"use client";

import React, { useState, useEffect, useRef } from "react";
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
  AlertCircle,
  User,
} from "lucide-react";
import "./globals.css";
import socket from "../components/Socket";
import FileUpload from "./FileUpload";

type Message = {
  text: string;
  time: string;
  device: string;
  sender: string;
};

type FileType = {
  id: number;
  name: string;
  size: string;
  type: string;
  timestamp: string;
  sender: string;
};

type DeviceInfo = {
  id: string;
  name: string;
  type: string;
};

export default function Home() {
  const [connected, setConnected] = useState(false);
  const [connectedDevices, setConnectedDevices] = useState<DeviceInfo[]>([]);
  const [sharedText, setSharedText] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [activeTab, setActiveTab] = useState("files");
  const [files, setFiles] = useState<FileType[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [socketConnected, setSocketConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [networkId, setNetworkId] = useState<string | null>(null);
  const [deviceName, setDeviceName] = useState("");
  const [deviceType, setDeviceType] = useState("laptop");
  const [showDevicePrompt, setShowDevicePrompt] = useState(true);

  // Refs for elements
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textAreaRef = useRef<HTMLTextAreaElement>(null);

  // Generate a device name if not already set
  useEffect(() => {
    if (!deviceName) {
      const deviceTypes = ["Phone", "Laptop", "Tablet", "Computer"];
      const randomType = deviceTypes[Math.floor(Math.random() * deviceTypes.length)];
      const randomNum = Math.floor(Math.random() * 1000);
      setDeviceName(`${randomType}-${randomNum}`);
    }
  }, [deviceName]);

  // Initialize socket connection
  useEffect(() => {
    console.log("Setting up socket listeners...");

    // Connection events
    socket.on("connect", () => {
      console.log("Connected to Socket.IO server");
      setSocketConnected(true);
      setError(null);
      
      // If we already have device info, register the device
      if (deviceName && !showDevicePrompt) {
        registerDevice();
      }
    });

    socket.on("disconnect", () => {
      console.log("Disconnected from Socket.IO server");
      setSocketConnected(false);
      setError("Connection to server lost. Trying to reconnect...");
      setConnected(false);
    });

    socket.on("connect_error", (err) => {
      console.error("Socket connection error:", err);
      setSocketConnected(false);
      setError("Failed to connect to server. Please check your network.");
      setConnected(false);
    });

    // Message events
    socket.on("receive_message", (data: Message) => {
      console.log("Message received:", data);
      setMessages((prevMessages) => [data, ...prevMessages]);
    });

    // File events
    socket.on("file_shared", (fileData: any) => {
      console.log("File shared event:", fileData);
      
      // Convert to our file format
      const newFile: FileType = {
        id: fileData.id || Date.now(),
        name: fileData.name,
        size: formatFileSize(fileData.size),
        type: getFileType(fileData.name),
        timestamp: fileData.timestamp ? new Date(fileData.timestamp).toLocaleTimeString() : "Just now",
        sender: fileData.sender || "Another device",
      };
      
      setFiles((prevFiles) => [newFile, ...prevFiles]);
    });

    // Network room events
    socket.on("device_list", (devices: DeviceInfo[]) => {
      console.log("Device list updated:", devices);
      setConnectedDevices(devices);
      setConnected(true);
    });

    socket.on("device_left", (data: {id: string}) => {
      console.log("Device left:", data.id);
      setConnectedDevices(prev => prev.filter(device => device.id !== data.id));
    });

    socket.on("file_list", (fileList: any[]) => {
      console.log("File list received:", fileList);
      // Convert to our file format
      const formattedFiles = fileList.map(file => ({
        id: file.id || Date.now() + Math.random(),
        name: file.name,
        size: formatFileSize(file.size),
        type: getFileType(file.name),
        timestamp: file.timestamp ? new Date(file.timestamp).toLocaleTimeString() : "Unknown",
        sender: file.sender || "Server",
      }));
      
      setFiles(formattedFiles);
    });

    return () => {
      // Clean up the socket listeners when the component unmounts
      socket.off("connect");
      socket.off("disconnect");
      socket.off("connect_error");
      socket.off("receive_message");
      socket.off("file_shared");
      socket.off("device_list");
      socket.off("device_left");
      socket.off("file_list");
    };
  }, [deviceName, showDevicePrompt]);

  // Register device with server
  const registerDevice = () => {
    if (!deviceName.trim()) {
      setError("Please enter a device name");
      return;
    }

    const deviceInfo = {
      name: deviceName,
      type: deviceType
    };

    console.log("Registering device:", deviceInfo);
    socket.emit("register_device", deviceInfo);
    
    // Store device name in local storage
    localStorage.setItem("deviceName", deviceName);
    localStorage.setItem("deviceType", deviceType);
    
    setShowDevicePrompt(false);
  };

  // Handle device form submission
  const handleDeviceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    registerDevice();
  };

  // Helper function to determine file type
  const getFileType = (filename: string) => {
    const ext = filename.split('.').pop()?.toLowerCase() || '';
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext)) return 'image';
    if (['mp4', 'webm', 'avi', 'mov', 'mkv'].includes(ext)) return 'video';
    if (['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'].includes(ext)) return 'document';
    if (['txt', 'md', 'rtf', 'csv', 'json'].includes(ext)) return 'text';
    return 'file';
  };

  // Helper function to format file size
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Copy text to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
      .then(() => {
        // Show success message
        const tempAlert = document.createElement('div');
        tempAlert.className = 'copy-alert';
        tempAlert.innerText = 'Copied to clipboard';
        document.body.appendChild(tempAlert);
        setTimeout(() => document.body.removeChild(tempAlert), 2000);
      })
      .catch(err => {
        console.error('Error copying text: ', err);
        setError('Failed to copy to clipboard');
      });
  };

  // Send text message
  const sendMessage = () => {
    if (sharedText.trim()) {
      const newMessage = {
        text: sharedText,
        time: new Date().toLocaleTimeString(),
        device: deviceName,
      };
      console.log("Emitting message:", newMessage);
      socket.emit("send_message", newMessage);
      setSharedText("");
      
      // Clear the textarea and focus it
      if (textAreaRef.current) {
        textAreaRef.current.focus();
      }
    }
  };

  // Handle drag and drop for files
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

    // Let the FileUpload component handle this
    if (activeTab === "files" && e.dataTransfer.files.length > 0) {
      if (fileInputRef.current) {
        fileInputRef.current.files = e.dataTransfer.files;
        const event = new Event('change', { bubbles: true });
        fileInputRef.current.dispatchEvent(event);
      }
    }
  };

  // Remove file from list
  const removeFile = (id: number) => {
    setFiles(files.filter((file) => file.id !== id));
  };

  // Download file
  const downloadFile = (filename: string) => {
    window.open(`https://1fbe-110-38-229-3.ngrok-free.app/download/${filename}`, '_blank');
  };

  // Get file icon based on file type
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

  // Get device icon based on device type
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

  // Device registration modal
  const DeviceRegistrationModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <h2 className="text-xl font-semibold mb-4">Welcome to Fly Share</h2>
        <p className="text-muted mb-4">
          Please enter a name for your device to connect to the local network
        </p>
        
        <form onSubmit={handleDeviceSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="deviceName" className="block text-sm font-medium mb-1">
                Device Name
              </label>
              <input
                type="text"
                id="deviceName"
                className="input w-full"
                value={deviceName}
                onChange={(e) => setDeviceName(e.target.value)}
                placeholder="My Device"
                required
              />
            </div>
            
            <div>
              <label htmlFor="deviceType" className="block text-sm font-medium mb-1">
                Device Type
              </label>
              <select
                id="deviceType"
                className="select w-full"
                value={deviceType}
                onChange={(e) => setDeviceType(e.target.value)}
              >
                <option value="phone">Phone</option>
                <option value="laptop">Laptop</option>
                <option value="tablet">Tablet</option>
                <option value="desktop">Desktop</option>
              </select>
            </div>
            
            <button type="submit" className="btn btn-primary w-full">
              Join Network
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  // Main app content
  return (
    <div className="min-h-screen bg-gradient">
      {showDevicePrompt && <DeviceRegistrationModal />}
      
      <div className="container max-w-5xl py-8">
        {/* Header */}
        <header className="flex flex-col items-center justify-center text-center mb-8">
          <div className="flex items-center gap-2 mb-2">
            <Wifi className={`icon icon-blue w-8 h-8 ${socketConnected ? 'text-green-500' : 'text-red-500'}`} />
            <h1 className="text-3xl font-bold">Fly Share</h1>
          </div>
          <p className="text-muted max-w-md">
            Share files and text instantly with devices on the same WiFi network
          </p>
          {error && (
            <div className="mt-4 p-3 bg-red-100 text-red-700 rounded-lg flex items-center">
              <AlertCircle className="w-5 h-5 mr-2" />
              <span>{error}</span>
            </div>
          )}
        </header>

        {/* Connected Devices */}
        <div className="card mb-8">
          <div className="card-content">
            <h2 className="text-xl font-semibold mb-4">
              Devices on Your WiFi Network {connected && `(${connectedDevices.length})`}
            </h2>
            
            <div className="space-y-3">
              {connectedDevices.length > 0 ? (
                connectedDevices.map((device) => (
                  <div
                    key={device.id}
                    className="flex items-center justify-between p-3 bg-muted rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      {getDeviceIcon(device.type)}
                      <span>{device.name}</span>
                      {device.id === socket.id && (
                        <span className="text-xs text-muted">(You)</span>
                      )}
                    </div>
                    <div className="badge badge-success">Active</div>
                  </div>
                ))
              ) : (
                <div className="text-center p-8 border border-dashed rounded-lg">
                  <p className="text-muted">
                    {socketConnected 
                      ? "No other devices connected yet" 
                      : "Connecting to network..."}
                  </p>
                </div>
              )}
              
              {connected && (
                <div className="flex justify-between items-center mt-4">
                  <p className="text-sm text-muted">
                    <User className="inline w-4 h-4 mr-1" />
                    You are connected as <strong>{deviceName}</strong>
                  </p>
                  <button 
                    className="btn btn-outline btn-sm"
                    onClick={() => setShowDevicePrompt(true)}
                  >
                    Change Device
                  </button>
                </div>
              )}
            </div>
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
                {/* File Upload Component */}
                <FileUpload setFiles={setFiles} />

                <h3 className="text-lg font-medium mb-4 mt-8">Shared Files</h3>

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
                    ref={textAreaRef}
                    className="textarea min-h-32"
                    placeholder="Type or paste text to share with connected devices..."
                    value={sharedText}
                    onChange={(e) => setSharedText(e.target.value)}
                    onKeyDown={(e) => {
                      // Send on Ctrl+Enter or Cmd+Enter
                      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                        sendMessage();
                      }
                    }}
                  />
                  <div className="flex justify-between">
                    <button
                      className="btn btn-outline"
                      onClick={() => setSharedText("")}
                    >
                      Clear
                    </button>
                    <button 
                      className="btn btn-primary" 
                      onClick={sendMessage}
                      disabled={!sharedText.trim()}
                    >
                      Share Text
                    </button>
                  </div>
                </div>

                <div className="separator"></div>

                <h3 className="text-lg font-medium mb-4">Received Text</h3>
                <div className="space-y-3">
                  {messages.length > 0 ? (
                    messages.map((msg, index) => (
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
                    ))
                  ) : (
                    <div className="text-center p-8 border border-dashed rounded-lg">
                      <p className="text-muted">No messages received yet</p>
                    </div>
                  )}
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
