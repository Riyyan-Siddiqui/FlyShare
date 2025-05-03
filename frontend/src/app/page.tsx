"use client";

import React, { useState, useEffect } from "react";
import {
  Wifi,
  Upload,
  Copy,
  FileText,
  ImageIcon,
  Film,
  File,
  Download,
  Smartphone,
  Laptop,
  Tablet,
  Clock,
  X,
  ComputerIcon as Device,
} from "lucide-react";
import Image from "next/image";
import "./globals.css";
import socket from "../components/Socket";

type Message = {
  text: string;
  time: string;
  device: string;
};

export default function Home() {
  const [connected, setConnected] = useState(true);
  const [connectedDevices, setConnectedDevices] = useState([
    { id: 1, name: "iPhone 13", type: "phone" },
    { id: 2, name: "MacBook Pro", type: "laptop" },
  ]);
  const [sharedText, setSharedText] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [room , setRoom] = useState("");

  // ✅ Now inside the component
  useEffect(() => {
    const setup = async () => {
      try {
        const res = await fetch("https://e446-39-34-144-246.ngrok-free.app"); // 👈 Make sure this matches your backend URL
        const data = await res.json();
        setRoom(data.room);
        console.log("Joining room:", data.room);
        socket.emit("join_room", data.room);
      } catch (error) {
        console.error("Failed to get room:", error);
      }
    };
  
    setup();
  
    socket.on("connect", () => {
      console.log("Connected to Socket.IO server");
    });
  
    socket.on("receive_message", (data: Message) => {
      console.log("Message received:", data);
      setMessages((prevMessages) => [data, ...prevMessages]);
    });
  
    return () => {
      socket.off("connect");
      socket.off("receive_message");
    };
  }, []);
  
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert("Copied to clipboard");
  };

  const sendMessage = () => {
    console.log("clicked share button");
    if (!room) {
      console.warn("Room is not set!");
      return;
    }
  
    if (!sharedText.trim()) {
      console.warn("Shared text is empty!");
      return;
    }
  
    const newMessage = {
      text: sharedText,
      time: "Just now",
      device: "You",
    };
  
    console.log("Emitting message:", newMessage.text, "to room:", room);
    socket.emit("send_message", { room, message: newMessage });
    setSharedText("");
    }


  return (
    <div className="min-h-screen bg-gradient">
      <div className="container max-w-5xl py-8">
        {/* Header */}
        <header className="flex flex-col items-center justify-center text-center mb-8">
          <div className="flex items-center gap-2 mb-2">
            <Wifi className="icon icon-blue w-8 h-8" />
            <h1 className="text-3xl font-bold">Fly Share</h1>
          </div>
          <p className="text-muted max-w-md">
            Share files and text instantly with devices on the same WiFi network
          </p>
        </header>

        {/* Connected Devices */}
        <div className="card mb-8">
          <div className="card-content">
            <h2 className="text-xl font-semibold mb-4">Connected Devices</h2>
            <div className="space-y-3">
              {connectedDevices.map((device: any) => (
                <div
                  key={device.id}
                  className="flex items-center justify-between p-3 bg-muted rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    {getDeviceIcon(device.type)}
                    <span>{device.name}</span>
                  </div>
                  <div className="badge badge-success">Active</div>
                </div>
              ))}
              <button className="btn btn-outline w-full mt-2">
                Add Device
              </button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="tabs">
          <div className="tabs-list">
            <button className="tab active">Text</button>
          </div>

          {/* Text Sharing Tab */}
          <div className="tab-content active">
            <div className="card">
              <div className="card-content">
                <h3 className="text-lg font-medium mb-4">Share Text</h3>
                <div className="space-y-4">
                  <textarea
                    className="textarea min-h-32"
                    placeholder="Type or paste text to share with connected devices..."
                    value={sharedText}
                    onChange={(e) => setSharedText(e.target.value)}
                  />
                  <div className="flex justify-between">
                    <button
                      className="btn btn-outline"
                      onClick={() => setSharedText("")}
                    >
                      Clear
                    </button>
                    <button className="btn btn-primary" onClick={sendMessage}>
                      Share Text
                    </button>
                  </div>
                </div>

                <div className="separator"></div>

                <h3 className="text-lg font-medium mb-4">Received Text</h3>
                <div className="space-y-3">
                  {messages.map((msg, index) => (
                    <div key={index} className="text-message">
                      <div className="flex items-center justify-between mb-2">
                        <div className="badge badge-outline">
                          <Clock className="icon w-3 h-3 mr-1" />
                          {msg.time}
                        </div>
                        <span className="text-xs text-muted">
                          From: {msg.device}
                        </span>
                      </div>
                      <p className="mb-3">{msg.text}</p>
                      <button
                        className="btn btn-outline btn-sm text-xs"
                        onClick={() => copyToClipboard(msg.text)}
                      >
                        <Copy className="icon w-3 h-3 mr-1" />
                        Copy to clipboard
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-muted">
          <p>
            All transfers are end-to-end encrypted and only available on your
            local network
          </p>
        </div>
      </div>
    </div>
  );
}

function getDeviceIcon(type: string) {
  switch (type) {
    case "phone":
      return <Smartphone className="icon w-5 h-5" />;
    case "laptop":
      return <Laptop className="icon w-5 h-5" />;
    case "tablet":
      return <Tablet className="icon w-5 h-5" />;
    default:
      return <Device className="icon w-5 h-5" />;
  }
}
