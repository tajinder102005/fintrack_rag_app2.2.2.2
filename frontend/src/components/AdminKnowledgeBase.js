import React, { useState } from 'react';
import { Upload, FileText, CheckCircle, AlertTriangle, Loader, BookOpen } from 'lucide-react';
import './AdminKnowledgeBase.css';

const AdminKnowledgeBase = () => {
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState(null); // null, 'success', 'error'
  const [errorMessage, setErrorMessage] = useState('');
  const [chunksIngested, setChunksIngested] = useState(0);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (selectedFile.type !== 'text/plain') {
        setUploadStatus('error');
        setErrorMessage('Only .txt files are supported at this time.');
        setFile(null);
      } else {
        setFile(selectedFile);
        setUploadStatus(null);
        setErrorMessage('');
      }
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.type !== 'text/plain') {
        setUploadStatus('error');
        setErrorMessage('Only .txt files are supported at this time.');
        setFile(null);
      } else {
        setFile(droppedFile);
        setUploadStatus(null);
        setErrorMessage('');
      }
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setIsUploading(true);
    setUploadStatus(null);

    const formData = new FormData();
    formData.append('document', file);

    try {
      // Send the file to our new backend route
      const token = localStorage.getItem('token');
      const backendUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
      
      const response = await fetch(`${backendUrl}/knowledge/upload`, {
        method: 'POST',
        headers: {
          // If we had strict auth, we would pass the token here:
          // 'Authorization': `Bearer ${token}` 
        },
        body: formData
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to upload document');
      }

      setUploadStatus('success');
      setChunksIngested(data.chunks || 0);
      setFile(null);
    } catch (error) {
      console.error('Upload error:', error);
      setUploadStatus('error');
      setErrorMessage(error.message);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="admin-knowledge-base">
      <div className="admin-header">
        <div>
          <h1>AI Coach Knowledge Base</h1>
          <p>Upload educational material to train FinTrack's AI Coach</p>
        </div>
        <BookOpen size={32} className="header-icon" />
      </div>

      <div className="upload-container">
        <div 
          className={`drop-zone ${file ? 'has-file' : ''}`}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onClick={() => document.getElementById('file-upload').click()}
        >
          <input 
            type="file" 
            id="file-upload" 
            className="hidden-input" 
            accept=".txt"
            onChange={handleFileChange}
          />
          
          {!file ? (
            <div className="drop-zone-content">
              <Upload size={48} className="upload-icon" />
              <h3>Click or drag a file to upload</h3>
              <p>Supports .txt format only (Max 5MB)</p>
            </div>
          ) : (
            <div className="selected-file-content">
              <FileText size={48} className="file-icon" />
              <h3>{file.name}</h3>
              <p>{(file.size / 1024).toFixed(2)} KB</p>
              <button 
                className="btn btn-secondary change-file-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  setFile(null);
                }}
              >
                Remove File
              </button>
            </div>
          )}
        </div>

        {uploadStatus === 'error' && (
          <div className="status-message error">
            <AlertTriangle size={20} />
            <span>{errorMessage}</span>
          </div>
        )}

        {uploadStatus === 'success' && (
          <div className="status-message success">
            <CheckCircle size={20} />
            <span>Document successfully ingested! Generated {chunksIngested} chunks.</span>
          </div>
        )}

        <button 
          className="btn btn-primary upload-submit-btn"
          disabled={!file || isUploading}
          onClick={handleUpload}
        >
          {isUploading ? (
            <>
              <Loader className="spinner" size={20} />
              Ingesting Document...
            </>
          ) : (
            <>
              <Upload size={20} />
              Upload & Process
            </>
          )}
        </button>
      </div>

      <div className="instructions-card">
        <h3>How it works</h3>
        <ol>
          <li><strong>Upload</strong> your financial education text file.</li>
          <li>The system will automatically <strong>chunk</strong> the document into smaller paragraphs.</li>
          <li>Each chunk is <strong>embedded</strong> using Google's Gemini AI model.</li>
          <li>Embeddings are saved to <strong>Pinecone</strong>, expanding the AI Coach's brain instantly!</li>
        </ol>
      </div>
    </div>
  );
};

export default AdminKnowledgeBase;
