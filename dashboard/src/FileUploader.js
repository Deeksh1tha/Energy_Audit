import React, { useState, useRef, useEffect } from "react";
import axios from "axios";

const FileUploader = ({ onDataReceived, onError, onLoadingChange, isLoading }) => {
  const [file, setFile] = useState(null);
  const [fileId, setFileId] = useState(null);
  const [uploadStatus, setUploadStatus] = useState("");
  const [duration, setDuration] = useState(10);
  const [analysisStarted, setAnalysisStarted] = useState(false);
  const fileInputRef = useRef(null);
  
  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];
    if (selectedFile) {
      // Check if file is an executable
      const validExtensions = ['.exe', '.com', '.bat', '.cmd'];
      const fileExt = selectedFile.name.substring(selectedFile.name.lastIndexOf('.')).toLowerCase();
      
      if (!validExtensions.includes(fileExt)) {
        onError("Please select an executable file (.exe, .com, .bat, or .cmd)");
        fileInputRef.current.value = "";
        return;
      }
      
      setFile(selectedFile);
      setUploadStatus("");
      setFileId(null);
      setAnalysisStarted(false);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      onError("Please select a file to upload");
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    
    onLoadingChange(true);
    setUploadStatus("Uploading...");
    
    try {
      const response = await axios.post('http://localhost:5000/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      if (response.data.success) {
        setFileId(response.data.file_id);
        setUploadStatus(`Uploaded: ${response.data.filename}`);
      } else {
        onError(response.data.error || "Upload failed");
        setUploadStatus("Upload failed");
      }
    } catch (err) {
      console.error("Upload error:", err);
      onError("Error uploading file. Please try again.");
      setUploadStatus("Upload failed");
    } finally {
      onLoadingChange(false);
    }
  };

  const startAnalysis = async () => {
    if (!fileId) {
      onError("Please upload a file first");
      return;
    }
    
    onLoadingChange(true);
    setAnalysisStarted(true);
    
    try {
      const response = await axios.post(`http://localhost:5000/analyze-executable/${fileId}`, {
        duration: parseInt(duration)
      });
      
      if (response.data.success) {
        checkAnalysisStatus();
      } else {
        onError(response.data.error || "Analysis failed to start");
        onLoadingChange(false);
        setAnalysisStarted(false);
      }
    } catch (err) {
      console.error("Analysis error:", err);
      onError("Error starting analysis. Please try again.");
      onLoadingChange(false);
      setAnalysisStarted(false);
    }
  };

  const checkAnalysisStatus = async () => {
    try {
      const response = await axios.get(`http://localhost:5000/analysis-status/${fileId}`);
      
      if (response.data.success) {
        if (response.data.status === 'completed' && response.data.result) {
          onDataReceived(response.data.result);
          onLoadingChange(false);
          setAnalysisStarted(false);
        } else if (response.data.status === 'analyzing') {
          // Check again in 2 seconds
          setTimeout(checkAnalysisStatus, 2000);
        } else {
          onError(`Analysis status: ${response.data.status}`);
          onLoadingChange(false);
          setAnalysisStarted(false);
        }
      } else {
        onError(response.data.error || "Failed to get analysis status");
        onLoadingChange(false);
        setAnalysisStarted(false);
      }
    } catch (err) {
      console.error("Status check error:", err);
      onError("Error checking analysis status. Please try again.");
      onLoadingChange(false);
      setAnalysisStarted(false);
    }
  };

  useEffect(() => {
    return () => {
      // Cleanup function
      if (analysisStarted) {
        onLoadingChange(false);
      }
    };
  }, [analysisStarted, onLoadingChange]);

  return (
    <div className="uploader-section">
      <h2>Upload Executable for Analysis</h2>
      
      <div className="file-upload">
        <input 
          type="file" 
          onChange={handleFileChange}
          ref={fileInputRef}
          disabled={isLoading}
        />
        <button 
          onClick={handleUpload} 
          disabled={!file || isLoading}
          className={isLoading && !analysisStarted ? 'loading' : ''}
        >
          Upload
        </button>
      </div>
      
      {uploadStatus && <p className="upload-status">{uploadStatus}</p>}
      
      {fileId && (
        <div className="analysis-controls">
          <div className="duration-control">
            <label htmlFor="duration">Analysis Duration (seconds):</label>
            <input 
              type="number" 
              id="duration" 
              min="5" 
              max="60" 
              value={duration} 
              onChange={(e) => setDuration(e.target.value)}
              disabled={isLoading}
            />
          </div>
          
          <button 
            onClick={startAnalysis} 
            disabled={isLoading}
            className={isLoading && analysisStarted ? 'loading' : ''}
          >
            {isLoading && analysisStarted ? "Analyzing..." : "Start Analysis"}
          </button>
        </div>
      )}
    </div>
  );
};

export default FileUploader;