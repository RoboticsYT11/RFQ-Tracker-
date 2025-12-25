import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import './Dashboard.css';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('month');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    fetchStats();
  }, [period]);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/dashboard/stats?period=${period}`);
      if (response.data && response.data.success) {
        setStats(response.data.data);
        setErrorMessage(''); // Clear any previous errors
      } else {
        console.error('Invalid response format:', response.data);
        setErrorMessage('Invalid response from server. Please check backend logs.');
        setStats(null);
      }
    } catch (error) {
      console.error('Failed to fetch dashboard stats:', error);
      console.error('Error details:', error.response?.data || error.message);
      setStats(null);
      
      // Set user-friendly error message
      if (error.response) {
        // Server responded with error
        if (error.response.status === 401) {
          setErrorMessage('Authentication failed. Please log in again.');
        } else if (error.response.status === 500) {
          setErrorMessage('Server error. Please check backend logs.');
        } else {
          setErrorMessage(`Server error: ${error.response.data?.message || error.response.statusText || 'Unknown error'}`);
        }
      } else if (error.request) {
        // Request made but no response
        setErrorMessage('Cannot connect to server. Make sure the backend is running on http://localhost:5000');
      } else {
        setErrorMessage(`Error: ${error.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="spinner"></div>;
  }

  if (!stats) {
    return (
      <div style={{ padding: '20px' }}>
        <div className="alert alert-error">
          <strong>Failed to load dashboard data</strong>
          {errorMessage && (
            <div style={{ marginTop: '12px', padding: '12px', background: 'rgba(255,255,255,0.5)', borderRadius: '4px' }}>
              {errorMessage}
            </div>
          )}
          <div style={{ marginTop: '16px' }}>
            <small style={{ display: 'block', marginBottom: '12px' }}>
              Troubleshooting steps:
            </small>
            <ul style={{ fontSize: '14px', marginLeft: '20px', marginBottom: '12px' }}>
              <li>Check if backend server is running on port 5000</li>
              <li>Check browser console (F12) for detailed errors</li>
              <li>Verify you are logged in</li>
              <li>Check backend terminal for error messages</li>
            </ul>
            <button 
              onClick={() => { setErrorMessage(''); fetchStats(); }} 
              style={{ padding: '8px 16px' }} 
              className="btn btn-primary"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  const statusColors = {
    'Enquiry': '#9e9e9e',
    'Under Review': '#800020',
    'Quotation Sent': '#4caf50',
    'Negotiation': '#ff9800',
    'Won': '#2e7d32',
    'Lost': '#f44336',
    'On Hold': '#9c27b0'
  };

  const COLORS = ['#800020', '#a00030', '#c00040', '#ff5066', '#ff8099', '#ffb3c1'];

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h2>Dashboard</h2>
        <select value={period} onChange={(e) => setPeriod(e.target.value)} className="period-select">
          <option value="month">This Month</option>
          <option value="quarter">This Quarter</option>
          <option value="year">This Year</option>
        </select>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <h3>Total RFQs</h3>
          <div className="value">{stats.totalRfqs}</div>
        </div>
        <div className="stat-card">
          <h3>Won</h3>
          <div className="value" style={{ color: '#2e7d32' }}>{stats.winLoss.won}</div>
        </div>
        <div className="stat-card">
          <h3>Lost</h3>
          <div className="value" style={{ color: '#f44336' }}>{stats.winLoss.lost}</div>
        </div>
        <div className="stat-card">
          <h3>Win/Loss Ratio</h3>
          <div className="value">{stats.winLoss.ratio}</div>
        </div>
        <div className="stat-card">
          <h3>Total Quoted</h3>
          <div className="value">₹{stats.values.totalQuoted.toLocaleString('en-IN')}</div>
        </div>
        <div className="stat-card">
          <h3>Total Won Value</h3>
          <div className="value" style={{ color: '#2e7d32' }}>₹{stats.values.totalWon.toLocaleString('en-IN')}</div>
        </div>
        <div className="stat-card">
          <h3>Overdue RFQs</h3>
          <div className="value" style={{ color: stats.overdueCount > 0 ? '#f44336' : '#4caf50' }}>
            {stats.overdueCount}
          </div>
        </div>
      </div>

      <div className="charts-row">
        <div className="chart-container">
          <h3 className="chart-title">RFQs by Status</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={stats.statusBreakdown}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="count"
              >
                {stats.statusBreakdown.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={statusColors[entry.status] || COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-container">
          <h3 className="chart-title">RFQs by Category</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={stats.categoryBreakdown}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="rfq_category" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#800020" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="charts-row">
        <div className="chart-container">
          <h3 className="chart-title">Engineer-wise RFQ Load</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={stats.engineerLoad}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="full_name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="rfq_count" fill="#800020" name="Total RFQs" />
              <Bar dataKey="active_count" fill="#4caf50" name="Active RFQs" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-container">
          <h3 className="chart-title">Pending RFQs Aging (Top 10)</h3>
          <div className="aging-list">
            {stats.aging.length > 0 ? (
              <table>
                <thead>
                  <tr>
                    <th>RFQ Number</th>
                    <th>Customer</th>
                    <th>Status</th>
                    <th>Aging Days</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.aging.map((item) => (
                    <tr key={item.rfq_number}>
                      <td>{item.rfq_number}</td>
                      <td>{item.customer_name}</td>
                      <td>
                        <span className={`badge status-${item.status.toLowerCase().replace(' ', '-')}`}>
                          {item.status}
                        </span>
                      </td>
                      <td className={item.aging_days > 30 ? 'overdue' : ''}>
                        {item.aging_days} days
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p>No pending RFQs</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

