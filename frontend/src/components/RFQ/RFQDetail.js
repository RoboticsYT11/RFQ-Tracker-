import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../../utils/api';
import { format } from 'date-fns';
import { useAuth } from '../../context/AuthContext';
import './RFQDetail.css';

const RFQDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [rfq, setRfq] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [statusForm, setStatusForm] = useState({
    status: '',
    reason: ''
  });

  useEffect(() => {
    fetchRFQ();
  }, [id]);

  const fetchRFQ = async () => {
    try {
      const response = await api.get(`/rfq/${id}`);
      if (response.data.success) {
        setRfq(response.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch RFQ:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async () => {
    try {
      const updateData = {
        status: statusForm.status,
        ...(statusForm.reason && { reason_for_lost_on_hold: statusForm.reason })
      };

      await api.put(`/rfq/${id}`, updateData);
      setShowStatusModal(false);
      setStatusForm({ status: '', reason: '' });
      fetchRFQ();
    } catch (error) {
      console.error('Failed to update status:', error);
      alert(error.response?.data?.message || 'Failed to update status');
    }
  };

  const canEdit = () => {
    if (user.role === 'admin') return true;
    if (user.role === 'sales' && (rfq?.assigned_sales_person_id === user.id || rfq?.created_by === user.id)) return true;
    if (user.role === 'engineer' && rfq?.assigned_engineer_id === user.id) return true;
    return false;
  };

  if (loading) {
    return <div className="spinner"></div>;
  }

  if (!rfq) {
    return <div className="alert alert-error">RFQ not found</div>;
  }

  const getStatusClass = (status) => {
    return `badge status-${status.toLowerCase().replace(' ', '-')}`;
  };

  return (
    <div className="rfq-detail">
      <div className="detail-header">
        <div>
          <h2>{rfq.rfq_number}</h2>
          <p className="customer-name">{rfq.customer_name}</p>
        </div>
        <div className="header-actions">
          {canEdit() && (
            <>
              <Link to={`/rfq/${id}/edit`} className="btn btn-primary">
                Edit
              </Link>
              <button
                onClick={() => {
                  setStatusForm({ status: rfq.status, reason: rfq.reason_for_lost_on_hold || '' });
                  setShowStatusModal(true);
                }}
                className="btn btn-secondary"
              >
                Change Status
              </button>
            </>
          )}
          <Link to="/rfq" className="btn btn-secondary">
            Back to List
          </Link>
        </div>
      </div>

      <div className="detail-grid">
        <div className="detail-section">
          <h3>Basic Information</h3>
          <div className="info-grid">
            <div className="info-item">
              <label>RFQ Number</label>
              <div>{rfq.rfq_number}</div>
            </div>
            <div className="info-item">
              <label>Status</label>
              <div>
                <span className={getStatusClass(rfq.status)}>{rfq.status}</span>
              </div>
            </div>
            <div className="info-item">
              <label>Priority</label>
              <div className={`priority-${rfq.priority?.toLowerCase()}`}>{rfq.priority}</div>
            </div>
            <div className="info-item">
              <label>Category</label>
              <div>{rfq.rfq_category || '-'}</div>
            </div>
            <div className="info-item">
              <label>Source</label>
              <div>{rfq.rfq_source || '-'}</div>
            </div>
            <div className="info-item">
              <label>RFQ Received Date</label>
              <div>
                {rfq.rfq_received_date
                  ? format(new Date(rfq.rfq_received_date), 'dd MMM yyyy')
                  : '-'}
              </div>
            </div>
            <div className="info-item">
              <label>RFQ Due Date</label>
              <div>
                {rfq.rfq_due_date
                  ? format(new Date(rfq.rfq_due_date), 'dd MMM yyyy')
                  : '-'}
              </div>
            </div>
            <div className="info-item">
              <label>Expected Order Date</label>
              <div>
                {rfq.expected_order_date
                  ? format(new Date(rfq.expected_order_date), 'dd MMM yyyy')
                  : '-'}
              </div>
            </div>
          </div>
        </div>

        <div className="detail-section">
          <h3>Customer Information</h3>
          <div className="info-grid">
            <div className="info-item">
              <label>Customer Name</label>
              <div>{rfq.customer_name}</div>
            </div>
            <div className="info-item">
              <label>Contact Person</label>
              <div>{rfq.customer_contact_person || '-'}</div>
            </div>
            <div className="info-item">
              <label>Company Name</label>
              <div>{rfq.company_name || '-'}</div>
            </div>
            <div className="info-item">
              <label>Email</label>
              <div>{rfq.email || '-'}</div>
            </div>
            <div className="info-item">
              <label>Phone</label>
              <div>{rfq.phone || '-'}</div>
            </div>
          </div>
        </div>

        <div className="detail-section">
          <h3>Project Details</h3>
          <div className="info-grid">
            <div className="info-item full-width">
              <label>Product / Project Name</label>
              <div>{rfq.product_project_name || '-'}</div>
            </div>
            <div className="info-item">
              <label>Estimated Project Value</label>
              <div>
                {rfq.estimated_project_value
                  ? `${rfq.currency} ${parseFloat(rfq.estimated_project_value).toLocaleString('en-IN')}`
                  : '-'}
              </div>
            </div>
            <div className="info-item">
              <label>Assigned Engineer</label>
              <div>{rfq.assigned_engineer_name || '-'}</div>
            </div>
            <div className="info-item">
              <label>Assigned Sales Person</label>
              <div>{rfq.assigned_sales_person_name || '-'}</div>
            </div>
            {rfq.reason_for_lost_on_hold && (
              <div className="info-item full-width">
                <label>Reason for Lost/On Hold</label>
                <div>{rfq.reason_for_lost_on_hold}</div>
              </div>
            )}
            {rfq.remarks_notes && (
              <div className="info-item full-width">
                <label>Remarks / Notes</label>
                <div>{rfq.remarks_notes}</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {rfq.quotations && rfq.quotations.length > 0 && (
        <div className="detail-section quotations-section">
          <h3>Quotations</h3>
          <table>
            <thead>
              <tr>
                <th>Quotation Number</th>
                <th>Sent Date</th>
                <th>Revision</th>
                <th>Quoted Amount</th>
                <th>Approval Status</th>
                <th>Final Approved Amount</th>
              </tr>
            </thead>
            <tbody>
              {rfq.quotations.map((quo) => (
                <tr key={quo.id}>
                  <td>{quo.quotation_number}</td>
                  <td>
                    {quo.quotation_sent_date
                      ? format(new Date(quo.quotation_sent_date), 'dd MMM yyyy')
                      : '-'}
                  </td>
                  <td>{quo.revision_number}</td>
                  <td>₹{parseFloat(quo.quoted_amount).toLocaleString('en-IN')}</td>
                  <td>
                    <span className={`badge status-${quo.approval_status?.toLowerCase()}`}>
                      {quo.approval_status}
                    </span>
                  </td>
                  <td>
                    {quo.final_approved_amount
                      ? `₹${parseFloat(quo.final_approved_amount).toLocaleString('en-IN')}`
                      : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {rfq.status_history && rfq.status_history.length > 0 && (
        <div className="detail-section status-history-section">
          <h3>Status History</h3>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>From</th>
                <th>To</th>
                <th>Changed By</th>
                <th>Reason</th>
              </tr>
            </thead>
            <tbody>
              {rfq.status_history.map((history) => (
                <tr key={history.id}>
                  <td>
                    {format(new Date(history.changed_at), 'dd MMM yyyy HH:mm')}
                  </td>
                  <td>{history.old_status || '-'}</td>
                  <td>
                    <span className={getStatusClass(history.new_status)}>
                      {history.new_status}
                    </span>
                  </td>
                  <td>{history.changed_by_name || '-'}</td>
                  <td>{history.change_reason || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showStatusModal && (
        <div className="modal-overlay" onClick={() => setShowStatusModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Change Status</h3>
            <div className="form-group">
              <label>New Status</label>
              <select
                value={statusForm.status}
                onChange={(e) => setStatusForm({ ...statusForm, status: e.target.value })}
              >
                <option value="">Select Status</option>
                <option value="Enquiry">Enquiry</option>
                <option value="Under Review">Under Review</option>
                <option value="Quotation Sent">Quotation Sent</option>
                <option value="Negotiation">Negotiation</option>
                <option value="Won">Won</option>
                <option value="Lost">Lost</option>
                <option value="On Hold">On Hold</option>
              </select>
            </div>
            {(statusForm.status === 'Lost' || statusForm.status === 'On Hold') && (
              <div className="form-group">
                <label>Reason (Required)</label>
                <textarea
                  value={statusForm.reason}
                  onChange={(e) => setStatusForm({ ...statusForm, reason: e.target.value })}
                  required
                />
              </div>
            )}
            <div className="modal-actions">
              <button onClick={() => setShowStatusModal(false)} className="btn btn-secondary">
                Cancel
              </button>
              <button onClick={handleStatusChange} className="btn btn-primary">
                Update
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RFQDetail;

