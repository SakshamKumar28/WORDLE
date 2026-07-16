import { getRandomWord, checkGuess } from "../utils/gameLogic.js";
import User from "../modules/user/user.model.js";
import Room from "../modules/user/room.model.js";
import { nanoid } from "nanoid";

// State
let waitingPlayer = null; 
const activeRooms = new Map(); // For random matchmaking
const customLobbies = new Map(); // For custom lobbies

export const setupSocket = (io) => {
  
  io.on("connection", (socket) => {
    console.log(`🟢 User Connected : ${socket.id}`);

    // Store user info on socket
    socket.on('setUserId', ({ userId, firstName }) => {
        socket.userId = userId;
        socket.firstName = firstName;
    });

    // --- RANDOM MATCHMAKING LOGIC (Legacy) ---
    socket.on('joinQueue', async ({ userId }) => {
      socket.userId = userId; // also bind here

      if (waitingPlayer && waitingPlayer.id !== socket.id) {
        const player1 = waitingPlayer;
        const player2 = socket;
        const roomId = `room_${player1.id}_${player2.id}`;
        
        waitingPlayer = null;
        player1.join(roomId);
        player2.join(roomId);

        const secretWord = getRandomWord();
        activeRooms.set(roomId, { 
          player1: { socketId: player1.id, userId: player1.userId }, 
          player2: { socketId: player2.id, userId: player2.userId }, 
          secretWord 
        });

        try {
            await Room.create({
                roomId,
                players: [player1.userId, player2.userId].filter(Boolean),
                secretWord
            });
        } catch (err) {
            console.error("Failed to create room in DB", err);
        }

        io.to(roomId).emit('matchFound', { 
            roomId,
            players: [
                { socketId: player1.id, userId: player1.userId, firstName: player1.firstName },
                { socketId: player2.id, userId: player2.userId, firstName: player2.firstName }
            ]
        });
        console.log(`⚔️ Match started in ${roomId}. Secret word is ${secretWord}`);
      } else {
        waitingPlayer = socket;
        socket.emit('waitingForOpponent');
      }
    });

    // --- CUSTOM LOBBY LOGIC ---
    socket.on('createCustomLobby', ({ userId, firstName }) => {
      socket.userId = userId;
      socket.firstName = firstName;
      const roomCode = nanoid(6).toUpperCase();
      
      customLobbies.set(roomCode, {
          roomId: roomCode,
          host: socket.id,
          players: [{ socketId: socket.id, userId, firstName }],
          status: 'waiting',
          secretWord: null
      });

      socket.join(roomCode);
      socket.emit('customLobbyCreated', { roomCode, players: customLobbies.get(roomCode).players });
    });

    socket.on('joinCustomLobby', ({ roomCode, userId, firstName }) => {
      socket.userId = userId;
      socket.firstName = firstName;
      
      const lobby = customLobbies.get(roomCode);
      if (!lobby) {
          socket.emit('customLobbyError', { message: "Invalid Room Code" });
          return;
      }
      if (lobby.status !== 'waiting') {
          socket.emit('customLobbyError', { message: "Match already in progress" });
          return;
      }

      // Check if already in lobby to prevent duplicates
      if (!lobby.players.find(p => p.socketId === socket.id)) {
          lobby.players.push({ socketId: socket.id, userId, firstName });
      }

      socket.join(roomCode);
      io.to(roomCode).emit('lobbyUpdated', { players: lobby.players, host: lobby.host });
    });

    socket.on('startCustomMatch', async ({ roomCode }) => {
      const lobby = customLobbies.get(roomCode);
      if (!lobby || lobby.host !== socket.id) return;

      const secretWord = getRandomWord();
      lobby.secretWord = secretWord;
      lobby.status = 'playing';

      try {
          await Room.create({
              roomId: roomCode,
              players: lobby.players.map(p => p.userId).filter(Boolean),
              secretWord
          });
      } catch (err) {
          console.error("Failed to create custom room in DB", err);
      }

      // We use matchFound to trigger the transition to GameBoard
      io.to(roomCode).emit('matchFound', { roomId: roomCode, players: lobby.players });
    });

    // --- SHARED GAMEPLAY LOGIC ---
    socket.on('submitGuess', async ({ roomId, guess }) => {
      // Find room in either random or custom maps
      let room = activeRooms.get(roomId);
      let isCustom = false;
      if (!room) {
          room = customLobbies.get(roomId);
          isCustom = true;
      }
      if (!room) return;

      const feedback = checkGuess(guess, room.secretWord);
      
      io.to(roomId).emit('guessEvaluated', {
        playerId: socket.id, // we use socket.id as unique player ID in gameboard
        guess,
        feedback
      });

      if (guess.toUpperCase() === room.secretWord.toUpperCase()) {
        const winnerSocketId = socket.id;
        
        io.to(roomId).emit('gameOver', { 
          winner: socket.id, 
          word: room.secretWord 
        });

        try {
            // Process stats
            if (isCustom) {
                // Custom Lobby: N players
                for (const player of room.players) {
                    if (!player.userId) continue;
                    if (player.socketId === winnerSocketId) {
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
                customLobbies.delete(roomId);
            } else {
                // Random Matchmaking: 2 players
                const isPlayer1Winner = room.player1.socketId === winnerSocketId;
                const winnerUserId = isPlayer1Winner ? room.player1.userId : room.player2.userId;
                const loserUserId = isPlayer1Winner ? room.player2.userId : room.player1.userId;

                if (winnerUserId) {
                    await User.findByIdAndUpdate(winnerUserId, {
                        $inc: { "stats.wins": 1, "stats.winStreak": 1, "stats.gamesPlayed": 1 }
                    });
                }
                if (loserUserId) {
                    await User.findByIdAndUpdate(loserUserId, {
                        $set: { "stats.winStreak": 0 },
                        $inc: { "stats.gamesPlayed": 1 }
                    });
                }
                activeRooms.delete(roomId);
            }

            // Delete room from DB
            await Room.deleteOne({ roomId });
        } catch (err) {
            console.error("Failed to update stats or delete room", err);
        }
      }
    });

    socket.on("disconnect", () => {
      console.log(`🔴 User Disconnected : ${socket.id}`);
      if (waitingPlayer && waitingPlayer.id === socket.id) {
        waitingPlayer = null;
      }
      
      // Cleanup custom lobbies if a player disconnects
      for (const [code, lobby] of customLobbies.entries()) {
          lobby.players = lobby.players.filter(p => p.socketId !== socket.id);
          if (lobby.players.length === 0) {
              customLobbies.delete(code);
          } else {
              io.to(code).emit('lobbyUpdated', { players: lobby.players, host: lobby.host });
          }
      }
    });
  });
};