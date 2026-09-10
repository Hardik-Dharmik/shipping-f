import { useEffect, useState } from 'react';
import { Alert, Button, Checkbox, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, TextField, Table, TableBody, TableCell, TableHead, TableRow, TablePagination, MenuItem } from '@mui/material';
import { toast } from 'react-toastify';
import { api } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { employeePayload, passwordError } from '../../utils/employeeForm';
import './Employees.css';
const blank = () => ({ name:'', email:'', company_name:'', password:'', page_permissions:[] });
const profile = employee => ({ name:employee.name || '', email:employee.email || '', company_name:employee.company_name || '', page_permissions:employee.page_permissions || [], id:employee.id });
export default function Employees() {
 const {isAdmin} = useAuth();
 const [search, setSearch] = useState(''), [accessFilter, setAccessFilter] = useState('all');
 const [page, setPage] = useState(0), [rowsPerPage, setRowsPerPage] = useState(10);
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

 const startCreate = () => {setOriginal(null);setForm(blank());setFormError('');setOpen(true);};
 const withAccess = employees.filter(employee=>employee.page_permissions.length > 0).length;
 const filtered = employees.filter(employee => [employee.name,employee.email,employee.company_name].some(value=>value.toLowerCase().includes(search.toLowerCase().trim())) && (accessFilter === 'all' || (accessFilter === 'assigned' ? employee.page_permissions.length > 0 : employee.page_permissions.length === 0)));
 const currentPage = Math.min(page, Math.max(0,Math.ceil(filtered.length / rowsPerPage)-1));
 const initials = name => name.trim().split(/\s+/).slice(0,2).map(part=>part[0]).join('').toUpperCase() || 'E';
 return <section className="employees-page">
  {open ? <>
   <Button className="employee-back" disabled={busy} onClick={close}>&larr; Back to employees</Button>
   <header className="employees-heading"><div><span className="employee-eyebrow">TEAM MANAGEMENT</span><h1>{original ? 'Edit employee' : 'Add an employee'}</h1><p>{original ? 'Update profile details and choose the pages this employee can access.' : 'Set up a team member with the access they need.'}</p></div><span className="employee-role-badge">Employee account</span></header>
   <form onSubmit={save}>
    {formError && <Alert severity="error" className="employee-form-alert">{formError}</Alert>}
    <div className="employee-form-layout">
     <div className="employee-form-main">
      <section className="employee-card"><div className="employee-section-heading"><span className="employee-step">01</span><div><h2>Personal details</h2><p>The information used to identify and sign in to this account.</p></div></div>
       <div className="employee-fields">{['name','email','company_name','password'].map(key=><TextField key={key} fullWidth label={{name:'Full name',email:'Email address',company_name:'Company name (optional)',password:original ? 'New password (optional)' : 'Password'}[key]} placeholder={{name:'e.g. Alex Smith',email:'alex@company.com',company_name:'Company or organization'}[key]} type={key==='password' ? 'password' : key==='email' ? 'email' : 'text'} required={key==='name' || key==='email' || (key==='password' && !original)} autoComplete={key==='password' ? 'new-password' : 'off'} value={form[key]} disabled={busy} onChange={event=>setForm(previous=>({...previous,[key]:event.target.value}))} helperText={key==='password' ? (original ? 'Leave blank to keep the current password. ' : '') + 'Use 8+ characters, up to 72 UTF-8 bytes.' : undefined} />)}</div>
      </section>
      <section className="employee-card"><div className="employee-section-heading"><span className="employee-step">02</span><div><h2>Page permissions</h2><p>Choose which pages this employee can open.</p></div></div>
       <div className="employee-permission-toolbar"><span><strong>{form.page_permissions.length}</strong> of {pages.length} pages selected</span><div><Button size="small" disabled={busy} onClick={()=>setForm(previous=>({...previous,page_permissions:pages.map(item=>item.key)}))}>Select all</Button><Button size="small" disabled={busy} onClick={()=>setForm(previous=>({...previous,page_permissions:[]}))}>Clear all</Button></div></div>
       <div className="employee-permission-grid">{pages.map(item=><label key={item.key} className={'employee-permission ' + (form.page_permissions.includes(item.key) ? 'is-selected' : '')}><Checkbox disabled={busy} checked={form.page_permissions.includes(item.key)} onChange={event=>setForm(previous=>({...previous,page_permissions:event.target.checked ? [...previous.page_permissions,item.key] : previous.page_permissions.filter(key=>key!==item.key)}))} /><span>{item.label}</span></label>)}</div>
      </section>
     </div>
     <aside className="employee-card employee-summary"><span className="employee-eyebrow">ACCOUNT PREVIEW</span><div className="employee-avatar employee-avatar-large">{initials(form.name)}</div><h2>{form.name.trim() || 'New employee'}</h2><p className="employee-preview-email">{form.email.trim() || 'Email address not added'}</p><span className="employee-role-badge">Employee</span><hr/><h3>Access overview</h3><p>{form.page_permissions.length ? form.page_permissions.length + ' pages available after sign-in.' : 'No page access assigned yet.'}</p><div className="employee-access-tags">{pages.filter(item=>form.page_permissions.includes(item.key)).map(item=><span key={item.key}>{item.label}</span>)}</div><div className="employee-summary-note">{form.page_permissions.length === 0 && <p>This employee will see an &ldquo;Access not assigned&rdquo; screen until you select a page.</p>}<p>Employee management is reserved for administrators.</p></div></aside>
    </div>
    <footer className="employee-form-footer"><span>You can update page access at any time.</span><div><Button disabled={busy} onClick={close}>Cancel</Button><Button type="submit" variant="contained" disableElevation disabled={busy}>{busy ? 'Saving...' : original ? 'Save changes' : 'Create employee'}</Button></div></footer>
   </form>
  </> : <>
   <header className="employees-heading"><div><span className="employee-eyebrow">TEAM MANAGEMENT</span><h1>Employees</h1><p>Manage your team and keep page access in the right hands.</p></div><Button variant="contained" disableElevation disabled={loading || !!error || busy} onClick={startCreate}><span className="employee-plus">+</span> Add employee</Button></header>
   <div className="employee-stats">{[['Total employees',employees.length,'Your team at a glance'],['Access assigned',withAccess,'Ready to use assigned pages'],['Awaiting access',employees.length-withAccess,'No pages assigned yet']].map(([label,count,description])=><div className="employee-stat" key={label}><span>{label}</span><strong>{loading || error ? '-' : count}</strong><small>{description}</small></div>)}</div>
   <section className="employee-directory"><div className="employee-directory-heading"><div><h2>Team directory <span>{employees.length}</span></h2><p>View employee details and manage permissions.</p></div><Button disabled={loading || busy} onClick={load}>Refresh</Button></div>
    <div className="employee-toolbar"><TextField size="small" label="Search employees" placeholder="Name, email or company" value={search} onChange={event=>{setSearch(event.target.value);setPage(0);}}/><TextField size="small" select label="Page access" value={accessFilter} onChange={event=>{setAccessFilter(event.target.value);setPage(0);}}><MenuItem value="all">All employees</MenuItem><MenuItem value="assigned">Access assigned</MenuItem><MenuItem value="unassigned">Awaiting access</MenuItem></TextField></div>
    {loading ? <div className="employee-empty" role="status"><CircularProgress size={30}/><p>Loading your team...</p></div> : error ? <Alert severity="error" action={<Button onClick={load}>Retry</Button>}>{error}</Alert> : !filtered.length ? <div className="employee-empty"><div className="employee-empty-symbol">{employees.length ? '\u2315' : '+'}</div><h3>{employees.length ? 'No matching employees' : 'Your team starts here'}</h3><p>{employees.length ? 'Try a different search or page-access filter.' : 'Add your first employee and choose the pages they can access.'}</p><Button variant="outlined" onClick={employees.length ? ()=>{setSearch('');setAccessFilter('all');setPage(0);} : startCreate}>{employees.length ? 'Clear filters' : 'Add employee'}</Button></div> : <>
     <div className="employee-table-scroll"><Table aria-label="Employees"><TableHead><TableRow>{['Employee','Company','Page access','Actions'].map(label=><TableCell key={label}>{label}</TableCell>)}</TableRow></TableHead><TableBody>{filtered.slice(currentPage*rowsPerPage,(currentPage+1)*rowsPerPage).map(employee=><TableRow key={employee.id}><TableCell><div className="employee-identity"><span className="employee-avatar">{initials(employee.name)}</span><div><strong>{employee.name}</strong><span>{employee.email}</span></div></div></TableCell><TableCell>{employee.company_name || <span className="employee-muted">Not provided</span>}</TableCell><TableCell><div className="employee-access-tags">{pages.filter(item=>employee.page_permissions.includes(item.key)).slice(0,2).map(item=><span key={item.key}>{item.label}</span>)}{employee.page_permissions.length > 2 && <span title={pages.filter(item=>employee.page_permissions.includes(item.key)).map(item=>item.label).join(', ')}>+{employee.page_permissions.length-2} more</span>}{!employee.page_permissions.length && <span className="employee-no-access">Awaiting access</span>}</div></TableCell><TableCell><div className="employee-row-actions"><Button size="small" disabled={busy} onClick={()=>edit(employee)} aria-label={'View or edit ' + employee.name}>View / Edit</Button><Button size="small" color="error" disabled={busy} onClick={()=>{setFormError('');setDeleting(employee);}} aria-label={'Delete ' + employee.name}>Delete</Button></div></TableCell></TableRow>)}</TableBody></Table></div>
     <TablePagination component="div" count={filtered.length} page={currentPage} rowsPerPage={rowsPerPage} onPageChange={(_,next)=>setPage(next)} onRowsPerPageChange={event=>{setRowsPerPage(Number(event.target.value));setPage(0);}} rowsPerPageOptions={[10,25,50]}/>
    </>}
   </section>
  </>}
  <Dialog open={!!deleting} onClose={()=>{if(!busy)setDeleting(null);}} aria-labelledby="delete-employee-title"><DialogTitle id="delete-employee-title">Delete employee?</DialogTitle><DialogContent>{formError && <Alert severity="error">{formError}</Alert>}Delete {deleting?.name}? This cannot be undone.</DialogContent><DialogActions><Button disabled={busy} onClick={()=>setDeleting(null)}>Cancel</Button><Button color="error" disabled={busy} onClick={remove}>{busy ? 'Deleting...' : 'Delete'}</Button></DialogActions></Dialog>
 </section>;
}
