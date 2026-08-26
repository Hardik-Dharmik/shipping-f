import { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../../../../services/api';
import './CreateAddressFormLink.css';

const FALLBACK_SERVICES = [
  { carrier: 'FedEx', serviceType: 'INTERNATIONAL_ECONOMY', label: 'FedEx International Economy', group: 'FedEx — Boxes' },
  { carrier: 'FedEx', serviceType: 'INTERNATIONAL_PRIORITY', label: 'FedEx International Priority', group: 'FedEx — Boxes' },
  { carrier: 'FedEx', serviceType: 'REGIONAL_ECONOMY', label: 'FedEx Regional Economy', group: 'FedEx — Boxes / Road (where available)' },
  { carrier: 'FedEx', serviceType: 'INTERNATIONAL_ECONOMY_FREIGHT', label: 'FedEx International Economy Freight', group: 'FedEx — Freight' },
  { carrier: 'FedEx', serviceType: 'INTERNATIONAL_PRIORITY_FREIGHT', label: 'FedEx International Priority Freight', group: 'FedEx — Freight' },
  { carrier: 'FedEx', serviceType: 'REGIONAL_FREIGHT', label: 'FedEx Regional Freight', group: 'FedEx — Freight / Road (where available)' },
  { carrier: 'UPS', serviceType: 'UPS_SAVER', label: 'UPS Saver', group: 'UPS — Boxes' },
  { carrier: 'UPS', serviceType: 'UPS_EXPEDITED', label: 'UPS Expedited', group: 'UPS — Boxes' },
  { carrier: 'UPS', serviceType: 'WORLDWIDE_EXPRESS_FREIGHT', label: 'Worldwide Express Freight', group: 'UPS — Pallet' },
];

const initial = { pickupCountry: '', pickupPincode: '', destinationCountry: '', destinationPincode: '', actualWeight: '', shipmentValue: '', productDescription: '', productQuantity: '1', productUnitPrice: '', boxQuantity: '1', boxWeight: '', length: '', breadth: '', height: '', service: '', pickupDate: '', readyTime: '', latestPickupTime: '' };
const asList = (response) => {
  const payload = response?.data ?? response;
  const items = Array.isArray(payload) ? payload : payload?.services || payload?.items || [];
  return items.map((item) => ({ carrier: item.carrier || item.carrierName || item.provider, serviceType: item.serviceType || item.service_type || item.code || item.value, label: item.label || item.name || item.serviceName || item.serviceType, group: item.group || item.category || `${item.carrier || 'Carrier'} services` })).filter((item) => item.carrier && item.serviceType);
};
const suggestionList = (response, type = 'country') => {
  const data = response?.data ?? response;
  const items = Array.isArray(data) ? data : data?.suggestions || data?.results || data?.items || [];
  return items.map((item) => {
    if (typeof item === 'string') return item;
    if (type === 'pincode') {
      const pincode = item?.pincode || item?.pinCode || item?.postalCode || item?.postal_code || item?.zip || item?.zipCode || item?.postcode || item?.code || item?.value || '';
      const city = item?.city || item?.cityName || item?.locality || item?.town || item?.district || '';
      return [pincode, city].filter(Boolean).join(' - ');
    }
    return item?.name || item?.label || item?.country || item?.value || '';
  }).filter(Boolean);
};
const countryCode = (country = '') => {
  const name = country.trim().toUpperCase();
  const known = { UAE: 'ae', 'UNITED ARAB EMIRATES': 'ae', INDIA: 'in', USA: 'us', 'UNITED STATES': 'us', UK: 'gb', 'UNITED KINGDOM': 'gb', GERMANY: 'de', CHINA: 'cn', CANADA: 'ca', AUSTRALIA: 'au', FRANCE: 'fr', OMAN: 'om', QATAR: 'qa', BAHRAIN: 'bh', EGYPT: 'eg', SAUDI: 'sa', 'SAUDI ARABIA': 'sa' };
  return known[name] || (name.length === 2 ? name.toLowerCase() : '');
};

function LocationField({ label, country, isCountry, value, onChange }) {
  const [items, setItems] = useState([]); const [open, setOpen] = useState(false); const [loading, setLoading] = useState(false);
  useEffect(() => { const query = value.trim(); if (query.length < 2 || (!isCountry && !country.trim())) { setItems([]); return undefined; } const timer = setTimeout(async () => { try { setLoading(true); const response = isCountry ? await api.getCountrySuggestions(query) : await api.getPincodeSuggestions(query, countryCode(country)); setItems(suggestionList(response, isCountry ? 'country' : 'pincode')); } catch { setItems([]); } finally { setLoading(false); } }, 250); return () => clearTimeout(timer); }, [value, country, isCountry]);
  return <label className="address-link-field address-link-location">{label} *<input value={value} autoComplete="off" onFocus={() => setOpen(true)} onBlur={() => setTimeout(() => setOpen(false), 120)} onChange={(event) => { onChange(event.target.value); setOpen(true); }} required />{open && (loading || items.length > 0) && <div className="address-link-suggestions">{loading ? <span>Loading suggestions…</span> : items.map((item, index) => <button type="button" key={`${item}-${index}`} onMouseDown={(event) => event.preventDefault()} onClick={() => { onChange(isCountry ? item : item.split(' - ')[0]); setOpen(false); }}>{item}</button>)}</div>}</label>;
}

export default function CreateAddressFormLink() {
  const [form, setForm] = useState(initial); const [services, setServices] = useState(FALLBACK_SERVICES); const [loadingServices, setLoadingServices] = useState(true); const [submitting, setSubmitting] = useState(false); const [link, setLink] = useState('');
  useEffect(() => { let active = true; api.getAddressFormServices().then((response) => { const list = asList(response); if (active && list.length) setServices(list); }).catch(() => { /* Server validation remains authoritative. */ }).finally(() => active && setLoadingServices(false)); return () => { active = false; }; }, []);
  const grouped = useMemo(() => services.reduce((all, item) => ({ ...all, [item.group]: [...(all[item.group] || []), item] }), {}), [services]);
  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));
  const create = async (event) => { event.preventDefault(); const selected = services.find((item) => `${item.carrier}:${item.serviceType}` === form.service); const required = ['pickupCountry', 'pickupPincode', 'destinationCountry', 'destinationPincode', 'actualWeight', 'shipmentValue', 'productDescription', 'productQuantity', 'productUnitPrice', 'boxQuantity', 'boxWeight', 'length', 'breadth', 'height', 'service']; if (required.some((key) => !String(form[key]).trim())) return toast.error('Complete all required shipment and route details.'); if (!selected) return toast.error('Select a shipping service.');
    const order = { pickupCountry: form.pickupCountry.trim().toUpperCase(), pickupPincode: form.pickupPincode.trim(), destinationCountry: form.destinationCountry.trim().toUpperCase(), destinationPincode: form.destinationPincode.trim(), actualWeight: Number(form.actualWeight), shipmentValue: Number(form.shipmentValue), products: [{ description: form.productDescription.trim(), quantity: Number(form.productQuantity), unitPrice: Number(form.productUnitPrice) }], boxes: [{ quantity: Number(form.boxQuantity), actualWeight: Number(form.boxWeight), length: Number(form.length), breadth: Number(form.breadth), height: Number(form.height) }], carrier: { carrier: selected.carrier, serviceType: selected.serviceType }, pickupRequest: { pickupDate: form.pickupDate || undefined, readyTime: form.readyTime || undefined, latestPickupTime: form.latestPickupTime || undefined } };
    try { setSubmitting(true); const response = await api.createOrderAddressLink(order); const data = response?.data || response || {}; const createdLink = data.url || data.link || data.publicUrl || (data.code ? `${window.location.origin}/address-form/${data.code}` : ''); if (!createdLink) throw new Error('The address link was created but no shareable URL was returned.'); setLink(createdLink); toast.success('Address link created. Service availability was confirmed.'); } catch (error) { toast.error(error.message || 'Unable to create address link.'); } finally { setSubmitting(false); }
  };
  const copy = async () => { await navigator.clipboard?.writeText(link); toast.success('Link copied to clipboard.'); };
  const input = (key, label, type = 'text', required = true) => <label className="address-link-field">{label}{required && <span> *</span>}<input type={type} value={form[key]} min={type === 'number' ? '0' : undefined} onChange={(event) => update(key, event.target.value)} required={required} /></label>;
  return <div className="address-link-page"><div className="address-link-card"><h1>Create Address Link</h1><p>Lock the pickup and destination country and pincode, choose a verified service, then share the link for the recipient to complete both addresses.</p><form onSubmit={create}>
    <section><h2>Locked route</h2><div className="address-link-grid"><LocationField label="Pickup country" isCountry value={form.pickupCountry} onChange={(value) => { update('pickupCountry', value); update('pickupPincode', ''); }} /><LocationField label="Pickup pincode" country={form.pickupCountry} value={form.pickupPincode} onChange={(value) => update('pickupPincode', value)} /><LocationField label="Destination country" isCountry value={form.destinationCountry} onChange={(value) => { update('destinationCountry', value); update('destinationPincode', ''); }} /><LocationField label="Destination pincode" country={form.destinationCountry} value={form.destinationPincode} onChange={(value) => update('destinationPincode', value)} /></div></section>
    <section><h2>Service</h2><label className="address-link-field">Shipping service *<select value={form.service} onChange={(event) => update('service', event.target.value)} required disabled={loadingServices}><option value="">{loadingServices ? 'Loading services…' : 'Select service'}</option>{Object.entries(grouped).map(([group, items]) => <optgroup key={group} label={group}>{items.map((item) => <option key={`${item.carrier}:${item.serviceType}`} value={`${item.carrier}:${item.serviceType}`}>{item.label}</option>)}</optgroup>)}</select></label><small>Regional road services are checked against the selected route when the link is created.</small></section>
    <section><h2>Shipment details</h2><div className="address-link-grid">{input('actualWeight', 'Actual weight (kg)', 'number')}{input('shipmentValue', 'Shipment value', 'number')}{input('productDescription', 'Product description')}{input('productQuantity', 'Product quantity', 'number')}{input('productUnitPrice', 'Product unit price', 'number')}{input('boxQuantity', 'Boxes / pallets', 'number')}{input('boxWeight', 'Box actual weight (kg)', 'number')}{input('length', 'Length (cm)', 'number')}{input('breadth', 'Breadth (cm)', 'number')}{input('height', 'Height (cm)', 'number')}</div></section>
    <section><h2>Pickup scheduling <em>(recipient may edit)</em></h2><div className="address-link-grid">{input('pickupDate', 'Pickup date', 'date')}{input('readyTime', 'Ready time', 'time')}{input('latestPickupTime', 'Latest pickup time', 'time')}</div></section>
    <button className="address-link-submit" disabled={submitting}>{submitting ? 'Validating service and creating…' : 'Create shareable link'}</button>
  </form>{link && <div className="address-link-result"><strong>Share this link</strong><input value={link} readOnly /><button type="button" onClick={copy}>Copy link</button></div>}</div></div>;
}
