import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import crypto from "crypto";
import requestIp from "request-ip";
require("dotenv").config();

const PORT = 3001;
const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*", // Allow all clients on same network
  },
});

app.use(cors());
app.use(requestIp.mw());

function hashIp(ip) {
  const secret = process.env.SECRET_SALT; // Replace with your secret key
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

  socket.on("disconnect", () => {
    console.log("User Disconnected", socket.id);
  });
});


server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://192.168.100.56:${PORT}`);
});
