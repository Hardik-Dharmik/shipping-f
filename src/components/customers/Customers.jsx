import { useState } from 'react';
import { Button, TextField } from '@mui/material';
import { toast } from 'react-toastify';
import DataTable from '../common/DataTable';
import { api } from '../../services/api';
import { customerList } from '../../utils/customers';
import '../orders/order-list/Orders.css';

const initial = { companyName: '', email: '', phoneNumber: '' };
const columns = [{ key: 'id', label: 'Customer ID' }, { key: 'company', label: 'Company name' }, { key: 'email', label: 'Email' }, { key: 'phone', label: 'Phone number' }];
const fetchCustomers = ({ search, page, limit }) => api.getCustomers({ query: search, page, limit });
function normalizeResponse(response, query) {
  const data = response?.data ?? response;
  const rows = customerList(response);
  const pagination = data?.pagination ?? response?.pagination ?? data;
  const totalItems = Number(pagination?.totalItems ?? pagination?.total ?? response?.total ?? rows.length);
  return { rows, totalItems, page: Number(pagination?.page) || query.page, limit: Number(pagination?.limit) || query.limit, totalPages: Number(pagination?.totalPages) || Math.max(1, Math.ceil(totalItems / query.limit)) };
}

export default function Customers() {
  const [form, setForm] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  async function create(event) {
    event.preventDefault();
    if (saving) return;
    const body = Object.fromEntries(Object.entries(form).map(([key, value]) => [key, value.trim()]));
    if (Object.values(body).some((value) => !value)) { toast.error('Complete all customer fields.'); return; }
    setSaving(true);
    try {
      const response = await api.createCustomer(body);
      if (response?.success === false) throw new Error(response.message || 'Unable to create customer');
      const data = response?.data ?? response;
      const customer = data?.customer ?? data;
      toast.success(`Customer created${customer?.id ? ` — ID ${customer.id}` : ''}`);
      setForm(initial);
      setRefreshKey((key) => key + 1);
    } catch (error) { toast.error(error.message || 'Unable to create customer'); }
    finally { setSaving(false); }
  }
  return <div className="orders-page"><div className="orders-container">
    <div className="orders-header"><div><h1>Customers</h1><p className="subtitle">Create customers and use them on your orders. A unique six-digit ID is assigned automatically.</p></div></div>
    <form onSubmit={create} style={{ display: 'flex', flexWrap: 'wrap', gap: 16, marginBottom: 24, alignItems: 'center' }}>
      {[['companyName', 'Company name', 'text'], ['email', 'Email', 'email'], ['phoneNumber', 'Phone number', 'tel']].map(([key, label, type]) => <TextField key={key} label={label} type={type} required size="small" disabled={saving} value={form[key]} onChange={(event) => setForm((current) => ({ ...current, [key]: event.target.value }))} />)}
      <Button type="submit" variant="contained" disabled={saving}>{saving ? 'Creating…' : 'Create customer'}</Button>
    </form>
    <DataTable fetchData={fetchCustomers} normalizeResponse={normalizeResponse} columns={columns} getRowKey={(customer) => customer.id} initialQuery={{ search: '', page: 1, limit: 20 }} pageSizeOptions={[20, 50, 100]} refreshKey={refreshKey} searchPlaceholder="Search customers…" singularLabel="Customer" pluralLabel="Customers" emptyMessage="No customers found." errorMessage="Failed to load customers" renderRow={(customer) => <><td>{customer.id}</td><td>{customer.company_name}</td><td>{customer.email || '-'}</td><td>{customer.phone_number || '-'}</td></>} />
  </div></div>;
}
