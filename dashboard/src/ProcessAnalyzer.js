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
      <h2 className="text-xl text-green-800 font-semibold mb-4">Analyze Running Process</h2>
      <div className="flex mb-4">
        <input
          type="text"
          placeholder="Enter process name (e.g., chrome.exe)"
          value={processName}
          onChange={(e) => setProcessName(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleAnalyze()}
          className="flex-1 p-2 border border-gray-300 rounded-l-md text-base focus:outline-none focus:ring-2 focus:ring-green-500"
        />
        <button 
          onClick={handleAnalyze} 
          disabled={isLoading}
          className={`px-5 py-2 bg-green-700 text-white border-none rounded-r-md text-base transition-colors duration-300 hover:bg-green-800 disabled:bg-gray-400 disabled:cursor-not-allowed relative ${
            isLoading ? 'pl-10' : ''
          }`}
        >
          {isLoading && (
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin"></span>
          )}
          {isLoading ? "Analyzing..." : "Analyze"}
        </button>
      </div>
    </div>
  );
};

export default ProcessAnalyzer;