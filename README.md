# 🎮 WORDLE.BATTLE

**A real-time multiplayer Wordle arena — race your friends to guess the word first.**

The classic 5-letter word game, rebuilt as a live head-to-head duel. Authenticated players can jump into random matchmaking or spin up a private lobby with a shareable room code, then watch every guess resolve in real time — including their rival's tile colors (but not their letters), for a "fog of war" competitive feel.


---

## Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Architecture](#-architecture)
- [Project Structure](#-project-structure)
- [Game Modes](#-game-modes)
- [REST API Reference](#-rest-api-reference)
- [WebSocket Events Reference](#-websocket-events-reference)
- [Data Models](#-data-models)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [Notes & Known Limitations](#-notes--known-limitations)
- [License](#-license)

---

## ✨ Features

**Authentication & Accounts**
- Email/password registration and login
- JWT access tokens (15 min) + rotating refresh tokens (7 days), stored as `httpOnly` cookies
- Passwords hashed with `bcryptjs`, request bodies validated with `zod`

**Multiplayer Gameplay**
- **Random Matchmaking** — join a queue and get auto-paired with the next waiting player
- **Custom Lobbies** — host a private room with a 6-character `nanoid` code, invite friends, and support more than 2 players in one match
- Live guess evaluation over WebSockets (Socket.IO) with standard Wordle color feedback (green / yellow / gray)
- Real-time opponent boards showing color feedback only (letters stay hidden), so you can track a rival's progress without seeing their guesses
- Win detection, game-over broadcast, and automatic stat updates the moment someone solves the word

**Social**
- Send/accept/reject friend requests by email
- Friends list with each friend's stats
- Global Top 10 leaderboard sorted by wins

**Player Stats**
- Games played, wins, and win streak tracked automatically after every match

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite, React Router 7, Tailwind CSS 4 |
| Frontend extras | `socket.io-client`, `axios`, `motion` (Framer Motion), `react-hot-toast`, `lucide-react` |
| Backend | Node.js, Express 5 |
| Real-time | Socket.IO 4 |
| Database | MongoDB via Mongoose |
| Auth | `jsonwebtoken`, `bcryptjs`, `cookie-parser` |
| Validation | `zod` |
| Word list | `word-list` npm package, filtered to 5-letter words |
| Other | `nanoid` (room codes), `express-rate-limit`, `morgan`, `cors` |

---

## 🏗 Architecture

```
┌─────────────────┐        HTTPS (REST, cookies)       ┌──────────────────────┐
│                  │ ───────────────────────────────►  │                       │
│  React Frontend  │        /api/v1/auth, /user         │   Express Backend     │
│    (Vite, 5173)  │ ◄───────────────────────────────  │      (port 3000)     │
│                  │                                     │                       │
│                  │        WebSocket (Socket.IO)        │  ┌─────────────────┐ │
│                  │ ◄─────────────────────────────────► │  │  socketHandler  │ │
└─────────────────┘        matchmaking / gameplay        │  └─────────────────┘ │
                                                           │           │           │
                                                           │           ▼           │
                                                           │      Mongoose ODM     │
                                                           └───────────┼───────────┘
                                                                       ▼
                                                                  MongoDB
```

REST endpoints handle **auth and social/account data**. All **live gameplay** (matchmaking, lobbies, guesses, win/loss) runs over a single Socket.IO connection opened from the Dashboard.

---

## 📁 Project Structure

```
WORDLE/
├── backend/
│   ├── server.js                  # HTTP server bootstrap + Socket.IO init
│   └── src/
│       ├── app.js                 # Express app, middleware, routes, error handler
│       ├── config/config.js       # Env var loading & validation
│       ├── lib/db.js              # MongoDB connection
│       ├── middlewares/
│       │   ├── auth.middleware.js     # JWT verification, attaches req.user
│       │   └── validate.middleware.js # zod schema validation wrapper
│       ├── modules/
│       │   ├── auth/               # controller, service, repository, routes, zod schemas
│       │   └── user/                # user + room + friendRequest models, controller, routes
│       ├── sockets/socketHandler.js # matchmaking, lobbies, guess evaluation, stats
│       └── utils/
│           ├── apiError.js / apiResponse.js  # consistent response shape
│           ├── gameLogic.js        # word selection + Wordle guess-checking algorithm
│           └── rateLimiter.js      # 100 req / 15 min per IP on API routes
│
└── frontend/
    └── src/
        ├── App.jsx                 # route definitions
        ├── pages/
        │   ├── LandingPage.jsx      # marketing/landing page
        │   ├── Login.jsx / SignUp.jsx
        │   └── Dashboard.jsx        # hub: matchmaking, lobbies, friends, leaderboard
        ├── components/
        │   ├── GameBoard.jsx        # live game grid, keyboard input, opponent racks
        │   ├── Navbar.jsx / Instagram.jsx
        ├── utils/
        │   ├── api.js               # axios instance (cookie-based, withCredentials)
        │   └── ProtectedRoute.jsx   # gates /dashboard behind /v1/auth/me check
        └── assets/wordle_grid.png
```

---

## 🕹 Game Modes

**1. Random Matchmaking (`joinQueue`)**
The server keeps a single `waitingPlayer` slot. The next player to queue is instantly paired with whoever is waiting, a room is created, a random 5-letter secret word is chosen, and both clients receive `matchFound`.

**2. Custom Lobbies (`createCustomLobby` / `joinCustomLobby`)**
The host generates a room via a 6-character code (`nanoid`). Friends join using that code from the Dashboard's "Join Room" modal. Unlike random matchmaking, custom lobbies support **more than 2 players**, and only the host can trigger `startCustomMatch` once at least 2 players are present.

**3. Gameplay loop**
Both modes converge on the same `submitGuess` → `checkGuess()` → `guessEvaluated` flow. Guesses are scored letter-by-letter using a standard two-pass Wordle algorithm (exact matches first, then position-independent matches), correctly handling duplicate letters. The first player to guess the word triggers `gameOver` for the whole room and updates everyone's `gamesPlayed`/`wins`/`winStreak` in MongoDB.

---

## 📡 REST API Reference

Base path: `/api/v1`

### Auth (`/auth`) — rate-limited, 100 req/15min

| Method | Endpoint | Auth required | Description |
|---|---|---|---|
| POST | `/auth/register` | No | Create account (`firstName`, `lastName?`, `email`, `password`) |
| POST | `/auth/login` | No | Login, sets `accessToken`/`refreshToken` cookies |
| POST | `/auth/logout` | No | Clears cookies, invalidates stored refresh token |
| POST | `/auth/refresh` | Refresh cookie | Rotates access + refresh tokens |
| GET | `/auth/me` | Yes | Returns the current authenticated user |

### User (`/user`) — all routes require authentication

| Method | Endpoint | Description |
|---|---|---|
| GET | `/user/friends` | List current user's friends with stats |
| GET | `/user/leaderboard` | Top 10 users sorted by `stats.wins` |
| GET | `/user/friends/requests` | Pending incoming friend requests |
| POST | `/user/friends/request` | Send a friend request by `receiverEmail` |
| POST | `/user/friends/respond` | Accept/reject a request (`requestId`, `action`) |

### Misc

| Method | Endpoint | Description |
|---|---|---|
| GET | `/health` | Basic server health check |

---

## 🔌 WebSocket Events Reference

### Client → Server

| Event | Payload | Purpose |
|---|---|---|
| `setUserId` | `{ userId, firstName }` | Bind identity to a socket |
| `joinQueue` | `{ userId }` | Enter random matchmaking |
| `createCustomLobby` | `{ userId, firstName }` | Create a private lobby |
| `joinCustomLobby` | `{ roomCode, userId, firstName }` | Join a lobby by code |
| `startCustomMatch` | `{ roomCode }` | Host starts the match |
| `submitGuess` | `{ roomId, guess }` | Submit a 5-letter guess |

### Server → Client

| Event | Payload | Purpose |
|---|---|---|
| `waitingForOpponent` | — | No opponent yet, still queued |
| `matchFound` | `{ roomId, players[] }` | Match/lobby is starting, transition to `GameBoard` |
| `customLobbyCreated` | `{ roomCode, players[] }` | Lobby created, host view |
| `lobbyUpdated` | `{ players[], host }` | Lobby roster changed |
| `customLobbyError` | `{ message }` | Invalid code / lobby already in progress |
| `guessEvaluated` | `{ playerId, guess, feedback[] }` | Broadcasts a guess + per-letter result to the room |
| `gameOver` | `{ winner, word }` | Match ended; reveals the secret word |

---

## 🗄 Data Models

**User**
`firstName`, `lastName`, `email` (unique), `password` (hashed), `refreshToken`, `friends[]` (ref: User), `stats { gamesPlayed, wins, winStreak, rank }`, `dailyChallenges { lastReset, fastWins, speedDuelsWon }`

**Room**
`roomId` (unique), `players[]` (ref: User), `secretWord`, `status` (`active` | `completed`) — created when a match starts, deleted when it ends

**FriendRequest**
`sender`, `receiver` (ref: User), `status` (`pending` | `accepted` | `rejected`) — unique compound index on `(sender, receiver)`

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+ recommended)
- A MongoDB instance (local or Atlas)

### 1. Clone the repo
```bash
git clone https://github.com/SakshamKumar28/WORDLE.git
cd WORDLE
```

### 2. Backend setup
```bash
cd backend
npm install
```
Create a `backend/.env` file (see [Environment Variables](#-environment-variables) below), then:
```bash
npm run dev     # auto-restarts on file changes (node --watch)
# or
npm start
```
The API + Socket.IO server starts on `http://localhost:3000` by default.

### 3. Frontend setup
```bash
cd frontend
npm install
npm run dev
```
The app runs on Vite's default dev server (`http://localhost:5173`).

> The backend's CORS and cookie config, and the frontend's Socket.IO connection, are hardcoded to `localhost:3000` / `localhost:5173` in a few places (`Dashboard.jsx`, `app.js`, `server.js`). Update these — or wire them fully to `VITE_API_URL` / `CORS_ORIGIN` — if you deploy to different hosts.

---

## 🔐 Environment Variables

### `backend/.env`

| Variable | Required | Description |
|---|---|---|
| `PORT` | No (defaults to `3000`) | Backend server port |
| `MONGODB_URL` | **Yes** | MongoDB connection string |
| `ACCESS_TOKEN_SECRET` | **Yes** | Secret for signing 15-min access JWTs |
| `REFRESH_TOKEN_SECRET` | **Yes** | Secret for signing 7-day refresh JWTs |
| `CORS_ORIGIN` | No (defaults to `http://localhost:5173`) | Allowed frontend origin |

The server throws on startup if `MONGODB_URL`, `ACCESS_TOKEN_SECRET`, or `REFRESH_TOKEN_SECRET` are missing.

### `frontend/.env`

| Variable | Required | Description |
|---|---|---|
| `VITE_API_URL` | No (defaults to `http://localhost:3000/api`) | Backend REST base URL |

No `.env.example` file currently exists in the repo — you'll need to create these `.env` files yourself using the tables above.

---

## 📝 Notes & Known Limitations

A few things worth knowing if you plan to extend or deploy this project, based on reading the current implementation:

- **In-memory match state**: `waitingPlayer`, `activeRooms`, and `customLobbies` live in a JS `Map`/variable inside `socketHandler.js`. This means matchmaking state is lost on server restart and won't work correctly if you scale the backend to multiple instances without adding shared state (e.g. Redis).
- **`stats.rank` and `dailyChallenges` are schema-only**: the `User` model defines a `rank` field (shown on the Dashboard) and `dailyChallenges.fastWins` / `speedDuelsWon`, but no backend logic currently updates them — only `gamesPlayed`, `wins`, and `winStreak` are incremented after a match.
- **Auth cookies use `secure: true` / `sameSite: "none"`**, which requires HTTPS in production; this will silently fail to set cookies over plain `http://localhost` in some browsers unless testing over `https`.
- **Random matchmaking is explicitly commented `(Legacy)`** in the source in favor of the newer custom-lobby flow, though both remain functional.
- No password reset, email verification, or account deletion flow currently exists.

---

## 📄 License

No `LICENSE` file is currently present in this repository. Consider adding one (MIT is a common choice for projects like this) if you intend for others to use or contribute to it.

---

## 👤 Author

**Saksham Kumar** — [@SakshamKumar28](https://github.com/SakshamKumar28)