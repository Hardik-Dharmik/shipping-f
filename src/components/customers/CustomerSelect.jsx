import { useEffect, useState } from 'react';
import { Autocomplete, TextField } from '@mui/material';
import { api } from '../../services/api';
import { customerList } from '../../utils/customers';

export default function CustomerSelect({ value, onChange, disabled = false, label = 'Customer', required = false }) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    let active = true;
    const timer = setTimeout(async () => {
      setLoading(true);
      setError('');
      setOptions([]);
      try {
        const response = await api.getCustomerSuggestions(query.trim());
        if (active) setOptions(customerList(response));
      } catch (err) {
        if (active) setError(err.message || 'Unable to load customers');
      } finally {
        if (active) setLoading(false);
      }
    }, 250);
    return () => { active = false; clearTimeout(timer); };
  }, [query, open]);

  return <Autocomplete
    sx={{ minWidth: 220, width: '100%', my: 1 }} size="small"
    value={value || null} options={options} disabled={disabled}
    open={open} onOpen={() => setOpen(true)} onClose={() => setOpen(false)}
    loading={loading} filterOptions={(items) => items}
    getOptionLabel={(item) => [item.company_name || item.companyName, item.id].filter(Boolean).join(' — ')}
    isOptionEqualToValue={(a, b) => String(a.id) === String(b.id)}
    onInputChange={(_, text, reason) => { if (reason === 'input' || reason === 'clear') { setQuery(text); setOptions([]); } }}
    onChange={(_, customer) => { onChange(customer); setQuery(''); }}
    noOptionsText={error || 'No customers found'}
    renderInput={(params) => <TextField {...params} label={label} required={required} error={Boolean(error)} helperText={error || undefined} />}
  />;
}
