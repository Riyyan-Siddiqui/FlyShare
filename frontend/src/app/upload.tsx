import { useState } from 'react';
import axios from 'axios';

export default function UploadPage() {
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState('');

  // Handle file change event
  const handleFileChange = (e: any) => {
    setFile(e.target.files[0]);
  };

  // Handle file upload
  const handleUpload = async () => {
    if (!file) {
      setMessage('Please select a file');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await axios.post('http://localhost:3001/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data', // Important for file uploads
        },
      });
      setMessage(response.data.message); // Display success message from backend
    } catch (error) {
      console.error('Error uploading file:', error);
      setMessage('File upload failed');
    }
  };

  return (
    <div>
      <h1>File Upload</h1>
      <input type="file" onChange={handleFileChange} />
      <button onClick={handleUpload}>Upload</button>
      {message && <p>{message}</p>}
    </div>
  );
}
