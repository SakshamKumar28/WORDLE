import app from "./src/app.js";
import connectDB from "./src/lib/db.js";
import { port } from "./src/config/config.js";
import { Server } from "socket.io";
import http from "http";
import { setupSocket } from "./src/sockets/socketHandler.js";

const server = http.createServer(app);

// Initialize Socket.io
const io = new Server(server, {
  cors: {
    origin: process.env.CORS_ORIGIN || "http://localhost:5173", 
    methods: ["GET", "POST"],
    credentials: true
  }
});

async function startServer() {
  await connectDB(); 

  // Pass the io instance to your handler module
  setupSocket(io);
  
  server.listen(port || 3000, () => {
    console.log(`Server is running on port : ${port || 3000}`);
  });
}

startServer();