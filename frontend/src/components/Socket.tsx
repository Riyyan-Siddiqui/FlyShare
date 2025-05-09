import { io } from "socket.io-client";

// Create socket instance with auto-reconnect
const socket = io(process.env.NEXT_PUBLIC_BACKEND_URL as string, {
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