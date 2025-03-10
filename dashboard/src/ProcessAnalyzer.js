import React, { useState } from "react";
import axios from "axios";

const ProcessAnalyzer = ({ onDataReceived, onError, onLoadingChange, isLoading }) => {
  const [processName, setProcessName] = useState("");

  const handleAnalyze = async () => {
    onError("");
    onLoadingChange(true);

    if (!processName.trim()) {
      onError("Please enter a process name.");
      onLoadingChange(false);
      return;
    }

    try {
      const response = await axios.get(`http://localhost:5000/analyze`, {
        params: {
          process: processName.trim()
        },
        timeout: 40000
      });
      
      if (response.data.success) {
        onDataReceived(response.data);
      } else {
        onError(response.data.error || "Process not found or no data available.");
      }
    } catch (err) {
      console.error("Error details:", err);
      if (err.code === "ECONNREFUSED") {
        onError("Cannot connect to the backend server. Make sure it's running on port 5000.");
      } else if (err.response) {
        onError(err.response.data.error || "Error fetching data from server.");
      } else {
        onError("Error connecting to server. Please check your connection.");
      }
    } finally {
      onLoadingChange(false);
    }
  };

  return (
    <div className="analyzer-section">
      <h2>Analyze Running Process</h2>
      <div className="input-group">
        <input
          type="text"
          placeholder="Enter process name (e.g., chrome.exe)"
          value={processName}
          onChange={(e) => setProcessName(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleAnalyze()}
        />
        <button 
          onClick={handleAnalyze} 
          disabled={isLoading}
          className={isLoading ? 'loading' : ''}
        >
          {isLoading ? "Analyzing..." : "Analyze"}
        </button>
      </div>
    </div>
  );
};

export default ProcessAnalyzer;