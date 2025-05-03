import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import crypto from "crypto";
import requestIp from "request-ip";
// import dotenv from 'dotenv';
// dotenv.config();

const PORT = 3001;
const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "https://fly-share-vh9f.vercel.app", // Vercel frontend URL
    methods: ["GET", "POST"]
  },
});

app.use(cors({
  origin: "https://fly-share-vh9f.vercel.app", // Vercel frontend URL
}));

app.use(requestIp.mw());

function hashIp(ip) {
  const secret = 'zT!93s@Vq#dFp8$L7xKm'; // Replace with your secret key
  return crypto.createHash("sha256").update(ip + secret).digest("hex");
}

app.get("/", (req, res) => {
  const clientIp = req.clientIp || req.ip; // Get the client's IP address
  const hashedIp = hashIp(clientIp); // Hash the IP address
  console.log(`Client IP: ${clientIp}, Hashed IP: ${hashedIp}`);
  res.json({ room: hashedIp })
});

io.on("connection", (socket) => {
  console.log(`User Connected: ${socket.id}`);

  socket.on("join_room", (room) => {
    socket.join(room); // Join the room
    console.log(`User with ID: ${socket.id} joined room: ${room}`);
  });

  socket.on("send_message", ({ room, message}) => {
    // Broadcast message to all clients, including sender
    console.log(`Message Received: ${message.text}`);
    io.to(room).emit("receive_message", message);
  });

  socket.on("join_room", (room) => {
    console.log(`User with ID: ${socket.id} joined room: ${room}`);
    socket.join(room); // Join the room
});

  socket.on("disconnect", () => {
    console.log("User Disconnected", socket.id);
  });
});


server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
