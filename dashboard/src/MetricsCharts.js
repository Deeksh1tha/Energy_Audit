import React from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { Line } from "react-chartjs-2";

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const MetricsCharts = ({ metrics, timestamps, energyData }) => {
  if (!metrics.length || !timestamps.length) return null;

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      }
    },
    scales: {
      y: {
        type: 'linear',
        beginAtZero: true
      },
      x: {
        type: 'category'
      }
    }
  };

  // Generate labels for energy and carbon data
  const energyLabels = energyData.per_process_cumulative_energy.map((_, index) => `Point ${index + 1}`);
  const carbonLabels = energyData.per_process_cumulative_gCO2.map((_, index) => `Point ${index + 1}`);

  const chartData = [
    {
      id: 'energy',
      data: energyData.per_process_cumulative_energy,
      labels: energyLabels,  // Use custom labels for energy data
      label: 'Energy Consumption (Joules)',
      borderColor: 'rgba(75,192,192,1)',
      backgroundColor: 'rgba(75,192,192,0.2)'
    },
    {
      id: 'carbon',
      data: energyData.per_process_cumulative_gCO2,
      labels: carbonLabels,  // Use custom labels for carbon data
      label: 'Carbon Emissions (gCO2)',
      borderColor: 'rgba(255,99,132,1)',
      backgroundColor: 'rgba(255,99,132,0.2)'
    },
    {
      id: 'efficiency',
      data: metrics.map(m => m.efficiency_score),
      labels: timestamps,  // Use timestamps for efficiency data
      label: 'Efficiency Score (0-100)',
      borderColor: 'rgba(54, 162, 235, 1)',
      backgroundColor: 'rgba(54, 162, 235, 0.2)'
    },
    {
      id: 'cpu',
      data: metrics.map(m => m.cpu_usage),
      labels: timestamps,  // Use timestamps for CPU data
      label: 'CPU Usage (%)',
      borderColor: 'rgba(153, 102, 255, 1)',
      backgroundColor: 'rgba(153, 102, 255, 0.2)'
    },
    {
      id: 'memory',
      data: metrics.map(m => m.memory_usage),
      labels: timestamps,  // Use timestamps for memory data
      label: 'Memory Usage (MB)',
      borderColor: 'rgba(255, 159, 64, 1)',
      backgroundColor: 'rgba(255, 159, 64, 0.2)'
    }
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mt-5">
      {chartData.map((dataset) => (
        <div key={dataset.id} className="bg-white p-4 rounded-md mb-5 shadow-md">
          <h3 className="text-lg text-green-800 font-semibold mb-3">{dataset.label}</h3>
          <div className="h-72">
            <Line
              data={{
                labels: dataset.labels,  // Use custom labels for each dataset
                datasets: [{
                  label: dataset.label,
                  data: dataset.data,
                  borderColor: dataset.borderColor,
                  backgroundColor: dataset.backgroundColor,
                  fill: true
                }]
              }}
              options={chartOptions}
            />
          </div>
        </div>
      ))}
    </div>
  );
};

export default MetricsCharts;