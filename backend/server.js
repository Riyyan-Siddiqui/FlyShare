import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import FtpServer from "ftp-srv";

// for __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const io = new Server (server, {
  cors: {
    origin: "https://4a4a-39-34-144-246.ngrok-free.app", // Allow requests from your frontend
    methods: ["GET", "POST"]
  }
});

app.use(cors());

// ---Setup Multer for file uploads ---
const uploadDir = path.join(__dirname, "uploads");
if(!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  }
});

const upload = multer({ storage });

// --- Upload Endpoint ---

app.post("/upload", upload.single("file"), (req, res) => {
  if (!req.file) {
    return res.status(400).send("No file uploaded.");
  }
  console.log("File uploaded:", req.file.filename);
  res.status(200).json({ message: 'File uploaded successfully' });
});

// --- GET /download/:filename ---
app.get('/download/:filename', (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(__dirname, 'uploads', filename);

  res.download(filePath, filename, (err) => {
    if (err) {
      console.error('Error sending file:', err);
      res.status(500).send('Error downloading file');
    }
  });
});

// --- FTP Server Setup ---

const ftpServer = new FtpServer({
  url: 'ftp://0.tcp.in.ngrok.io:10361', // Use ngrok's URL here
  pasv_url: '0.tcp.in.ngrok.io:10361',  // Passive connection URL
  anonymous: true,
});

ftpServer.on('login', ({connection, username, password}, resolve, reject) => {
  console.log(`FTP client connected: ${username}`);
resolve({ root: uploadDir})
});

ftpServer.listen().then(() => {
  console.log("✅ FTP server running at ftp://localhost:2121");
  console.log("📁 FTP root directory:", uploadDir);
}).catch(err => {
  console.log("❌ Error starting FTP server:", err);
})


// --- Socket.IO Events ---

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("send_message", (data) => {
    io.emit("receive_message", data); // Broadcast to all clients
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

app.get("/", (req, res) => {
  res.send("Socket.IO server is running.");
});

server.listen(3001, () => {
  console.log("Server running on port 3001");
});
