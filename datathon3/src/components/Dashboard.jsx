// // components/Dashboard.jsx
// import React, { useState, useEffect } from 'react';
// import axios from 'axios';

// const Dashboard = () => {
//   const [tickets, setTickets] = useState([]);
//   const [analytics, setAnalytics] = useState(null);
//   const [filter, setFilter] = useState({ status: '', category: '' });
//   const [gptRes, setGptRes] = useState([]);

//   useEffect(() => {
//     fetchData();
//     const interval = setInterval(fetchData, 30000);
//     return () => clearInterval(interval);
//   }, [filter]);

//   const fetchData = async () => {
//     try {
//       const [gptRes,analyticsRes] = await Promise.all([
//         axios.get(`http://127.0.0.1:8000/tickets/`),
//         axios.get(`http://127.0.0.1:8000/analytics`)
//       ]);
//       setGptRes(gptRes.data);
//       setAnalytics(analyticsRes.data);
//       console.log(analytics)
//     } catch (error) {
//       console.error('Error fetching data:', error);
//     }
//   };

//   const updateGptTicketStatus = async (id, status) => {
//     try {
//       await axios.put(`http://127.0.0.1:8000/tickets/${id}`, { status });
//       fetchData();
//     } catch (error) {
//       console.error('Error updating ticket:', error);
//     }
//   };

//   return (
//     <div className="p-6">
//       <h2 className="text-2xl font-bold mb-6">Admin Overview</h2>
      
//       {/* Analytics Section */}
//       {gptRes && (
//         <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
//           <div className="bg-white p-4 rounded shadow">
//             <h3 className="font-bold mb-2">Total Tickets</h3>
//             <p className="text-2xl">{gptRes.length ||0}</p>
//           </div>
//           <div className="bg-white p-4 rounded shadow">
//             <h3 className="font-bold mb-2">Open Tickets</h3>
//             <p className="text-2xl">{analytics?.open_tickets||0}</p>
//           </div>
//           <div className="bg-white p-4 rounded shadow">
//             <h3 className="font-bold mb-2">Resolved</h3>
//             <p className="text-2xl">{analytics?.tickets_by_status.Resolved || 0}</p>
//           </div>
//         </div>
//       )}

//       {/* Filters */}
//       <div className="mb-6 flex gap-4">
//         <select
//           value={filter.status}
//           onChange={(e) => setFilter({...filter, status: e.target.value})}
//           className="p-2 border rounded"
//         >
//           <option value="">All Statuses</option>
//           <option value="Open">Open</option>
//           <option value="In Progress">In Progress</option>
//           <option value="Resolved">Resolved</option>
//         </select>
//         <select
//           value={filter.category}
//           onChange={(e) => setFilter({...filter, category: e.target.value})}
//           className="p-2 border rounded"
//         >
//           <option value="">All Categories</option>
//           <option value="Login">Login</option>
//           <option value="Billing">Billing</option>
//           <option value="Technical">Technical</option>
//           <option value="Other">Other</option>
//         </select>
//       </div>

//       {/* Tickets Table */}
//       <div className="overflow-x-auto">
//         <table className="min-w-full bg-white">
//           <thead>
//             <tr>
//               <th className="p-2 border">ID</th>
//               <th className="p-2 border">Description</th>
//               <th className="p-2 border">Category</th>
//               <th className="p-2 border">Status</th>
//               <th className="p-2 border">Created</th>
//               <th className="p-2 border">Actions</th>
//               {/* <th className='p-2 border'>Response</th> */}
//             </tr>
//           </thead>
//           <tbody>
//             {gptRes.map(ticket => (
//               <tr key={ticket.id}>
//                 <td className="p-2 border">{ticket.id}</td>
//                 <td className="p-2 border">{ticket.description}</td>
//                 <td className="p-2 border">{ticket.category}</td>
//                 <td className="p-2 border">{ticket.status}</td>
//                 <td className="p-2 border">
//                   {new Date(ticket.created_at).toLocaleDateString()}
//                 </td>
//                 <td className="p-2 border">
//                   <select
//                     value={ticket.status}
//                     onChange={(e) => updateGptTicketStatus(ticket.id, e.target.value)}
//                     className="p-1 border rounded"
//                   >
//                     <option value="Open">Open</option>
//                     <option value="In Progress">In Progress</option>
//                     <option value="Resolved">Resolved</option>
//                   </select>
//                 </td>
//                 {/* <td className="p-2 border">{ticket.response}</td> */}
//               </tr>
//             ))}
//           </tbody>
//         </table>
//       </div>
//     </div>
//   );
// };


// export default Dashboard;
import React, { useState, useEffect , useMemo } from 'react';
import axios from 'axios';
import { LineChart, XAxis, YAxis, Tooltip, Line, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { ArrowUp, ArrowDown, Users, Clock, CheckCircle, AlertCircle } from 'lucide-react';

const Dashboard = () => {
  const [tickets, setTickets] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [filter, setFilter] = useState({ status: '', category: '' });
  const [gptRes, setGptRes] = useState([]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [filter]);

  const fetchData = async () => {
    try {
      const [gptRes, analyticsRes] = await Promise.all([
        axios.get(`http://127.0.0.1:8000/tickets/`),
        axios.get(`http://127.0.0.1:8000/analytics`)
      ]);
      setGptRes(gptRes.data);
      setAnalytics(analyticsRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };
  const chartData = useMemo(() => {
    if (!gptRes.length) return [];

    // Create a map to store tickets per day
    const ticketsByDay = gptRes.reduce((acc, ticket) => {
      const date = new Date(ticket.created_at).toLocaleDateString();
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {});

    // Convert to array and sort by date
    const sortedData = Object.entries(ticketsByDay)
      .map(([date, count]) => ({
        date: new Date(date).toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric' 
        }),
        value: count
      }))
      .sort((a, b) => new Date(a.date) - new Date(b.date));

    // Take the last 7 days if more data exists
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

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h2 className="text-3xl font-bold mb-8 text-gray-800">Support Analytics</h2>
      
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
      <div className="bg-white rounded-xl shadow-sm p-6 mb-8 border border-gray-100">
        <h3 className="text-lg font-semibold mb-4 text-gray-800">Ticket Volume Trend</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <XAxis 
                dataKey="date" 
                stroke="#94a3b8"
                tickMargin={10}
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
            <select
              value={filter.status}
              onChange={(e) => setFilter({...filter, status: e.target.value})}
              className="px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Statuses</option>
              <option value="Open">Open</option>
              <option value="In Progress">In Progress</option>
              <option value="Resolved">Resolved</option>
            </select>
            <select
              value={filter.category}
              onChange={(e) => setFilter({...filter, category: e.target.value})}
              className="px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Categories</option>
              <option value="Login">Login</option>
              <option value="Billing">Billing</option>
              <option value="Technical">Technical</option>
              <option value="Other">Other</option>
            </select>
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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">response</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {gptRes.map(ticket => (
                <tr key={ticket.id} className="hover:bg-gray-50 ">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{ticket.id}</td>
                  <td className="px-6 py-4 text-sm text-gray-900">{ticket.description}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{ticket.category}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      ticket.status === 'Open' ? 'bg-yellow-100 text-yellow-800' :
                      ticket.status === 'In Progress' ? 'bg-blue-100 text-blue-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {ticket.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(ticket.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <select
                      value={ticket.status}
                      onChange={(e) => updateGptTicketStatus(ticket.id, e.target.value)}
                      className="px-3 py-1 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="Open">Open</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Resolved">Resolved</option>
                    </select>
                  </td>
                  <td className="px-6 py-4 whitespace-wrap text-sm text-gray-900">{ticket.response}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;