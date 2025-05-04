import React from "react";
import { Link } from "react-router-dom";
import { Leaf, LineChart, Settings, Home } from "lucide-react";

const Header = () => {
  return (
    <header className="sticky top-0 z-10 bg-[#041a25] mb-4">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center h-20">
          {/* Left: Logo and Heading */}
          <div className="flex items-center space-x-2">
            <Leaf className="h-10 w-10 text-green-500" />
            <span className="text-3xl font-bold text-white">Sustainmeter</span>
          </div>

          {/* Right: Navigation + Button */}
          <div className="ml-auto flex items-center space-x-10">
            <nav className="flex space-x-6">
              <Link
                to="/"
                className="inline-flex items-center border-b-2 border-green-500 text-sm font-medium text-white"
              >
                <Home className="mr-1 h-5 w-5" />
                Dashboard
              </Link>
              
              <Link
                to="/reports"
                className="inline-flex items-center border-b-2 border-transparent text-sm font-medium text-gray-400 hover:text-white hover:border-gray-400"
              >
                <LineChart className="mr-1 h-5 w-5" />
                Reports
              </Link>
              <Link
                to="/settings"
                className="inline-flex items-center border-b-2 border-transparent text-sm font-medium text-gray-400 hover:text-white hover:border-gray-400"
              >
                <Settings className="mr-1 h-5 w-5" />
                Settings
              </Link>
            </nav>
            <button className="bg-green-100 hover:bg-green-200 text-green-700 px-4 py-2 rounded-md text-sm font-medium flex items-center transition-colors duration-300">
              <Leaf className="mr-2 h-5 w-5" />
              Export Analysis
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
