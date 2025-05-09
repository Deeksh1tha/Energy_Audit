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
      <h2 className="text-xl text-green-800 font-semibold mb-4">Upload Executable for Analysis</h2>
      
      <div className="flex mb-4">
        <input 
          type="file" 
          onChange={handleFileChange}
          ref={fileInputRef}
          disabled={isLoading}
          className="flex-1 py-2 px-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-gray-100"
        />
        <button 
          onClick={handleUpload} 
          disabled={!file || isLoading}
          className={`px-5 py-2 bg-green-600 text-white border-none rounded-r-md transition-colors duration-300 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed relative ${
            isLoading && !analysisStarted ? 'pl-10' : ''
          }`}
        >
          {isLoading && !analysisStarted && (
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin"></span>
          )}
          Upload
        </button>
      </div>
      
      {uploadStatus && (
        <p className="mb-4 py-1 px-3 rounded bg-blue-50 text-blue-800">
          {uploadStatus}
        </p>
      )}
      
      {fileId && (
        <div className="bg-gray-50 p-4 rounded-md mt-4">
          <div className="flex items-center mb-4">
            <label htmlFor="duration" className="mr-2 font-medium text-gray-700">
              Analysis Duration (seconds):
            </label>
            <input 
              type="number" 
              id="duration" 
              min="5" 
              max="60" 
              value={duration} 
              onChange={(e) => setDuration(e.target.value)}
              disabled={isLoading}
              className="w-20 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-gray-100"
            />
          </div>
          
          <button 
            onClick={startAnalysis} 
            disabled={isLoading}
            className={`px-5 py-2 bg-green-600 text-white border-none rounded-md transition-colors duration-300 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed relative ${
              isLoading && analysisStarted ? 'pl-10' : ''
            }`}
          >
            {isLoading && analysisStarted && (
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin"></span>
            )}
            {isLoading && analysisStarted ? "Analyzing..." : "Start Analysis"}
          </button>
        </div>
      )}
    </div>
  );
};

export default FileUploader;