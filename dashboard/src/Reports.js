import React from 'react';
import Header from './Header'; // Adjust the import path as needed

const Reports = () => {
  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      <Header />
      
      <main className="flex-1 p-6">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl font-bold text-gray-800 mb-6">Reports Dashboard</h1>
          
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <iframe
              src="http://localhost:3000/public-dashboards/36522b653e3942318c80a7a195e0756f"
              width="100%"
              height="800"
              frameBorder="0"
              title="Grafana Dashboard"
              className="w-full"
            ></iframe>
          </div>
        </div>
      </main>
      
      <footer className="py-4 border-t border-gray-200 mt-auto">
        <div className="max-w-6xl mx-auto px-5 text-center text-sm text-gray-600">
          <p>Energy Audit Dashboard &copy; {new Date().getFullYear()} - Monitor your application's environmental impact</p>
        </div>
      </footer>
    </div>
  );
};

export default Reports;