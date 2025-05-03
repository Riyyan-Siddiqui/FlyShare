// socket.ts
import { io } from "socket.io-client";

const socket = io("https://4a4a-39-34-144-246.ngrok-free.app", {
    transports: ["websocket"],  // Specify to use WebSocket transport
  });

export default socket;
