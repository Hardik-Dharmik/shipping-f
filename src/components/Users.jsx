import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { useSidebar } from '../contexts/SidebarContext';
import { api } from '../services/api';
import './Users.css';

function Users() {
  const { isCollapsed } = useSidebar();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await api.getUsers();
      if (response.success) {
        setUsers(response.users || response.data || []);
      } else {
        setError('Failed to fetch users');
      }
    } catch (err) {
      console.error('Error fetching users:', err);
      setError(err.message || 'Failed to load users');
      toast.error(err.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusBadgeClass = (status) => {
    switch (status?.toLowerCase()) {
      case 'approved':
        return 'status-approved';
      case 'pending':
        return 'status-pending';
      case 'rejected':
        return 'status-rejected';
      default:
        return 'status-pending';
    }
  };

  const getRoleBadgeClass = (role) => {
    switch (role?.toLowerCase()) {
      case 'admin':
        return 'role-admin';
      case 'user':
        return 'role-user';
      default:
        return 'role-user';
    }
  };

  return (
    <div className={`users-page ${isCollapsed ? 'sidebar-collapsed' : ''}`}>
      <div className="users-container">
        <div className="users-header">
          <div>
            <h1>All Users</h1>
            <p className="subtitle">View and manage all registered users</p>
          </div>
        </div>

        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading users...</p>
          </div>
        ) : error ? (
          <div className="error-state">
            <p className="error-message">{error}</p>
            <button onClick={fetchUsers} className="btn-retry">
              Retry
            </button>
          </div>
        ) : users.length === 0 ? (
          <div className="empty-state">
            <p>No users found.</p>
          </div>
        ) : (
          <>
            <div className="list-header">
              <span className="count-badge">{users.length} {users.length === 1 ? 'User' : 'Users'}</span>
            </div>
            <div className="users-table-container">
              <table className="users-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Company</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Registered</th>
                    <th>Document</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id}>
                      <td>
                        <div className="table-user-info">
                          <strong>{user.name}</strong>
                        </div>
                      </td>
                      <td>{user.email}</td>
                      <td>{user.company_name || '-'}</td>
                      <td>
                        <span className={`role-badge ${getRoleBadgeClass(user.role)}`}>
                          {user.role || 'user'}
                        </span>
                      </td>
                      <td>
                        <span className={`status-badge ${getStatusBadgeClass(user.approval_status)}`}>
                          {user.approval_status || 'pending'}
                        </span>
                      </td>
                      <td>{formatDate(user.created_at)}</td>
                      <td>
                        {user.file_url ? (
                          <a 
                            href={user.file_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="file-link"
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                              <polyline points="14 2 14 8 20 8" />
                            </svg>
                            View
                          </a>
                        ) : (
                          <span className="no-file">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default Users;

