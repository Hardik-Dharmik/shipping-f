import { useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import CustomerSelect from '../../customers/CustomerSelect';
import { api } from '../../../services/api';
import './CreateOrder.css';

const complianceOptions = [
  ['requireBOE', 'Require BOE (Bill of Entry)'], ['requireDO', 'Require D/O (Delivery Order)'],
  ['exportDeclaration', 'Export Declaration (select for UAE exports)'], ['dutyExemption', 'Duty Exemption'],
  ['temporaryExportForRepairAndReturn', 'Temporary Export For Repair And Return'], ['insurance', 'Add Shipment Insurance'],
];

export default function ManualOrder() {
  const navigate = useNavigate();
  const submitting = useRef(false);
  const [customer, setCustomer] = useState(null);
  const [documents, setDocuments] = useState([]);
  const nextId = useRef(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const submit = async event => {
    event.preventDefault();
    if (submitting.current) return;
    if (!customer) { setError('Select a customer.'); return; }
    const form = new FormData(event.currentTarget);
    form.set('customerId', String(customer.id));
    form.set('documentNames', JSON.stringify(documents.map(row => form.get(`documentName-${row}`))));
    for (const row of documents) form.delete(`documentName-${row}`);
    const compliance = Object.fromEntries(complianceOptions.map(([key]) => [key, form.get(key) === 'on']));
    for (const [key] of complianceOptions) form.delete(key);
    form.set('compliance', JSON.stringify(compliance));
    for (const value of form.values()) {
      if (value instanceof File && value.size > 10 * 1024 * 1024) { setError('Each file must be 10 MB or smaller.'); return; }
    }
    submitting.current = true;
    setLoading(true); setError('');
    try {
      await api.createManualOrder(form);
      toast.success('Order created successfully');
      navigate('/orders/list');
    } catch (err) { setError(err.message || 'Unable to create order'); }
    finally { submitting.current = false; setLoading(false); }
  };
  return <div className="create-order"><div className="create-order-container">
    <div className="create-order-header"><h1>Create Manual Order</h1><Link to="/orders/list">Back to Orders</Link></div>
    <form onSubmit={submit} className="create-order-form">
      <fieldset disabled={loading} style={{ border: 0, padding: 0, minWidth: 0 }}>
        <div className="form-group"><label htmlFor="manual-awb">AWB number *</label><input id="manual-awb" name="awbNumber" required maxLength={100} /></div>
        <div className="form-group"><label htmlFor="manual-awb-file">AWB file (PDF) *</label><input id="manual-awb-file" name="awbFile" type="file" accept=".pdf" required /></div>
        <CustomerSelect required value={customer} onChange={setCustomer} disabled={loading} />
        <div className="form-group"><label htmlFor="manual-agent">Agent name *</label><input id="manual-agent" name="agentName" required maxLength={200} /></div>
        <p>Files must be 10 MB or smaller. Screenshots: PNG, JPEG or WebP.</p>
        {['Pickup', 'Destination', 'Packaging'].map(section => <section key={section} className="form-section">
          <h3>{section}</h3><label htmlFor={`manual-${section}`}>Upload screenshot *</label>
          <input id={`manual-${section}`} type="file" name={`${section.toLowerCase()}Screenshot`} accept=".png,.jpg,.jpeg,.webp" required />
        </section>)}
        <section className="form-section"><h3>Other documents</h3><p>PDF, PNG, JPEG or WebP. Up to 10 documents.</p>
          {documents.map((id, index) => <div className="form-group" key={id}>
            <label htmlFor={`doc-name-${id}`}>Document {index + 1} name *</label><input id={`doc-name-${id}`} name={`documentName-${id}`} required maxLength={200} />
            <label htmlFor={`doc-file-${id}`}>Document {index + 1} file *</label><input id={`doc-file-${id}`} type="file" name="otherDocuments" accept=".pdf,.png,.jpg,.jpeg,.webp" required />
            <button type="button" onClick={() => setDocuments(rows => rows.filter(row => row !== id))}>Remove document {index + 1}</button>
          </div>)}
          <button type="button" disabled={documents.length >= 10} onClick={() => setDocuments(rows => [...rows, nextId.current++])}>Add document</button>
        </section>
        <section className="compliance-section"><h3>Compliance &amp; Declarations</h3>
          {complianceOptions.map(([key, label]) => <div className="checkbox-group compliance-option" key={key}><input type="checkbox" id={`manual-${key}`} name={key} /><label htmlFor={`manual-${key}`}>{label}</label></div>)}
        </section>
        {error && <p role="alert" className="error-message">{error}</p>}
        <div className="form-actions"><button type="submit" className="btn-submit">{loading ? 'Creating order...' : 'Create Order'}</button></div>
      </fieldset>
    </form>
  </div></div>;
}
