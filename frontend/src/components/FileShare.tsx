// frontend/components/FileShare.tsx
import { useState } from 'react';
import axios from 'axios';

export default function FileShare() {
  const [file, setFile] = useState<File | null>(null);
  const [link, setLink] = useState<string>('');

  const handleUpload = async () => {
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await axios.post<{ link: string }>('/api/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setLink(res.data.link);  // Get the file URL from the response
    } catch (error) {
      console.error("Error uploading file:", error);
    }
  };

  return (
    <div>
      <input
        type="file"
        onChange={(e) => setFile(e.target.files ? e.target.files[0] : null)}
      />
      <button onClick={handleUpload}>Upload</button>
      {link && <p>Download: <a href={link}>{link}</a></p>}
    </div>
  );
}
