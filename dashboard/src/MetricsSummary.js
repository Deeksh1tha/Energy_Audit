import React from "react";

const MetricsSummary = ({ metrics }) => {
  if (!metrics.length) return null;

  const latest = metrics[metrics.length - 1];
  
  return (
    <div className="metrics-summary">
      <h3>Current Metrics</h3>
      <div className="metrics-grid">
        <div className="metric-item">
          <label>Energy Usage:</label>
          <span>{latest.energy_consumption} W</span>
        </div>
        <div className="metric-item">
          <label>Carbon Emissions:</label>
          <span>{latest.carbon_emissions} gCO2</span>
        </div>
        <div className="metric-item">
          <label>CPU Usage:</label>
          <span>{latest.cpu_usage}%</span>
        </div>
        <div className="metric-item">
          <label>Memory Usage:</label>
          <span>{latest.memory_usage} MB</span>
        </div>
        <div className="metric-item">
          <label>Efficiency Score:</label>
          <span>{latest.efficiency_score}/100</span>
        </div>
      </div>
    </div>
  );
};

export default MetricsSummary;