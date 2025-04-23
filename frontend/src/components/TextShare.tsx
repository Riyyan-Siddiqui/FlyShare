// frontend/components/TextShare.tsx
import { useEffect, useState } from 'react';

export default function TextShare() {
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [msg, setMsg] = useState('');
  const [chat, setChat] = useState<string[]>([]);

  useEffect(() => {
    // Create a WebSocket connection to the server
    const socket = new WebSocket('ws://localhost:3001');

    socket.onopen = () => {
      console.log('Connected to WebSocket server');
    };

    // When the WebSocket server sends a message
    socket.onmessage = (e) => {
      console.log('Received message from server:', e.data);
      setChat((prev) => [...prev, e.data]); // Append the received message to the chat
    };

    // Store the WebSocket instance in the state
    setWs(socket);

    // Cleanup function to close the WebSocket when the component unmounts
    return () => socket.close();
  }, []);

  const sendMsg = () => {
    if (ws && msg) {
      ws.send(msg);  // Send the message to the WebSocket server
      setMsg('');  // Clear the message input
    }
  };

  return (
    <div>
      <textarea
        value={msg}
        onChange={(e) => setMsg(e.target.value)}
        rows={4}
        cols={40}
      />
      <br />
      <button onClick={sendMsg}>Send</button>
      <div>
        <h3>Received Messages:</h3>
        <ul>
          {chat.map((c, i) => (
            <li key={i}>{c}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
