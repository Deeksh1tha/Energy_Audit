import React from "react";

const SystemInfo = ({ systemInfo }) => {
  return (
    <div className="system-info">
      <h3>System Information</h3>
      <div className="info-grid">
        <div className="info-item">
          <label>CPU:</label>
          <span>{systemInfo.cpu.model || 'Unknown'}</span>
        </div>
        
        <div className="info-item">
          <label>Platform:</label>
          <span>{systemInfo.platform}</span>
        </div>
        
        <div className="info-item">
          <label>Total Memory:</label>
          <span>{systemInfo.total_memory} GB</span>
        </div>
        
        {systemInfo.cpu.temperature && (
          <div className="info-item">
            <label>CPU Temperature:</label>
            <span>{systemInfo.cpu.temperature}°C</span>
          </div>
        )}
        
        {systemInfo.cpu.frequency && (
          <div className="info-item">
            <label>CPU Frequency:</label>
            <span>{systemInfo.cpu.frequency} MHz</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default SystemInfo;