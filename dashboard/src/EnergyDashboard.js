import React, { useState } from "react";
import ProcessAnalyzer from "./ProcessAnalyzer";
import FileUploader from "./FileUploader";
import SystemInfo from "./SystemInfo";
import MetricsSummary from "./MetricsSummary";
import MetricsCharts from "./MetricsCharts";
import Header from "./Header";
import AnalyzeIdle from "./AnalyzeIdle"; // Import the new component

const EnergyDashboard = () => {
  const [metrics, setMetrics] = useState([]);
  const [timestamps, setTimestamps] = useState([]);
  const [systemInfo, setSystemInfo] = useState(null);
  const [energyData, setEnergyData] = useState(null)
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("process");
  const [idleData, setIdleData] = useState(null);
  const [idleDuration, setIdleDuration] = useState(5);

  const handleDataReceived = (data) => {
    setMetrics(data.metrics || []);
    setTimestamps(data.timestamps || []);
    setSystemInfo(data.system_info || null);
    setEnergyData(data.cpu_energy_data || null);
    setError("");
  };

  const handleError = (errorMessage) => {
    setError(errorMessage);
    setMetrics([]);
    setTimestamps([]);
    setSystemInfo(null);
    setEnergyData(null);
  };

  const handleLoadingChange = (loading) => {
    setIsLoading(loading);
  };

  const analyzeIdle = async () => {
    try {
      const response = await fetch("http://localhost:5000/analyze-idle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ duration: idleDuration }),
      });
      const data = await response.json();
      if (response.ok) {
        setIdleData(data);
      } else {
        setError(data.error || "Failed to analyze idle energy usage");
      }
    } catch (err) {
      setError("Network error while analyzing idle energy");
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-8 pb-12 flex-grow w-full">
        {/* Idle Analysis Section */}
        <AnalyzeIdle
          idleData={idleData}
          idleDuration={idleDuration}
          setIdleDuration={setIdleDuration}
          analyzeIdle={analyzeIdle}
        />

        {/* Process Analyzer / File Uploader Section */}
        <div className="mb-8 bg-white p-6 rounded-lg shadow-md">
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

        {/* Error Display */}
        {error && (
          <div className="mb-8 text-red-600 bg-red-50 border border-red-200 p-4 rounded-lg shadow-sm text-center">
            <div className="flex items-center justify-center">
              <svg
                className="w-5 h-5 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span>{error}</span>
            </div>
          </div>
        )}

        {/* System Info, Metrics Summary, and Charts */}
        {systemInfo && <SystemInfo systemInfo={systemInfo} />}
        {metrics.length > 0 && <MetricsSummary summary={energyData} />}
        {metrics.length > 0 && <MetricsCharts metrics={metrics} timestamps={timestamps} energyData={energyData} />}

        {/* No Data Placeholder */}
        {!error && metrics.length === 0 && (
          <div className="text-center py-16 text-gray-500">
            <svg
              className="w-16 h-16 mx-auto mb-4 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1}
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
            <h3 className="text-lg font-medium mb-2">No Data Available</h3>
            <p>Start by analyzing a process or uploading an executable</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="py-4 border-t border-gray-200 mt-auto">
        <div className="max-w-7xl mx-auto px-8 text-center text-sm text-gray-600">
          <p>
            Energy Audit Dashboard &copy; {new Date().getFullYear()} - Monitor your
            application's environmental impact
          </p>
        </div>
      </footer>
    </div>
  );
};

export default EnergyDashboard;