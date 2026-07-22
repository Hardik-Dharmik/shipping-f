import { useCallback, useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../../services/api';
import { normalizeContactDetails, toContactDetailPayload } from '../../utils/contactDetails';
import './ContactDetailsList.css';

const EMPTY_CONTACT = {
  companyName: '', country: '', pincode: '', mobileNo: '', fullName: '',
  completeAddress: '', landmark: '', city: '', state: '', alternateNo: '', email: '',
};

const fields = [
  ['companyName', 'Company name'], ['fullName', 'Contact name'], ['mobileNo', 'Mobile number'],
  ['alternateNo', 'Alternate number'], ['email', 'Email address'], ['completeAddress', 'Address'],
  ['landmark', 'Landmark'], ['city', 'City'], ['state', 'State'], ['pincode', 'Pincode'], ['country', 'Country'],
];

function ContactDetailsList() {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [contactType, setContactType] = useState('');
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [editingContact, setEditingContact] = useState(null);
  const [form, setForm] = useState(EMPTY_CONTACT);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState('');

  useEffect(() => {
    const timeout = window.setTimeout(() => setDebouncedQuery(query.trim()), 350);
    return () => window.clearTimeout(timeout);
  }, [query]);

  const loadContacts = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const response = await api.getContactDetails({ contactType, query: debouncedQuery });
      if (response?.success === false) throw new Error(response.message || 'Failed to load contacts');
      setContacts(normalizeContactDetails(response));
    } catch (err) {
      setContacts([]);
      setError(err.message || 'Failed to load contacts');
    } finally {
      setLoading(false);
    }
  }, [contactType, debouncedQuery]);

  useEffect(() => { loadContacts(); }, [loadContacts]);

  const openEdit = (contact) => {
    setEditingContact(contact);
    setForm({ ...EMPTY_CONTACT, ...contact });
  };

  const closeEdit = () => {
    if (!saving) {
      setEditingContact(null);
      setForm(EMPTY_CONTACT);
    }
  };

  const handleSave = async (event) => {
    event.preventDefault();
    if (!editingContact?.id) return;
    try {
      setSaving(true);
      await api.updateContactDetail(editingContact.id, toContactDetailPayload(form, editingContact.contactType || 'pickup'));
      toast.success('Contact updated successfully');
      setEditingContact(null);
      setForm(EMPTY_CONTACT);
      loadContacts();
    } catch (err) {
      toast.error(err.message || 'Failed to update contact');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (contact) => {
    if (!contact.id || !window.confirm(`Delete ${contact.companyName || contact.fullName || 'this contact'}?`)) return;
    try {
      setDeletingId(contact.id);
      await api.deleteContactDetail(contact.id);
      setContacts((current) => current.filter((item) => item.id !== contact.id));
      toast.success('Contact deleted successfully');
    } catch (err) {
      toast.error(err.message || 'Failed to delete contact');
    } finally {
      setDeletingId('');
    }
  };

  return (
    <div className="contact-details-page">
      <div className="contact-details-container">
        <div className="contact-details-header">
          <div><h1>Saved Contacts</h1><p>Manage the pickup and delivery contacts used for your orders.</p></div>
        </div>
        <div className="contact-details-toolbar">
          <label><span>Search</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search company, name, phone..." /></label>
          
        </div>
        {loading ? <div className="contact-details-state">Loading contacts...</div> : error ? <div className="contact-details-state contact-details-error"><p>{error}</p><button type="button" onClick={loadContacts}>Retry</button></div> : contacts.length === 0 ? <div className="contact-details-state">No saved contacts found.</div> : (
          <div className="contact-details-table-wrap">
            <table className="contact-details-table">
              <thead>
                <tr>
                  <th>Company / Contact</th>
                  <th>Contact details</th>
                  <th>Address</th>
                  <th aria-label="Actions" />
                </tr>
              </thead><tbody>{contacts.map((contact) => <tr key={contact.id}><td><strong>{contact.companyName || '—'}</strong><span>{contact.fullName || '—'}</span></td><td><span>{contact.mobileNo || '—'}</span><span>{contact.email || '—'}</span></td><td>{[contact.completeAddress, contact.city, contact.state, contact.pincode, contact.country].filter(Boolean).join(', ') || '—'}</td><td className="contact-details-actions"><button type="button" onClick={() => openEdit(contact)}>Edit</button><button type="button" className="delete" disabled={deletingId === contact.id} onClick={() => handleDelete(contact)}>{deletingId === contact.id ? 'Deleting...' : 'Delete'}</button></td></tr>)}</tbody></table></div>
        )}
      </div>
      {editingContact && <div className="app-modal-overlay" role="presentation"><form className="app-modal contact-edit-modal" onSubmit={handleSave}><div className="app-modal-header"><h2 className="app-modal-title">Edit Contact</h2><button type="button" className="app-modal-close" onClick={closeEdit} aria-label="Close">×</button></div><div className="app-modal-body"><div className="contact-edit-type">{editingContact.contactType || 'Contact'}</div><div className="contact-edit-fields">{fields.map(([name, label]) => <label key={name} className={name === 'completeAddress' ? 'wide' : ''}><span>{label}</span>{name === 'completeAddress' ? <textarea value={form[name]} onChange={(event) => setForm((current) => ({ ...current, [name]: event.target.value }))} rows="3" /> : <input value={form[name]} onChange={(event) => setForm((current) => ({ ...current, [name]: event.target.value }))} />}</label>)}</div></div><div className="app-modal-footer"><button type="button" className="app-modal-secondary-btn" onClick={closeEdit} disabled={saving}>Cancel</button><button type="submit" className="app-modal-primary-btn" disabled={saving}>{saving ? 'Saving...' : 'Save changes'}</button></div></form></div>}
    </div>
  );
}

export default ContactDetailsList;
