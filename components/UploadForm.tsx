'use client';

import { useState } from 'react';

export default function UploadForm() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setUploading(true);
    setMessage('');

    const formData = new FormData();
    formData.append('file', file);

    const res = await fetch('/api/process-pdf', {
      method: 'POST',
      body: formData,
    });

    const data = await res.json();

    if (res.ok) {
      setMessage('PDF uploaded and processing started!');
      setFile(null);
    } else {
      setMessage('Error: ' + (data.error || 'Upload failed'));
    }

    setUploading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-lg font-medium text-gray-700 mb-2">
          Choose a PDF file
        </label>
        <input
          type="file"
          accept=".pdf"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          required
          className="block w-full text-sm text-gray-600 file:mr-4 file:py-3 file:px-6 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700"
        />
      </div>

      <button
        type="submit"
        disabled={uploading || !file}
        className="w-full py-4 px-6 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition"
      >
        {uploading ? 'Uploading & Processing…' : 'Upload PDF'}
      </button>

      {message && (
        <p className={`text-center text-lg ${message.includes('Error') ? 'text-red-600' : 'text-green-600'}`}>
          {message}
        </p>
      )}
    </form>
  );
}
