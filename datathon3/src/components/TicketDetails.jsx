import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, Trash2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

const TicketDetails = () => {
  const { id } = useParams();
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchTicket = async () => {
      try {
        const response = await axios.get(`http://127.0.0.1:8000/tickets/${id}`);
        setTicket(response.data);
      } catch (error) {
        console.error('Error fetching ticket:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTicket();
  }, [id]);

  const handleDelete = async () => {
    try {
      await axios.delete(`http://127.0.0.1:8000/tickets/${id}`);
      navigate('/dashboard');
    } catch (error) {
      console.error('Error deleting ticket:', error);
    }
  };

  const DeleteModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-sm mx-4">
        <h3 className="text-lg font-semibold mb-4">Confirm Delete</h3>
        <p className="text-gray-600 mb-6">Are you sure you want to delete this ticket? This action cannot be undone.</p>
        <div className="flex justify-end gap-4">
          <button
            onClick={() => setShowDeleteModal(false)}
            className="px-4 py-2 text-gray-600 hover:text-gray-800"
          >
            Cancel
          </button>
          <button
            onClick={handleDelete}
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  if (!ticket) {
    return <div className="p-6">Ticket not found</div>;
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <Link to="/dashboard" className="inline-flex items-center text-blue-600 hover:text-blue-800">
          <ArrowLeft className="mr-2" size={20} />
          Back to Dashboard
        </Link>
        <button
          onClick={() => setShowDeleteModal(true)}
          className="flex items-center text-red-500 hover:text-red-700"
        >
          <Trash2 size={20} className="mr-2" />
          Delete Ticket
        </button>
      </div>
      
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <div className="flex justify-between items-start mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Ticket #{ticket.id}</h1>
          <span className={`px-3 py-1 text-sm font-semibold rounded-full ${
            ticket.status === 'Open' ? 'bg-yellow-100 text-yellow-800' :
            ticket.status === 'In Progress' ? 'bg-blue-100 text-blue-800' :
            'bg-green-100 text-green-800'
          }`}>
            {ticket.status}
          </span>
        </div>
        <div className="flex justify-between items-start mb-6">
          <span className="px-3 py-1 text-sm font-semibold rounded-full bg-red-100 text-red-800">
            {ticket.urgency}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-6 mb-6">
          <div>
            <h3 className="text-sm font-medium text-gray-500">Submitted By</h3>
            <p className="mt-1 text-md text-gray-900">{ticket.name}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500">Email</h3>
            <p className="mt-1 text-md text-gray-900">{ticket.user_email}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500">Category</h3>
            <p className="mt-1 text-md text-gray-900">{ticket.category}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500">Created At</h3>
            <p className="mt-1 text-md text-gray-900">
              {new Date(ticket.created_at).toLocaleString()}
            </p>
          </div>
        </div>

        <div className="mb-6">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Description</h3>
          <div className="p-4 bg-gray-50 rounded-lg text-md text-gray-900">
            {ticket.description}
          </div>
        </div>

        <div>
          <h3 className="text-sm font-medium text-gray-500 mb-2">AI Response</h3>
          <div className="p-4 bg-gray-50 rounded-lg prose prose-sm max-w-none">
            <ReactMarkdown>{ticket.response}</ReactMarkdown>
          </div>
        </div>
      </div>
      {showDeleteModal && <DeleteModal />}
    </div>
  );
};

export default TicketDetails;
