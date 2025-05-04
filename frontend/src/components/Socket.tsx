import { io } from "socket.io-client";

// Create socket instance with auto-reconnect
const socket = io("https://6647-39-34-147-234.ngrok-free.app", {
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
  timeout: 10000,
  transports: ['websocket', 'polling']
});

// Add event listeners for connection status
socket.on("connect", () => {
  console.log("Socket connected with ID:", socket.id);
});

socket.on("connect_error", (error) => {
  console.error("Socket connection error:", error);
});

socket.on("disconnect", (reason) => {
  console.log("Socket disconnected:", reason);
});

// Export the socket as default
export default socket;