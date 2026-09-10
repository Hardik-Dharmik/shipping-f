import { addressLinkUrl } from '../../../../utils/addressLinkUrl';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../../../../services/api';
import './CreateAddressFormLink.css';
import CustomerSelect from '../../../customers/CustomerSelect';

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
const blankPackage = () => ({ quantity: '1', actualWeight: '', length: '', breadth: '', height: '' });
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
  const [customer, setCustomer] = useState(null);
  const [form, setForm] = useState(initial); const [packages, setPackages] = useState([blankPackage()]); const [services, setServices] = useState(FALLBACK_SERVICES); const [loadingServices, setLoadingServices] = useState(true); const [submitting, setSubmitting] = useState(false); const [link, setLink] = useState(''); const [rateCalculatorCode, setRateCalculatorCode] = useState(''); const [loadingRateCode, setLoadingRateCode] = useState(false);
  useEffect(() => { let active = true; api.getAddressFormServices().then((response) => { const list = asList(response); if (active && list.length) setServices(list); }).catch(() => { /* Server validation remains authoritative. */ }).finally(() => active && setLoadingServices(false)); return () => { active = false; }; }, []);
  const grouped = useMemo(() => services.reduce((all, item) => ({ ...all, [item.group]: [...(all[item.group] || []), item] }), {}), [services]);
  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));
  const updatePackage = (index, key, value) => setPackages((current) => current.map((box, boxIndex) => boxIndex === index ? { ...box, [key]: value } : box));
  const loadRateCalculatorCode = async () => {
    const code = rateCalculatorCode.trim();
    if (!code) { toast.error('Enter an RC code first.'); return; }
    try {
      setLoadingRateCode(true);
      const response = await api.getRateCalculatorDetails(code);
      const responseData = response?.data || response || {};
      const saved = responseData.rateData || responseData.calculatorData || responseData.formData || responseData;
      const firstBox = Array.isArray(saved.boxes) && saved.boxes.length ? saved.boxes[0] : {};
      const firstProduct = Array.isArray(saved.products) && saved.products.length ? saved.products[0] : {};
      setForm((current) => ({ ...current,
        pickupCountry: String(saved.pickupCountry || current.pickupCountry),
        pickupPincode: String(saved.pickupPincode || current.pickupPincode),
        destinationCountry: String(saved.destinationCountry || saved.deliveryCountry || current.destinationCountry),
        destinationPincode: String(saved.destinationPincode || saved.deliveryPincode || current.destinationPincode),
        actualWeight: String(saved.actualWeight ?? firstBox.actualWeight ?? firstBox.weight ?? current.actualWeight),
        shipmentValue: String(saved.shipmentValue?.value ?? saved.shipmentValue ?? current.shipmentValue),
        productDescription: String(firstProduct.description || firstProduct.name || current.productDescription),
        productQuantity: String(firstProduct.quantity ?? current.productQuantity),
        productUnitPrice: String(firstProduct.unitPrice ?? saved.shipmentValue?.value ?? saved.shipmentValue ?? current.productUnitPrice),
      }));
      if (Array.isArray(saved.boxes) && saved.boxes.length) setPackages(saved.boxes.map((box) => ({ quantity: String(box.quantity ?? 1), actualWeight: String(box.actualWeight ?? box.weight ?? ''), length: String(box.length ?? box.dimensions?.length ?? ''), breadth: String(box.breadth ?? box.dimensions?.breadth ?? ''), height: String(box.height ?? box.dimensions?.height ?? '') })));
      setRateCalculatorCode(responseData.code || saved.code || code);
      toast.success(`Rate calculator details loaded from ${responseData.code || saved.code || code}.`);
    } catch (error) { toast.error(error.message || 'Failed to load rate calculator details.'); } finally { setLoadingRateCode(false); }
  };
  const create = async (event) => { event.preventDefault(); if (!customer?.id) return toast.error('Please select a customer.'); const selected = services.find((item) => `${item.carrier}:${item.serviceType}` === form.service); const required = ['pickupCountry', 'pickupPincode', 'destinationCountry', 'destinationPincode', 'actualWeight', 'shipmentValue', 'productDescription', 'productQuantity', 'productUnitPrice', 'service']; const hasIncompletePackage = packages.some((box) => ['quantity', 'actualWeight', 'length', 'breadth', 'height'].some((key) => !String(box[key]).trim())); if (required.some((key) => !String(form[key]).trim()) || hasIncompletePackage) return toast.error('Complete all required shipment and package details.'); if (!selected) return toast.error('Select a shipping service.');
    const order = { ...(customer ? { customerId: String(customer.id) } : {}), pickupCountry: form.pickupCountry.trim().toUpperCase(), pickupPincode: form.pickupPincode.trim(), destinationCountry: form.destinationCountry.trim().toUpperCase(), destinationPincode: form.destinationPincode.trim(), actualWeight: Number(form.actualWeight), shipmentValue: Number(form.shipmentValue), products: [{ description: form.productDescription.trim(), quantity: Number(form.productQuantity), unitPrice: Number(form.productUnitPrice) }], boxes: packages.map((box) => ({ quantity: Number(box.quantity), actualWeight: Number(box.actualWeight), length: Number(box.length), breadth: Number(box.breadth), height: Number(box.height) })), carrier: { carrier: selected.carrier, serviceType: selected.serviceType }, pickupRequest: { pickupDate: form.pickupDate || undefined, readyTime: form.readyTime || undefined, latestPickupTime: form.latestPickupTime || undefined } };
    try { setSubmitting(true); const response = await api.createOrderAddressLink(order); const createdLink = addressLinkUrl(response); setLink(createdLink); toast.success('Address link created. Service availability was confirmed.'); } catch (error) { toast.error(error.message || 'Unable to create address link.'); } finally { setSubmitting(false); }
  };
  const copy = async () => { await navigator.clipboard?.writeText(link); toast.success('Link copied to clipboard.'); };
  const input = (key, label, type = 'text', required = true) => <label className="address-link-field">{label}{required && <span> *</span>}<input type={type} value={form[key]} min={type === 'number' ? '0' : undefined} onChange={(event) => update(key, event.target.value)} required={required} /></label>;
  return <div className="address-link-page"><div className="address-link-card"><h1>Create Address Link</h1><p>Lock the pickup and destination country and pincode, choose a verified service, then share the link for the recipient to complete both addresses.</p><form onSubmit={create}>
      <CustomerSelect required value={customer} onChange={setCustomer} disabled={submitting} />
    <section className="address-link-rate-code"><h2>Load Rate Calculator Details</h2><p>Enter an RC code to prefill the route, shipment value, product, and package details.</p><div><input value={rateCalculatorCode} placeholder="RC-123456" onChange={(event) => setRateCalculatorCode(event.target.value.toUpperCase())} /><button type="button" onClick={loadRateCalculatorCode} disabled={loadingRateCode}>{loadingRateCode ? 'Loading…' : 'Load details'}</button></div></section>
    <section><h2>Locked route</h2><div className="address-link-grid"><LocationField label="Pickup country" isCountry value={form.pickupCountry} onChange={(value) => { update('pickupCountry', value); update('pickupPincode', ''); }} /><LocationField label="Pickup pincode" country={form.pickupCountry} value={form.pickupPincode} onChange={(value) => update('pickupPincode', value)} /><LocationField label="Destination country" isCountry value={form.destinationCountry} onChange={(value) => { update('destinationCountry', value); update('destinationPincode', ''); }} /><LocationField label="Destination pincode" country={form.destinationCountry} value={form.destinationPincode} onChange={(value) => update('destinationPincode', value)} /></div></section>
    <section><h2>Service</h2><label className="address-link-field">Shipping service *<select value={form.service} onChange={(event) => update('service', event.target.value)} required disabled={loadingServices}><option value="">{loadingServices ? 'Loading services…' : 'Select service'}</option>{Object.entries(grouped).map(([group, items]) => <optgroup key={group} label={group}>{items.map((item) => <option key={`${item.carrier}:${item.serviceType}`} value={`${item.carrier}:${item.serviceType}`}>{item.label}</option>)}</optgroup>)}</select></label><small>Regional road services are checked against the selected route when the link is created.</small></section>
    <section><h2>Shipment details</h2><div className="address-link-grid">{input('actualWeight', 'Actual weight (kg)', 'number')}{input('shipmentValue', 'Shipment value', 'number')}{input('productDescription', 'Product description')}{input('productQuantity', 'Product quantity', 'number')}{input('productUnitPrice', 'Product unit price', 'number')}</div><div className="address-link-packages"><h3>Packages</h3>{packages.map((box, index) => <div className="address-link-grid" key={index}>{[['quantity', 'Quantity'], ['actualWeight', 'Actual weight (kg)'], ['length', 'Length (cm)'], ['breadth', 'Breadth (cm)'], ['height', 'Height (cm)']].map(([key, label]) => <label className="address-link-field" key={key}>{label} *<input type="number" min="0" value={box[key]} onChange={(event) => updatePackage(index, key, event.target.value)} /></label>)}{packages.length > 1 && <button type="button" className="address-link-remove-package" onClick={() => setPackages((current) => current.filter((_, boxIndex) => boxIndex !== index))}>Remove package</button>}</div>)}<button type="button" className="address-link-add-package" onClick={() => setPackages((current) => [...current, blankPackage()])}>+ Add package</button></div></section>
    <section><h2>Pickup scheduling <em>(recipient may edit)</em></h2><div className="address-link-grid">{input('pickupDate', 'Pickup date', 'date')}{input('readyTime', 'Ready time', 'time')}{input('latestPickupTime', 'Latest pickup time', 'time')}</div></section>
    <button className="address-link-submit" disabled={submitting}>{submitting ? 'Validating service and creating…' : 'Create shareable link'}</button>
  </form>{link && <div className="address-link-result"><strong>Share this link</strong><input value={link} readOnly /><button type="button" onClick={copy}>Copy link</button></div>}</div></div>;
}
