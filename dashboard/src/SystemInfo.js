import React from "react";

const SystemInfo = ({ systemInfo }) => {
  return (
    <div className="bg-green-100 bg-opacity-30 p-4 rounded-md mb-5 shadow-md">
      <h3 className="text-lg text-green-800 font-semibold mb-3 pb-2 border-b border-gray-200">
        System Information
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="flex flex-col">
          <label className="font-bold text-gray-600 mb-1">CPU:</label>
          <span className="text-lg">{systemInfo.cpu.model || 'Unknown'}</span>
        </div>
        
        <div className="flex flex-col">
          <label className="font-bold text-gray-600 mb-1">Platform:</label>
          <span className="text-lg">{systemInfo.platform}</span>
        </div>
        
        <div className="flex flex-col">
          <label className="font-bold text-gray-600 mb-1">Total Memory:</label>
          <span className="text-lg">{systemInfo.total_memory} GB</span>
        </div>
        
        {systemInfo.cpu.temperature && (
          <div className="flex flex-col">
            <label className="font-bold text-gray-600 mb-1">CPU Temperature:</label>
            <span className="text-lg">{systemInfo.cpu.temperature}°C</span>
          </div>
        )}
        
        {systemInfo.cpu.frequency && (
          <div className="flex flex-col">
            <label className="font-bold text-gray-600 mb-1">CPU Frequency:</label>
            <span className="text-lg">{systemInfo.cpu.frequency} MHz</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default SystemInfo;