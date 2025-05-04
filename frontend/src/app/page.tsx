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
import FileUpload from "./FileUpload";

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

  // ✅ Now inside the component
  useEffect(() => {
    console.log("Setting up socket listeners...");

    socket.on("connect", () => {
      console.log("Connected to Socket.IO server");
    });

    socket.on("receive_message", (data: Message) => {
      console.log("Message received:", data);
      setMessages((prevMessages) => [data, ...prevMessages]);
    });

    return () => {
      // Clean up the socket listeners when the component unmounts
      socket.off("connect");
      socket.off("receive_message");
    };
  }, []);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert("Copied to clipboard");
  };

  const sendMessage = () => {
    if (sharedText.trim()) {
      const newMessage = {
        text: sharedText,
        time: "Just now",
        device: "You",
      };
      console.log("Emitting message:", newMessage); // Add this log
      socket.emit("send_message", newMessage);
      setSharedText("");
    }
  };

  const [activeTab, setActiveTab] = useState("files");
  const [files, setFiles] = useState([
    {
      id: 1,
      name: "Project Presentation.pdf",
      size: "2.4 MB",
      type: "document",
      timestamp: "Just now",
      sender: "MacBook Pro",
    },
    {
      id: 2,
      name: "Vacation Photo.jpg",
      size: "3.8 MB",
      type: "image",
      timestamp: "2 minutes ago",
      sender: "iPhone 13",
    },
    {
      id: 3,
      name: "Meeting Notes.txt",
      size: "12 KB",
      type: "text",
      timestamp: "5 minutes ago",
      sender: "MacBook Pro",
    },
    {
      id: 4,
      name: "Product Demo.mp4",
      size: "18.2 MB",
      type: "video",
      timestamp: "10 minutes ago",
      sender: "iPhone 13",
    },
  ]);
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    // Simulate file upload
    if (e.dataTransfer.files.length > 0) {
      const newFiles = Array.from(e.dataTransfer.files).map((file, index) => {
        let type = "file";
        if (file.type.includes("image")) type = "image";
        else if (file.type.includes("video")) type = "video";
        else if (
          file.type.includes("text") ||
          file.type.includes("pdf") ||
          file.type.includes("document")
        )
          type = "document";

        return {
          id: files.length + index + 1,
          name: file.name,
          size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
          type,
          timestamp: "Just now",
          sender: "You",
        };
      });

      setFiles([...newFiles, ...files]);
      alert(`${newFiles.length} file(s) shared with all connected devices`);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files).map((file, index) => {
        let type = "file";
        if (file.type.includes("image")) type = "image";
        else if (file.type.includes("video")) type = "video";
        else if (
          file.type.includes("text") ||
          file.type.includes("pdf") ||
          file.type.includes("document")
        )
          type = "document";

        return {
          id: files.length + index + 1,
          name: file.name,
          size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
          type,
          timestamp: "Just now",
          sender: "You",
        };
      });

      setFiles([...newFiles, ...files]);
      alert(`${newFiles.length} file(s) shared with all connected devices`);
    }
  };

  const removeFile = (id: number) => {
    setFiles(files.filter((file) => file.id !== id));
    alert("The file has been removed from shared files");
  };

  const getFileIcon = (type: string) => {
    switch (type) {
      case "image":
        return <ImageIcon className="icon text-blue-500 w-6 h-6" />;
      case "video":
        return <Film className="icon text-purple-500 w-6 h-6" />;
      case "document":
        return <FileText className="icon text-orange-500 w-6 h-6" />;
      case "text":
        return <FileText className="icon text-green-500 w-6 h-6" />;
      default:
        return <File className="icon text-gray-500 w-6 h-6" />;
    }
  };

  const getDeviceIcon = (type: string) => {
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
  };

  const downloadFile = (filename: string) => {
    const link = document.createElement("a");
    link.href = `http://localhost:3001/download/${filename}`;
    link.download = filename;
    link.click();
  };

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
              {connectedDevices.map((device) => (
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

        {/* File Upload */}
        <div className="card mb-8">
          <div className="card-content">
            <FileUpload setFiles={setFiles} />
          </div>
        </div>

        {/* Tabs */}
        <div className="tabs">
          <div className="tabs-list">
            <button
              className={`tab ${activeTab === "files" ? "active" : ""}`}
              data-state={activeTab === "files" ? "active" : "inactive"}
              onClick={() => setActiveTab("files")}
            >
              Files
            </button>
            <button
              className={`tab ${activeTab === "text" ? "active" : ""}`}
              data-state={activeTab === "text" ? "active" : "inactive"}
              onClick={() => setActiveTab("text")}
            >
              Text
            </button>
          </div>

          <div
            className="tab-content"
            data-state={activeTab === "files" ? "active" : "inactive"}
          >
            <div className="card">
              <div className="card-content">
                <div
                  className={`dropzone ${isDragging ? "active" : ""}`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  <div className="flex flex-col items-center justify-center text-center">
                    <Upload className="icon text-muted w-10 h-10 mb-4" />
                    <h3 className="text-lg font-medium mb-2">
                      Drag & Drop Files Here
                    </h3>
                    <p className="text-muted mb-4 max-w-md">
                      Drop your files here to instantly share them with all
                      connected devices
                    </p>
                    <div className="flex gap-3">
                      <label htmlFor="file-upload">
                        <span className="btn btn-primary">Select Files</span>
                        <input
                          id="file-upload"
                          type="file"
                          multiple
                          className="hidden"
                          onChange={handleFileUpload}
                        />
                      </label>
                      <button className="btn btn-outline">
                        Paste from Clipboard
                      </button>
                    </div>
                  </div>
                </div>

                <h3 className="text-lg font-medium mb-4 mt-2">Shared Files</h3>

                {files.length > 0 ? (
                  <div className="space-y-3">
                    {files.map((file) => (
                      <div key={file.id} className="file-item">
                        {getFileIcon(file.type)}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="font-medium truncate">{file.name}</p>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-muted whitespace-nowrap">
                                {file.size}
                              </span>
                              <div className="badge badge-outline whitespace-nowrap">
                                <Clock className="icon w-3 h-3 mr-1" />
                                {file.timestamp}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-muted">
                              From: {file.sender}
                            </span>
                            <div className="flex gap-1">
                              <button
                                className="btn btn-ghost btn-icon h-8 w-8"
                                onClick={() => downloadFile(file.name)}
                              >
                                <Download className="icon w-4 h-4" />
                              </button>
                              <button
                                className="btn btn-ghost btn-icon h-8 w-8 text-red-500"
                                onClick={() => removeFile(file.id)}
                              >
                                <X className="icon w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center p-8 border border-dashed rounded-lg">
                    <p className="text-muted">No files shared yet</p>
                  </div>
                )}
              </div>
            </div>
          </div>
          <div
            className="tab-content"
            data-state={activeTab === "text" ? "active" : "inactive"}
          >
            {/* Text Sharing Tab */}
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
