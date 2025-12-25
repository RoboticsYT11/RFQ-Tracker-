import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../utils/api';
import { format } from 'date-fns';
import './RFQList.css';

const RFQList = () => {
  const [rfqs, setRfqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    priority: '',
    category: '',
    sort_by: 'created_at',
    sort_order: 'DESC'
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    pages: 0
  });

  useEffect(() => {
    fetchRFQs();
  }, [filters, pagination.page]);

  const fetchRFQs = async () => {
    try {
      setLoading(true);
      const params = {
        ...filters,
        page: pagination.page,
        limit: pagination.limit
      };
      const response = await api.get('/rfq', { params });
      if (response.data.success) {
        setRfqs(response.data.data);
        setPagination(prev => ({
          ...prev,
          total: response.data.pagination.total,
          pages: response.data.pagination.pages
        }));
      }
    } catch (error) {
      console.error('Failed to fetch RFQs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleExport = async (format) => {
    try {
      const params = {
        status: filters.status,
        priority: filters.priority,
        category: filters.category
      };
      const response = await api.get(`/reports/export/${format}`, {
        params,
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `RFQ_Export_${new Date().toISOString().split('T')[0]}.${format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed. Please try again.');
    }
  };

  const getStatusClass = (status) => {
    return `badge status-${status.toLowerCase().replace(' ', '-')}`;
  };

  const getPriorityClass = (priority) => {
    return `priority-${priority.toLowerCase()}`;
  };

  const isOverdue = (dueDate) => {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date();
  };

  return (
    <div className="rfq-list">
      <div className="page-header">
        <h2>RFQ Management</h2>
        <div className="header-actions">
          <button onClick={() => handleExport('excel')} className="btn btn-secondary btn-small">
            Export Excel
          </button>
          <button onClick={() => handleExport('csv')} className="btn btn-secondary btn-small">
            Export CSV
          </button>
        </div>
      </div>

      <div className="filters">
        <div className="filter-group">
          <label>Search</label>
          <input
            type="text"
            placeholder="RFQ Number, Customer, Project..."
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
          />
        </div>
        <div className="filter-group">
          <label>Status</label>
          <select
            value={filters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
          >
            <option value="">All Status</option>
            <option value="Enquiry">Enquiry</option>
            <option value="Under Review">Under Review</option>
            <option value="Quotation Sent">Quotation Sent</option>
            <option value="Negotiation">Negotiation</option>
            <option value="Won">Won</option>
            <option value="Lost">Lost</option>
            <option value="On Hold">On Hold</option>
          </select>
        </div>
        <div className="filter-group">
          <label>Priority</label>
          <select
            value={filters.priority}
            onChange={(e) => handleFilterChange('priority', e.target.value)}
          >
            <option value="">All Priorities</option>
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
            <option value="Critical">Critical</option>
          </select>
        </div>
        <div className="filter-group">
          <label>Category</label>
          <select
            value={filters.category}
            onChange={(e) => handleFilterChange('category', e.target.value)}
          >
            <option value="">All Categories</option>
            <option value="Automation">Automation</option>
            <option value="Vision">Vision</option>
            <option value="Robotics">Robotics</option>
            <option value="Electrical">Electrical</option>
            <option value="Mechanical">Mechanical</option>
            <option value="Software">Software</option>
            <option value="Other">Other</option>
          </select>
        </div>
        <div className="filter-group">
          <label>Sort By</label>
          <select
            value={filters.sort_by}
            onChange={(e) => handleFilterChange('sort_by', e.target.value)}
          >
            <option value="created_at">Created Date</option>
            <option value="rfq_received_date">Received Date</option>
            <option value="rfq_due_date">Due Date</option>
            <option value="estimated_project_value">Value</option>
            <option value="priority">Priority</option>
          </select>
        </div>
        <div className="filter-group">
          <label>Order</label>
          <select
            value={filters.sort_order}
            onChange={(e) => handleFilterChange('sort_order', e.target.value)}
          >
            <option value="DESC">Descending</option>
            <option value="ASC">Ascending</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="spinner"></div>
      ) : (
        <>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>RFQ Number</th>
                  <th>Customer</th>
                  <th>Project</th>
                  <th>Category</th>
                  <th>Status</th>
                  <th>Priority</th>
                  <th>Received Date</th>
                  <th>Due Date</th>
                  <th>Value</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {rfqs.length === 0 ? (
                  <tr>
                    <td colSpan="10" style={{ textAlign: 'center', padding: '40px' }}>
                      No RFQs found
                    </td>
                  </tr>
                ) : (
                  rfqs.map((rfq) => (
                    <tr key={rfq.id}>
                      <td>
                        <Link to={`/rfq/${rfq.id}`} className="rfq-link">
                          {rfq.rfq_number}
                        </Link>
                      </td>
                      <td>{rfq.customer_name}</td>
                      <td>{rfq.product_project_name || '-'}</td>
                      <td>{rfq.rfq_category || '-'}</td>
                      <td>
                        <span className={getStatusClass(rfq.status)}>
                          {rfq.status}
                        </span>
                      </td>
                      <td className={getPriorityClass(rfq.priority)}>
                        {rfq.priority}
                      </td>
                      <td>
                        {rfq.rfq_received_date
                          ? format(new Date(rfq.rfq_received_date), 'dd MMM yyyy')
                          : '-'}
                      </td>
                      <td className={isOverdue(rfq.rfq_due_date) ? 'overdue' : ''}>
                        {rfq.rfq_due_date
                          ? format(new Date(rfq.rfq_due_date), 'dd MMM yyyy')
                          : '-'}
                      </td>
                      <td>
                        {rfq.estimated_project_value
                          ? `₹${parseFloat(rfq.estimated_project_value).toLocaleString('en-IN')}`
                          : '-'}
                      </td>
                      <td>
                        <Link
                          to={`/rfq/${rfq.id}`}
                          className="btn btn-primary btn-small"
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {pagination.pages > 1 && (
            <div className="pagination">
              <button
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                disabled={pagination.page === 1}
                className="btn btn-secondary btn-small"
              >
                Previous
              </button>
              <span>
                Page {pagination.page} of {pagination.pages} (Total: {pagination.total})
              </span>
              <button
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                disabled={pagination.page >= pagination.pages}
                className="btn btn-secondary btn-small"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default RFQList;

