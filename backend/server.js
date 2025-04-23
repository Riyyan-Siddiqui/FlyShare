import express from 'express';
import http from 'http';
import WebSocket, { Server } from 'ws';
import multer from 'multer';
import path from 'path';

// Initialize Express and HTTP server
const app = express();
const server = http.createServer(app);

// Initialize WebSocket server
const wss = new Server({ server });

// Set up file upload directory using multer
const upload = multer({ dest: 'uploads/' });

// Endpoint for file upload
app.post('/upload', upload.single('file'), (req, res) => {
  const filePath = path.join('uploads', req.file?.filename || '');
  res.json({ link: `http://localhost:3001/${filePath}` });  // Send back the file URL
});

// Serve the uploaded files
app.use('/uploads', express.static('uploads'));

// WebSocket communication
wss.on('connection', (ws) => {
  console.log('New client connected');

  // When a message is received from a client, broadcast it to all clients
  ws.on('message', (message) => {
    console.log('Received:', message);

    // Broadcast the message to all connected clients
    wss.clients.forEach((client) => {
      if (client !== ws && client.readyState === WebSocket.OPEN) {
        client.send(message);  // Send the message to other clients
      }
    });
  });

  // When the client disconnects
  ws.on('close', () => {
    console.log('Client disconnected');
  });
});

// Start the server
server.listen(3001, () => {
  console.log('WebSocket server running on http://localhost:3001');
});
