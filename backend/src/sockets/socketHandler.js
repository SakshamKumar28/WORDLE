import { getRandomWord, checkGuess } from "../utils/gameLogic.js";
import User from "../modules/user/user.model.js";
import Room from "../modules/user/room.model.js";
import { nanoid } from "nanoid";
import { z } from "zod";
import { createAdapter } from "@socket.io/redis-adapter";
import { createClient } from "redis";
import { initRedis, redisClient } from "../lib/redis.js";

const RECONNECT_GRACE_SECONDS = 60;
const makeRoomKey = (roomId) => `room:${roomId}`;
const makeLobbyKey = (roomCode) => `lobby:${roomCode}`;
const makeDisconnectedKey = (socketId) => `disconnected:${socketId}`;
const makeWaitingKey = () => `matchmaking:waitingPlayer`;

const guessSchema = z.object({
  roomId: z.string().min(1),
  guess: z.string().length(5).regex(/^[A-Za-z]{5}$/, {
    message: "Guess must be exactly 5 alphabetic letters"
  })
});

const normalizePlayer = ({ socketId, userId, firstName }) => ({ socketId, userId, firstName, connected: true });

const loadRoom = async (roomId) => {
  const data = await redisClient.hGetAll(makeRoomKey(roomId));
  if (!data || Object.keys(data).length === 0) return null;
  return {
    roomId,
    secretWord: data.secretWord,
    status: data.status,
    players: JSON.parse(data.players || "[]"),
    guessCounts: JSON.parse(data.guessCounts || "{}")
  };
};

const saveRoom = async (room) => {
  await redisClient.hSet(makeRoomKey(room.roomId), {
    roomId: room.roomId,
    secretWord: room.secretWord,
    status: room.status,
    players: JSON.stringify(room.players),
    guessCounts: JSON.stringify(room.guessCounts || {})
  });
};

const deleteRoom = async (roomId) => await redisClient.del(makeRoomKey(roomId));

const loadLobby = async (roomCode) => {
  const data = await redisClient.hGetAll(makeLobbyKey(roomCode));
  if (!data || Object.keys(data).length === 0) return null;
  return {
    roomId: roomCode,
    host: data.host,
    status: data.status,
    secretWord: data.secretWord || null,
    players: JSON.parse(data.players || "[]")
  };
};

const saveLobby = async (lobby) => {
  await redisClient.hSet(makeLobbyKey(lobby.roomId), {
    roomId: lobby.roomId,
    host: lobby.host,
    status: lobby.status,
    secretWord: lobby.secretWord || "",
    players: JSON.stringify(lobby.players)
  });
};

const deleteLobby = async (roomCode) => await redisClient.del(makeLobbyKey(roomCode));

const scheduleDisconnectCleanup = async (roomId, disconnectedSocketId) => {
  const disconnectedKey = makeDisconnectedKey(disconnectedSocketId);
  const byeInMs = RECONNECT_GRACE_SECONDS * 1000;

  await redisClient.expire(disconnectedKey, RECONNECT_GRACE_SECONDS);

  setTimeout(async () => {
    const exists = await redisClient.exists(disconnectedKey);
    if (!exists) return;

    const room = await loadRoom(roomId);
    if (!room || room.status !== "playing") {
      await redisClient.del(disconnectedKey);
      return;
    }

    const disconnectedPlayer = room.players.find((player) => player.socketId === disconnectedSocketId);
    if (!disconnectedPlayer || disconnectedPlayer.connected !== false) {
      await redisClient.del(disconnectedKey);
      return;
    }

    const remainingPlayer = room.players.find((player) => player.socketId !== disconnectedSocketId && player.connected !== false);
    if (!remainingPlayer) {
      await redisClient.del(disconnectedKey);
      return;
    }

    await redisClient.del(disconnectedKey);
    io.to(roomId).emit("gameOver", {
      winner: remainingPlayer.socketId,
      reason: "opponentDisconnected",
      word: room.secretWord
    });
    await handleGameEnd(roomId, room, remainingPlayer.socketId);
  }, byeInMs);
};

const handleGameEnd = async (roomId, room, winnerSocketId) => {
  try {
    for (const player of room.players) {
      if (!player.userId) continue;
      if (winnerSocketId === null) {
        // Draw — just increment gamesPlayed, don't touch streaks
        await User.findByIdAndUpdate(player.userId, {
          $inc: { "stats.gamesPlayed": 1 }
        });
      } else if (player.socketId === winnerSocketId) {
        await User.findByIdAndUpdate(player.userId, {
          $inc: { "stats.wins": 1, "stats.winStreak": 1, "stats.gamesPlayed": 1 }
        });
      } else {
        await User.findByIdAndUpdate(player.userId, {
          $set: { "stats.winStreak": 0 },
          $inc: { "stats.gamesPlayed": 1 }
        });
      }
    }
    // Push updated stats to each player in real-time
    for (const player of room.players) {
      if (!player.userId) continue;
      const updatedUser = await User.findById(player.userId).select("stats");
      if (updatedUser && io) {
        io.to(`user:${player.userId}`).emit("statsUpdated", updatedUser.stats);
      }
    }

    // Broadcast updated leaderboard to all connected users
    if (io) {
      const leaderboard = await User.find()
        .sort({ "stats.wins": -1 })
        .limit(10)
        .select("firstName lastName stats");
      io.emit("leaderboardUpdated", leaderboard);
    }
  } catch (err) {
    console.error("Failed to update stats after game end", err);
  }

  await deleteRoom(roomId);
  await Room.deleteOne({ roomId });
};

let io;
const userSocketMap = new Map();

export const getIo = () => io;
export { userSocketMap };

export const setupSocket = async (serverIo) => {
  io = serverIo;
  await initRedis();

  const pubClient = createClient({ url: process.env.REDIS_URL || "redis://localhost:6379" });
  const subClient = pubClient.duplicate();
  await Promise.all([pubClient.connect(), subClient.connect()]);
  io.adapter(createAdapter(pubClient, subClient));

  io.on("connection", (socket) => {
    console.log(`🟢 User Connected : ${socket.id}`);

    socket.on("setUserId", ({ userId, firstName }) => {
      socket.userId = userId;
      socket.firstName = firstName;
      // Track this user's socket for real-time pushes
      userSocketMap.set(userId, socket.id);
      socket.join(`user:${userId}`);
    });

    socket.on("joinQueue", async ({ userId }) => {
      socket.userId = userId;
      const waitingPlayerId = await redisClient.get(makeWaitingKey());

      if (waitingPlayerId && waitingPlayerId !== socket.id) {
        const waitingSocket = io.sockets.sockets.get(waitingPlayerId);
        if (!waitingSocket) {
          await redisClient.del(makeWaitingKey());
          socket.emit("waitingForOpponent");
          return;
        }

        const roomId = `room_${waitingSocket.id}_${socket.id}`;
        waitingSocket.join(roomId);
        socket.join(roomId);

        const secretWord = getRandomWord();
        const room = {
          roomId,
          status: "playing",
          secretWord,
          players: [
            normalizePlayer({ socketId: waitingSocket.id, userId: waitingSocket.userId, firstName: waitingSocket.firstName }),
            normalizePlayer({ socketId: socket.id, userId: socket.userId, firstName: socket.firstName })
          ]
        };

        await saveRoom(room);
        await redisClient.del(makeWaitingKey());

        try {
          await Room.create({
            roomId,
            players: room.players.map((player) => player.userId).filter(Boolean),
            secretWord
          });
        } catch (err) {
          console.error("Failed to create room in DB", err);
        }

        io.to(roomId).emit("matchFound", { roomId, players: room.players });
      } else {
        await redisClient.set(makeWaitingKey(), socket.id, { EX: RECONNECT_GRACE_SECONDS });
        socket.emit("waitingForOpponent");
      }
    });

    socket.on("createCustomLobby", async ({ userId, firstName }) => {
      socket.userId = userId;
      socket.firstName = firstName;
      const roomCode = nanoid(6).toUpperCase();
      const lobby = {
        roomId: roomCode,
        host: socket.id,
        status: "waiting",
        secretWord: null,
        players: [normalizePlayer({ socketId: socket.id, userId, firstName })]
      };

      await saveLobby(lobby);
      socket.join(roomCode);
      socket.emit("customLobbyCreated", { roomCode, players: lobby.players });
    });

    socket.on("joinCustomLobby", async ({ roomCode, userId, firstName }) => {
      socket.userId = userId;
      socket.firstName = firstName;
      const lobby = await loadLobby(roomCode);
      if (!lobby) {
        socket.emit("customLobbyError", { message: "Invalid Room Code" });
        return;
      }
      if (lobby.status !== "waiting") {
        socket.emit("customLobbyError", { message: "Match already in progress" });
        return;
      }

      if (!lobby.players.some((player) => player.socketId === socket.id)) {
        lobby.players.push(normalizePlayer({ socketId: socket.id, userId, firstName }));
      }
      await saveLobby(lobby);

      socket.join(roomCode);
      io.to(roomCode).emit("lobbyUpdated", { players: lobby.players, host: lobby.host });
    });

    socket.on("startCustomMatch", async ({ roomCode }) => {
      const lobby = await loadLobby(roomCode);
      if (!lobby || lobby.host !== socket.id) return;

      const secretWord = getRandomWord();
      lobby.secretWord = secretWord;
      lobby.status = "playing";
      await saveLobby(lobby);

      const room = {
        roomId: roomCode,
        status: "playing",
        secretWord,
        players: lobby.players
      };
      await saveRoom(room);

      try {
        await Room.create({
          roomId: roomCode,
          players: room.players.map((player) => player.userId).filter(Boolean),
          secretWord
        });
      } catch (err) {
        console.error("Failed to create custom room in DB", err);
      }

      io.to(roomCode).emit("matchFound", { roomId: roomCode, players: lobby.players });
    });

    socket.on("submitGuess", async (payload) => {
      const parseResult = guessSchema.safeParse(payload);
      if (!parseResult.success) {
        socket.emit("validationError", { errors: parseResult.error.errors });
        return;
      }

      const { roomId, guess } = parseResult.data;
      const room = await loadRoom(roomId);
      if (!room || room.status !== "playing") {
        socket.emit("gameError", { message: "Invalid or inactive room." });
        return;
      }

      const MAX_GUESSES = 6;
      const currentCount = (room.guessCounts[socket.id] || 0);
      if (currentCount >= MAX_GUESSES) {
        socket.emit("gameError", { message: "You have used all your guesses." });
        return;
      }

      // Increment guess count
      room.guessCounts[socket.id] = currentCount + 1;
      await saveRoom(room);

      const feedback = checkGuess(guess, room.secretWord);
      io.to(roomId).emit("guessEvaluated", { playerId: socket.id, guess, feedback });

      if (guess.toUpperCase() === room.secretWord.toUpperCase()) {
        io.to(roomId).emit("gameOver", { winner: socket.id, word: room.secretWord });
        await handleGameEnd(roomId, room, socket.id);
      } else if (room.guessCounts[socket.id] >= MAX_GUESSES) {
        // Check if ALL players have exhausted their guesses
        const allExhausted = room.players.every(
          p => (room.guessCounts[p.socketId] || 0) >= MAX_GUESSES
        );
        if (allExhausted) {
          // Game ends in a draw — no winner
          io.to(roomId).emit("gameOver", { winner: null, reason: "draw", word: room.secretWord });
          await handleGameEnd(roomId, room, null);
        }
      }
    });

    socket.on("reconnectToGame", async ({ previousSocketId }) => {
      const disconnectedKey = makeDisconnectedKey(previousSocketId);
      const disconnectData = await redisClient.hGetAll(disconnectedKey);
      if (!disconnectData || Object.keys(disconnectData).length === 0) {
        socket.emit("reconnectFailed", { message: "No active grace session found." });
        return;
      }

      const roomId = disconnectData.roomId;
      const room = await loadRoom(roomId);
      if (!room || room.status !== "playing") {
        socket.emit("reconnectFailed", { message: "Game is no longer active." });
        return;
      }

      room.players = room.players.map((player) => {
        if (player.socketId === previousSocketId) {
          return normalizePlayer({ socketId: socket.id, userId: disconnectData.userId || player.userId, firstName: player.firstName });
        }
        return player;
      });

      await saveRoom(room);
      socket.join(roomId);
      await redisClient.del(disconnectedKey);

      io.to(roomId).emit("playerReconnected", { roomId, socketId: socket.id, previousSocketId });
      socket.emit("reconnected", { roomId, players: room.players });
    });

    socket.on("disconnect", async (reason) => {
      console.log(`🔴 User Disconnected : ${socket.id}`);
      // Clean up the user-to-socket mapping
      if (socket.userId) {
        userSocketMap.delete(socket.userId);
      }
      const waitingPlayerId = await redisClient.get(makeWaitingKey());
      if (waitingPlayerId === socket.id) {
        await redisClient.del(makeWaitingKey());
      }

      const roomKeyIterator = redisClient.scanIterator({ MATCH: "room:*" });
      for await (const key of roomKeyIterator) {
        const roomId = key.replace("room:", "");
        // const roomId = key.split(":")[1];
        const room = await loadRoom(roomId);
        if (!room || room.status !== "playing") continue;

        const player = room.players.find((player) => player.socketId === socket.id);
        if (!player) continue;

        player.connected = false;
        await saveRoom(room);

        const remainingPlayer = room.players.find((p) => p.socketId !== socket.id && p.connected !== false);
        if (!remainingPlayer) {
          await deleteRoom(roomId);
          await Room.deleteOne({ roomId });
          break;
        }

        await redisClient.hSet(makeDisconnectedKey(socket.id), {
          roomId,
          socketId: socket.id,
          userId: socket.userId || ""
        });
        await redisClient.expire(makeDisconnectedKey(socket.id), RECONNECT_GRACE_SECONDS);

        io.to(roomId).emit("playerDisconnected", { socketId: socket.id, reason });
        scheduleDisconnectCleanup(roomId, socket.id).catch((err) => console.error(err));
        break;
      }

      const lobbyKeyIterator = redisClient.scanIterator({ MATCH: "lobby:*" });
      for await (const key of lobbyKeyIterator) {
        const roomCode = key.replace("lobby:", "");
        const lobby = await loadLobby(roomCode);
        if (!lobby) continue;

        const playerIndex = lobby.players.findIndex((player) => player.socketId === socket.id);
        if (playerIndex === -1) continue;

        lobby.players.splice(playerIndex, 1);
        if (lobby.host === socket.id && lobby.players.length > 0) {
          lobby.host = lobby.players[0].socketId;
        }

        if (lobby.players.length === 0) {
          await deleteLobby(roomCode);
        } else {
          await saveLobby(lobby);
          io.to(roomCode).emit("lobbyUpdated", { players: lobby.players, host: lobby.host });
        }
        break;
      }
    });
  });
};