import React, { useState, useRef } from 'react';
import { Upload, AlertCircle } from 'lucide-react';
import axios from 'axios';

// Define the structure for each file entry
type FileType = {
  id: number;
  name: string;
  size: string;
  type: string;
  timestamp: string;
  sender: string;
};

// Props type
type FileUploadProps = {
  setFiles: React.Dispatch<React.SetStateAction<FileType[]>>;
};

const FileUpload: React.FC<FileUploadProps> = ({ setFiles }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const determineFileType = (file: File): string => {
    if (file.type.includes('image')) return 'image';
    if (file.type.includes('video')) return 'video';
    if (file.type.includes('text') || file.type.includes('pdf') || 
        file.type.includes('document') || file.type.includes('application/pdf')) return 'document';
    return 'file';
  };

  const handleFileChange = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    
    setIsUploading(true);
    setError(null);
    setUploadProgress(0);
    
    try {
      // Process each file
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const formData = new FormData();
        formData.append('file', file);
        
        // Upload with progress tracking
        await axios.post('https://5e0f-119-155-207-98.ngrok-free.app/upload', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          onUploadProgress: (progressEvent) => {
            if (progressEvent.total) {
              const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
              setUploadProgress(percentCompleted);
            }
          },
        });
        
        // Add file to UI immediately after successful upload
        const newFile: FileType = {
          id: Date.now() + i,
          name: file.name,
          size: formatFileSize(file.size),
          type: determineFileType(file),
          timestamp: 'Just now',
          sender: 'You',
        };
        
        setFiles(prev => [newFile, ...prev]);
        
        // Reset progress after each file
        setUploadProgress(0);
      }
      
      // Clear file input after successful upload
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error: any) {
      console.error('Upload failed:', error);
      setError(error.response?.data?.message || 'File upload failed. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileChange(e.dataTransfer.files);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFileChange(e.target.files);
  };

  return (
    <div className="mb-6">
      <div 
        className={`dropzone ${isDragging ? 'active' : ''} border-2 border-dashed rounded-lg p-6 transition-all`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="flex flex-col items-center justify-center text-center">
          <Upload className="w-12 h-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium mb-2">
            Drag & Drop Files Here
          </h3>
          <p className="text-gray-500 mb-4">
            Drop files here to share with all connected devices
          </p>
          
          {isUploading && (
            <div className="w-full mb-4">
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div 
                  className="bg-blue-600 h-2.5 rounded-full" 
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
              <p className="text-sm text-center mt-2">Uploading... {uploadProgress}%</p>
            </div>
          )}
          
          {error && (
            <div className="p-3 bg-red-100 text-red-700 rounded-lg flex items-center mb-4 w-full">
              <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0" />
              <p className="text-sm">{error}</p>
            </div>
          )}
          
          <label className="btn btn-primary cursor-pointer">
            Select Files
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              multiple
              onChange={handleFileInputChange}
              disabled={isUploading}
            />
          </label>
        </div>
      </div>
    </div>
  );
};

export default FileUpload;