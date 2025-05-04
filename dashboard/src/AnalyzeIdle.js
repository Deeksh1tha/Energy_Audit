import React from "react";
import { Line } from "react-chartjs-2";
import "chart.js/auto";

const AnalyzeIdle = ({ idleData, idleDuration, setIdleDuration, analyzeIdle }) => {
  return (
    <div className="mb-8 bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-4">Analyze Idle</h2>
      <div className="flex items-center space-x-4 mb-6">
        <input
          type="number"
          value={idleDuration}
          onChange={(e) => setIdleDuration(Number(e.target.value))}
          className="border rounded px-3 py-2 w-24"
          min="1"
        />
        <button
          className="bg-green-700 text-white px-4 py-2 rounded"
          onClick={analyzeIdle}
        >
          Analyze Idle
        </button>
      </div>
      {idleData && (
        <div className="space-y-6">
          {/* Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-gray-50 p-4 rounded-lg shadow-sm">
              <h3 className="text-lg font-semibold mb-2">Total Energy Consumed</h3>
              <p className="text-gray-700">
                {idleData.total_cpu_energy} Joules
              </p>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg shadow-sm">
              <h3 className="text-lg font-semibold mb-2">Average CPU Utilization</h3>
              <p className="text-gray-700">
                {idleData.average_cpu_utilization}%
              </p>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg shadow-sm">
              <h3 className="text-lg font-semibold mb-2">Average CPU Frequency</h3>
              <p className="text-gray-700">
                {idleData.average_cpu_frequency} MHz
              </p>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg shadow-sm">
              <h3 className="text-lg font-semibold mb-2">Average Processor Power</h3>
              <p className="text-gray-700">
                {idleData.average_processor_power} Watts
              </p>
            </div>
          </div>

          {/* Cumulative Processor Energy Graph */}
          <div className="bg-gray-50 p-4 rounded-lg shadow-sm">
            <h3 className="text-lg font-semibold mb-4">Cumulative Processor Energy Over Time</h3>
            <Line
              data={{
                labels: idleData.cumulative_processor_energy.map((_, index) => `Time ${index + 1}`),
                datasets: [
                  {
                    label: "Cumulative Processor Energy (Joules)",
                    data: idleData.cumulative_processor_energy,
                    borderColor: "#3b82f6",
                    fill: false,
                  },
                ],
              }}
              options={{
                scales: {
                  x: {
                    title: {
                      display: true,
                      text: "Time",
                    },
                  },
                  y: {
                    title: {
                      display: true,
                      text: "Energy (Joules)",
                    },
                  },
                },
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default AnalyzeIdle;