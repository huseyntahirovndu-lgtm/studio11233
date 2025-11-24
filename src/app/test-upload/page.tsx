'use client';

import { useState, ChangeEvent } from 'react';

export default function TestUploadPage() {
  const [uploading, setUploading] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [documentUrl, setDocumentUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileUpload = async (e: ChangeEvent<HTMLInputElement>, type: 'sekil' | 'sened') => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);
    setImageUrl(null);
    setDocumentUrl(null);

    const formData = new FormData();
    formData.append('file', file);

    const endpoint = type === 'sekil' 
        ? '/api/upload/sekiller' 
        : '/api/upload/senedler';

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        if (type === 'sekil') {
          setImageUrl(result.url);
        } else {
          setDocumentUrl(result.url);
        }
      } else {
        setError(result.error || 'Yükləmə zamanı xəta baş verdi.');
      }
    } catch (err: any) {
      setError(err.message || 'Server xətası.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
      <h1>Fayl Yükləmə Testi</h1>

      <div style={{ margin: '2rem 0' }}>
        <h2>Şəkil Yüklə</h2>
        <input 
          type="file" 
          accept="image/*" 
          onChange={(e) => handleFileUpload(e, 'sekil')} 
          disabled={uploading}
        />
      </div>

      <div style={{ margin: '2rem 0' }}>
        <h2>Sənəd Yüklə</h2>
        <input 
          type="file" 
          accept=".pdf,.doc,.docx" 
          onChange={(e) => handleFileUpload(e, 'sened')} 
          disabled={uploading}
        />
      </div>

      {uploading && <p>Yüklənir...</p>}

      {error && <p style={{ color: 'red' }}>Xəta: {error}</p>}

      {imageUrl && (
        <div style={{ marginTop: '2rem' }}>
          <h3>Yüklənmiş Şəkil:</h3>
          <p>URL: <a href={imageUrl} target="_blank" rel="noopener noreferrer">{imageUrl}</a></p>
          <img src={imageUrl} alt="Yüklənmiş şəkil" style={{ maxWidth: '400px', marginTop: '1rem', border: '1px solid #ccc' }} />
        </div>
      )}

      {documentUrl && (
        <div style={{ marginTop: '2rem' }}>
          <h3>Yüklənmiş Sənəd:</h3>
          <p>URL: <a href={documentUrl} target="_blank" rel="noopener noreferrer">{documentUrl}</a></p>
        </div>
      )}
    </div>
  );
}
