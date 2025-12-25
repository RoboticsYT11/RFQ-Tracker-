import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import './RFQForm.css';

const RFQForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState({ engineers: [], sales: [] });
  const [formData, setFormData] = useState({
    customer_name: '',
    customer_contact_person: '',
    email: '',
    phone: '',
    company_name: '',
    rfq_received_date: new Date(),
    rfq_due_date: null,
    product_project_name: '',
    rfq_category: '',
    rfq_source: '',
    assigned_engineer_id: '',
    assigned_sales_person_id: '',
    priority: 'Medium',
    estimated_project_value: '',
    currency: 'INR',
    expected_order_date: null,
    status: 'Enquiry',
    remarks_notes: ''
  });

  useEffect(() => {
    fetchUsers();
    if (isEdit) {
      fetchRFQ();
    }
  }, [id]);

  const fetchUsers = async () => {
    try {
      const [engineersRes, salesRes] = await Promise.all([
        api.get('/users/by-role/engineer'),
        api.get('/users/by-role/sales')
      ]);
      setUsers({
        engineers: engineersRes.data.data || [],
        sales: salesRes.data.data || []
      });
    } catch (error) {
      console.error('Failed to fetch users:', error);
    }
  };

  const fetchRFQ = async () => {
    try {
      const response = await api.get(`/rfq/${id}`);
      if (response.data.success) {
        const rfq = response.data.data;
        setFormData({
          customer_name: rfq.customer_name || '',
          customer_contact_person: rfq.customer_contact_person || '',
          email: rfq.email || '',
          phone: rfq.phone || '',
          company_name: rfq.company_name || '',
          rfq_received_date: rfq.rfq_received_date ? new Date(rfq.rfq_received_date) : new Date(),
          rfq_due_date: rfq.rfq_due_date ? new Date(rfq.rfq_due_date) : null,
          product_project_name: rfq.product_project_name || '',
          rfq_category: rfq.rfq_category || '',
          rfq_source: rfq.rfq_source || '',
          assigned_engineer_id: rfq.assigned_engineer_id || '',
          assigned_sales_person_id: rfq.assigned_sales_person_id || '',
          priority: rfq.priority || 'Medium',
          estimated_project_value: rfq.estimated_project_value || '',
          currency: rfq.currency || 'INR',
          expected_order_date: rfq.expected_order_date ? new Date(rfq.expected_order_date) : null,
          status: rfq.status || 'Enquiry',
          remarks_notes: rfq.remarks_notes || ''
        });
      }
    } catch (error) {
      console.error('Failed to fetch RFQ:', error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleDateChange = (name, date) => {
    setFormData(prev => ({ ...prev, [name]: date }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const submitData = {
        ...formData,
        rfq_received_date: formData.rfq_received_date?.toISOString().split('T')[0],
        rfq_due_date: formData.rfq_due_date?.toISOString().split('T')[0] || null,
        expected_order_date: formData.expected_order_date?.toISOString().split('T')[0] || null,
        assigned_engineer_id: formData.assigned_engineer_id || null,
        assigned_sales_person_id: formData.assigned_sales_person_id || null,
        estimated_project_value: formData.estimated_project_value ? parseFloat(formData.estimated_project_value) : null
      };

      if (isEdit) {
        await api.put(`/rfq/${id}`, submitData);
      } else {
        await api.post('/rfq', submitData);
      }

      navigate('/rfq');
    } catch (error) {
      console.error('Failed to save RFQ:', error);
      alert(error.response?.data?.message || 'Failed to save RFQ');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rfq-form">
      <div className="form-header">
        <h2>{isEdit ? 'Edit RFQ' : 'Create New RFQ'}</h2>
        <button onClick={() => navigate('/rfq')} className="btn btn-secondary">
          Cancel
        </button>
      </div>

      <div className="rfq-form-container">
        <form onSubmit={handleSubmit}>
          {/* Basic Information Section */}
          <div className="form-section-box basic-info-section">
            <h3>Basic Information</h3>
            <div className="form-grid">
              <div className="form-group">
                <label>Customer Name *</label>
                <input
                  type="text"
                  name="customer_name"
                  value={formData.customer_name}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>Contact Person</label>
                <input
                  type="text"
                  name="customer_contact_person"
                  value={formData.customer_contact_person}
                  onChange={handleChange}
                />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                />
              </div>
              <div className="form-group">
                <label>Phone</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                />
              </div>
              <div className="form-group">
                <label>Company Name</label>
                <input
                  type="text"
                  name="company_name"
                  value={formData.company_name}
                  onChange={handleChange}
                />
              </div>
              <div className="form-group">
                <label>Product / Project Name</label>
                <input
                  type="text"
                  name="product_project_name"
                  value={formData.product_project_name}
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>

          {/* RFQ Details Section */}
          <div className="form-section-box rfq-details-section">
            <h3>RFQ Details</h3>
            <div className="form-grid">
              <div className="form-group">
                <label>RFQ Received Date *</label>
                <DatePicker
                  selected={formData.rfq_received_date}
                  onChange={(date) => handleDateChange('rfq_received_date', date)}
                  dateFormat="yyyy-MM-dd"
                  className="date-input"
                  required
                />
              </div>
              <div className="form-group">
                <label>RFQ Due Date</label>
                <DatePicker
                  selected={formData.rfq_due_date}
                  onChange={(date) => handleDateChange('rfq_due_date', date)}
                  dateFormat="yyyy-MM-dd"
                  className="date-input"
                />
              </div>
              <div className="form-group">
                <label>Category</label>
                <select
                  name="rfq_category"
                  value={formData.rfq_category}
                  onChange={handleChange}
                >
                  <option value="">Select Category</option>
                  <option value="Automation">Automation</option>
                  <option value="Vision">Vision</option>
                  <option value="Robotics">Robotics</option>
                  <option value="Electrical">Electrical</option>
                  <option value="Mechanical">Mechanical</option>
                  <option value="Software">Software</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div className="form-group">
                <label>Source</label>
                <select
                  name="rfq_source"
                  value={formData.rfq_source}
                  onChange={handleChange}
                >
                  <option value="">Select Source</option>
                  <option value="Email">Email</option>
                  <option value="Phone">Phone</option>
                  <option value="Portal">Portal</option>
                  <option value="Reference">Reference</option>
                  <option value="Sales Team">Sales Team</option>
                </select>
              </div>
              <div className="form-group">
                <label>Priority</label>
                <select
                  name="priority"
                  value={formData.priority}
                  onChange={handleChange}
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                  <option value="Critical">Critical</option>
                </select>
              </div>
              <div className="form-group">
                <label>Status</label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                >
                  <option value="Enquiry">Enquiry</option>
                  <option value="Under Review">Under Review</option>
                  <option value="Quotation Sent">Quotation Sent</option>
                  <option value="Negotiation">Negotiation</option>
                  <option value="Won">Won</option>
                  <option value="Lost">Lost</option>
                  <option value="On Hold">On Hold</option>
                </select>
              </div>
            </div>
          </div>

          {/* Assignment & Value Section */}
          <div className="form-section-box assignment-value-section">
            <h3>Assignment & Value</h3>
            <div className="form-grid">
              <div className="form-group">
                <label>Assigned Engineer</label>
                <select
                  name="assigned_engineer_id"
                  value={formData.assigned_engineer_id}
                  onChange={handleChange}
                >
                  <option value="">Select Engineer</option>
                  {users.engineers.map(eng => (
                    <option key={eng.id} value={eng.id}>{eng.full_name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Assigned Sales Person</label>
                <select
                  name="assigned_sales_person_id"
                  value={formData.assigned_sales_person_id}
                  onChange={handleChange}
                >
                  <option value="">Select Sales Person</option>
                  {users.sales.map(sales => (
                    <option key={sales.id} value={sales.id}>{sales.full_name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Estimated Project Value</label>
                <input
                  type="number"
                  name="estimated_project_value"
                  value={formData.estimated_project_value}
                  onChange={handleChange}
                  step="0.01"
                  min="0"
                />
              </div>
              <div className="form-group">
                <label>Currency</label>
                <select
                  name="currency"
                  value={formData.currency}
                  onChange={handleChange}
                >
                  <option value="INR">INR</option>
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                </select>
              </div>
              <div className="form-group">
                <label>Expected Order Date</label>
                <DatePicker
                  selected={formData.expected_order_date}
                  onChange={(date) => handleDateChange('expected_order_date', date)}
                  dateFormat="yyyy-MM-dd"
                  className="date-input"
                />
              </div>
            </div>
          </div>

          {/* Additional Information Section */}
          <div className="form-section-box additional-info-section">
            <h3>Additional Information</h3>
            <div className="form-group">
              <label>Remarks / Notes</label>
              <textarea
                name="remarks_notes"
                value={formData.remarks_notes}
                onChange={handleChange}
                rows="4"
              />
            </div>
          </div>

          {/* Form Actions - Bottom Right */}
          <div className="form-actions-bottom">
            <button type="button" onClick={() => navigate('/rfq')} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Saving...' : isEdit ? 'Update RFQ' : 'Create RFQ'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RFQForm;

