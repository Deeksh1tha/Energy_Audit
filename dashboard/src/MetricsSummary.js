import React from "react";

const MetricsSummary = ({ metrics }) => {
  if (!metrics.length) return null;

  const latest = metrics[metrics.length - 1];
  
  return (
    <div className="bg-green-100 bg-opacity-30 p-4 rounded-md mb-5 shadow-md">
      <h3 className="text-lg text-green-800 font-semibold mb-3 pb-2 border-b border-gray-200">
        Current Metrics
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="flex flex-col">
          <label className="font-bold text-gray-600 mb-1">Energy Usage:</label>
          <span className="text-lg">{latest.energy_consumption} W</span>
        </div>
        <div className="flex flex-col">
          <label className="font-bold text-gray-600 mb-1">Carbon Emissions:</label>
          <span className="text-lg">{latest.carbon_emissions} gCO2</span>
        </div>
        <div className="flex flex-col">
          <label className="font-bold text-gray-600 mb-1">CPU Usage:</label>
          <span className="text-lg">{latest.cpu_usage}%</span>
        </div>
        <div className="flex flex-col">
          <label className="font-bold text-gray-600 mb-1">Memory Usage:</label>
          <span className="text-lg">{latest.memory_usage} MB</span>
        </div>
        <div className="flex flex-col">
          <label className="font-bold text-gray-600 mb-1">Efficiency Score:</label>
          <span className="text-lg">{latest.efficiency_score}/100</span>
        </div>
      </div>
    </div>
  );
};

export default MetricsSummary;