import { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../services/api';
import './Billing.css';

const tabs = ['BOE', 'D/O', 'INVOICE'];

function Billing() {
  const { isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState(tabs[0]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [awbNumber, setAwbNumber] = useState('');
  const [file, setFile] = useState(null);
  const [documentType, setDocumentType] = useState(tabs[0]);
  const [isUploading, setIsUploading] = useState(false);
  const [billingDocs, setBillingDocs] = useState([]);
  const [isLoadingDocs, setIsLoadingDocs] = useState(false);

  const activeType = useMemo(() => {
    if (activeTab === 'D/O') return 'DO';
    return activeTab;
  }, [activeTab]);

  const resetForm = () => {
    setAwbNumber('');
    setFile(null);
    setDocumentType(tabs[0]);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    resetForm();
  };

  const fetchBillingDocs = async () => {
    try {
      setIsLoadingDocs(true);
      const response = await api.getBillingUploads();
      setBillingDocs(response?.data || []);
    } catch (error) {
      toast.error(error?.message || 'Failed to load billing documents.');
    } finally {
      setIsLoadingDocs(false);
    }
  };

  useEffect(() => {
    fetchBillingDocs();
  }, []);

  const handleUpload = async (event) => {
    event.preventDefault();
    if (!awbNumber.trim() || !file) {
      toast.error('Please provide both AWB number and file.');
      return;
    }

    try {
      setIsUploading(true);
      const formData = new FormData();
      formData.append('awb_number', awbNumber.trim());
      formData.append('type', documentType);
      formData.append('file', file);
      await api.uploadBilling(formData);
      toast.success('Billing uploaded successfully.');
      handleCloseModal();
      fetchBillingDocs();
    } catch (error) {
      toast.error(error?.message || 'Failed to upload billing.');
    } finally {
      setIsUploading(false);
    }
  };

  const filteredDocs = useMemo(() => {
    return billingDocs.filter((doc) => doc.billing_type === activeType);
  }, [billingDocs, activeType]);

  return (
    <div className="billing-page">
      <div className="billing-container">
        <div className="billing-header">
          <div>
            <h1>Billing</h1>
            <p className="billing-subtitle">Documents and billing workflow.</p>
          </div>
          {isAdmin && (
            <button
              type="button"
              className="billing-add-button"
              onClick={() => setIsModalOpen(true)}
            >
              Add Billing
            </button>
          )}
        </div>
        <div className="billing-tabs" role="tablist" aria-label="Billing tabs">
          {tabs.map((tab) => (
            <button
              key={tab}
              type="button"
              className={`billing-tab ${activeTab === tab ? 'active' : ''}`}
              role="tab"
              aria-selected={activeTab === tab}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </button>
          ))}
        </div>
        <div className="billing-panel" role="tabpanel">
          <div className="billing-panel-header">
            <h2>{activeTab}</h2>
            <span className="billing-count">{filteredDocs.length} files</span>
          </div>
          {isLoadingDocs ? (
            <div className="billing-empty">Loading documents...</div>
          ) : filteredDocs.length === 0 ? (
            <div className="billing-empty">No documents found.</div>
          ) : (
            <div className="billing-table-container">
              <table className="billing-table">
                <thead>
                  <tr>
                    <th>AWB Number</th>
                    <th>File Name</th>
                    <th>File Type</th>
                    <th>Uploaded At</th>
                    <th>File</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDocs.map((doc) => (
                    <tr key={doc.id}>
                      <td className="billing-awb">{doc.awb_number}</td>
                      <td>{doc.file_name}</td>
                      <td>{doc.file_type}</td>
                      <td>{new Date(doc.created_at).toLocaleString()}</td>
                      <td>
                        <a
                          className="billing-file-link"
                          href={doc.file_url}
                          target="_blank"
                          rel="noreferrer"
                        >
                          View
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
      {isModalOpen && (
        <div className="billing-modal-overlay" onClick={handleCloseModal}>
          <div className="billing-modal-content" onClick={(event) => event.stopPropagation()}>
            <div className="billing-modal-header">
              <h2>Add Billing</h2>
              <button type="button" className="billing-modal-close" onClick={handleCloseModal}>
                &times;
              </button>
            </div>
            <form className="billing-modal-body" onSubmit={handleUpload}>
              <label className="billing-field">
                <span>AWB Number</span>
                <input
                  type="text"
                  value={awbNumber}
                  onChange={(event) => setAwbNumber(event.target.value)}
                  placeholder="Enter AWB number"
                  required
                />
              </label>
              <label className="billing-field">
                <span>Document Type</span>
                <select
                  value={documentType}
                  onChange={(event) => setDocumentType(event.target.value)}
                  required
                >
                  {tabs.map((tab) => (
                    <option key={tab} value={tab}>
                      {tab}
                    </option>
                  ))}
                </select>
              </label>
              <label className="billing-field">
                <span>Upload File</span>
                <input
                  type="file"
                  onChange={(event) => setFile(event.target.files?.[0] || null)}
                  required
                />
              </label>
              <div className="billing-modal-footer">
                <button
                  type="button"
                  className="billing-cancel-button"
                  onClick={handleCloseModal}
                  disabled={isUploading}
                >
                  Cancel
                </button>
                <button type="submit" className="billing-upload-button" disabled={isUploading}>
                  {isUploading ? 'Uploading...' : 'Upload'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Billing;
