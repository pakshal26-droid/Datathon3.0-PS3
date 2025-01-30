import React, { useState, useEffect , useMemo } from 'react';
import axios from 'axios';
import { LineChart, XAxis, YAxis, Tooltip, Line, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { ArrowUp, ArrowDown, Users, Clock, CheckCircle, AlertCircle, ChevronDown, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const [tickets, setTickets] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [filter, setFilter] = useState({ status: '', category: '' });
  const [gptRes, setGptRes] = useState([]);
  const [openActionId, setOpenActionId] = useState(null);
  const [openFilterType, setOpenFilterType] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [ticketToDelete, setTicketToDelete] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [filter]);

  const fetchData = async () => {
    try {
      const [gptRes, analyticsRes] = await Promise.all([
        axios.get(`http://127.0.0.1:8000/tickets/filtered/`, {
          params: {
            status: filter.status,
            category: filter.category
          }
        }),
        axios.get(`http://127.0.0.1:8000/analytics`)
      ]);
      setGptRes(gptRes.data);
      setAnalytics(analyticsRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.filter-dropdown')) {
        setOpenFilterType(null);
      }
      if (!event.target.closest('.action-dropdown')) {
        setOpenActionId(null);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const chartData = useMemo(() => {
    if (!gptRes.length) return [];

    // Create a map to store tickets per day
    const ticketsByDay = gptRes.reduce((acc, ticket) => {
      // Format the date properly
      const date = new Date(ticket.created_at);
      const formattedDate = date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
      acc[formattedDate] = (acc[formattedDate] || 0) + 1;
      return acc;
    }, {});

    // Convert to array and sort by date
    const sortedData = Object.entries(ticketsByDay)
      .map(([date, count]) => ({
        date,
        value: count,
        // Add a timestamp for proper sorting
        timestamp: new Date(date).getTime()
      }))
      .sort((a, b) => a.timestamp - b.timestamp);

    // Take the last 7 days
    return sortedData.slice(-7);
  }, [gptRes]);

  const ticketChange = useMemo(() => {
    if (!chartData.length) return 0;
    const currentTotal = chartData.slice(-7).reduce((sum, day) => sum + day.value, 0);
    const previousTotal = chartData.slice(-14, -7).reduce((sum, day) => sum + day.value, 0);
    if (previousTotal === 0) return 100;
    return Math.round(((currentTotal - previousTotal) / previousTotal) * 100);
  }, [chartData]);

  const updateGptTicketStatus = async (id, status) => {
    try {
      await axios.put(`http://127.0.0.1:8000/tickets/${id}`, { status });
      fetchData();
    } catch (error) {
      console.error('Error updating ticket:', error);
    }
  };

  const handleDeleteClick = (e, ticketId) => {
    e.stopPropagation();
    setTicketToDelete(ticketId);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    try {
      await axios.delete(`http://127.0.0.1:8000/tickets/${ticketToDelete}`);
      setShowDeleteModal(false);
      setTicketToDelete(null);
      fetchData(); // Refresh the list
    } catch (error) {
      console.error('Error deleting ticket:', error);
    }
  };

  const toggleDropdown = (e, id) => {
    e.stopPropagation(); // Stop event from bubbling up
    setOpenActionId(openActionId === id ? null : id);
  };

  const toggleFilter = (filterType) => {
    setOpenFilterType(openFilterType === filterType ? null : filterType);
  };

  const handleFilterChange = (type, value) => {
    setFilter({ ...filter, [type]: value });
    setOpenFilterType(null);
  };

  const handleRowClick = (ticketId) => {
    navigate(`/ticket/${ticketId}`);
  };

  // Calculate percentage changes (mock data for demo)
  const getChangeIndicator = (value, threshold = 0) => {
    return value > threshold ? (
      <div className="flex items-center text-green-500">
        <ArrowUp size={16} />
        <span className="ml-1">+{value}%</span>
      </div>
    ) : (
      <div className="flex items-center text-red-500">
        <ArrowDown size={16} />
        <span className="ml-1">{value}%</span>
      </div>
    );
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
            onClick={confirmDelete}
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h2 className="text-4xl font-bold mb-8 text-gray-800">Admin Dashboard</h2>
      
      {/* Analytics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">Total Tickets</p>
              <h3 className="text-2xl font-bold text-gray-800">{gptRes.length || 0}</h3>
            </div>
            <div className="bg-blue-50 p-3 rounded-lg">
              <Users size={24} className="text-blue-500" />
            </div>
          </div>
          <div className="mt-4 text-sm">
            {getChangeIndicator(12)} {/* Mock data */}
            <span className="text-gray-500 ml-2">vs last week</span>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">Open Tickets</p>
              <h3 className="text-2xl font-bold text-gray-800">{analytics?.open_tickets || 0}</h3>
            </div>
            <div className="bg-yellow-50 p-3 rounded-lg">
              <AlertCircle size={24} className="text-yellow-500" />
            </div>
          </div>
          <div className="mt-4 text-sm">
            {getChangeIndicator(-5)} {/* Mock data */}
            <span className="text-gray-500 ml-2">vs last week</span>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">Resolved</p>
              <h3 className="text-2xl font-bold text-gray-800">{analytics?.tickets_by_status?.Resolved || 0}</h3>
            </div>
            <div className="bg-green-50 p-3 rounded-lg">
              <CheckCircle size={24} className="text-green-500" />
            </div>
          </div>
          <div className="mt-4 text-sm">
            {getChangeIndicator(8)} {/* Mock data */}
            <span className="text-gray-500 ml-2">vs last week</span>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">Avg. Response Time</p>
              <h3 className="text-2xl font-bold text-gray-800">2.4h</h3>
            </div>
            <div className="bg-purple-50 p-3 rounded-lg">
              <Clock size={24} className="text-purple-500" />
            </div>
          </div>
          <div className="mt-4 text-sm">
            {getChangeIndicator(-15)} {/* Mock data */}
            <span className="text-gray-500 ml-2">vs last week</span>
          </div>
        </div>
      </div>

      {/* Chart Section */}
      <div className="bg-white rounded-xl  shadow-sm p-6 mb-8 border border-gray-100">
        <h3 className="text-lg font-semibold mb-4 text-gray-800">Ticket Volume Trend</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <XAxis 
                dataKey="date" 
                stroke="#94a3b8"
                tickMargin={10}
                tickFormatter={(value) => {
                  // Format the tick labels to show only month and day
                  const date = new Date(value);
                  return date.toLocaleDateString('en-US', { 
                    month: 'short',
                    day: 'numeric'
                  });
                }}
              />
              <YAxis 
                stroke="#94a3b8"
                allowDecimals={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  padding: '8px'
                }}
                labelStyle={{ color: '#1e293b' }}
                labelFormatter={(value) => {
                  // Format the tooltip label
                  return `Date: ${value}`;
                }}
                formatter={(value) => [`${value} tickets`, 'Volume']}
              />
              <Line
                type="monotone"
                dataKey="value"
                name="Tickets"
                stroke="#6366f1"
                strokeWidth={2}
                dot={{ fill: '#6366f1', strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-4 text-sm text-gray-500 flex items-center">
          <span className="mr-2">Week over week change:</span>
          {getChangeIndicator(ticketChange)}
        </div>
      </div>


      {/* Filters and Table Section */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-semibold text-gray-800">Recent Tickets</h3>
          <div className="flex gap-4">
            {/* Status Filter */}
            <div className="relative filter-dropdown">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleFilter('status');
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 flex items-center justify-between w-40"
              >
                {filter.status || 'All Statuses'}
                <ChevronDown 
                  size={16} 
                  className={`transform transition-transform duration-200 ${
                    openFilterType === 'status' ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {openFilterType === 'status' && (
                <div className="absolute right-0 mt-2 w-40 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10">
                  <div className="py-1" role="menu">
                    <button
                      onClick={() => handleFilterChange('status', '')}
                      className={`block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left ${
                        filter.status === '' ? 'bg-gray-50' : ''
                      }`}
                    >
                      All Statuses
                    </button>
                    {['Open', 'In Progress', 'Resolved'].map((status) => (
                      <button
                        key={status}
                        onClick={() => handleFilterChange('status', status)}
                        className={`block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left ${
                          filter.status === status ? 'bg-gray-50' : ''
                        }`}
                      >
                        {status}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Category Filter */}
            <div className="relative filter-dropdown">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleFilter('category');
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 flex items-center justify-between w-40"
              >
                {filter.category || 'All Categories'}
                <ChevronDown 
                  size={16} 
                  className={`transform transition-transform duration-200 ${
                    openFilterType === 'category' ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {openFilterType === 'category' && (
                <div className="absolute right-0 mt-2 w-40 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10">
                  <div className="py-1" role="menu">
                    <button
                      onClick={() => handleFilterChange('category', '')}
                      className={`block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left ${
                        filter.category === '' ? 'bg-gray-50' : ''
                      }`}
                    >
                      All Categories
                    </button>
                    {['Login', 'Billing', 'Technical', 'Other'].map((category) => (
                      <button
                        key={category}
                        onClick={() => handleFilterChange('category', category)}
                        className={`block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left ${
                          filter.category === category ? 'bg-gray-50' : ''
                        }`}
                      >
                        {category}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full ">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Response</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
  {gptRes.map(ticket => (
    <tr 
      key={ticket.id} 
      className="hover:bg-gray-50 cursor-pointer"
      onClick={() => handleRowClick(ticket.id)}
    >
      <td className="px-6 py-4 whitespace-nowrap text-md text-gray-900">{ticket.id}</td>
      <td className="px-6 py-4 text-md text-gray-900">{ticket.description}</td>
      <td className="px-6 py-4 whitespace-nowrap text-md text-gray-900">{ticket.category}</td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span className={`px-2 inline-flex text-md leading-5 font-semibold rounded-full ${
          ticket.status === 'Open' ? 'bg-yellow-100 text-yellow-800' :
          ticket.status === 'In Progress' ? 'bg-blue-100 text-blue-800' :
          'bg-green-100 text-green-800'
        }`}>
          {ticket.status}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-md text-gray-900">
        {new Date(ticket.created_at).toLocaleDateString()}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-md text-gray-900 relative">
        <div className="flex gap-2">
          <div className="relative action-dropdown">
            <button
              onClick={(e) => toggleDropdown(e, ticket.id)}
              className="px-4 py-2 text-md font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 flex items-center justify-between w-36"
            >
              {ticket.status}
              <ChevronDown 
                size={16} 
                className={`transform transition-transform duration-200 ${
                  openActionId === ticket.id ? 'rotate-180' : ''
                }`}
              />
            </button>

            {openActionId === ticket.id && (
              <div className="absolute right-0 mt-2 w-36 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10">
                <div className="py-1" role="menu">
                  {['Open', 'In Progress', 'Resolved'].map((status) => (
                    <button
                      key={status}
                      onClick={(e) => {
                        e.stopPropagation(); // Stop event from bubbling up
                        updateGptTicketStatus(ticket.id, status);
                        toggleDropdown(e, ticket.id);
                      }}
                      className={`block px-4 py-2 text-md text-gray-700 hover:bg-gray-100 w-full text-left ${
                        ticket.status === status ? 'bg-gray-50' : ''
                      }`}
                      role="menuitem"
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <button
            onClick={(e) => handleDeleteClick(e, ticket.id)}
            className="p-2 text-gray-500 hover:text-red-500 transition-colors"
          >
            <Trash2 size={20} />
          </button>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-normal text-md text-gray-900">
        {ticket.response?.slice(0, 200) + "..."}
      </td>
    </tr>
  ))}
</tbody>

          </table>
        </div>
      </div>
      {showDeleteModal && <DeleteModal />}
    </div>
  );
};

export default Dashboard;