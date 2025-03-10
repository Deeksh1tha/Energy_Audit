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

const MetricsCharts = ({ metrics, timestamps }) => {
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

  const chartData = [
    {
      id: 'energy',
      data: metrics.map(m => m.energy_consumption),
      label: 'Energy Consumption (Watts)',
      borderColor: 'rgba(75,192,192,1)',
      backgroundColor: 'rgba(75,192,192,0.2)'
    },
    {
      id: 'carbon',
      data: metrics.map(m => m.carbon_emissions),
      label: 'Carbon Emissions (gCO2)',
      borderColor: 'rgba(255,99,132,1)',
      backgroundColor: 'rgba(255,99,132,0.2)'
    },
    {
      id: 'efficiency',
      data: metrics.map(m => m.efficiency_score),
      label: 'Efficiency Score (0-100)',
      borderColor: 'rgba(54, 162, 235, 1)',
      backgroundColor: 'rgba(54, 162, 235, 0.2)'
    },
    {
      id: 'cpu',
      data: metrics.map(m => m.cpu_usage),
      label: 'CPU Usage (%)',
      borderColor: 'rgba(153, 102, 255, 1)',
      backgroundColor: 'rgba(153, 102, 255, 0.2)'
    },
    {
      id: 'memory',
      data: metrics.map(m => m.memory_usage),
      label: 'Memory Usage (MB)',
      borderColor: 'rgba(255, 159, 64, 1)',
      backgroundColor: 'rgba(255, 159, 64, 0.2)'
    }
  ];

  return (
    <div className="charts-container">
      {chartData.map((dataset) => (
        <div key={dataset.id} className="chart-wrapper">
          <h3>{dataset.label}</h3>
          <div style={{ height: '300px' }}>
            <Line
              data={{
                labels: timestamps,
                datasets: [{
                  ...dataset,
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