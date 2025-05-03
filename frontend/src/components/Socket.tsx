// socket.ts
import { io } from "socket.io-client";

const socket = io("https://2f73-39-34-144-246.ngrok-free.app", {
  transports: ["websocket"], // optional but recommended
});

export default socket;
