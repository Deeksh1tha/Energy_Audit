import React from "react";
import { Battery, Clock } from "lucide-react";

const AnalyzeIdle = ({ idleData, idleDuration, setIdleDuration, analyzeIdle }) => {
  return (
    <div className="mb-8 bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-lg shadow-sm border border-green-100">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
        <div className="mb-4 md:mb-0">
          <h2 className="text-xl font-bold text-gray-800 flex items-center">
            <Battery className="mr-2 text-green-600" />
            Baseline Power Analysis
          </h2>
          <p className="text-gray-600 mt-1">
            Measure the system's idle energy consumption as a baseline for comparison
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center space-y-3 sm:space-y-0 sm:space-x-4">
          <div className="flex items-center bg-white rounded-md border border-gray-200 p-2">
            <Clock className="mr-2 text-gray-500" size={18} />
            <input
              type="number"
              value={idleDuration}
              onChange={(e) => setIdleDuration(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-16 focus:outline-none text-gray-700"
              min="1"
              max="60"
            />
            <span className="ml-1 text-gray-600">seconds</span>
          </div>
          
          <button
            onClick={analyzeIdle}
            className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-md transition-colors duration-300 flex items-center justify-center"
          >
            <span>Analyze Idle Consumption</span>
          </button>
        </div>
      </div>

      {idleData && (
        <div className="mt-6 bg-white p-4 rounded-md border border-green-100">
          <h3 className="font-medium text-gray-700 mb-3">Baseline Results</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-green-50 p-3 rounded border border-green-100">
              <div className="text-sm text-gray-500 mb-1">Average Power</div>
              <div className="text-xl font-bold text-gray-800">
                {idleData.avg_power.toFixed(2)} <span className="text-sm font-normal">W</span>
              </div>
            </div>
            <div className="bg-blue-50 p-3 rounded border border-blue-100">
              <div className="text-sm text-gray-500 mb-1">Energy per Hour</div>
              <div className="text-xl font-bold text-gray-800">
                {idleData.energy_per_hour.toFixed(3)} <span className="text-sm font-normal">kWh</span>
              </div>
            </div>
            <div className="bg-amber-50 p-3 rounded border border-amber-100">
              <div className="text-sm text-gray-500 mb-1">Carbon per Hour</div>
              <div className="text-xl font-bold text-gray-800">
                {idleData.carbon_per_hour.toFixed(2)} <span className="text-sm font-normal">g CO₂e</span>
              </div>
            </div>
            <div className="bg-emerald-50 p-3 rounded border border-emerald-100">
              <div className="text-sm text-gray-500 mb-1">Measurement Duration</div>
              <div className="text-xl font-bold text-gray-800">
                {idleData.duration} <span className="text-sm font-normal">seconds</span>
              </div>
            </div>
          </div>
          <div className="mt-4 text-sm text-gray-500">
            <p>
              This baseline represents the system's power consumption when idle. Use this as a
              reference point to calculate the additional energy used by applications.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default AnalyzeIdle;