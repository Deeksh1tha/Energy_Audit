import React, { useState, useEffect, useRef } from "react";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  AreaChart,
  Area
} from "recharts";
import { Leaf, Cpu, Battery, MemoryStick, TreePine, Droplets, CloudFog } from "lucide-react";

const MetricsCharts = ({ initialMetrics = [], initialTimestamps = [], energyData = null, liveData = [] }) => {
  const [metrics, setMetrics] = useState(initialMetrics);
  const [timestamps, setTimestamps] = useState(initialTimestamps);
  const [isLive, setIsLive] = useState(false);
  const [internalLiveData, setInternalLiveData] = useState([]);

  const [interval, setIntervalTime] = useState(1000); // 1 second by default
  const dataFetchRef = useRef(null);
  const hasLiveData = liveData && liveData.length > 0;

  // Set initial data
  useEffect(() => {
    setMetrics(initialMetrics);
    setTimestamps(initialTimestamps);
  }, [initialMetrics, initialTimestamps]);

  // Format data for charts
  const formatChartData = (metrics, timestamps) => {
    if (!metrics.length || !timestamps.length) return [];
    
    return timestamps.map((time, index) => {
      const dataPoint = {
        time: new Date(time).toLocaleTimeString(),
      };
      
      metrics.forEach((metric) => {
        if (metric.values && metric.values[index] !== undefined) {
          dataPoint[metric.name] = metric.values[index];
        }
      });
      
      return dataPoint;
    });
  };

  const formatEnergyData = (data) => {
    if (!data) return [];
    
    return data.map((point, index) => ({
      time: new Date(timestamps[index]).toLocaleTimeString(),
      energy: point,
    }));
  };

  // Start live data fetching if not provided externally
  const startLiveUpdates = () => {
    if (hasLiveData) return; // Don't start own fetching if data is provided
    
    setIsLive(true);
    fetchLiveData();
    
    dataFetchRef.current = setInterval(() => {
      fetchLiveData();
    }, interval);
  };

  // Stop live data fetching
  const stopLiveUpdates = () => {
    setIsLive(false);
    if (dataFetchRef.current) {
      clearInterval(dataFetchRef.current);
    }
  };

  // Mock function to fetch live data - replace with actual API call
  const fetchLiveData = async () => {
    if (hasLiveData) return; // Don't fetch if data is provided externally
    
    try {
      const response = await fetch("http://localhost:5000/live-metrics");
      const data = await response.json();
      
      if (response.ok) {
        // This would update our internal liveData state if no external data is provided
        setInternalLiveData(prevData => {
          // Keep only the last 60 data points (1 minute of data at 1sec interval)
          const newData = [...prevData, data];
          if (newData.length > 60) {
            return newData.slice(newData.length - 60);
          }
          return newData;
        });
      }
    } catch (err) {
      console.error("Error fetching live data:", err);
    }
  };

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (dataFetchRef.current) {
        clearInterval(dataFetchRef.current);
      }
    };
  }, []);

  // Format data for display
  const chartData = hasLiveData 
    ? liveData.map((data, index) => ({
        time: new Date().toLocaleTimeString(),
        cpuUsage: data.cpuUsage,
        MemoryStickUsage: data.MemoryStickUsage,
        energyConsumption: data.energyConsumption,
        carbonEmissions: data.carbonEmissions,
        powerUsage: data.powerUsage,
        treesEquivalent: data.treesEquivalent,
        waterUsage: data.waterUsage
      }))
    : isLive && dataFetchRef.current
    ? liveData.map((data, index) => ({
        time: new Date().toLocaleTimeString(),
        cpuUsage: data.cpuUsage,
        MemoryStickUsage: data.MemoryStickUsage,
        energyConsumption: data.energyConsumption,
        carbonEmissions: data.carbonEmissions,
        powerUsage: data.powerUsage,
        treesEquivalent: data.treesEquivalent,
        waterUsage: data.waterUsage
      }))
    : formatChartData(metrics, timestamps);

  const energyChartData = hasLiveData 
    ? liveData.map((data, index) => ({
        time: new Date().toLocaleTimeString(),
        energy: data.energyConsumption
      }))
    : isLive && dataFetchRef.current
    ? liveData.map((data, index) => ({
        time: new Date().toLocaleTimeString(),
        energy: data.energyConsumption
      }))
    : formatEnergyData(energyData);

  // Custom tooltip styles
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 border border-green-100 rounded-md shadow-md">
          <p className="text-sm font-medium text-gray-900">{`Time: ${label}`}</p>
          {payload.map((entry, index) => (
            <p 
              key={`item-${index}`} 
              className="text-sm" 
              style={{ color: entry.color }}
            >
              {`${entry.name}: ${entry.value.toFixed(2)} ${entry.unit || ''}`}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  // Color palette inspired by sustainability and nature
  const colors = {
    cpuUsage: "#3B82F6", // blue
    MemoryStickUsage: "#8B5CF6", // purple
    energyConsumption: "#10B981", // green
    carbonEmissions: "#6B7280", // gray
    powerUsage: "#F59E0B", // amber
    treesEquivalent: "#059669", // emerald
    waterUsage: "#0EA5E9" // sky blue
  };

  const renderIcon = (metric) => {
    const iconProps = { size: 20, className: "mr-2" };
    switch(metric) {
      case 'cpuUsage': return <Cpu {...iconProps} />;
      case 'MemoryStickUsage': return <MemoryStick {...iconProps} />;
      case 'energyConsumption': return <Battery {...iconProps} />;
      case 'carbonEmissions': return <CloudFog {...iconProps} />;
      case 'powerUsage': return <Battery {...iconProps} />;
      case 'treesEquivalent': return <TreePine {...iconProps} />;
      case 'waterUsage': return <Droplets {...iconProps} />;
      default: return <Leaf {...iconProps} />;
    }
  };

  const MetricSelector = ({ metric, color, isActive, onClick }) => (
    <button
      onClick={() => onClick(metric)}
      className={`flex items-center px-3 py-2 rounded-md text-sm font-medium mr-2 mb-2 transition-all
        ${isActive ? 'bg-opacity-100 text-white' : 'bg-opacity-20 text-gray-700 hover:bg-opacity-30'}`}
      style={{ backgroundColor: isActive ? color : `${color}33` }}
    >
      {renderIcon(metric)}
      {metric.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
    </button>
  );

  // State for controlling which metrics to show
  const [activeMetrics, setActiveMetrics] = useState({
    cpuUsage: true,
    MemoryStickUsage: true,
    energyConsumption: true,
    carbonEmissions: true,
    powerUsage: true,
    treesEquivalent: true,
    waterUsage: true
  });

  const toggleMetric = (metric) => {
    setActiveMetrics(prev => ({
      ...prev,
      [metric]: !prev[metric]
    }));
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center">
          <Leaf className="mr-2 text-green-500" size={24} />
          Sustainability Metrics
        </h2>
        <div className="flex items-center">
          <div className="mr-4">
            <label htmlFor="interval" className="block text-sm font-medium text-gray-700 mb-1">
              Update Interval (ms)
            </label>
            <input
              type="number"
              id="interval"
              className="border border-gray-300 rounded-md px-3 py-1 w-24"
              value={interval}
              onChange={(e) => setIntervalTime(Number(e.target.value))}
              min="500"
              max="10000"
              step="100"
              disabled={isLive}
            />
          </div>
          <button
            onClick={isLive ? stopLiveUpdates : startLiveUpdates}
            className={`px-4 py-2 rounded-md font-medium ${
              isLive
                ? "bg-red-100 text-red-700 hover:bg-red-200"
                : "bg-green-100 text-green-700 hover:bg-green-200"
            }`}
          >
            {isLive ? "Stop Live Updates" : "Start Live Updates"}
          </button>
        </div>
      </div>

      <div className="mb-6 flex flex-wrap">
        {Object.keys(colors).map(metric => (
          <MetricSelector
            key={metric}
            metric={metric}
            color={colors[metric]}
            isActive={activeMetrics[metric]}
            onClick={toggleMetric}
          />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Main metrics chart */}
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
          <h3 className="text-lg font-semibold mb-4 text-gray-700">Resource Usage</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={chartData}
                margin={{ top: 5, right: 30, left: 20, bottom: 25 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis 
                  dataKey="time" 
                  stroke="#6B7280"
                  tick={{ fontSize: 12 }}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                />
                <YAxis stroke="#6B7280" />
                <Tooltip content={<CustomTooltip />} />
                <Legend verticalAlign="top" height={36} />
                
                {activeMetrics.cpuUsage && (
                  <Line
                    type="monotone"
                    dataKey="cpuUsage"
                    name="CPU Usage"
                    stroke={colors.cpuUsage}
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 6 }}
                  />
                )}
                
                {activeMetrics.MemoryStickUsage && (
                  <Line
                    type="monotone"
                    dataKey="MemoryStickUsage"
                    name="MemoryStick Usage"
                    stroke={colors.MemoryStickUsage}
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 6 }}
                  />
                )}
                
                {activeMetrics.powerUsage && (
                  <Line
                    type="monotone"
                    dataKey="powerUsage"
                    name="Power Usage"
                    stroke={colors.powerUsage}
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 6 }}
                  />
                )}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Environmental impact chart */}
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
          <h3 className="text-lg font-semibold mb-4 text-gray-700">Environmental Impact</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={chartData}
                margin={{ top: 5, right: 30, left: 20, bottom: 25 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis 
                  dataKey="time" 
                  stroke="#6B7280"
                  tick={{ fontSize: 12 }}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                />
                <YAxis stroke="#6B7280" />
                <Tooltip content={<CustomTooltip />} />
                <Legend verticalAlign="top" height={36} />
                
                {activeMetrics.energyConsumption && (
                  <Line
                    type="monotone"
                    dataKey="energyConsumption"
                    name="Energy (kWh)"
                    stroke={colors.energyConsumption}
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 6 }}
                  />
                )}
                
                {activeMetrics.carbonEmissions && (
                  <Line
                    type="monotone"
                    dataKey="carbonEmissions"
                    name="Carbon (g CO2e)"
                    stroke={colors.carbonEmissions}
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 6 }}
                  />
                )}
                
                {activeMetrics.treesEquivalent && (
                  <Line
                    type="monotone"
                    dataKey="treesEquivalent"
                    name="Trees Equivalent"
                    stroke={colors.treesEquivalent}
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 6 }}
                  />
                )}
                
                {activeMetrics.waterUsage && (
                  <Line
                    type="monotone"
                    dataKey="waterUsage"
                    name="Water Usage (L)"
                    stroke={colors.waterUsage}
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 6 }}
                  />
                )}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Energy Consumption Area Chart */}
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-100 lg:col-span-2">
          <h3 className="text-lg font-semibold mb-4 text-gray-700">Energy Consumption Trend</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={energyChartData}
                margin={{ top: 5, right: 30, left: 20, bottom: 25 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis 
                  dataKey="time" 
                  stroke="#6B7280"
                  tick={{ fontSize: 12 }}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                />
                <YAxis stroke="#6B7280" />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="energy"
                  name="Energy Consumption"
                  stroke="#10B981"
                  fill="#10B98133"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MetricsCharts;