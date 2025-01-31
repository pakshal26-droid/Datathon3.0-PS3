import React from 'react';
import { useNavigate } from 'react-router-dom';

const Homepage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      {/* Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <h1 className="text-2xl font-bold text-gray-900">SeekDesk</h1>
            <div className="flex space-x-4">
              <button
                onClick={() => navigate('/login')}
                className="text-gray-700 cursor-pointer hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
              >
                Sign In
              </button>
              <button
                onClick={() => navigate('/signup')}
                className="bg-blue-700 cursor-pointer border-2 border-black/90  text-white hover:bg-blue-700 px-4 py-2 rounded-md text-sm font-medium"
              >
                Sign Up
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-8">
            Smart Support Ticket Management
          </h1>
          <p className="text-xl text-gray-600 mb-12 max-w-3xl mx-auto">
            SeepDeek is an AI-powered support ticket system that helps you manage, analyze, and respond to customer inquiries efficiently. With smart categorization and automated responses, you'll never miss a beat.
          </p>
          <button
            onClick={() => navigate('/signup')}
            className="bg-blue-700  border-2 border-black/90 text-white hover:bg-blue-700 px-8 py-4 rounded-full text-lg font-medium transition-all duration-200 transform hover:scale-105"
          >
            Get Started
          </button>
        </div>

        {/* Features Section */}
        <div className="mt-15 grid grid-cols-1 md:grid-cols-3 gap-12">
          <div className="text-center p-6">
            <div className="bg-blue-100 w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">AI-Powered Responses</h3>
            <p className="text-gray-600">Automatically categorize and respond to common support queries using advanced AI.</p>
          </div>

          <div className="text-center p-6">
            <div className="bg-blue-100 w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Analytics Dashboard</h3>
            <p className="text-gray-600">Track and analyze support metrics with our comprehensive dashboard.</p>
          </div>

          <div className="text-center p-6">
            <div className="bg-blue-100 w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Real-time Updates</h3>
            <p className="text-gray-600">Get instant notifications and track ticket status in real-time.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Homepage;
