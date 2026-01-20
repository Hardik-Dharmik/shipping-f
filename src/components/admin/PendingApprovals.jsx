import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { api } from '../../services/api';
import './PendingApprovals.css';

function PendingApprovals() {
  const [signups, setSignups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [layout, setLayout] = useState('grid'); // 'grid' or 'table'

  useEffect(() => {
    fetchPendingSignups();
  }, []);

  const fetchPendingSignups = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await api.getPendingSignups();
      if (response.success) {
        setSignups(response.signups || response.data || []);
      } else {
        setError('Failed to fetch pending signups');
      }
    } catch (err) {
      console.error('Error fetching pending signups:', err);
      setError(err.message || 'Failed to load pending signups');
      toast.error(err.message || 'Failed to load pending signups');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (userId, userName) => {
    try {
      const response = await api.approveUser(userId);
      if (response.success) {
        toast.success(`User ${userName} has been approved successfully`);
        // Refresh the list
        fetchPendingSignups();
      } else {
        toast.error(response.error || 'Failed to approve user');
      }
    } catch (error) {
      console.error('Error approving user:', error);
      toast.error(error.message || 'Failed to approve user');
    }
  };

  const handleReject = async (userId, userName) => {
    if (!window.confirm(`Are you sure you want to reject ${userName}? This action cannot be undone.`)) {
      return;
    }

    try {
      const response = await api.rejectUser(userId);
      if (response.success) {
        toast.success(`User ${userName} has been rejected`);
        // Refresh the list
        fetchPendingSignups();
      } else {
        toast.error(response.error || 'Failed to reject user');
      }
    } catch (error) {
      console.error('Error rejecting user:', error);
      toast.error(error.message || 'Failed to reject user');
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="pending-approvals">
      <div className="approvals-container">
        <div className="approvals-header">
          <div className="header-content">
            <div>
              <h1>Pending Approvals</h1>
              <p className="subtitle">Review and approve user signup requests</p>
            </div>
            <div className="layout-toggle">
              <button
                className={`layout-btn ${layout === 'grid' ? 'active' : ''}`}
                onClick={() => setLayout('grid')}
                title="Grid Layout"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="7" height="7" />
                  <rect x="14" y="3" width="7" height="7" />
                  <rect x="14" y="14" width="7" height="7" />
                  <rect x="3" y="14" width="7" height="7" />
                </svg>
              </button>
              <button
                className={`layout-btn ${layout === 'table' ? 'active' : ''}`}
                onClick={() => setLayout('table')}
                title="Table Layout"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v18m0 0h10a2 2 0 0 0 2-2V9M9 21H5a2 2 0 0 1-2-2V9m0 0h18" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading pending signups...</p>
          </div>
        ) : error ? (
          <div className="error-state">
            <p className="error-message">{error}</p>
            <button onClick={fetchPendingSignups} className="btn-retry">
              Retry
            </button>
          </div>
        ) : signups.length === 0 ? (
          <div className="empty-state">
            <p>No pending approvals at the moment.</p>
          </div>
        ) : (
          <>
            <div className="list-header">
              <span className="count-badge">{signups.length} Pending {signups.length === 1 ? 'Request' : 'Requests'}</span>
            </div>
            {layout === 'grid' ? (
              <div className="signups-grid">
                {signups.map((signup) => (
                  <div key={signup.id} className="signup-card">
                    <div className="card-header">
                      <div className="user-info">
                        <h3>{signup.name}</h3>
                        <p className="email">{signup.email}</p>
                      </div>
                      <span className="status-badge pending">{signup.approval_status}</span>
                    </div>
                    
                    <div className="card-body">
                      <div className="info-row">
                        <span className="label">Company Name:</span>
                        <span className="value">{signup.company_name}</span>
                      </div>
                      
                      <div className="info-row">
                        <span className="label">Submitted:</span>
                        <span className="value">{formatDate(signup.created_at)}</span>
                      </div>

                      {signup.file_url && (
                        <div className="file-section">
                          <span className="label">Document:</span>
                          <a 
                            href={signup.file_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="file-link"
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                              <polyline points="14 2 14 8 20 8" />
                              <line x1="16" y1="13" x2="8" y2="13" />
                              <line x1="16" y1="17" x2="8" y2="17" />
                              <polyline points="10 9 9 9 8 9" />
                            </svg>
                            {signup.file_name || 'View Document'}
                          </a>
                        </div>
                      )}
                    </div>

                    <div className="card-actions">
                      <button 
                        className="btn-action btn-approve"
                        onClick={() => handleApprove(signup.id, signup.name)}
                      >
                        Approve
                      </button>
                      <button 
                        className="btn-action btn-reject"
                        onClick={() => handleReject(signup.id, signup.name)}
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="signups-table-container">
                <table className="signups-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Company</th>
                      <th>Submitted</th>
                      <th>Document</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {signups.map((signup) => (
                      <tr key={signup.id}>
                        <td>
                          <div className="table-user-info">
                            <strong>{signup.name}</strong>
                          </div>
                        </td>
                        <td>{signup.email}</td>
                        <td>{signup.company_name}</td>
                        <td>{formatDate(signup.created_at)}</td>
                        <td>
                          {signup.file_url ? (
                            <a 
                              href={signup.file_url} 
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
                        <td>
                          <span className="status-badge pending">{signup.approval_status}</span>
                        </td>
                        <td>
                          <div className="table-actions">
                            <button 
                              className="btn-action btn-approve"
                              onClick={() => handleApprove(signup.id, signup.name)}
                            >
                              Approve
                            </button>
                            <button 
                              className="btn-action btn-reject"
                              onClick={() => handleReject(signup.id, signup.name)}
                            >
                              Reject
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default PendingApprovals;

