// socket.ts
import { io } from "socket.io-client";

const socket = io("https://ecb5-39-34-147-234.ngrok-free.app", {
    transports: ["websocket"],  // Specify to use WebSocket transport
  });

export default socket;
