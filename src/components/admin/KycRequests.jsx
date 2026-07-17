import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { api } from '../../services/api';
import './KycRequests.css';

function formatDate(value) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleString();
}

function getRequests(response) {
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response?.requests)) return response.requests;
  if (Array.isArray(response?.kycRequests)) return response.kycRequests;
  return [];
}

function getStatusValue(request) {
  return request?.status || request?.kyc_status || 'pending';
}

export default function KycRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchRequests = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await api.getKycRequests();
      setRequests(getRequests(response));
    } catch (err) {
      setError(err?.message || 'Failed to load KYC requests.');
      toast.error(err?.message || 'Failed to load KYC requests.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const summary = useMemo(() => {
    const pending = requests.filter((request) => getStatusValue(request) === 'pending').length;
    const completed = requests.filter((request) => getStatusValue(request) === 'completed').length;

    return {
      total: requests.length,
      pending,
      completed,
    };
  }, [requests]);

  return (
    <section className="kyc-requests-page">
      <div className="kyc-requests-container">
        <header className="kyc-requests-header">
          <div>
            <h1>KYC Requests</h1>
            <p>Review submitted KYC documents and update their approval status.</p>
          </div>
          <button type="button" className="kyc-refresh-btn" onClick={fetchRequests}>
            Refresh
          </button>
        </header>

        <div className="kyc-requests-summary">
          <div className="kyc-summary-box">
            <span>Total</span>
            <strong>{summary.total}</strong>
          </div>
          <div className="kyc-summary-box">
            <span>Pending</span>
            <strong>{summary.pending}</strong>
          </div>
          <div className="kyc-summary-box">
            <span>Completed</span>
            <strong>{summary.completed}</strong>
          </div>
        </div>

        {loading ? (
          <div className="kyc-state-card">Loading KYC requests...</div>
        ) : error ? (
          <div className="kyc-state-card error">
            <p>{error}</p>
            <button type="button" className="kyc-refresh-btn" onClick={fetchRequests}>
              Retry
            </button>
          </div>
        ) : requests.length === 0 ? (
          <div className="kyc-state-card">No KYC requests submitted yet.</div>
        ) : (
          <div className="kyc-requests-table-wrap">
            <table className="kyc-requests-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Company</th>
                  <th>Status</th>
                  <th>Submitted</th>
                  <th>Documents</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((request) => {
                  const userId = request.user_id || request.userId || request.id;
                  const documentCount = [
                    request.credit_application_form_url,
                    request.trade_licence_url,
                    request.trn_licence_url,
                  ].filter(Boolean).length;

                  return (
                    <tr key={userId}>
                      <td>
                        <div className="kyc-user-cell">
                          <strong>{request.user_name || request.name || 'User'}</strong>
                          <span>{request.user_email || request.email || '-'}</span>
                        </div>
                      </td>
                      <td>{request.company_name || '-'}</td>
                      <td>
                        <span className={`kyc-table-status ${getStatusValue(request)}`}>
                          {getStatusValue(request)}
                        </span>
                      </td>
                      <td>{formatDate(request.created_at || request.submitted_at)}</td>
                      <td>{documentCount} uploaded</td>
                      <td>
                        <Link
                          to={`/admin/kyc/requests/${userId}`}
                          state={{ request }}
                          className="kyc-review-link"
                        >
                          Review
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}
