import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { api } from '../../services/api';
import { extractAddressFormPayload } from '../../utils/addressForms';
import './AddressFormsList.css';

const formatDateTime = (value) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const getStatusClass = (status) => {
  const normalized = String(status || '').toLowerCase();
  if (normalized === 'submitted') return 'status-submitted';
  if (normalized === 'expired') return 'status-expired';
  return 'status-pending';
};

function AddressFormsList() {
  const [forms, setForms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchForms();
  }, []);

  const fetchForms = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await api.getAddressForms();
      const rawList = Array.isArray(response?.data) ? response.data : [];
      setForms(rawList.map((item) => extractAddressFormPayload(item)));
    } catch (err) {
      setError('Failed to load address forms.');
      toast.error(err.message || 'Failed to load address forms.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="address-forms-page">
      <div className="address-forms-container">
        <div className="address-forms-header">
          <div>
            <h1>Address Forms</h1>
            <p>Submitted pickup and destination data from shared links.</p>
          </div>
          <Link to="/orders/create" className="address-forms-create-link">Create Link</Link>
        </div>

        {loading ? (
          <div className="address-forms-state">Loading forms...</div>
        ) : error ? (
          <div className="address-forms-state address-forms-error">
            <p>{error}</p>
            <button type="button" onClick={fetchForms}>Retry</button>
          </div>
        ) : forms.length === 0 ? (
          <div className="address-forms-state">No address forms found yet.</div>
        ) : (
          <div className="address-forms-table-wrap">
            <table className="address-forms-table">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Status</th>
                  <th>Pickup</th>
                  <th>Destination</th>
                  <th>Submitted At</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {forms.map((form) => (
                  <tr key={form.id || form.code}>
                    <td>{form.code || '-'}</td>
                    <td>
                      <span className={`address-form-status ${getStatusClass(form.status || (form.submitted ? 'submitted' : 'pending'))}`}>
                        {form.status || (form.submitted ? 'Submitted' : 'Pending')}
                      </span>
                    </td>
                    <td>{form.pickupAddress.completeAddress || form.pickupAddress.city || '-'}</td>
                    <td>{form.destinationAddress.completeAddress || form.destinationAddress.city || '-'}</td>
                    <td>{formatDateTime(form.submittedAt || form.createdAt)}</td>
                    <td>
                      {form.id ? (
                        <Link className="address-form-action" to={`/orders/create?addressFormId=${form.id}`}>
                          Use In Order
                        </Link>
                      ) : (
                        '-'
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default AddressFormsList;
