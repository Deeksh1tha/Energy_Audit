import React, { useState } from "react";
import ProcessAnalyzer from "./ProcessAnalyzer";
import FileUploader from "./FileUploader";
import SystemInfo from "./SystemInfo";
import MetricsSummary from "./MetricsSummary";
import MetricsCharts from "./MetricsCharts";
import Header from "./Header";

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
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      
      <div className="max-w-6xl mx-auto px-5 pb-12 flex-grow">
        <div className="flex justify-center mb-8">
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <button 
              className={`px-6 py-3 font-medium transition-all duration-300 ${
                activeTab === "process" 
                  ? "bg-green-700 text-white" 
                  : "bg-white text-gray-700 hover:bg-gray-100"
              }`}
              onClick={() => setActiveTab("process")}
            >
              <span className="flex items-center">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                Analyze Process
              </span>
            </button>
            <button 
              className={`px-6 py-3 font-medium transition-all duration-300 ${
                activeTab === "upload" 
                  ? "bg-green-700 text-white" 
                  : "bg-white text-gray-700 hover:bg-gray-100"
              }`}
              onClick={() => setActiveTab("upload")}
            >
              <span className="flex items-center">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                Upload Executable
              </span>
            </button>
          </div>
        </div>

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

        {error && (
          <div className="mb-8 text-red-600 bg-red-50 border border-red-200 p-4 rounded-lg shadow-sm text-center">
            <div className="flex items-center justify-center">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{error}</span>
            </div>
          </div>
        )}
        
        {systemInfo && <SystemInfo systemInfo={systemInfo} />}
        {metrics.length > 0 && <MetricsSummary metrics={metrics} />}
        {metrics.length > 0 && <MetricsCharts metrics={metrics} timestamps={timestamps} />}
        
        {!error && metrics.length === 0 && (
          <div className="text-center py-16 text-gray-500">
            <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <h3 className="text-lg font-medium mb-2">No Data Available</h3>
            <p>Start by analyzing a process or uploading an executable</p>
          </div>
        )}
      </div>
      
      <footer className="py-4 border-t border-gray-200 mt-auto">
        <div className="max-w-6xl mx-auto px-5 text-center text-sm text-gray-600">
          <p>Energy Audit Dashboard &copy; {new Date().getFullYear()} - Monitor your application's environmental impact</p>
        </div>
      </footer>
    </div>
  );
};

export default EnergyDashboard;