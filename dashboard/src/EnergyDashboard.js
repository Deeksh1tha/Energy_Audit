import React, { useState } from "react";
import ProcessAnalyzer from "./ProcessAnalyzer";
import FileUploader from "./FileUploader";
import SystemInfo from "./SystemInfo";
import MetricsSummary from "./MetricsSummary";
import MetricsCharts from "./MetricsCharts";
import "./styles.css";
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
    <div className="container">
      <h1>Energy Audit Dashboard</h1>
      
      <div className="tabs">
        <button 
          className={activeTab === "process" ? "active" : ""} 
          onClick={() => setActiveTab("process")}
        >
          Analyze Running Process
        </button>
        <button 
          className={activeTab === "upload" ? "active" : ""} 
          onClick={() => setActiveTab("upload")}
        >
          Upload Executable
        </button>
      </div>

      <div className="tab-content">
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

      {error && <p className="error">{error}</p>}
      
      {systemInfo && <SystemInfo systemInfo={systemInfo} />}
      {metrics.length > 0 && <MetricsSummary metrics={metrics} />}
      {metrics.length > 0 && <MetricsCharts metrics={metrics} timestamps={timestamps} />}
    </div>
  );
};

export default EnergyDashboard;