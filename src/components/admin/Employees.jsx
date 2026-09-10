import { useEffect, useState } from 'react';
import { Alert, Button, Checkbox, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, FormControlLabel, FormGroup, Stack, TextField, Table, TableBody, TableCell, TableHead, TableRow } from '@mui/material';
import { toast } from 'react-toastify';
import { api } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { employeePayload, passwordError } from '../../utils/employeeForm';
import './Users.css';
const blank = () => ({ name:'', email:'', company_name:'', password:'', page_permissions:[] });
const profile = employee => ({ name:employee.name || '', email:employee.email || '', company_name:employee.company_name || '', page_permissions:employee.page_permissions || [], id:employee.id });
export default function Employees() {
 const {isAdmin} = useAuth();
 const [employees,setEmployees] = useState([]), [pages,setPages] = useState([]);
 const [loading,setLoading] = useState(true), [error,setError] = useState('');
 const [open,setOpen] = useState(false), [original,setOriginal] = useState(null), [form,setForm] = useState(blank);
 const [busy,setBusy] = useState(false), [formError,setFormError] = useState(''), [deleting,setDeleting] = useState(null);
 const load = async () => {
  setLoading(true); setError('');
  try {
   const [catalog,list] = await Promise.all([api.getEmployeePages(),api.getEmployees()]);
   if (!Array.isArray(catalog.pages) || !catalog.pages.length || !Array.isArray(list.employees)) throw new Error('Invalid employee response.');
   setPages(catalog.pages); setEmployees(list.employees.map(profile));
  } catch (err) { setError(err.message); } finally { setLoading(false); }
 };
 useEffect(() => { if (isAdmin) load(); }, [isAdmin]);
 if (!isAdmin) return null;
 const close = () => { if (busy) return; setOpen(false); setForm(blank()); setOriginal(null); setFormError(''); };
 const edit = async employee => {
  setBusy(true); setFormError('');
  try {
   const response = await api.getEmployee(employee.id);
   const item = profile(response.employee);
   setOriginal(item); setForm({...item,password:''}); setOpen(true);
  } catch (err) { toast.error(err.message); } finally { setBusy(false); }
 };
 const save = async event => {
  event.preventDefault();
  if (!form.name.trim() || !form.email.trim()) { setFormError('Name and email are required.'); return; }
  const validation = (!original || form.password) ? passwordError(form.password) : '';
  if (validation) { setFormError(validation); return; }
  const body = employeePayload(form,original);
  if (!Object.keys(body).length) { close(); return; }
  setBusy(true); setFormError(''); setForm(previous=>({...previous,password:''}));
  try {
   const response = original ? await api.updateEmployee(original.id,body) : await api.createEmployee(body);
   const item = profile(response.employee);
   setEmployees(previous=> original ? previous.map(row=>row.id===original.id ? item : row) : [item,...previous]);
   setOpen(false); setForm(blank()); setOriginal(null); toast.success(original ? 'Employee updated' : 'Employee created');
  } catch (err) { setFormError(err.message); } finally { delete body.password; setBusy(false); }
 };
 const remove = async () => {
  setBusy(true); setFormError('');
  try {
   await api.deleteEmployee(deleting.id);
   setEmployees(previous=>previous.filter(row=>row.id!==deleting.id)); setDeleting(null); toast.success('Employee deleted');
  } catch (err) { setFormError(err.status === 409 ? 'This employee has linked records and cannot be deleted. ' + err.message : err.message); }
  finally { setBusy(false); }
 };
 return <div className="users-page"><div className="users-container">
  <div className="users-header"><div><h1>Employees</h1><p className="subtitle">Manage employee profiles and page access</p></div><Button variant="contained" disabled={loading || !!error || busy} onClick={()=>{setOriginal(null);setForm(blank());setFormError('');setOpen(true);}}>Add employee</Button></div>
  {loading ? <CircularProgress aria-label="Loading employees" /> : error ? <Alert severity="error" action={<Button onClick={load}>Retry</Button>}>{error}</Alert> : !employees.length ? <Alert severity="info">No employees yet. Add an employee to get started.</Alert> : <Table aria-label="Employees"><TableHead><TableRow>{['Name','Email','Company','Page access','Actions'].map(label=><TableCell key={label}>{label}</TableCell>)}</TableRow></TableHead><TableBody>{employees.map(employee=><TableRow key={employee.id}><TableCell>{employee.name}</TableCell><TableCell>{employee.email}</TableCell><TableCell>{employee.company_name || '?'}</TableCell><TableCell>{pages.filter(page=>employee.page_permissions.includes(page.key)).map(page=>page.label).join(', ') || 'No access assigned'}</TableCell><TableCell><Button disabled={busy} onClick={()=>edit(employee)}>View / Edit</Button><Button color="error" disabled={busy} onClick={()=>{setFormError('');setDeleting(employee);}}>Delete</Button></TableCell></TableRow>)}</TableBody></Table>}
  <Dialog open={open} onClose={close} fullWidth maxWidth="sm"><form onSubmit={save}><DialogTitle>{original ? 'Edit employee' : 'Add employee'}</DialogTitle><DialogContent><Stack spacing={2} sx={{pt:1}}>
   {formError && <Alert severity="error">{formError}</Alert>}
   {['name','email','company_name','password'].map(key=><TextField key={key} label={{name:'Name',email:'Email',company_name:'Company name (optional)',password:original ? 'New password (optional)' : 'Password'}[key]} type={key==='password' ? 'password' : key==='email' ? 'email' : 'text'} required={key==='name' || key==='email' || (key==='password' && !original)} autoComplete={key==='password' ? 'new-password' : 'off'} value={form[key]} disabled={busy} onChange={event=>setForm(previous=>({...previous,[key]:event.target.value}))} helperText={key==='password' ? 'At least 8 characters; at most 72 UTF-8 bytes. Leave blank when editing to keep the current password.' : undefined} />)}
   <fieldset disabled={busy}><legend>Page permissions</legend><Button onClick={()=>setForm(previous=>({...previous,page_permissions:pages.map(page=>page.key)}))}>Select all</Button><Button onClick={()=>setForm(previous=>({...previous,page_permissions:[]}))}>Clear all</Button><FormGroup>{pages.map(page=><FormControlLabel key={page.key} label={page.label} control={<Checkbox checked={form.page_permissions.includes(page.key)} onChange={event=>setForm(previous=>({...previous,page_permissions:event.target.checked ? [...previous.page_permissions,page.key] : previous.page_permissions.filter(key=>key!==page.key)}))} />} />)}</FormGroup></fieldset>
  </Stack></DialogContent><DialogActions><Button disabled={busy} onClick={close}>Cancel</Button><Button type="submit" variant="contained" disabled={busy}>{busy ? 'Saving...' : 'Save employee'}</Button></DialogActions></form></Dialog>
  <Dialog open={!!deleting} onClose={()=>{if(!busy)setDeleting(null);}}><DialogTitle>Delete employee?</DialogTitle><DialogContent>{formError && <Alert severity="error">{formError}</Alert>}Delete {deleting?.name}? This cannot be undone.</DialogContent><DialogActions><Button disabled={busy} onClick={()=>setDeleting(null)}>Cancel</Button><Button color="error" disabled={busy} onClick={remove}>{busy ? 'Deleting...' : 'Delete'}</Button></DialogActions></Dialog>
 </div></div>;
}
