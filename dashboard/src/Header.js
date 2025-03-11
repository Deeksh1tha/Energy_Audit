import React from "react";

const Header = () => {
  return (
    <div className="bg-gradient-to-r from-green-800 to-green-800 text-white shadow-lg mb-8 py-6">
      <div className="max-w-6xl mx-auto px-5">
        <div className="flex flex-col md:flex-row justify-between items-right">
          <div className="flex items-center mb-4 md:mb-0">
            <svg 
              className="w-10 h-10 mr-3" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24" 
              xmlns="http://www.w3.org/2000/svg"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M13 10V3L4 14h7v7l9-11h-7z" 
              />
            </svg>
            <h1 className="text-2xl md:text-4xl font-extrabold tracking-tight">Energy Audit</h1>
          </div>
          
          <nav className="flex items-center">
            <a href="/" className="px-3 py-2 text-white bg-green-700 bg-opacity-50 rounded-md font-medium hover:bg-opacity-70 transition-all">
              Dashboard
            </a>
            <div className="ml-6 flex items-center space-x-6">
              {/* Space for additional navigation items */}
              <a href="/reports" className="px-3 py-2 text-white hover:bg-green-700 hover:bg-opacity-50 rounded-md transition-all">
                Reports
              </a>
              <a href="/" className="px-3 py-2 text-white hover:bg-green-700 hover:bg-opacity-50 rounded-md transition-all">
                Settings
              </a>
            </div>
          </nav>
        </div>
      </div>
    </div>
  );
};

export default Header;