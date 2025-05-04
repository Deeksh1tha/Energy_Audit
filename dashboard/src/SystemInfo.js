import React from "react";
import { Cpu, MemoryStick, HardDrive, Monitor, Globe, Server } from "lucide-react";

const SystemInfo = ({ systemInfo, isLive = false }) => {
  if (!systemInfo) return null;

  const specs = [
    {
      name: "CPU",
      value: systemInfo.cpu_model || "N/A",
      icon: <Cpu size={20} className="text-blue-500" />,
      details: `${systemInfo.cpu_cores || '?'} Cores / ${systemInfo.cpu_threads || '?'} Threads`
    },
    {
      name: "MemoryStick",
      value: `${(systemInfo.MemoryStick_total / (1024 * 1024 * 1024)).toFixed(2)} GB`,
      icon: <MemoryStick size={20} className="text-purple-500" />,
      details: `${systemInfo.MemoryStick_type || 'System'} MemoryStick`
    },
    {
      name: "OS",
      value: systemInfo.os_name || "N/A",
      icon: <Server size={20} className="text-gray-500" />,
      details: systemInfo.os_version || "Unknown Version"
    },
    {
      name: "Platform",
      value: systemInfo.platform || "N/A",
      icon: <HardDrive size={20} className="text-green-500" />,
      details: systemInfo.architecture || "Unknown Architecture"
    },
    {
      name: "Power Profile",
      value: systemInfo.power_profile || "Standard",
      icon: <Monitor size={20} className="text-amber-500" />,
      details: systemInfo.power_source || "Unknown Power Source"
    },
    {
      name: "Location",
      value: systemInfo.region || "N/A",
      icon: <Globe size={20} className="text-emerald-500" />,
      details: `Carbon Intensity: ${systemInfo.carbon_intensity || '?'} gCO₂/kWh`
    }
  ];

  return (
    <div className="mb-8 bg-white rounded-lg shadow-md overflow-hidden">
      <div className="bg-gradient-to-r from-blue-600 to-green-600 px-6 py-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-white flex items-center">
            <Server className="mr-2" />
            System Information
            {isLive && (
              <span className="ml-3 bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full flex items-center">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-1 animate-pulse"></span>
                Live
              </span>
            )}
          </h2>
          <div className="text-sm text-blue-100">
            Last Updated: {new Date().toLocaleString()}
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-6">
        {specs.map((spec, index) => (
          <div key={index} className="flex items-start space-x-3 border-b border-gray-100 pb-3">
            <div className="p-2 bg-gray-50 rounded-md">
              {spec.icon}
            </div>
            <div>
              <div className="text-sm font-medium text-gray-500">{spec.name}</div>
              <div className="font-medium text-gray-900">{spec.value}</div>
              <div className="text-xs text-gray-500">{spec.details}</div>
            </div>
          </div>
        ))}
      </div>
      
      {systemInfo.notes && (
        <div className="px-6 py-3 bg-blue-50 border-t border-blue-100">
          <div className="text-sm text-blue-800">
            <span className="font-medium">Note:</span> {systemInfo.notes}
          </div>
        </div>
      )}
    </div>
  );
};

export default SystemInfo;