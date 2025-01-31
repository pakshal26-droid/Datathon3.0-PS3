import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import axios from 'axios';
import { supabase } from './lib/supabase';
import ChatInterface from './components/ChatInterface';
import Dashboard from './components/Dashboard';
import FAQ from './components/FAQ';
import TicketDetails from './components/TicketDetails';
import Login from './components/Auth/Login';
import Signup from './components/Auth/Signup';
import Homepage from './components/Homepage';

// Ticket Form Component
const TicketForm = () => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    user_email: '',
    image: null
  });
  const [imagePreview, setImagePreview] = useState(null);
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData({ ...formData, image: file });
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const submitData = new FormData();
      submitData.append('name', formData.name);
      submitData.append('user_email', formData.user_email);
      submitData.append('description', formData.description);
      if (formData.image) {
        submitData.append('image', formData.image);
      }

      await axios.post(`http://127.0.0.1:8000/tickets/`, submitData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setMessage('Ticket submitted successfully!');
      setFormData({ name: '', description: '', user_email: '', image: null });
      setImagePreview(null);
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
        <h2 className="text-5xl font-bold text-center mb-8">Submit Support Ticket</h2>
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
          
          <div className="flex flex-col gap-4">
            <textarea
              value={formData.description}
              placeholder='Describe your issue... or upload an image'
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              className="w-full p-2 border-2 h-[40vh] rounded"
              required={!formData.image}
            />
            
            <div className="flex items-center h-[40vh] justify-center ">
              <label className="flex flex-col items-center justify-center w-full h-[40vh] border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <svg className="w-8 h-8 mb-4 text-gray-500" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 16">
                    <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"/>
                  </svg>
                  <p className="mb-2 text-sm text-gray-500"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                  <p className="text-xs text-gray-500">PNG, JPG (max. size 5mb)</p>
                </div>
                <input 
                  type="file" 
                  className="hidden" 
                  accept="image/*"
                  onChange={handleImageUpload}
                />
              </label>
            </div>
            
            {imagePreview && (
              <div className="relative">
                <img 
                  src={imagePreview} 
                  alt="Preview" 
                  className="max-h-[200px] object-contain rounded"
                />
                <button
                  type="button"
                  onClick={() => {
                    setFormData({...formData, image: null});
                    setImagePreview(null);
                  }}
                  className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1"
                >
                  ✕
                </button>
              </div>
            )}
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

const ProtectedRoute = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  return children;
};

// Main App Component
const App = () => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <Router>
      <div className="min-h-screen bg-gray-100 font-Anek tracking-tight">
        {user && (
          <nav className="bg-white shadow mb-8">
            <div className="mx-auto px-4">
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
                    <button
                      onClick={handleSignOut}
                      className="flex items-center px-4 text-gray-700 hover:text-gray-900"
                    >
                      Sign Out
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </nav>
        )}

        <Routes>
          <Route path="/" element={<Homepage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/submit-ticket"
            element={
              <ProtectedRoute>
                <TicketFormWithChat />
              </ProtectedRoute>
            }
          />
          <Route
            path="/faq"
            element={
              <ProtectedRoute>
                <FAQ />
              </ProtectedRoute>
            }
          />
          <Route
            path="/ticket/:id"
            element={
              <ProtectedRoute>
                <TicketDetails />
              </ProtectedRoute>
            }
          />
        </Routes>
      </div>
    </Router>
  );
};

export default App;