import React, { ChangeEvent, useState } from 'react';
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

// Component
const FileUpload: React.FC<FileUploadProps> = ({ setFiles }) => {
  const [file, setFile] = useState<File | null>(null);

  const onFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const onFileUpload = async () => {
    if (!file) {
      alert('Please select a file first.');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await axios.post('http://localhost:3001/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      // Add file to state after successful upload
      const newFile: FileType = {
        id: Date.now(),
        name: file.name,
        size: `${(file.size / 1024).toFixed(2)} KB`,
        type: file.type,
        timestamp: new Date().toISOString(),
        sender: 'You',
      };

      setFiles((prevFiles) => [...prevFiles, newFile]);

      alert('File uploaded successfully');
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Error uploading file');
    }
  };

  return (
    <div>
      <input type="file" onChange={onFileChange} />
      <button onClick={onFileUpload}>Upload</button>
    </div>
  );
};

export default FileUpload;
