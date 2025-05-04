import React from "react";

const MetricsSummary = ({ summary }) => {
  if (!summary) return null;

  return (
    <div className="bg-green-100 bg-opacity-30 p-4 rounded-md mb-5 shadow-md">
      <h3 className="text-lg text-green-800 font-semibold mb-3 pb-2 border-b border-gray-200">
        Metrics Summary (Averaged)
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="flex flex-col">
          <label className="font-bold text-gray-600 mb-1">Cumulative Energy Consumption:</label>
          <span className="text-lg">{summary.per_process_total_energy} J</span>
        </div>
        <div className="flex flex-col">
          <label className="font-bold text-gray-600 mb-1">Cumulative Carbon Emissions:</label>
          <span className="text-lg">{summary.per_process_gCO2} gCO2</span>
        </div>
        <div className="flex flex-col">
          <label className="font-bold text-gray-600 mb-1">CPU Usage:</label>
          <span className="text-lg">{summary.avg_cpu}%</span>
        </div>
        <div className="flex flex-col">
          <label className="font-bold text-gray-600 mb-1">Memory Usage:</label>
          <span className="text-lg">{summary.avg_mem} MB</span>
        </div>
        <div className="flex flex-col">
          <label className="font-bold text-gray-600 mb-1">Processor Power:</label>
          <span className="text-lg">{summary.per_process_avg_processor_power} W</span>
        </div>
      </div>
    </div>
  );
};

export default MetricsSummary;