// App.jsx
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import axios from 'axios';
import { LineChart, XAxis, YAxis, Line, Tooltip } from 'recharts';
import ChatInterface from './components/ChatInterface';
const API_URL = 'http://localhost:5002/api';

// Ticket Submission Form Component
const TicketForm = () => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    user_email: ''
  });
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`http://127.0.0.1:8000/tickets/`, formData);
      setMessage('Ticket submitted successfully!');
      setFormData({ name: '', description: '', user_email: '' });
    } catch (error) {
      setMessage('Error submitting ticket');
      console.log(error.message)
    }
  };

  return (
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
          className="bg-blue-600 hover:bg-white hover:text-black w-full text-white font-semibold text-md px-4 py-3 border-black  border-2 rounded-full hover:bg-blue-600"
        >
          Submit Ticket
        </button>
      </form>
    </div>
  );
};

// Agent Dashboard Component
const Dashboard = () => {
  const [tickets, setTickets] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [filter, setFilter] = useState({ status: '', category: '' });
  const [gptRes , setGptRes] = useState([])
 

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, [filter]);

  const fetchData = async () => {
    try {
      const [ticketsRes, analyticsRes, gptRes] = await Promise.all([
        axios.get(`${API_URL}/tickets`, { params: filter }),
        axios.get(`${API_URL}/analytics`),
        axios.get(`http://127.0.0.1:8000/tickets`),
      ]);
      setTickets(ticketsRes.data);
      setAnalytics(analyticsRes.data);
      setGptRes(gptRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);  // Log the error
    }
  };

  const updateTicketStatus = async (id, status) => {
    try {
      await axios.put(`${API_URL}/tickets/${id}`, { status });
      fetchData();
    } catch (error) {
      console.error('Error updating ticket:', error);
    }
  };
  const updateGptTicketStatus = async (id, status) => {
    try {
      await axios.put(`http://127.0.0.1:8000/tickets/${id}`, { status });
      fetchData();
    } catch (error) {
      console.error('Error updating ticket:', error);
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6">Agent Dashboard</h2>
      
      {/* Analytics Section */}
      {analytics && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white p-4 rounded shadow">
            <h3 className="font-bold mb-2">Total Tickets</h3>
            <p className="text-2xl">{gptRes.length}</p>
          </div>
          <div className="bg-white p-4 rounded shadow">
            <h3 className="font-bold mb-2">Open Tickets</h3>
            <p className="text-2xl">{analytics.open_tickets}</p>
          </div>
         <div className="bg-white p-4 rounded shadow">
            <h3 className="font-bold mb-2">Avg Resolution Time</h3>
            <p className="text-2xl">{-1*analytics.avg_resolution_time.toFixed(1)} hrs</p>
          </div>
        </div>
      )} 
      

      {/* Filters */}
      <div className="mb-6 flex gap-4">
        <select
          value={filter.status}
          onChange={(e) => setFilter({...filter, status: e.target.value})}
          className="p-2 border rounded"
        >
          <option value="">All Statuses</option>
          <option value="Open">Open</option>
          <option value="In Progress">In Progress</option>
          <option value="Resolved">Resolved</option>
        </select>
        <select
          value={filter.category}
          onChange={(e) => setFilter({...filter, category: e.target.value})}
          className="p-2 border rounded"
        >
          <option value="">All Categories</option>
          <option value="Login">Login</option>
          <option value="Billing">Billing</option>
          <option value="Technical">Technical</option>
          <option value="Other">Other</option>
        </select>
      </div>

      {/* Tickets Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white">
          <thead>
            <tr>
              <th className="p-2 border">ID</th>
              <th className="p-2 border">Description</th>
              <th className="p-2 border">Category</th>
              <th className="p-2 border">Status</th>
              <th className="p-2 border">Created</th>
              <th className="p-2 border">Actions</th>
              <th className='p-2 border'>Response</th>
            </tr>
          </thead>
          <tbody>
            {/* {tickets.map(ticket => (
              <tr key={ticket.id}>
                <td className="p-2 border">{ticket.id.slice(0,8)}</td>
                <td className="p-2 border">{ticket.description.slice(0,70)+"..."}</td>
                <td className="p-2 border">{ticket.category}</td>
                <td className="p-2 border">{ticket.status}</td>
                <td className="p-2 border">
                  {new Date(ticket.created_at).toLocaleDateString()}
                </td>
                <td className="p-2 border">
                  <select
                    value={ticket.status}
                    onChange={(e) => updateTicketStatus(ticket.id, e.target.value)}
                    className="p-1 border rounded"
                  >
                    <option value="Open">Open</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Resolved">Resolved</option>
                  </select>
                </td>
              </tr>
            ))} */}
            {gptRes.map(ticket => (
              <tr key={ticket.id}>
                <td className="p-2 border">{ticket.id}</td>
                <td className="p-2 border">{ticket.description.slice(0,70)+"..."}</td>
                <td className="p-2 border">{ticket.category}</td>
                <td className="p-2 border">{ticket.status}</td>
                <td className="p-2 border">
                  {new Date(ticket.created_at).toLocaleDateString()}
                </td>
                <td className="p-2 border">
                  <select
                    value={ticket.status}
                    onChange={(e) => updateGptTicketStatus(ticket.id, e.target.value)}
                    className="p-1 border rounded"
                  >
                    <option value="Open">Open</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Resolved">Resolved</option>
                  </select>
                </td>
                <td className="p-2 border">{ticket.response}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// Main App Component
const App = () => {
  return (
    <Router>
      <div className="min-h-screen bg-gray-100 font-Anek tracking-tight ">
        <nav className="bg-white shadow mb-8">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex justify-between h-16">
              <div className="flex">
                <Link to="/" className="flex items-center px-4 text-gray-700 hover:text-gray-900">
                  Submit Ticket
                </Link>
                <Link to="/dashboard" className="flex items-center px-4 text-gray-700 hover:text-gray-900">
                  Dashboard
                </Link>
              </div>
            </div>
          </div>
        </nav>

        <Routes>
          <Route path="/" element={<TicketForm />} />
          <Route path="/dashboard" element={<Dashboard />} />
        </Routes>
        <ChatInterface />
      </div>
      
    </Router>
    
  );
};

export default App;