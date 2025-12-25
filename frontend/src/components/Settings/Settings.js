import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import './Settings.css';

const Settings = () => {
  const [activeTab, setActiveTab] = useState('engineers');
  const [engineers, setEngineers] = useState([]);
  const [sales, setSales] = useState([]);
  const [management, setManagement] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    full_name: '',
    role: 'engineer'
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await api.get('/users');
      if (response.data.success) {
        const users = response.data.data;
        setEngineers(users.filter(u => u.role === 'engineer'));
        setSales(users.filter(u => u.role === 'sales'));
        setManagement(users.filter(u => u.role === 'management'));
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
      setError('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleAddNew = (role) => {
    setEditingUser(null);
    setFormData({
      username: '',
      email: '',
      password: '',
      full_name: '',
      role: role
    });
    setError('');
    setSuccess('');
    setShowModal(true);
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    setFormData({
      username: user.username,
      email: user.email,
      password: '',
      full_name: user.full_name,
      role: user.role
    });
    setError('');
    setSuccess('');
    setShowModal(true);
  };

  const handleDeleteClick = (user) => {
    setUserToDelete(user);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!userToDelete) return;

    try {
      const response = await api.delete(`/users/${userToDelete.id}?permanent=true`);
      if (response.data.success) {
        setSuccess(`User ${userToDelete.username} deleted permanently`);
        fetchUsers();
        setShowDeleteModal(false);
        setUserToDelete(null);
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to delete user');
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleToggleActive = async (userId, username, isActive) => {
    try {
      const response = await api.put(`/users/${userId}`, { is_active: !isActive });
      if (response.data.success) {
        setSuccess(`User ${username} ${isActive ? 'deactivated' : 'activated'} successfully`);
        fetchUsers();
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (error) {
      setError(error.response?.data?.message || `Failed to ${isActive ? 'deactivate' : 'activate'} user`);
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validation
    if (!formData.username || !formData.email || !formData.full_name) {
      setError('Please fill in all required fields');
      return;
    }

    if (!editingUser && !formData.password) {
      setError('Password is required for new users');
      return;
    }

    try {
      if (editingUser) {
        // Update user
        const updateData = {
          full_name: formData.full_name,
          email: formData.email,
          role: formData.role
        };

        // Only include password if provided
        if (formData.password && formData.password.trim() !== '') {
          updateData.password = formData.password;
        }

        const response = await api.put(`/users/${editingUser.id}`, updateData);
        if (response.data.success) {
          setSuccess('User updated successfully');
          setShowModal(false);
          fetchUsers();
          setTimeout(() => setSuccess(''), 3000);
        }
      } else {
        // Create new user
        const response = await api.post('/auth/register', formData);
        if (response.data.success) {
          setSuccess('User created successfully');
          setShowModal(false);
          fetchUsers();
          setTimeout(() => setSuccess(''), 3000);
        }
      }
    } catch (error) {
      setError(error.response?.data?.message || 'Operation failed');
      setTimeout(() => setError(''), 5000);
    }
  };

  const currentUsers = activeTab === 'engineers' ? engineers : activeTab === 'sales' ? sales : management;

  return (
    <div className="settings">
      <div className="page-header">
        <h2>Settings - User Management</h2>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <div className="settings-tabs">
        <button
          className={`tab-button ${activeTab === 'engineers' ? 'active' : ''}`}
          onClick={() => setActiveTab('engineers')}
        >
          Engineers
        </button>
        <button
          className={`tab-button ${activeTab === 'sales' ? 'active' : ''}`}
          onClick={() => setActiveTab('sales')}
        >
          Sales Team
        </button>
        <button
          className={`tab-button ${activeTab === 'management' ? 'active' : ''}`}
          onClick={() => setActiveTab('management')}
        >
          Management
        </button>
      </div>

      <div className="settings-content">
        <div className="settings-header">
          <h3>
            {activeTab === 'engineers' ? 'Engineers' : 
             activeTab === 'sales' ? 'Sales Team' : 'Management'}
          </h3>
          <button
            className="btn btn-primary"
            onClick={() => handleAddNew(activeTab)}
          >
            Add New {activeTab === 'engineers' ? 'Engineer' : 
                     activeTab === 'sales' ? 'Sales Person' : 'Manager'}
          </button>
        </div>

        {loading ? (
          <div className="spinner"></div>
        ) : (
          <div className="users-table-container">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Username</th>
                  <th>Email</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {currentUsers.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', padding: '40px' }}>
                      No {activeTab === 'engineers' ? 'engineers' : 
                          activeTab === 'sales' ? 'sales team members' : 'managers'} found
                    </td>
                  </tr>
                ) : (
                  currentUsers.map((user) => (
                    <tr key={user.id}>
                      <td>{user.full_name}</td>
                      <td>{user.username}</td>
                      <td>{user.email}</td>
                      <td>
                        <span className={`badge ${user.is_active ? 'status-active' : 'status-inactive'}`}>
                          {user.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td>{new Date(user.created_at).toLocaleDateString()}</td>
                      <td>
                        <button
                          className="btn btn-primary btn-small"
                          onClick={() => handleEdit(user)}
                        >
                          Edit
                        </button>
                        <button
                          className={user.is_active ? "btn btn-warning btn-small" : "btn btn-success btn-small"}
                          onClick={() => handleToggleActive(user.id, user.username, user.is_active)}
                          style={{ marginLeft: '8px' }}
                        >
                          {user.is_active ? 'Deactivate' : 'Activate'}
                        </button>
                        <button
                          className="btn btn-danger btn-small"
                          onClick={() => handleDeleteClick(user)}
                          style={{ marginLeft: '8px' }}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>{editingUser ? 'Edit User' : 'Add New User'}</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Full Name *</label>
                <input
                  type="text"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Username *</label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  required
                  disabled={!!editingUser}
                />
                {editingUser && <small style={{ color: '#666' }}>Username cannot be changed</small>}
              </div>
              <div className="form-group">
                <label>Email *</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Password {!editingUser && '*'}</label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required={!editingUser}
                  placeholder={editingUser ? 'Leave blank to keep current password' : ''}
                />
                {editingUser && (
                  <small style={{ color: '#666' }}>
                    Leave blank to keep current password. Password changes require admin assistance.
                  </small>
                )}
              </div>
              <div className="form-group">
                <label>Role *</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  required
                >
                  <option value="engineer">Engineer</option>
                  <option value="sales">Sales</option>
                  <option value="management">Management</option>
                </select>
              </div>
              <div className="modal-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingUser ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showDeleteModal && userToDelete && (
        <div className="modal-overlay" onClick={() => setShowDeleteModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Confirm Delete</h3>
            <p>
              Are you sure you want to permanently delete <strong>{userToDelete.full_name}</strong> ({userToDelete.username})?
            </p>
            <p style={{ color: '#d32f2f', fontSize: '14px' }}>
              ⚠️ This action cannot be undone. All RFQ assignments will be removed.
            </p>
            <div className="modal-actions">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setShowDeleteModal(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-danger"
                onClick={handleConfirmDelete}
              >
                Delete Permanently
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;

