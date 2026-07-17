import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { api } from '../../services/api';
import './KycApproval.css';

const DOCUMENT_LINKS = [
  { key: 'credit_application_form_url', label: 'Credit Application Form' },
  { key: 'trade_licence_url', label: 'Trade Licence' },
  { key: 'trn_licence_url', label: 'TRN Number Document' },
];

function getRequests(response) {
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response?.requests)) return response.requests;
  if (Array.isArray(response?.kycRequests)) return response.kycRequests;
  return [];
}

function formatDate(value) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleString();
}

export default function KycApproval() {
  const { id } = useParams();
  const location = useLocation();
  const [request, setRequest] = useState(location.state?.request || null);
  const [loading, setLoading] = useState(!location.state?.request);
  const [saving, setSaving] = useState(false);

  const statusValue = useMemo(
    () => request?.status || request?.kyc_status || 'pending',
    [request]
  );

  useEffect(() => {
    if (request) return;
    fetchRequest();
  }, [id]);

  const fetchRequest = async () => {
    try {
      setLoading(true);
      const response = await api.getKycRequests();
      const requests = getRequests(response);
      const match = requests.find(
        (item) => String(item.user_id || item.userId || item.id) === String(id)
      );
      setRequest(match || null);
      if (!match) {
        toast.error('KYC request not found.');
      }
    } catch (error) {
      toast.error(error?.message || 'Failed to load KYC request.');
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (status) => {
    if (!request) return;

    try {
      setSaving(true);
      const userId = request.user_id || request.userId || request.id;
      await api.updateKycStatus(userId, status);
      setRequest((prev) => ({
        ...prev,
        status,
        kyc_status: status,
      }));
      toast.success(`KYC marked as ${status}.`);
    } catch (error) {
      toast.error(error?.message || 'Failed to update KYC status.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <section className="kyc-approval-page">
        <div className="kyc-approval-card">Loading KYC request...</div>
      </section>
    );
  }

  if (!request) {
    return (
      <section className="kyc-approval-page">
        <div className="kyc-approval-card">
          <p>KYC request not found.</p>
          <Link to="/admin/kyc/requests" className="kyc-back-link">
            Back to KYC requests
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="kyc-approval-page">
      <div className="kyc-approval-container">
        <div className="kyc-approval-topbar">
          <div>
            <Link to="/admin/kyc/requests" className="kyc-back-link">
              Back to KYC requests
            </Link>
            <h1>{request.user_name || request.name || 'User'}</h1>
            <p>{request.user_email || request.email || '-'}</p>
          </div>
          <span className={`kyc-approval-status ${statusValue}`}>
            {statusValue}
          </span>
        </div>

        <div className="kyc-approval-card">
          <div className="kyc-meta-grid">
            <div>
              <span className="kyc-meta-label">Company</span>
              <strong>{request.company_name || '-'}</strong>
            </div>
            <div>
              <span className="kyc-meta-label">Submitted</span>
              <strong>{formatDate(request.created_at || request.submitted_at)}</strong>
            </div>
          </div>
        </div>

        <div className="kyc-approval-card">
          <h2>Uploaded documents</h2>
          <div className="kyc-document-list">
            {DOCUMENT_LINKS.map((document) => {
              const href = request[document.key];

              return (
                <div key={document.key} className="kyc-document-row">
                  <span>{document.label}</span>
                  {href ? (
                    <a href={href} target="_blank" rel="noreferrer">
                      View PDF
                    </a>
                  ) : (
                    <span className="kyc-doc-empty">Not uploaded</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="kyc-approval-card">
          <h2>Update status</h2>
          <div className="kyc-status-actions">
            <button
              type="button"
              className="kyc-status-btn secondary"
              onClick={() => updateStatus('pending')}
              disabled={saving}
            >
              Mark Pending
            </button>
            <button
              type="button"
              className="kyc-status-btn primary"
              onClick={() => updateStatus('completed')}
              disabled={saving}
            >
              Mark Completed
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
