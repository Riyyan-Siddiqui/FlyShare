'use client'

import { useState } from 'react';
import TextShare from '@/components/TextShare';
import FileShare from '@/components/FileShare';

export default function Home() {
  const [mode, setMode] = useState<'text' | 'file' | null>(null);

  return (
    <div className="p-10">
      {!mode && (
        <div>
          <button onClick={() => setMode('text')} className="mr-4">Text</button>
          <button onClick={() => setMode('file')}>File</button>
        </div>
      )}
      {mode === 'text' && <TextShare />}
      {mode === 'file' && <FileShare />}
    </div>
  );
}
