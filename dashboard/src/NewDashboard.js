import React from 'react';
import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Leaf, Cpu, Battery, AlertTriangle, ArrowDown, ArrowUp, BarChart3, Factory, SortAsc, ArrowUpDown } from 'lucide-react';

// Real API fetch function
const fetchMetricsData = async () => {
  try {
    const response = await fetch('http://localhost:5000/live-metrics');
    if (!response.ok) {
      throw new Error(`API request failed with status: ${response.status}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching metrics data:", error);
    // Return empty data structure in case of error
    return {};
  }
};

// Prepare chart data
const prepareChartData = (metricsArray) => {
  return metricsArray.map((value, index) => ({
    time: index,
    value
  }));
};

// Calculate trends
const calculateTrend = (data) => {
  if (data.length < 2) return 0;
  return data[data.length - 1] - data[data.length - 2];
};

// Component for individual metric card
const MetricCard = ({ title, icon, value, trend, unit, color }) => {
  // Make sure there's a default icon if icon is undefined
  const IconComponent = icon || Leaf;
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 border-l-4 border-green-500">
      <div className="flex justify-between items-center">
        <div className="flex items-center">
          <div className={`p-2 rounded-full ${color}`}>
            <IconComponent size={20} className="text-white" />
          </div>
          <h3 className="ml-3 text-sm font-medium text-gray-700 dark:text-gray-300">{title}</h3>
        </div>
        <div className="flex items-center">
          {trend > 0 ? (
            <ArrowUp size={16} className="text-red-500" />
          ) : (
            <ArrowDown size={16} className="text-green-500" />
          )}
        </div>
      </div>
      <div className="mt-2">
        <p className="text-2xl font-semibold text-gray-900 dark:text-white">
          {value} {unit}
        </p>
      </div>
    </div>
  );
};

// Individual Process Dashboard
const ProcessDashboard = ({ pid, metrics, historicalData }) => {
  const getLatestValue = (metricName) => {
    const data = metrics[metricName];
    return data[data.length - 1];
  };

  const getTrend = (metricName) => {
    return calculateTrend(metrics[metricName]);
  };

  const metricColors = {
    "carbon_emissions": "bg-green-800",
    "energy_consumption": "bg-green-500",
    "cpu_utilization": "bg-blue-500",
    "memory_usage": "bg-purple-500",
    "power_usage": "bg-yellow-500"
  };

  const metricIcons = {
    "carbon_emissions": Factory,
    "energy_consumption": Leaf,
    "cpu_utilization": Cpu,
    "memory_usage": Battery,
    "power_usage": BarChart3
  };

  const metricUnits = {
    "carbon_emissions": "gCO2",
    "energy_consumption": "W",
    "cpu_utilization": "%",
    "memory_usage": "MB",
    "power_usage": "KB/s"
  };

  const metricTitles = {
    "carbon_emissions": "CO2 Emissions",
    "energy_consumption": "Energy",
    "cpu_utilization": "CPU",
    "memory_usage": "Memory",
    "power_usage": "Power Usage"
  };

  return (
    <div className="mb-8 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border border-green-200 dark:border-green-900">
      <div className="flex items-center mb-4">
        <Leaf size={20} className="text-green-500 mr-2" />
        <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">Process: {metrics['name']} ({pid})</h2>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {Object.keys(metrics).map(metricName => (
          metricName != "name" ? (
            <MetricCard 
              key={`${pid}-${metricName}`}
              title={metricTitles[metricName]} 
              icon={metricIcons[metricName]} 
              value={getLatestValue(metricName)}
              trend={getTrend(metricName)}
              unit={metricUnits[metricName]}
              color={metricColors[metricName]}
            />
          ) : <></>
        ))}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {Object.keys(metrics).map(metricName => {
          // Prepare chart data
          if (metricName == "name") return;
          const chartData = prepareChartData(metrics[metricName]);

          return (
            <div key={`chart-${pid}-${metricName}`} className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
              <h3 className="text-md font-medium text-gray-700 dark:text-gray-300 mb-4 flex items-center">
                {metricIcons[metricName] && React.createElement(metricIcons[metricName], { size: 16, className: "mr-2" })}
                {metricTitles[metricName]} ({metricUnits[metricName]})
              </h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.2} />
                    <XAxis dataKey="time" label={{ value: 'Time (s)', position: 'insideBottomRight', offset: -5 }} />
                    <YAxis label={{ value: metricUnits[metricName], angle: -90, position: 'insideLeft' }} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '0.5rem', color: '#F9FAFB' }}
                    />
                    <Line
                      type="monotone"
                      dataKey="value"
                      stroke={metricName === "energy_consumption" ? "#10B981" : 
                              metricName === "cpu_utilization" ? "#3B82F6" : 
                              metricName === "memory_usage" ? "#8B5CF6" : "#FBBF24"}
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: 6 }}
                      isAnimationActive={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Summary Section
const SummarySection = ({ allMetrics, historicalData }) => {
  // Calculate total energy consumption across all processes
  const calculateTotalEnergy = () => {
    let total = 0;
    Object.keys(allMetrics || {}).forEach(pid => {
      if (allMetrics[pid] && allMetrics[pid].energy_consumption) {
        const energyArray = allMetrics[pid].energy_consumption;
        if (energyArray && energyArray.length > 0) {
          total += energyArray[energyArray.length - 1];
        }
      }
    });
    return total;
  };

  // Calculate average CPU utilization
  const calculateAvgCpu = () => {
    let sum = 0;
    let count = 0;
    Object.keys(allMetrics || {}).forEach(pid => {
      if (allMetrics[pid] && allMetrics[pid].cpu_utilization) {
        const cpuArray = allMetrics[pid].cpu_utilization;
        if (cpuArray && cpuArray.length > 0) {
          sum += cpuArray[cpuArray.length - 1];
          count++;
        }
      }
    });
    return count > 0 ? (sum / count).toFixed(1) : 0;
  };

  // Find process with highest energy consumption
  const findHighestEnergyProcess = () => {
    let highest = { pid: "None", value: -1 };
    
    Object.keys(allMetrics || {}).forEach(pid => {
      if (allMetrics[pid] && allMetrics[pid].energy_consumption) {
        const energyArray = allMetrics[pid].energy_consumption;
        const currentValue = energyArray[energyArray.length - 1];
        if (currentValue > highest.value) {
          highest = { pid, value: currentValue };
        }
      }
    });
    
    return highest;
  };

  // Generate aggregate data for the summary chart
  const generateSummaryData = () => {
    const result = [];
    
    // Safety check if data is not yet available
    if (!historicalData || Object.keys(historicalData).length === 0) {
      return [];
    }
    
    const firstPid = Object.keys(historicalData)[0];
    if (!firstPid || !historicalData[firstPid] || !historicalData[firstPid].energy_consumption) {
      return [];
    }
    
    const timePoints = historicalData[firstPid].energy_consumption.length || 0;
    
    for (let i = 0; i < timePoints; i++) {
      const dataPoint = { time: i };
      
      Object.keys(allMetrics || {}).forEach(pid => {
        if (historicalData[pid]?.energy_consumption?.[i]) {
          dataPoint[`${pid}_energy`] = historicalData[pid].energy_consumption[i].value;
        }
      });
      
      result.push(dataPoint);
    }
    return result;
  };
  
  const summaryData = generateSummaryData();
  const highestEnergyProcess = findHighestEnergyProcess();

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border-t-4 border-green-500">
      <div className="flex items-center mb-6">
        <Leaf size={24} className="text-green-500 mr-2" />
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">Sustainability Overview</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <MetricCard 
          title="Total Energy Usage" 
          icon={Leaf} 
          value={calculateTotalEnergy()}
          trend={0}
          unit="W"
          color="bg-green-500"
        />
        <MetricCard 
          title="Avg CPU Utilization" 
          icon={Cpu} 
          value={calculateAvgCpu()}
          trend={0}
          unit="%"
          color="bg-blue-500"
        />
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 border-l-4 border-yellow-500">
          <div className="flex items-center">
            <div className="p-2 rounded-full bg-yellow-500">
              <AlertTriangle size={20} className="text-white" />
            </div>
            <h3 className="ml-3 text-sm font-medium text-gray-700 dark:text-gray-300">Highest Energy Process</h3>
          </div>
          <div className="mt-2">
            <p className="text-2xl font-semibold text-gray-900 dark:text-white">
              {highestEnergyProcess.pid} ({highestEnergyProcess.value} W)
            </p>
          </div>
        </div>
      </div>
      
      <div className="h-72 mb-4">
        <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-4">Energy Consumption Trend</h3>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={summaryData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.2} />
            <XAxis dataKey="time" label={{ value: 'Time (s)', position: 'insideBottomRight', offset: -5 }} />
            <YAxis label={{ value: 'Energy (W)', angle: -90, position: 'insideLeft' }} />
            <Tooltip 
              contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '0.5rem', color: '#F9FAFB' }}
            />
            <Legend />
            {Object.keys(allMetrics).map((pid, index) => (
              <Line
                key={`summary-${pid}`}
                type="monotone"
                dataKey={`${pid}_energy`}
                name={`${pid} Energy`}
                stroke={index === 0 ? "#10B981" : "#3B82F6"}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 6 }}
                isAnimationActive={false}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
      
      <div className="p-4 bg-green-50 dark:bg-green-900 rounded-lg">
        <h3 className="text-lg font-medium text-green-800 dark:text-green-200 mb-2">Sustainability Tips</h3>
        <ul className="list-disc pl-5 text-green-700 dark:text-green-300 space-y-1">
          <li>Consider consolidating processes to reduce overall energy usage</li>
          <li>Schedule high-CPU tasks during off-peak hours</li>
          <li>Optimize {highestEnergyProcess.pid} for better energy efficiency</li>
        </ul>
      </div>
    </div>
  );
};

// Main Dashboard Component
export default function Dashboard() {
  const [metrics, setMetrics] = useState({});
  const [historicalData, setHistoricalData] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [sortBy, setSortBy] = useState("none");
  const [sortOrder, setSortOrder] = useState("desc"); // "desc" for highest values first

  // Sort processes based on selected metric
  const getSortedProcesses = () => {
    const processes = Object.keys(metrics);
    
    if (sortBy === "none") {
      return processes;
    }
    
    return [...processes].sort((a, b) => {
      // Get the latest value for the selected metric
      const getLatestMetricValue = (pid, metricName) => {
        if (!metrics[pid] || !metrics[pid][metricName] || !metrics[pid][metricName].length) {
          return 0;
        }
        const metricArray = metrics[pid][metricName];
        return metricArray[metricArray.length - 1];
      };
      
      const valueA = getLatestMetricValue(a, sortBy);
      const valueB = getLatestMetricValue(b, sortBy);
      
      // Sort based on sortOrder
      return sortOrder === "desc" ? valueB - valueA : valueA - valueB;
    });
  };

  // Toggle sort order when clicking on already selected metric
  const handleSortClick = (metric) => {
    if (sortBy === metric) {
      // Toggle sort order if same metric is clicked
      setSortOrder(sortOrder === "desc" ? "asc" : "desc");
    } else {
      // Set new metric and default to descending order
      setSortBy(metric);
      setSortOrder("desc");
    }
  };

  useEffect(() => {
    // Function to fetch and process data
    const fetchAndProcessData = async () => {
      try {
        const initialData = await fetchMetricsData();
        
        if (Object.keys(initialData).length === 0) {
          console.error("No data received from API");
          return;
        }
        
        setMetrics(initialData);
        
        // Initialize historical data
        const initialHistorical = {};
        Object.keys(initialData).forEach(pid => {
          initialHistorical[pid] = {};
          Object.keys(initialData[pid]).forEach(metric => {

            if (metric == "name") return ;

            initialHistorical[pid][metric] = initialData[pid][metric].map((value, time) => ({
              time,
              value
            }));
          });
        });
        
        setHistoricalData(initialHistorical);
        setIsLoading(false);
      } catch (error) {
        console.error("Error in initial data fetch:", error);
      }
    };
    
    // Initial fetch
    fetchAndProcessData();
    
    // Set up interval for data fetching
    const intervalId = setInterval(async () => {
      try {
        const newData = await fetchMetricsData();
        
        if (Object.keys(newData).length === 0) return;
        
        setMetrics(newData);
        
        setHistoricalData(prevHistorical => {
          const updatedHistorical = {...prevHistorical};
          
          Object.keys(newData).forEach(pid => {
            if (!updatedHistorical[pid]) {
              updatedHistorical[pid] = {};
            }
            
            Object.keys(newData[pid]).forEach(metric => {
              if (!updatedHistorical[pid][metric]) {
                updatedHistorical[pid][metric] = [];
              }

              if (metric == "name") return ;
              
              // Add new data points to historical data
              const newDataPoints = newData[pid][metric].map((value, i) => ({
                time: updatedHistorical[pid][metric].length + i,
                value
              }));
              
              updatedHistorical[pid][metric] = [
                ...updatedHistorical[pid][metric],
                ...newDataPoints
              ];
              
              // Keep only last 30 data points to avoid memory issues
              if (updatedHistorical[pid][metric].length > 30) {
                updatedHistorical[pid][metric] = updatedHistorical[pid][metric].slice(-30);
              }
            });
          });
          
          return updatedHistorical;
        });
      } catch (error) {
        console.error("Error fetching updated metrics:", error);
      }
    }, 1000);

    return () => clearInterval(intervalId);
  }, []);

  // Define the available sorting options
  const sortOptions = [
    { value: "none", label: "Default Order" },
    { value: "cpu_utilization", label: "CPU Utilization" },
    { value: "memory_usage", label: "Memory Usage" },
    { value: "energy_consumption", label: "Energy Consumption" },
    { value: "carbon_emissions", label: "Carbon Emissions" },
    { value: "power_usage", label: "Power Usage" }
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-6 flex justify-center items-center">
        <div className="text-center">
          <svg className="animate-spin h-10 w-10 text-green-500 mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="text-gray-700 dark:text-gray-300">Loading sustainability metrics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-6">
      <header className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Leaf size={32} className="text-green-500 mr-2" />
            <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-200">Eco-Metrics Dashboard</h1>
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center">
            <div className="flex items-center mr-4">
              <div className="w-3 h-3 rounded-full bg-green-500 mr-1"></div>
              <span>Live Data</span>
            </div>
            <span>Updating every 1s</span>
          </div>
        </div>
      </header>

      <SummarySection allMetrics={metrics} historicalData={historicalData} />
      
      <div className="mt-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">Process Details</h2>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              <label htmlFor="sortSelect" className="text-gray-700 dark:text-gray-300 mr-2 flex items-center">
                <SortAsc size={18} className="mr-1" />
                Sort by:
              </label>
              <select 
                id="sortSelect"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md px-3 py-1 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                {sortOptions.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>
            
            <button 
              onClick={() => setSortOrder(sortOrder === "desc" ? "asc" : "desc")}
              className="flex items-center bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 px-3 py-1 rounded-md text-gray-700 dark:text-gray-300"
            >
              <ArrowUpDown size={16} className="mr-1" />
              {sortOrder === "desc" ? "Highest First" : "Lowest First"}
            </button>
          </div>
        </div>
        
        {/* Sort buttons for mobile/alternative view */}
        <div className="mb-4 flex flex-wrap gap-2">
          {sortOptions.slice(1).map((option) => (
            <button
              key={option.value}
              onClick={() => handleSortClick(option.value)}
              className={`px-3 py-1 rounded-md text-sm flex items-center ${
                sortBy === option.value 
                  ? "bg-green-500 text-white"
                  : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
              }`}
            >
              {option.label}
              {sortBy === option.value && (
                <span className="ml-1">
                  {sortOrder === "desc" ? "↓" : "↑"}
                </span>
              )}
            </button>
          ))}
        </div>
        
        {/* Render sorted processes */}
        {getSortedProcesses().map(pid => (
          <ProcessDashboard 
            key={pid} 
            pid={pid} 
            metrics={metrics[pid]} 
            historicalData={historicalData}
          />
        ))}
      </div>
      
      <footer className="mt-8 pt-4 border-t border-gray-200 dark:border-gray-700 text-center text-gray-500 dark:text-gray-400">
        <p>Sustainable Metrics Dashboard • Real-time monitoring for resource optimization</p>
      </footer>
    </div>
  );
}