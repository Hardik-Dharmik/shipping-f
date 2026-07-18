import { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../services/api';
import { getOrganizationId } from '../../utils/userAccess.js';
import './Kyc.css';

const KYC_DOCUMENTS = [
  {
    id: 'creditApplicationForm',
    fieldName: 'credit_application_form',
    title: 'Credit Application Form',
    description: 'Download the sample, complete the form, and upload the signed document.',
    sampleHref: '/kyc-credit-application-sample.txt',
    sampleLabel: 'Download sample',
    required: true,
  },
  {
    id: 'tradeLicence',
    fieldName: 'trade_licence',
    title: 'Trade Licence',
    description: 'Upload a clear copy of your current trade licence.',
    required: true,
  },
  {
    id: 'trnDocument',
    fieldName: 'trn_licence',
    title: 'TRN Number Document',
    description: 'Upload the TRN supporting document if available.',
    required: false,
  },
];

function getKycRecord(response) {
  if (!response) return null;
  return response.data || response.kyc || response.request || response;
}

function getStatusLabel(record) {
  const value = record?.status || record?.kyc_status || 'not submitted';
  return String(value).replace(/_/g, ' ');
}

function getDocumentUrl(record, document) {
  return (
    record?.[`${document.fieldName}_url`] ||
    record?.documents?.[document.fieldName]?.url ||
    record?.documents?.[document.id]?.url ||
    null
  );
}

function Kyc() {
  const { user, requiresKyc } = useAuth();
  const organizationId = getOrganizationId(user);
  const [documents, setDocuments] = useState({
    creditApplicationForm: null,
    tradeLicence: null,
    trnDocument: null,
  });
  const [kycRecord, setKycRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const completedCount = useMemo(
    () => Object.values(documents).filter(Boolean).length,
    [documents]
  );

  const requiredDocuments = useMemo(
    () => KYC_DOCUMENTS.filter((document) => document.required),
    []
  );
  const currentStatus = getStatusLabel(kycRecord).toLowerCase();
  const isPending = currentStatus === 'pending';
  const isCompleted = currentStatus === 'completed';
  const isReadOnly = isPending || isCompleted;

  useEffect(() => {
    if (!requiresKyc) {
      setLoading(false);
      return;
    }

    fetchKyc();
  }, [requiresKyc]);

  const fetchKyc = async () => {
    try {
      setLoading(true);
      const response = await api.getMyKyc();
      setKycRecord(getKycRecord(response));
    } catch (error) {
      if (!String(error?.message || '').includes('404')) {
        toast.error(error?.message || 'Failed to load KYC status.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (key, event) => {
    const file = event.target.files?.[0] || null;

    if (file && !file.name.toLowerCase().endsWith('.pdf')) {
      event.target.value = '';
      toast.error('Only PDF files are allowed for KYC documents.');
      return;
    }

    setDocuments((prev) => ({
      ...prev,
      [key]: file,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const hasMissingRequiredDocument = requiredDocuments.some(
      (document) => !documents[document.id]
    );

    if (hasMissingRequiredDocument) {
      toast.error('Please upload all mandatory KYC documents.');
      return;
    }

    const formData = new FormData();
    KYC_DOCUMENTS.forEach((document) => {
      const file = documents[document.id];
      if (file) {
        formData.append(document.fieldName, file);
      }
    });

    try {
      setSubmitting(true);
      await api.submitKycRequest(formData);
      toast.success('KYC submitted successfully.');
      window.dispatchEvent(new Event('kyc-updated'));
      setDocuments({
        creditApplicationForm: null,
        tradeLicence: null,
        trnDocument: null,
      });
      await fetchKyc();
    } catch (error) {
      toast.error(error?.message || 'Failed to submit KYC.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="kyc-page">
      <div className="kyc-container">
        <header className="kyc-header">
          <div className="kyc-header-copy">
            <h1>KYC Documents</h1>
            <p>
              {requiresKyc
                ? 'Upload the required PDF documents for your credit facility request.'
                : 'Your account is linked as an employee under an existing organization.'}
            </p>
          </div>
        </header>

        {!requiresKyc ? (
          <section className="kyc-readonly-card kyc-exempt-card">
            <h2>KYC not required</h2>
            <p>
              Employee accounts do not need to submit KYC documents. Your access is handled
              through the organization{organizationId ? ` (${organizationId})` : ''}.
            </p>
          </section>
        ) : (
        <form className="kyc-form" onSubmit={handleSubmit}>
          <section className="kyc-status-card">
            <div>
              <h2>Current status</h2>
              <p>
                {loading
                  ? 'Loading your KYC details.'
                  : isPending
                    ? 'Your KYC request has been submitted and is currently under review.'
                    : isCompleted
                    ? 'Your KYC has been approved and is now completed.'
                    : kycRecord
                    ? 'Your latest KYC submission is shown below.'
                    : 'You have not submitted KYC yet.'}
              </p>
            </div>
            <span
              className={`kyc-status-badge ${getStatusLabel(kycRecord)
                .toLowerCase()
                .replace(/\s+/g, '-')}`}
            >
              {loading ? 'loading' : getStatusLabel(kycRecord)}
            </span>
          </section>

          {isReadOnly ? (
            <section className="kyc-readonly-card">
              <h2>{isCompleted ? 'KYC completed' : 'KYC request submitted'}</h2>
              <p>
                {isCompleted
                  ? 'Your KYC has already been approved. You cannot update the KYC form after completion.'
                  : 'Your documents have already been submitted. You cannot update the KYC form while the request is pending approval.'}
              </p>
            </section>
          ) : (
            <section className="kyc-note">
              <p>
                Mandatory: Credit Application Form and Trade Licence. Optional: TRN Number
                Document. Accepted format: PDF only.
              </p>
              <span className="kyc-count">
                {completedCount} of {KYC_DOCUMENTS.length} selected
              </span>
            </section>
          )}

          {!loading && kycRecord && (
            <section className="kyc-existing-docs">
              {KYC_DOCUMENTS.map((document) => {
                const url = getDocumentUrl(kycRecord, document);

                return (
                  <div key={document.id} className="kyc-existing-doc">
                    <span>{document.title}</span>
                    {url ? (
                      <a href={url} target="_blank" rel="noreferrer">
                        View PDF
                      </a>
                    ) : (
                      <span className="kyc-missing-doc">Not uploaded</span>
                    )}
                  </div>
                );
              })}
            </section>
          )}

          {!isReadOnly && (
            <>
              <div className="kyc-document-grid">
                {KYC_DOCUMENTS.map((document) => {
                  const selectedFile = documents[document.id];

                  return (
                    <article key={document.id} className="kyc-document-card">
                      <div className="kyc-document-copy">
                        <div className="kyc-document-heading">
                          <h2>{document.title}</h2>
                          <span
                            className={`kyc-document-badge ${document.required ? 'required' : 'optional'}`}
                          >
                            {document.required ? 'Mandatory' : 'Optional'}
                          </span>
                        </div>
                        <p>{document.description}</p>
                        {document.sampleHref && (
                          <a className="kyc-download-link" href={document.sampleHref} download>
                            {document.sampleLabel}
                          </a>
                        )}
                      </div>

                      <div className="kyc-upload-panel">
                        <label className="kyc-upload-label" htmlFor={document.id}>
                          Upload PDF
                        </label>
                        <input
                          id={document.id}
                          type="file"
                          className="kyc-file-input"
                          onChange={(event) => handleFileChange(document.id, event)}
                          accept=".pdf,application/pdf"
                          required={document.required}
                        />
                        <span className={`kyc-file-status ${selectedFile ? 'selected' : ''}`}>
                          {selectedFile ? selectedFile.name : 'No file selected'}
                        </span>
                      </div>
                    </article>
                  );
                })}
              </div>

              <div className="kyc-actions">
                <button type="submit" className="kyc-submit-button" disabled={submitting}>
                  {submitting ? 'Submitting...' : 'Submit KYC'}
                </button>
              </div>
            </>
          )}
        </form>
        )}
      </div>
    </section>
  );
}

export default Kyc;
