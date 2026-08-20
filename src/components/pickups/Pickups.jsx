import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../../services/api';
import { pickupActions, carrierKey, isPickupAvailable } from '../../utils/pickupActions';
import './Pickups.css';

const emptyForm = { carrier: 'FedEx', awbNumber: '', pickupAddress: '', country: '', countryCode: '', postalCode: '', pickupAddressMode: 'shipment', alternatePickupAddress: '', pickupDate: '', readyTime: '', closingTime: '', packageCount: '1', totalWeight: '', packageLocation: '', remarks: '' };
const PICKUP_CARRIERS = ['FedEx', 'UPS', 'DHL'];
const PICKUP_UNAVAILABLE_MESSAGE = 'Pickup scheduling is not available for this carrier yet.';
const getItems = (response) => response?.data?.pickups || response?.data?.items || response?.pickups || response?.items || response?.data || [];
const pickupId = (pickup) => pickup._id || pickup.id || pickup.pickupId;
const display = (pickup, ...keys) => keys.map((key) => pickup?.[key]).find(Boolean) || '—';
const requestValue = (pickup, path) => path.reduce((value, key) => value?.[key], pickup?.request_data);
const countrySuggestionsFrom = (response) => {
  const data = response?.data ?? response;
  const items = data?.suggestions ?? data?.results ?? data?.items ?? data;
  return Array.isArray(items) ? items.map((item) => {
    if (typeof item === 'string') return { label: item, code: /^[A-Za-z]{2}$/.test(item) ? item.toUpperCase() : '' };
    return {
      label: item.name || item.country || item.countryName || item.label || '',
      code: String(item.countryCode || item.country_code || item.code || item.isoCode || item.iso2 || item.alpha2Code || '').toUpperCase(),
    };
  }).filter((item) => item.label).slice(0, 10) : [];
};

function PickupFields({ form, onChange, includeAwb = true, hideOrderFields = false, disabled = false, countrySuggestions = [], countryOpen = false, onCountryFocus, onCountryBlur, onCountrySelect }) {
  const input = (key, label, type = 'text', required = true) => <label className="pickup-field">{label}<input type={type} required={required} disabled={disabled} value={form[key]} onChange={(e) => onChange(key, e.target.value)} /></label>;
  return <div className="pickup-grid">
    {includeAwb && input('awbNumber', 'AWB Number')}
    {!hideOrderFields && input('pickupAddress', 'Pickup Address')}
    {!hideOrderFields && <label className="pickup-field pickup-country-field">Country<input type="text" required disabled={disabled} value={form.country} onFocus={onCountryFocus} onBlur={onCountryBlur} onChange={(e) => onChange('country', e.target.value)} />
      {countryOpen && !disabled && <div className="pickup-country-suggestions">{countrySuggestions.length ? countrySuggestions.map((country) => <button type="button" key={`${country.label}-${country.code}`} onMouseDown={(event) => event.preventDefault()} onClick={() => onCountrySelect(country)}>{country.label}{country.code ? ` (${country.code})` : ''}</button>) : <span>{form.country.length >= 2 ? 'No countries found.' : 'Enter at least 2 characters.'}</span>}</div>}
    </label>}
    {!hideOrderFields && input('postalCode', 'Postal Code')}
    {input('pickupDate', 'Pickup Date', 'date')}
    {input('readyTime', 'Ready Time', 'time')}
    {input('closingTime', 'Closing Time', 'time')}
    {input('packageCount', 'Package Count', 'number')}
    {input('totalWeight', 'Total Weight', 'number')}
    {input('packageLocation', 'Package Location')}
    <label className="pickup-field pickup-field-wide">Remarks<textarea disabled={disabled} value={form.remarks} onChange={(e) => onChange('remarks', e.target.value)} /></label>
  </div>;
}

export function SchedulePickup() {
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [countrySuggestions, setCountrySuggestions] = useState([]);
  const [countryOpen, setCountryOpen] = useState(false);
  const [orderDetails, setOrderDetails] = useState(null);
  const [loadingOrderDetails, setLoadingOrderDetails] = useState(false);
  const [loadedAwb, setLoadedAwb] = useState('');
  const supported = isPickupAvailable(form.carrier);
  const setField = (key, value) => setForm((current) => ({
    ...current,
    [key]: value,
    ...(key === 'country' ? { countryCode: /^[A-Za-z]{2}$/.test(value) ? value.toUpperCase() : '' } : {}),
  }));
  useEffect(() => {
    if (!countryOpen || form.country.trim().length < 2) { setCountrySuggestions([]); return undefined; }
    const timeoutId = setTimeout(async () => {
      try { setCountrySuggestions(countrySuggestionsFrom(await api.getCountrySuggestions(form.country.trim(), 10))); }
      catch { setCountrySuggestions([]); }
    }, 250);
    return () => clearTimeout(timeoutId);
  }, [form.country, countryOpen]);
  const loadOrderDetails = async () => {
    const awbNumber = form.awbNumber.trim();
    if (!awbNumber || !isPickupAvailable(form.carrier)) return;
    setLoadingOrderDetails(true);
    try {
      const response = await api.getPickupOrderDetails(awbNumber);
      const details = response?.data || response;
      const pickupAddress = details.pickupAddress || details.pickup_address || details.order?.pickupAddress || details.order?.pickup_address || {};
      const contact = pickupAddress.contact || details.pickupContact || details.pickup_contact || {};
      const address = pickupAddress.address || pickupAddress;
      const carrier = details.carrier?.name || details.carrier || details.order?.carrier?.name || form.carrier;
      setOrderDetails({ address, contact, carrier });
      setLoadedAwb(awbNumber);
      setForm((current) => ({ ...current, carrier, pickupAddress: address.completeAddress || address.complete_address || address.address || address.streetLines?.join(', ') || '', country: address.country || address.countryName || address.countryCode || '', countryCode: address.countryCode || address.country_code || '', postalCode: address.postalCode || address.pincode || address.postal_code || '' }));
    } catch (error) {
      setOrderDetails(null); setLoadedAwb('');
      toast.error(error.message || 'Unable to load pickup details for this AWB.');
    } finally { setLoadingOrderDetails(false); }
  };
  const submit = async (event) => {
    event.preventDefault();
    if (!supported) return;
    if (loadedAwb !== form.awbNumber.trim() || !orderDetails) { toast.error('Load pickup details for this AWB before scheduling.'); return; }
    setSubmitting(true);
    try {
      await pickupActions.fedex.schedule(form);
      toast.success('Pickup scheduled successfully.');
      setForm({ ...emptyForm, carrier: form.carrier });
    } catch (error) {
      toast.error(error.status === 409 ? 'A pickup is already scheduled for this AWB.' : error.message || 'Unable to schedule pickup.');
    } finally { setSubmitting(false); }
  };
  return <div className="pickups-page"><div className="page-heading"><h1>Schedule Pickup</h1><p>Schedule a shipment collection with the selected carrier.</p></div>
    <form className="pickup-card" onSubmit={submit}><label className="pickup-field">Carrier<select value={form.carrier} onChange={(e) => { setField('carrier', e.target.value); setOrderDetails(null); setLoadedAwb(''); }}>{PICKUP_CARRIERS.map((carrier) => <option key={carrier}>{carrier}</option>)}</select></label>
      <p className={`pickup-availability ${supported ? 'available' : ''}`}>{supported ? 'Pickup scheduling is available for FedEx.' : PICKUP_UNAVAILABLE_MESSAGE}</p>
      <div className="awb-loader"><label className="pickup-field">AWB Number<input required disabled={!supported} value={form.awbNumber} onChange={(e) => { setField('awbNumber', e.target.value); setOrderDetails(null); setLoadedAwb(''); }} onBlur={loadOrderDetails} /></label><button type="button" onClick={loadOrderDetails} disabled={!supported || loadingOrderDetails || !form.awbNumber.trim()}>{loadingOrderDetails ? 'Loading…' : 'Load pickup details'}</button></div>
      {orderDetails && <><div className="pickup-order-details"><strong>Shipment pickup address</strong><span>{form.pickupAddress || '—'}</span><span>{[form.country, form.postalCode].filter(Boolean).join(' · ')}</span><span>{orderDetails.contact?.personName || orderDetails.contact?.fullName || orderDetails.contact?.phoneNumber || ''}</span></div><div className="pickup-address-choice"><span>Pickup address</span><label><input type="radio" name="standalonePickupAddressMode" checked={form.pickupAddressMode === 'shipment'} onChange={() => setField('pickupAddressMode', 'shipment')} /> Use shipment pickup address</label><label><input type="radio" name="standalonePickupAddressMode" checked={form.pickupAddressMode === 'alternate'} onChange={() => setField('pickupAddressMode', 'alternate')} /> Use a different collection address</label>{form.pickupAddressMode === 'alternate' && <label className="pickup-address-input">Collection address<input required value={form.alternatePickupAddress} onChange={(e) => setField('alternatePickupAddress', e.target.value)} placeholder="Office 1204, Al Saqr Business Tower, Sheikh Zayed Road, Dubai" /><small>Enter the address where the carrier should collect the package.</small></label>}</div></>}
      <PickupFields form={form} onChange={setField} includeAwb={false} hideOrderFields disabled={!supported || !orderDetails} countrySuggestions={countrySuggestions} countryOpen={countryOpen} onCountryFocus={() => setCountryOpen(true)} onCountryBlur={() => setTimeout(() => setCountryOpen(false), 150)} onCountrySelect={(country) => { setForm((current) => ({ ...current, country: country.label, countryCode: country.code })); setCountryOpen(false); }} />
      <button className="pickup-primary" disabled={!supported || submitting}>{submitting ? 'Scheduling…' : 'Schedule Pickup'}</button>
    </form></div>;
}

export function MyPickups() {
  const [pickups, setPickups] = useState([]); const [loading, setLoading] = useState(true); const [error, setError] = useState('');
  const [carrier, setCarrier] = useState(''); const [status, setStatus] = useState(''); const [page, setPage] = useState(1); const [pagination, setPagination] = useState({});
  const [editing, setEditing] = useState(null); const [editForm, setEditForm] = useState(emptyForm); const pageSize = 10;
  const [editOrderDetails, setEditOrderDetails] = useState(null); const [loadedEditAwb, setLoadedEditAwb] = useState(''); const [loadingEditOrderDetails, setLoadingEditOrderDetails] = useState(false);
  const load = async () => { setLoading(true); setError(''); try { const response = await api.getPickups({ carrier, status, page, limit: pageSize }); const data = getItems(response); setPickups(Array.isArray(data) ? data : []); setPagination(response?.data?.pagination || response?.pagination || {}); } catch (err) { setError(err.message || 'Unable to load pickups.'); } finally { setLoading(false); } };
  useEffect(() => { load(); }, [carrier, status, page]);
  const edit = (pickup) => {
    const address = requestValue(pickup, ['originDetail', 'pickupLocation', 'address']);
    const scheduledDate = display(pickup, 'scheduled_date', 'pickupDate', 'scheduledDate');
    setEditing(pickup);
    setEditForm({
      ...emptyForm, ...pickup,
      carrier: display(pickup, 'carrier', 'carrierName'),
      awbNumber: display(pickup, 'awb_number', 'awbNumber', 'awb') === '—' ? '' : display(pickup, 'awb_number', 'awbNumber', 'awb'),
      pickupAddress: address?.streetLines?.join(', ') || '',
      country: address?.countryCode || pickup.country || '',
      countryCode: address?.countryCode || pickup.countryCode || '',
      postalCode: address?.postalCode || pickup.postalCode || '',
      pickupDate: scheduledDate === '—' ? '' : scheduledDate,
      readyTime: requestValue(pickup, ['originDetail', 'readyDateTimestamp'])?.slice(11, 16) || '',
      closingTime: requestValue(pickup, ['originDetail', 'customerCloseTime'])?.slice(0, 5) || '',
      packageCount: requestValue(pickup, ['packageCount']) || pickup.packageCount || '1',
      totalWeight: requestValue(pickup, ['totalWeight', 'value']) || pickup.totalWeight || '',
      packageLocation: requestValue(pickup, ['originDetail', 'packageLocation']) || pickup.packageLocation || '',
    });
    setEditOrderDetails(null); setLoadedEditAwb('');
  };
  const loadEditOrderDetails = async () => {
    const awbNumber = editForm.awbNumber.trim();
    if (!awbNumber || !isPickupAvailable(editForm.carrier)) return;
    setLoadingEditOrderDetails(true);
    try {
      const response = await api.getPickupOrderDetails(awbNumber); const details = response?.data || response;
      const pickupAddress = details.pickupAddress || details.pickup_address || details.order?.pickupAddress || details.order?.pickup_address || {};
      const address = pickupAddress.address || pickupAddress; const contact = pickupAddress.contact || details.pickupContact || details.pickup_contact || {};
      const carrierName = details.carrier?.name || details.carrier || details.order?.carrier?.name || editForm.carrier;
      setEditOrderDetails({ address, contact, carrier: carrierName }); setLoadedEditAwb(awbNumber);
      setEditForm((current) => ({ ...current, carrier: carrierName, pickupAddress: address.completeAddress || address.complete_address || address.address || address.streetLines?.join(', ') || '', country: address.country || address.countryName || address.countryCode || '', countryCode: address.countryCode || address.country_code || '', postalCode: address.postalCode || address.pincode || address.postal_code || '' }));
    } catch (err) { setEditOrderDetails(null); setLoadedEditAwb(''); toast.error(err.message || 'Unable to load pickup details for this AWB.'); }
    finally { setLoadingEditOrderDetails(false); }
  };
  const saveEdit = async (event) => { event.preventDefault(); if (!isPickupAvailable(editForm.carrier)) return; if (loadedEditAwb !== editForm.awbNumber.trim() || !editOrderDetails) { toast.error('Load pickup details for this AWB before saving.'); return; } try { await pickupActions.fedex.edit(pickupId(editing), editForm); toast.success('Pickup updated. FedEx edits cancel the existing pickup and create a replacement.'); setEditing(null); load(); } catch (err) { toast.error(err.message || 'Unable to update pickup.'); } };
  const cancel = async (pickup) => { if (!window.confirm('Cancel this pickup?')) return; const action = pickupActions[carrierKey(display(pickup, 'carrier', 'carrierName'))]; if (!action?.cancel || !isPickupAvailable(display(pickup, 'carrier', 'carrierName'))) { toast.error(PICKUP_UNAVAILABLE_MESSAGE); return; } try { await action.cancel(pickupId(pickup)); toast.success('Pickup cancelled.'); load(); } catch (err) { toast.error(err.message || 'Unable to cancel pickup.'); } };
  const totalPages = pagination.totalPages || Math.max(1, Math.ceil((pagination.total || pickups.length) / pageSize));
  return <div className="pickups-page"><div className="page-heading"><h1>My Pickups</h1><p>Manage scheduled shipment collections across carriers.</p></div><div className="pickup-toolbar"><select value={carrier} onChange={(e) => { setCarrier(e.target.value); setPage(1); }}><option value="">All carriers</option>{PICKUP_CARRIERS.map((item) => <option key={item}>{item}</option>)}</select><input placeholder="Filter by status" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} /></div>
    {loading ? <div className="pickup-state">Loading pickups…</div> : error ? <div className="pickup-state error">{error}<button onClick={load}>Retry</button></div> : pickups.length === 0 ? <div className="pickup-state">No pickups found.</div> : <div className="pickup-table-wrap"><table className="pickup-table"><thead><tr><th>Carrier</th><th>AWB Number</th><th>Confirmation Number</th><th>Scheduled Date</th><th>Status</th><th>Created Date</th><th>Actions</th></tr></thead><tbody>{pickups.map((pickup) => <tr key={pickupId(pickup)}><td>{display(pickup, 'carrier', 'carrierName')}</td><td>{display(pickup, 'awb_number', 'awbNumber', 'awb')}</td><td>{display(pickup, 'carrier_confirmation_code', 'confirmationNumber', 'confirmationNo')}</td><td>{display(pickup, 'scheduled_date', 'pickupDate', 'scheduledDate')}</td><td>{display(pickup, 'status')}</td><td>{display(pickup, 'created_at', 'createdAt', 'createdDate')}</td><td><button onClick={() => edit(pickup)}>Edit Pickup</button><button onClick={() => cancel(pickup)}>Cancel Pickup</button></td></tr>)}</tbody></table></div>}
    <div className="pickup-pagination"><button disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</button><span>Page {page} of {totalPages}</span><button disabled={page >= totalPages} onClick={() => setPage(page + 1)}>Next</button></div>
    {editing && <div className="pickup-modal"><form className="pickup-card" onSubmit={saveEdit}><h2>Edit Pickup</h2><p>FedEx edits cancel the existing pickup and create a replacement.</p><label className="pickup-field">Carrier<select value={editForm.carrier} onChange={(e) => { setEditForm({ ...editForm, carrier: e.target.value }); setEditOrderDetails(null); setLoadedEditAwb(''); }}>{PICKUP_CARRIERS.map((item) => <option key={item}>{item}</option>)}</select></label>{!isPickupAvailable(editForm.carrier) && <p className="pickup-availability">{PICKUP_UNAVAILABLE_MESSAGE}</p>}<div className="awb-loader"><label className="pickup-field">AWB Number<input required disabled={!isPickupAvailable(editForm.carrier)} value={editForm.awbNumber} onChange={(e) => { setEditForm({ ...editForm, awbNumber: e.target.value }); setEditOrderDetails(null); setLoadedEditAwb(''); }} onBlur={loadEditOrderDetails} /></label><button type="button" onClick={loadEditOrderDetails} disabled={!isPickupAvailable(editForm.carrier) || loadingEditOrderDetails || !editForm.awbNumber.trim()}>{loadingEditOrderDetails ? 'Loading…' : 'Load pickup details'}</button></div>{editOrderDetails && <><div className="pickup-order-details"><strong>Shipment pickup address</strong><span>{editForm.pickupAddress || '—'}</span><span>{[editForm.country, editForm.postalCode].filter(Boolean).join(' · ')}</span><span>{editOrderDetails.contact?.personName || editOrderDetails.contact?.fullName || editOrderDetails.contact?.phoneNumber || ''}</span></div><div className="pickup-address-choice"><span>Pickup address</span><label><input type="radio" name="editPickupAddressMode" checked={editForm.pickupAddressMode === 'shipment'} onChange={() => setEditForm({ ...editForm, pickupAddressMode: 'shipment' })} /> Use shipment pickup address</label><label><input type="radio" name="editPickupAddressMode" checked={editForm.pickupAddressMode === 'alternate'} onChange={() => setEditForm({ ...editForm, pickupAddressMode: 'alternate' })} /> Use a different collection address</label>{editForm.pickupAddressMode === 'alternate' && <label className="pickup-address-input">Collection address<input required value={editForm.alternatePickupAddress} onChange={(e) => setEditForm({ ...editForm, alternatePickupAddress: e.target.value })} placeholder="Office 1204, Al Saqr Business Tower, Sheikh Zayed Road, Dubai" /><small>Enter the address where the carrier should collect the package.</small></label>}</div></>}<PickupFields form={editForm} onChange={(key, value) => setEditForm({ ...editForm, [key]: value })} includeAwb={false} hideOrderFields disabled={!isPickupAvailable(editForm.carrier) || !editOrderDetails} /><button className="pickup-primary" disabled={!isPickupAvailable(editForm.carrier)}>Save Pickup</button><button type="button" onClick={() => setEditing(null)}>Close</button></form></div>}
  </div>;
}
