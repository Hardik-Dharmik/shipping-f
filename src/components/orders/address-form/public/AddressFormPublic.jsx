import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../../../../services/api';
import { carrierWordLimitError } from '../../../../utils/carrierLimits';
import './AddressFormPublic.css';

const EMPTY_ADDRESS = { name: '', companyName: '', phone: '', email: '', addressLine1: '', addressLine2: '', city: '', state: '', country: '', pincode: '' };
const FIELDS = [
  ['name', 'Contact name', true], ['companyName', 'Company name', false], ['phone', 'Phone', true], ['email', 'Email', false],
  ['addressLine1', 'Address line 1', true], ['addressLine2', 'Address line 2', false], ['city', 'City', true], ['state', 'State', true],
  ['country', 'Country', true], ['pincode', 'Pincode', true],
];
const COUNTRY_CODES = { UAE: 'ae', GERMANY: 'de', UK: 'gb', USA: 'us', INDIA: 'in', CHINA: 'cn', 'SOUTH KOREA': 'kr', FRANCE: 'fr', AUSTRALIA: 'au', CANADA: 'ca', SAUDI: 'sa', BAHRAIN: 'bh', OMAN: 'om', QATAR: 'qa', EGYPT: 'eg' };
const countryCode = (country) => COUNTRY_CODES[String(country || '').trim().toUpperCase()] || String(country || '').trim().slice(0, 2).toLowerCase() || 'in';

const responseMessage = (error) => {
  const message = error?.message || 'This address link is unavailable.';
  if (/expired/i.test(message)) return 'This address link has expired.';
  if (/submitted|used/i.test(message)) return 'This address link has already been submitted.';
  if (/invalid|not found/i.test(message)) return 'This address link is invalid.';
  return message;
};

function AddressSection({ title, address, errors, onChange, disabled }) {
  const [suggestions, setSuggestions] = useState({ country: [], city: [], pincode: [] });
  const [open, setOpen] = useState({ country: false, city: false, pincode: false });

  useEffect(() => {
    const timer = setTimeout(async () => {
      const query = address.country.trim();
      if (query.length < 2) return setSuggestions((value) => ({ ...value, country: [] }));
      try { const response = await api.getCountrySuggestions(query); setSuggestions((value) => ({ ...value, country: response?.data || response?.countries || response || [] })); } catch { setSuggestions((value) => ({ ...value, country: [] })); }
    }, 250); return () => clearTimeout(timer);
  }, [address.country]);
  useEffect(() => {
    const timer = setTimeout(async () => {
      const query = address.city.trim();
      if (query.length < 2) return setSuggestions((value) => ({ ...value, city: [] }));
      try { const response = await api.getCitySuggestions(query, countryCode(address.country)); setSuggestions((value) => ({ ...value, city: response?.data || response?.cities || response || [] })); } catch { setSuggestions((value) => ({ ...value, city: [] })); }
    }, 250); return () => clearTimeout(timer);
  }, [address.city, address.country]);
  useEffect(() => {
    const timer = setTimeout(async () => {
      const query = address.pincode.trim();
      if (query.length < 2) return setSuggestions((value) => ({ ...value, pincode: [] }));
      try { const response = await api.getPincodeSuggestions(query, countryCode(address.country)); setSuggestions((value) => ({ ...value, pincode: response?.data || response?.pincodes || response || [] })); } catch { setSuggestions((value) => ({ ...value, pincode: [] })); }
    }, 250); return () => clearTimeout(timer);
  }, [address.pincode, address.country]);
  const labelFor = (item, type) => typeof item === 'string' ? item : item?.name || item?.label || item?.[type] || item?.city || item?.pincode || item?.postalCode || item?.country || '';
  const locationInput = (key, label, required) => <div className="public-form-group public-location-field" key={key}>
    <label htmlFor={`${title}-${key}`}>{label}{required && <span className="required"> *</span>}</label>
    <input id={`${title}-${key}`} value={address[key]} disabled={disabled} autoComplete="off" onFocus={() => setOpen((value) => ({ ...value, [key]: true }))} onChange={(e) => { onChange(key, e.target.value); setOpen((value) => ({ ...value, [key]: true })); }} className={errors[key] ? 'error' : ''} />
    {open[key] && suggestions[key].length > 0 && <div className="public-suggestions">{suggestions[key].map((item, index) => { const labelValue = labelFor(item, key); return <button type="button" key={`${labelValue}-${index}`} onMouseDown={(event) => event.preventDefault()} onClick={() => { onChange(key, labelValue); setOpen((value) => ({ ...value, [key]: false })); }}>{labelValue}</button>; })}</div>}
    {errors[key] && <span className="public-error-message">{errors[key]}</span>}
  </div>;
  return <section className="public-address-section"><h2>{title}</h2><div className="public-address-grid">
    {FIELDS.map(([key, label, required]) => ['country', 'city', 'pincode'].includes(key) ? locationInput(key, label, required) : <div className={key.startsWith('address') ? 'public-form-group public-form-group-wide' : 'public-form-group'} key={key}>
      <label htmlFor={`${title}-${key}`}>{label}{required && <span className="required"> *</span>}</label>
      <input id={`${title}-${key}`} type={key === 'email' ? 'email' : key === 'phone' ? 'tel' : 'text'} value={address[key]} disabled={disabled} onChange={(e) => onChange(key, e.target.value)} className={errors[key] ? 'error' : ''} />
      {errors[key] && <span className="public-error-message">{errors[key]}</span>}
    </div>)}
  </div></section>;
}

export default function AddressFormPublic() {
  const { code = '' } = useParams();
  const [loading, setLoading] = useState(true); const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(''); const [submitted, setSubmitted] = useState(false); const [awb, setAwb] = useState('');
  const [pickupAddress, setPickupAddress] = useState(EMPTY_ADDRESS); const [destinationAddress, setDestinationAddress] = useState(EMPTY_ADDRESS);
  const [errors, setErrors] = useState({ pickup: {}, destination: {} });
  const [carrier, setCarrier] = useState('');

  useEffect(() => { let active = true; (async () => { try { const response = await api.getPublicAddressForm(code); const data = response?.data || response || {}; const status = String(data.status || ''); if (/expired|invalid/i.test(status)) throw new Error(status); if (!active) return; const alreadySubmitted = Boolean(data.submitted || data.isSubmitted || /submitted|used/i.test(status)); setSubmitted(alreadySubmitted); setAwb(data.awb_number || data.awbNumber || ''); setCarrier(data.carrier?.name || data.order?.carrier?.name || ''); } catch (err) { if (active) setError(responseMessage(err)); } finally { if (active) setLoading(false); } })(); return () => { active = false; }; }, [code]);

  const update = (type, key, value) => { const setter = type === 'pickup' ? setPickupAddress : setDestinationAddress; setter((current) => ({ ...current, [key]: value })); setErrors((current) => ({ ...current, [type]: { ...current[type], [key]: '' } })); };
  const validate = (address) => { const next = {}; FIELDS.filter(([, , required]) => required).forEach(([key, label]) => { if (!address[key].trim()) next[key] = `${label} is required`; }); if (address.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(address.email)) next.email = 'Enter a valid email address'; if (address.phone && !/^[+\d][\d\s-]{7,}$/.test(address.phone)) next.phone = 'Enter a valid phone number'; [['name', 'contact', 'Contact person name'], ['companyName', 'company', 'Company name'], ['addressLine1', 'address', 'Address line 1'], ['addressLine2', 'address', 'Address line 2']].forEach(([key, type, label]) => { const limitError = carrierWordLimitError(carrier, type, address[key], label); if (limitError) next[key] = limitError; }); return next; };
  const submit = async (event) => { event.preventDefault(); if (submitted) return; const pickup = validate(pickupAddress); const destination = validate(destinationAddress); setErrors({ pickup, destination }); if (Object.keys(pickup).length || Object.keys(destination).length) return; try { setSubmitting(true); const response = await api.submitPublicAddressForm(code, { pickupAddress, destinationAddress }); const data = response?.data || response || {}; setAwb(data.awb_number || data.awbNumber || ''); setSubmitted(true); } catch (err) { setError(responseMessage(err)); } finally { setSubmitting(false); } };
  const copyAwb = async () => { try { await navigator.clipboard.writeText(awb); } catch { /* browser may block clipboard access */ } };

  if (loading) return <main className="public-form-page"><div className="public-form-card"><p>Loading address form…</p></div></main>;
  if (error) return <main className="public-form-page"><div className="public-form-card"><h1>Address form</h1><p className="public-form-error">{error}</p></div></main>;
  if (submitted) return <main className="public-form-page"><div className="public-form-card public-confirmation"><h1>Order created successfully</h1>{awb && <><p>AWB Number: <strong>{awb}</strong></p><button className="public-submit-btn" onClick={copyAwb}>Copy AWB</button></>} {!awb && <p>This address link has already been submitted.</p>}</div></main>;
  return <main className="public-form-page"><div className="public-form-card"><h1>Shipment address details</h1><p className="public-form-subtitle">Enter pickup and destination contact details to create the order.{carrier && ` Carrier: ${carrier}.`}</p><form className="public-form" onSubmit={submit}><AddressSection title="Pickup / source" address={pickupAddress} errors={errors.pickup} disabled={submitting} onChange={(key, value) => update('pickup', key, value)} /><AddressSection title="Destination" address={destinationAddress} errors={errors.destination} disabled={submitting} onChange={(key, value) => update('destination', key, value)} /><button className="public-submit-btn" disabled={submitting}>{submitting ? 'Creating order…' : 'Submit address details'}</button></form></div></main>;
}
