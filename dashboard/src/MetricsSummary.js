import React from "react";
import { Leaf, Cpu, Battery, MemoryStick, TreePine, Droplets, CloudFog, Zap } from "lucide-react";

const MetricsSummary = ({ summary, liveData = null }) => {
  // Use live data if available, otherwise use summary
  const data = liveData ? liveData[liveData.length - 1] : summary;
  
  if (!data) return null;

  const getStatusColor = (value, thresholds) => {
    const { low, medium } = thresholds;
    if (value <= low) return "bg-green-100 text-green-800 border-green-200";
    if (value <= medium) return "bg-yellow-100 text-yellow-800 border-yellow-200";
    return "bg-red-100 text-red-800 border-red-200";
  };

  const metrics = [
    {
      name: "CPU Usage",
      value: data.cpuUsage || 0,
      unit: "%",
      icon: <Cpu size={24} />,
      color: getStatusColor(data.cpuUsage || 0, { low: 30, medium: 70 }),
      description: "Current CPU utilization"
    },
    {
      name: "MemoryStick Usage",
      value: data.MemoryStickUsage || 0,
      unit: "%",
      icon: <MemoryStick size={24} />,
      color: getStatusColor(data.MemoryStickUsage || 0, { low: 30, medium: 70 }),
      description: "Current MemoryStick utilization"
    },
    {
      name: "Power Usage",
      value: data.powerUsage || 0,
      unit: "W",
      icon: <Zap size={24} />,
      color: getStatusColor(data.powerUsage || 0, { low: 10, medium: 25 }),
      description: "Current power consumption"
    },
    {
      name: "Energy Consumed",
      value: data.energyConsumption || 0,
      unit: "kWh",
      icon: <Battery size={24} />,
      color: "bg-green-100 text-green-800 border-green-200",
      description: "Total energy consumed"
    },
    {
      name: "Carbon Emissions",
      value: data.carbonEmissions || 0,
      unit: "g CO₂e",
      icon: <CloudFog size={24} />,
      color: "bg-gray-100 text-gray-800 border-gray-200",
      description: "Carbon dioxide equivalent"
    },
    {
      name: "Trees Equivalent",
      value: data.treesEquivalent || 0,
      unit: "trees",
      icon: <TreePine size={24} />,
      color: "bg-emerald-100 text-emerald-800 border-emerald-200",
      description: "Trees needed to offset emissions"
    },
    {
      name: "Water Consumption",
      value: data.waterUsage || 0,
      unit: "L",
      icon: <Droplets size={24} />,
      color: "bg-blue-100 text-blue-800 border-blue-200",
      description: "Water used in cooling"
    },
    {
      name: "Eco Score",
      value: Math.max(0, 100 - (data.carbonEmissions || 0) * 10),
      unit: "",
      icon: <Leaf size={24} />,
      color: getStatusColor(100 - (data.carbonEmissions || 0) * 10, { low: 30, medium: 70 }),
      description: "Overall sustainability rating"
    }
  ];

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-8">
      <div className="flex items-center mb-6">
        <Leaf className="mr-2 text-green-500" size={24} />
        <h2 className="text-2xl font-bold text-gray-800">Sustainability Metrics Summary</h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((metric, index) => (
          <div 
            key={index}
            className={`border rounded-lg p-4 ${metric.color} transition-all duration-300 hover:shadow-md`}
          >
            <div className="flex items-center mb-2">
              <div className="mr-3">{metric.icon}</div>
              <h3 className="font-medium">{metric.name}</h3>
            </div>
            <div className="flex justify-between items-end">
              <div className="text-2xl font-bold">
                {typeof metric.value === 'number' ? metric.value.toFixed(2) : metric.value}
                <span className="text-sm font-normal ml-1">{metric.unit}</span>
              </div>
              <div className="text-xs text-opacity-70">{metric.description}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MetricsSummary;