import React, { useState } from "react";
import ProcessAnalyzer from "./ProcessAnalyzer";
import FileUploader from "./FileUploader";
import SystemInfo from "./SystemInfo";
import MetricsSummary from "./MetricsSummary";
import MetricsCharts from "./MetricsCharts";

const EnergyDashboard = () => {
  const [metrics, setMetrics] = useState([]);
  const [timestamps, setTimestamps] = useState([]);
  const [systemInfo, setSystemInfo] = useState(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("process");

  const handleDataReceived = (data) => {
    setMetrics(data.metrics || []);
    setTimestamps(data.timestamps || []);
    setSystemInfo(data.system_info || null);
    setError("");
  };

  const handleError = (errorMessage) => {
    setError(errorMessage);
    setMetrics([]);
    setTimestamps([]);
    setSystemInfo(null);
  };

  const handleLoadingChange = (loading) => {
    setIsLoading(loading);
  };

  return (
    <div className="max-w-6xl mx-auto p-5">
      <h1 className="text-center text-2xl font-bold text-green-800 mb-6">Energy Audit Dashboard</h1>
      
      <div className="flex justify-center mb-6">
        <button 
          className={`px-5 py-2 mx-1 border border-gray-300 rounded-md transition-all duration-300 ${
            activeTab === "process" 
              ? "bg-green-700 text-white border-green-700" 
              : "bg-gray-100"
          }`}
          onClick={() => setActiveTab("process")}
        >
          Analyze Running Process
        </button>
        <button 
          className={`px-5 py-2 mx-1 border border-gray-300 rounded-md transition-all duration-300 ${
            activeTab === "upload" 
              ? "bg-green-700 text-white border-green-700" 
              : "bg-gray-100"
          }`}
          onClick={() => setActiveTab("upload")}
        >
          Upload Executable
        </button>
      </div>

      <div className="mb-6 p-5 rounded-md shadow-md">
        {activeTab === "process" ? (
          <ProcessAnalyzer 
            onDataReceived={handleDataReceived}
            onError={handleError}
            onLoadingChange={handleLoadingChange}
            isLoading={isLoading}
          />
        ) : (
          <FileUploader 
            onDataReceived={handleDataReceived}
            onError={handleError}
            onLoadingChange={handleLoadingChange}
            isLoading={isLoading}
          />
        )}
      </div>

      {error && (
        <div className="text-red-600 bg-red-100 p-3 mb-4 rounded-md text-center">
          {error}
        </div>
      )}
      
      {systemInfo && <SystemInfo systemInfo={systemInfo} />}
      {metrics.length > 0 && <MetricsSummary metrics={metrics} />}
      {metrics.length > 0 && <MetricsCharts metrics={metrics} timestamps={timestamps} />}
    </div>
  );
};

export default EnergyDashboard;