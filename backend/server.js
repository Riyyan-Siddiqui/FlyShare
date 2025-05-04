import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

// For __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create Express app
const app = express();
const server = http.createServer(app);

// Configure CORS - make sure to allow your frontend origin
app.use(cors({
  origin: "*", // In production, replace with your specific domain
  methods: ["GET", "POST", "OPTIONS"],
  credentials: true
}));

// Create uploads directory if it doesn't exist
const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Keep original filename but ensure uniqueness with timestamp
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

// Set file size limits and allowed MIME types
const upload = multer({ 
  storage,
  limits: { fileSize: 100 * 1024 * 1024 } // 100MB limit
});

// Configure Socket.IO
const io = new Server(server, {
  cors: {
    origin: "*", // In production, replace with your specific domain
    methods: ["GET", "POST"],
    credentials: true
  },
  maxHttpBufferSize: 1e8 // 100 MB
});

// Track active sockets and network rooms
const activeSockets = new Map(); // Map socket ID to socket object
const networkRooms = new Map(); // Map network ID to room data

// Socket.IO Connection Handling
io.on("connection", (socket) => {
  // Extract client IP address
  let clientIp = socket.handshake.headers['x-forwarded-for'] || socket.handshake.address;
  
  // For local development, use a consistent identifier
  if (clientIp.includes('127.0.0.1') || clientIp.includes('::1')) {
    clientIp = 'local-network';
  }
  
  // Create or get network room ID (in production, extract subnet instead of using full IP)
  const networkId = clientIp; // In production: getSubnet(clientIp)
  
  console.log(`User connected: ${socket.id} from network ${networkId}`);
  
  // Store socket reference with network info
  activeSockets.set(socket.id, {
    socket,
    networkId,
    deviceInfo: null // Will be set when client sends device info
  });
  
  // Join the network room
  socket.join(networkId);
  socket.networkId = networkId;
  
  // Create network room if it doesn't exist
  if (!networkRooms.has(networkId)) {
    networkRooms.set(networkId, {
      id: networkId,
      name: `Network ${networkId.substring(0, 6)}...`, // Friendly name
      devices: [],
      files: []
    });
  }
  
  // Register device info
  socket.on("register_device", (deviceInfo) => {
    const { name, type } = deviceInfo;
    
    // Update socket data
    const socketData = activeSockets.get(socket.id);
    socketData.deviceInfo = { id: socket.id, name, type };
    
    // Add to network room
    const room = networkRooms.get(networkId);
    room.devices.push(socketData.deviceInfo);
    
    // Notify all devices in the room about the new device
    io.to(networkId).emit("device_list", room.devices);
    
    // Send current file list to the new device
    socket.emit("file_list", room.files);
    
    console.log(`Device registered: ${name} (${type}) with ID ${socket.id}`);
  });
  
  // Handle text messages within the network
  socket.on("send_message", (data) => {
    if (!socket.networkId) {
      socket.emit("error", { message: "Not in a network" });
      return;
    }
    
    const socketData = activeSockets.get(socket.id);
    if (!socketData || !socketData.deviceInfo) {
      socket.emit("error", { message: "Device not registered" });
      return;
    }
    
    // Create message with device info
    const messageData = {
      ...data,
      sender: socketData.deviceInfo.name,
      senderId: socket.id
    };
    
    console.log(`Message in network ${networkId}:`, messageData);
    
    // Send message to everyone in the network
    io.to(networkId).emit("receive_message", messageData);
  });
  
  // Disconnect handling
  socket.on("disconnect", () => {
    console.log(`User disconnected: ${socket.id}`);
    
    const socketData = activeSockets.get(socket.id);
    if (socketData && socketData.networkId) {
      const room = networkRooms.get(socketData.networkId);
      
      if (room) {
        // Remove device from room
        room.devices = room.devices.filter(device => device.id !== socket.id);
        
        // Notify others in the room
        socket.to(socketData.networkId).emit("device_left", { id: socket.id });
        
        // If room is empty, clean it up
        if (room.devices.length === 0) {
          networkRooms.delete(socketData.networkId);
        } else {
          // Update device list for remaining clients
          io.to(socketData.networkId).emit("device_list", room.devices);
        }
      }
    }
    
    activeSockets.delete(socket.id);
  });
});

// File upload endpoint with network room support
app.post("/upload", upload.single("file"), (req, res) => {
  try {
    if (!req.file) {
      console.log("No file received");
      return res.status(400).json({ message: "No file uploaded." });
    }
    
    console.log("File uploaded:", req.file);
    
    // Get sender from request body
    const sender = req.body.sender || "Anonymous";
    const socketId = req.body.socketId;
    const networkId = req.body.networkId;
    
    // Send success response with file details
    res.status(200).json({ 
      message: 'File uploaded successfully',
      file: {
        filename: req.file.filename,
        originalName: req.file.originalname,
        size: req.file.size,
        mimetype: req.file.mimetype,
        sender: sender
      }
    });
    
    // Create file notification data
    const fileData = {
      id: Date.now(),
      name: req.file.originalname,
      fullname: req.file.filename,
      size: req.file.size,
      type: req.file.mimetype,
      sender: sender,
      timestamp: new Date().toISOString()
    };
    
    // If network ID is provided, add file to network room and broadcast
    if (networkId && networkRooms.has(networkId)) {
      const room = networkRooms.get(networkId);
      room.files.push(fileData);
      
      // Broadcast to the specific network
      io.to(networkId).emit("file_shared", fileData);
      console.log(`Broadcasting file notification to network ${networkId}`);
    } else if (socketId && activeSockets.has(socketId)) {
      // Fallback if network ID is not provided but socket ID is
      const socketData = activeSockets.get(socketId);
      if (socketData && socketData.networkId) {
        const room = networkRooms.get(socketData.networkId);
        if (room) {
          room.files.push(fileData);
          io.to(socketData.networkId).emit("file_shared", fileData);
          console.log(`Broadcasting file notification to network ${socketData.networkId}`);
        }
      }
    } else {
      // Last resort fallback - broadcast to everyone
      console.log("Broadcasting file notification to all clients (no network specified)");
      io.emit("file_shared", fileData);
    }
    
  } catch (error) {
    console.error("Error in file upload:", error);
    res.status(500).json({ message: "Server error during file upload" });
  }
});

// Get files for a specific network
app.get('/network-files/:networkId', (req, res) => {
  try {
    const networkId = req.params.networkId;
    
    if (!networkRooms.has(networkId)) {
      return res.status(404).json({ message: 'Network not found' });
    }
    
    const room = networkRooms.get(networkId);
    res.json(room.files);
  } catch (error) {
    console.error("Error fetching network files:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// File download endpoint with better error handling
app.get('/download/:filename', (req, res) => {
  try {
    const filename = req.params.filename;
    // Remove any timestamp prefix if present (in case that's causing issues)
    const actualFilename = filename.includes('-') ? filename.split('-').slice(1).join('-') : filename;
    
    // First, try to find the exact filename
    let filePath = path.join(uploadDir, filename);
    
    // If exact file doesn't exist, search for files with the given name (ignoring timestamp)
    if (!fs.existsSync(filePath)) {
      console.log(`File not found: ${filePath}, searching for similar files...`);
      
      const files = fs.readdirSync(uploadDir);
      const matchingFile = files.find(file => file.endsWith(actualFilename));
      
      if (matchingFile) {
        filePath = path.join(uploadDir, matchingFile);
        console.log(`Found matching file: ${matchingFile}`);
      } else {
        console.log("No matching file found");
        return res.status(404).json({ message: 'File not found' });
      }
    }
    
    console.log(`Sending file: ${filePath}`);
    res.download(filePath, actualFilename, (err) => {
      if (err) {
        console.error('Error sending file:', err);
        if (!res.headersSent) {
          res.status(500).send('Error downloading file');
        }
      }
    });
  } catch (error) {
    console.error("Error in download:", error);
    if (!res.headersSent) {
      res.status(500).json({ message: "Server error during download" });
    }
  }
});

// Get list of all files
app.get('/files', (req, res) => {
  try {
    fs.readdir(uploadDir, (err, files) => {
      if (err) {
        console.error("Error reading directory:", err);
        return res.status(500).json({ message: 'Error reading files directory' });
      }
      
      const fileList = files.map(file => {
        const stats = fs.statSync(path.join(uploadDir, file));
        const originalName = file.includes('-') ? file.split('-').slice(1).join('-') : file;
        
        return {
          name: originalName,
          fullname: file,
          size: stats.size,
          created: stats.birthtime
        };
      });
      
      res.json(fileList);
    });
  } catch (error) {
    console.error("Error listing files:", error);
    res.status(500).json({ message: "Server error listing files" });
  }
});

// Basic home route for checking server status
app.get("/", (req, res) => {
  res.send(`
    <html>
      <head>
        <title>Fly Share Server</title>
        <style>
          body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
          h1 { color: #333; }
          .status { color: green; font-weight: bold; }
          pre { background: #f4f4f4; padding: 10px; border-radius: 5px; }
        </style>
      </head>
      <body>
        <h1>Fly Share Server</h1>
        <p>Status: <span class="status">Running</span></p>
        <p>Upload directory: ${uploadDir}</p>
        <p>Files stored: ${fs.readdirSync(uploadDir).length}</p>
        <p>Active networks: ${networkRooms.size}</p>
      </body>
    </html>
  `);
});

// Start server
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Upload directory: ${uploadDir}`);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});