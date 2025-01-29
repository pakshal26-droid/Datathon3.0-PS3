// App.jsx
import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import axios from 'axios';
import ChatInterface from './components/ChatInterface';
import Dashboard from './components/Dashboard';
import FAQ from './components/FAQ';

// Ticket Form Component
const TicketForm = () => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    user_email: ''
  });
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await axios.post(`http://127.0.0.1:8000/tickets/`, formData);
      setMessage('Ticket submitted successfully!');
      setFormData({ name: '', description: '', user_email: '' });
    } catch (error) {
      setMessage('Error submitting ticket');
      console.log(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="max-w-4xl mx-auto p-6">
        <h2 className="text-5xl font-bold text-center mb-6">Submit Support Ticket</h2>
        {message && (
          <div className="mb-4 p-2 bg-green-100 text-green-700 rounded">
            {message}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className='flex flex-row justify-between gap-x-2'>
            <div className='w-1/2'>
            {/* <label className="block mb-1">Name</label> */}
            <input
              type="text"
              value={formData.name}
              placeholder='Your Name'
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              className="w-full p-2 border-2 rounded"
              required
            />
          </div>
          <div className='w-1/2'>
            {/* <label className="block mb-1">Email</label> */}
            <input
              type="email"
              value={formData.user_email}
              placeholder='Your Email'
              onChange={(e) => setFormData({...formData, user_email: e.target.value})}
              className="w-full p-2 border-2 rounded"
              required
            />
          </div>
          </div>
          
          <div>
            {/* <label className="block mb-1">Message</label> */}
            <textarea
              value={formData.description}
              placeholder='Describe your issue...'
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              className="w-full p-2 border-2 h-[40vh] rounded h-32"
              required
            />
          </div>
          
          <button
            type="submit"
            disabled={isSubmitting}
            className={`w-full text-white font-semibold text-md px-4 py-3 border-black border-2 rounded-full transition-all duration-200 ${
              isSubmitting 
                ? 'bg-gray-400 cursor-not-allowed opacity-70' 
                : 'bg-blue-600 hover:bg-white hover:text-black hover:bg-blue-600'
            }`}
          >
            {isSubmitting ? 'Submitting...' : 'Submit Ticket'}
          </button>
        </form>
      </div>
     
    </>
  );
};

// Ticket Form Component with Chat Interface
const TicketFormWithChat = () => {
  return (
    <>
      <TicketForm />
      <ChatInterface />
    </>
  );
};

// Main App Component
const App = () => {
  return (
    <Router>
      <div className="min-h-screen bg-gray-100 font-Anek tracking-tight ">
        <nav className="bg-white shadow mb-8">
          <div className=" mx-auto px-4">
            <div className="flex justify-between h-16">
              <div className="flex items-center justify-between w-full">
                <h1 className='text-2xl font-semibold'>SeepDeek</h1>
                <div className='flex flex-row gap-x-5'>
                <Link to="/" className="flex items-center px-4 text-gray-700 hover:text-gray-900">
                  Submit Ticket
                </Link>
                <Link to="/dashboard" className="flex items-center px-4 text-gray-700 hover:text-gray-900">
                  Dashboard
                </Link>
                <Link to="/faq" className="flex items-center px-4 text-gray-700 hover:text-gray-900">
                  FAQ
                </Link>
                </div>
                
              </div>
            </div>
          </div>
        </nav>

        <Routes>
          <Route path="/" element={<TicketFormWithChat />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/faq" element={<FAQ />} />
        </Routes>
      </div>
    </Router>
  );
};

export default App;