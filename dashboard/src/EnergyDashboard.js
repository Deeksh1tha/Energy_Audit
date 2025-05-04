import React, { useState, useEffect, useRef } from "react";
import ProcessAnalyzer from "./ProcessAnalyzer";
import FileUploader from "./FileUploader";
import SystemInfo from "./SystemInfo";
import MetricsSummary from "./MetricsSummary";
import MetricsCharts from "./MetricsCharts";
import Header from "./Header";
import AnalyzeIdle from "./AnalyzeIdle";
import { Leaf, AlertTriangle, Activity } from "lucide-react";

const EnergyDashboard = () => {
  const [metrics, setMetrics] = useState([]);
  const [timestamps, setTimestamps] = useState([]);
  const [systemInfo, setSystemInfo] = useState(null);
  const [energyData, setEnergyData] = useState(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("process");
  const [idleData, setIdleData] = useState(null);
  const [idleDuration, setIdleDuration] = useState(5);
  const [liveData, setLiveData] = useState([]);
  const [isLiveMonitoring, setIsLiveMonitoring] = useState(false);
  const liveDataRef = useRef(null);
  const [liveSystemInfo, setLiveSystemInfo] = useState(null);

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
      setIsLoading(true);
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
    } finally {
      setIsLoading(false);
    }
  };

  const startLiveMonitoring = () => {
    setIsLiveMonitoring(true);
    fetchLiveData();
    liveDataRef.current = setInterval(fetchLiveData, 1000);
  };

  const stopLiveMonitoring = () => {
    setIsLiveMonitoring(false);
    if (liveDataRef.current) clearInterval(liveDataRef.current);
  };

  const fetchLiveData = async () => {
    try {
      const response = await fetch("http://localhost:5000/live-metrics");
      const data = await response.json();
      if (response.ok) {
        setLiveData(prev => {
          const newData = [...prev, data];
          return newData.length > 60 ? newData.slice(-60) : newData;
        });
        if (data.system_info && (!liveSystemInfo || Date.now() - liveSystemInfo.timestamp > 10000)) {
          setLiveSystemInfo({ ...data.system_info, timestamp: Date.now() });
        }
      } else {
        setError("Failed to fetch live metrics");
      }
    } catch {
      setError("Network error while fetching live metrics");
    }
  };

  useEffect(() => {
    return () => { if (liveDataRef.current) clearInterval(liveDataRef.current); };
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-[#041a25] text-white">
      <Header />

      <div>
        <div className="max-w-7xl mx-auto px-8 flex justify-between items-center">
          <div className="flex items-center">
            <Activity className="mr-2" size={24} />
            <div>
              <h2 className="text-xl font-semibold">Live Sustainability Monitoring</h2>
              <p className="text-[#c1ff72] text-sm">
                Real-time energy and carbon emission tracking
              </p>
            </div>
          </div>
          <button
            onClick={isLiveMonitoring ? stopLiveMonitoring : startLiveMonitoring}
            className={`px-4 py-2 rounded-md font-medium transition-colors duration-300 ${
              isLiveMonitoring
                ? "bg-red-500 hover:bg-red-600 text-white"
                : "bg-[#9bb255] hover:bg-[#a8a7a8] text-[#041a25]"
            }`}
            disabled={isLoading}
          >
            {isLiveMonitoring ? "Stop Monitoring" : "Start Monitoring"}
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-8 pb-12 flex-grow w-full pt-8">
        <AnalyzeIdle
          idleData={idleData}
          idleDuration={idleDuration}
          setIdleDuration={setIdleDuration}
          analyzeIdle={analyzeIdle}
        />

        <div>
          <div className="flex items-center mb-4">
            <div className="flex-grow">
              <h2 className="text-xl font-bold text-white">Process Analysis</h2>
              <p className="text-gray-300">Analyze a specific process or upload data for analysis</p>
            </div>
            <div className="bg-[#041a25] rounded-lg p-1 flex">
              <button
                className={`px-3 py-1 rounded-md transition-colors ${
                  activeTab === "process" ? "bg-[#066e68] text-white" : "text-gray-400 hover:text-white"
                }`}
                onClick={() => setActiveTab("process")}
              >
                Process
              </button>
              <button
                className={`px-3 py-1 rounded-md transition-colors ${
                  activeTab === "file" ? "bg-[#066e68] text-white" : "text-gray-400 hover:text-white"
                }`}
                onClick={() => setActiveTab("file")}
              >
                File Upload
              </button>
            </div>
          </div>

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
          <div className="mb-8 text-red-500 bg-red-100 border border-red-300 p-4 rounded-lg shadow-sm">
            <div className="flex items-center">
              <AlertTriangle className="w-5 h-5 mr-2" />
              <span className="font-medium">{error}</span>
            </div>
          </div>
        )}

        {(systemInfo || liveSystemInfo) && (
          <SystemInfo systemInfo={liveSystemInfo || systemInfo} isLive={isLiveMonitoring} />
        )}

        {(isLiveMonitoring && liveData.length > 0) && <MetricsSummary liveData={liveData} />}
        {(!isLiveMonitoring && metrics.length > 0 && energyData) && <MetricsSummary summary={energyData} />}

        {(isLiveMonitoring && liveData.length > 0) && (
          <MetricsCharts initialMetrics={[]} liveData={liveData} />
        )}

        {(!isLiveMonitoring && metrics.length > 0) && (
          <MetricsCharts initialMetrics={metrics} initialTimestamps={timestamps} energyData={energyData} />
        )}

        {!error && !isLoading && !isLiveMonitoring && metrics.length === 0 && (
          <div className="text-center py-16 text-gray-400 bg-[#283c38] rounded-lg shadow-md">
            <Leaf className="w-16 h-16 mx-auto mb-4 text-[#9bb255]" />
            <h3 className="text-lg font-medium mb-2">No Sustainability Data Available</h3>
            <p className="max-w-md mx-auto">
              Start monitoring your application's environmental impact by analyzing a process or uploading an executable file for analysis.
            </p>
            <div className="mt-6">
              <button
                onClick={startLiveMonitoring}
                className="bg-[#9bb255] text-[#041a25] hover:bg-[#c1ff72] px-4 py-2 rounded-md font-medium transition-colors"
              >
                Start Live Monitoring
              </button>
            </div>
          </div>
        )}
      </div>

      <footer className="py-6 border-t border-[#387eb8] mt-auto bg-[#041a25] text-[#a6a6a6]">
        <div className="max-w-7xl mx-auto px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center mb-4 md:mb-0">
              <Leaf className="h-6 w-6 text-[#066e68] mr-2" />
              <span className="text-white font-bold">Sustainmeter</span>
            </div>
            <div className="text-sm">
              <p>
                Sustainmeter Dashboard &copy; {new Date().getFullYear()} - Monitor your application's environmental impact
              </p>
            </div>
            <div className="flex space-x-4 mt-4 md:mt-0">
              <a href="#" className="hover:text-[#c1ff72] transition-colors">Documentation</a>
              <a href="#" className="hover:text-[#c1ff72] transition-colors">About</a>
              <a href="#" className="hover:text-[#c1ff72] transition-colors">Contact</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default EnergyDashboard;
