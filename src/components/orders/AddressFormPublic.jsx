import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { api } from '../../services/api';
import { extractAddressFormPayload } from '../../utils/addressForms';
import './AddressFormPublic.css';

const COUNTRIES = [
  'UAE',
  'GERMANY',
  'UK',
  'USA',
  'INDIA',
  'CHINA',
  'SOUTH KOREA',
  'FRANCE',
  'AUSTRALIA',
  'CANADA',
  'SAUDI',
  'BAHRAIN',
  'OMAN',
  'QATAR',
  'EGYPT',
];

const CITY_NAME_COUNTRIES = ['UAE', 'OMAN', 'QATAR', 'EGYPT'];
const PRODUCT_CURRENCIES = [
  { code: 'AED', label: 'AED' },
  { code: 'USD', label: 'USD' },
  { code: 'EUR', label: 'EUR' },
  { code: 'GBP', label: 'GBP' },
  { code: 'INR', label: 'INR' },
  { code: 'SAR', label: 'SAR' },
  { code: 'CAD', label: 'CAD' },
  { code: 'AUD', label: 'AUD' },
  { code: 'CNY', label: 'CNY' },
  { code: 'KRW', label: 'KRW' },
];

const INITIAL_ADDRESS = {
  companyName: '',
  country: '',
  pincode: '',
  mobileNo: '',
  fullName: '',
  completeAddress: '',
  landmark: '',
  city: '',
  state: '',
  alternateNo: '',
  email: '',
};

const INITIAL_PRODUCT = {
  id: 1,
  name: '',
  currency: 'AED',
  unitPrice: '',
};

function AddressFields({ prefix, value, errors, onChange, disabled }) {
  const title = prefix === 'pickup' ? 'Pickup Address' : 'Destination Address';
  const useCityName = CITY_NAME_COUNTRIES.includes(value.country);
  const fieldPrefix = prefix === 'pickup' ? 'pickup' : 'destination';

  return (
    <section className="public-address-section">
      <h2>{title}</h2>
      <div className="public-address-grid">
        <div className="public-form-group">
          <label htmlFor={`${prefix}-companyName`}>
            Company Name <span className="required">*</span>
          </label>
          <input
            id={`${prefix}-companyName`}
            value={value.companyName}
            onChange={(e) => onChange('companyName', e.target.value)}
            disabled={disabled}
            className={errors[`${fieldPrefix}.companyName`] ? 'error' : ''}
          />
          {errors[`${fieldPrefix}.companyName`] && <span className="public-error-message">{errors[`${fieldPrefix}.companyName`]}</span>}
        </div>
        <div className="public-form-group">
          <label htmlFor={`${prefix}-country`}>
            Country <span className="required">*</span>
          </label>
          <select
            id={`${prefix}-country`}
            value={value.country}
            onChange={(e) => onChange('country', e.target.value)}
            disabled={disabled}
            className={errors[`${fieldPrefix}.country`] ? 'error' : ''}
          >
            <option value="">Select Country</option>
            {COUNTRIES.map((country) => (
              <option key={country} value={country}>
                {country}
              </option>
            ))}
          </select>
          {errors[`${fieldPrefix}.country`] && <span className="public-error-message">{errors[`${fieldPrefix}.country`]}</span>}
        </div>
        <div className="public-form-group">
          <label htmlFor={`${prefix}-pincode`}>
            {useCityName ? 'City' : 'Pincode'} <span className="required">*</span>
          </label>
          <input
            id={`${prefix}-pincode`}
            value={value.pincode}
            onChange={(e) => onChange('pincode', e.target.value)}
            disabled={disabled}
            className={errors[`${fieldPrefix}.pincode`] ? 'error' : ''}
          />
          {errors[`${fieldPrefix}.pincode`] && <span className="public-error-message">{errors[`${fieldPrefix}.pincode`]}</span>}
        </div>
        <div className="public-form-group">
          <label htmlFor={`${prefix}-mobileNo`}>
            Mobile No. <span className="required">*</span>
          </label>
          <input
            id={`${prefix}-mobileNo`}
            value={value.mobileNo}
            onChange={(e) => onChange('mobileNo', e.target.value)}
            disabled={disabled}
            className={errors[`${fieldPrefix}.mobileNo`] ? 'error' : ''}
          />
          {errors[`${fieldPrefix}.mobileNo`] && <span className="public-error-message">{errors[`${fieldPrefix}.mobileNo`]}</span>}
        </div>
        <div className="public-form-group">
          <label htmlFor={`${prefix}-fullName`}>
            Full Name <span className="required">*</span>
          </label>
          <input
            id={`${prefix}-fullName`}
            value={value.fullName}
            onChange={(e) => onChange('fullName', e.target.value)}
            disabled={disabled}
            className={errors[`${fieldPrefix}.fullName`] ? 'error' : ''}
          />
          {errors[`${fieldPrefix}.fullName`] && <span className="public-error-message">{errors[`${fieldPrefix}.fullName`]}</span>}
        </div>
        <div className="public-form-group public-form-group-wide">
          <label htmlFor={`${prefix}-completeAddress`}>
            Complete Address <span className="required">*</span>
          </label>
          <textarea
            id={`${prefix}-completeAddress`}
            value={value.completeAddress}
            onChange={(e) => onChange('completeAddress', e.target.value)}
            rows={3}
            disabled={disabled}
            className={errors[`${fieldPrefix}.completeAddress`] ? 'error' : ''}
          />
          {errors[`${fieldPrefix}.completeAddress`] && <span className="public-error-message">{errors[`${fieldPrefix}.completeAddress`]}</span>}
        </div>
        <div className="public-form-group">
          <label htmlFor={`${prefix}-landmark`}>
            Landmark <span className="required">*</span>
          </label>
          <input
            id={`${prefix}-landmark`}
            value={value.landmark}
            onChange={(e) => onChange('landmark', e.target.value)}
            disabled={disabled}
            className={errors[`${fieldPrefix}.landmark`] ? 'error' : ''}
          />
          {errors[`${fieldPrefix}.landmark`] && <span className="public-error-message">{errors[`${fieldPrefix}.landmark`]}</span>}
        </div>
        <div className="public-form-group">
          <label htmlFor={`${prefix}-city`}>
            City <span className="required">*</span>
          </label>
          <input
            id={`${prefix}-city`}
            value={value.city}
            onChange={(e) => onChange('city', e.target.value)}
            disabled={disabled}
            className={errors[`${fieldPrefix}.city`] ? 'error' : ''}
          />
          {errors[`${fieldPrefix}.city`] && <span className="public-error-message">{errors[`${fieldPrefix}.city`]}</span>}
        </div>
        <div className="public-form-group">
          <label htmlFor={`${prefix}-state`}>
            State <span className="required">*</span>
          </label>
          <input
            id={`${prefix}-state`}
            value={value.state}
            onChange={(e) => onChange('state', e.target.value)}
            disabled={disabled}
            className={errors[`${fieldPrefix}.state`] ? 'error' : ''}
          />
          {errors[`${fieldPrefix}.state`] && <span className="public-error-message">{errors[`${fieldPrefix}.state`]}</span>}
        </div>
        <div className="public-form-group">
          <label htmlFor={`${prefix}-alternateNo`}>
            Alternate No. <span className="optional">(Optional)</span>
          </label>
          <input
            id={`${prefix}-alternateNo`}
            value={value.alternateNo}
            onChange={(e) => onChange('alternateNo', e.target.value)}
            disabled={disabled}
            className={errors[`${fieldPrefix}.alternateNo`] ? 'error' : ''}
          />
          {errors[`${fieldPrefix}.alternateNo`] && <span className="public-error-message">{errors[`${fieldPrefix}.alternateNo`]}</span>}
        </div>
        <div className="public-form-group">
          <label htmlFor={`${prefix}-email`}>
            Email <span className="optional">(Optional)</span>
          </label>
          <input
            type="email"
            id={`${prefix}-email`}
            value={value.email}
            onChange={(e) => onChange('email', e.target.value)}
            disabled={disabled}
            className={errors[`${fieldPrefix}.email`] ? 'error' : ''}
          />
          {errors[`${fieldPrefix}.email`] && <span className="public-error-message">{errors[`${fieldPrefix}.email`]}</span>}
        </div>
      </div>
    </section>
  );
}

function ProductFields({ product, errors, onChange, disabled }) {
  return (
    <section className="public-address-section">
      <div className="public-section-header">
        <div>
          <h2>Product Details</h2>
          <p className="public-section-subtitle">Add the invoice value for this shipment.</p>
        </div>
      </div>

      <div className="public-product-list">
        <div className="public-product-card">
          <div className="public-product-card-header">
            <span>Product</span>
          </div>

          <div className="public-address-grid">
            <div className="public-form-group">
              <label htmlFor={`product-${product.id}-name`}>
                Product Name <span className="required">*</span>
              </label>
              <input
                id={`product-${product.id}-name`}
                value={product.name}
                onChange={(e) => onChange('name', e.target.value)}
                disabled={disabled}
                className={errors[`products.${product.id}.name`] ? 'error' : ''}
              />
              {errors[`products.${product.id}.name`] && (
                <span className="public-error-message">{errors[`products.${product.id}.name`]}</span>
              )}
            </div>

            <div className="public-form-group">
              <label htmlFor={`product-${product.id}-unitPrice`}>
                Total Invoice Value <span className="required">*</span>
              </label>
              <div className="public-currency-input">
                <select
                  aria-label="Product currency"
                  value={product.currency || 'AED'}
                  onChange={(e) => onChange('currency', e.target.value)}
                  disabled={disabled}
                >
                  {PRODUCT_CURRENCIES.map((currency) => (
                    <option key={currency.code} value={currency.code}>
                      {currency.label}
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  id={`product-${product.id}-unitPrice`}
                  value={product.unitPrice}
                  onChange={(e) => onChange('unitPrice', e.target.value)}
                  disabled={disabled}
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  className={errors[`products.${product.id}.unitPrice`] ? 'error' : ''}
                />
              </div>
              {errors[`products.${product.id}.unitPrice`] && (
                <span className="public-error-message">{errors[`products.${product.id}.unitPrice`]}</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function AddressFormPublic() {
  const { code = '' } = useParams();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [pickupAddress, setPickupAddress] = useState(INITIAL_ADDRESS);
  const [destinationAddress, setDestinationAddress] = useState(INITIAL_ADDRESS);
  const [product, setProduct] = useState(INITIAL_PRODUCT);
  const [errors, setErrors] = useState({});

  const formCode = useMemo(() => code.trim(), [code]);

  useEffect(() => {
    const fetchForm = async () => {
      if (!formCode) {
        setError('Invalid link.');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError('');
        const response = await api.getPublicAddressForm(formCode);
        const payload = extractAddressFormPayload(response);

        setSubmitted(payload.submitted);
        setPickupAddress(payload.pickupAddress);
        setDestinationAddress(payload.destinationAddress);
        setProduct(payload.products.length > 0 ? payload.products[0] : INITIAL_PRODUCT);
      } catch (err) {
        setError(err.message || 'Unable to load this form.');
      } finally {
        setLoading(false);
      }
    };

    fetchForm();
  }, [formCode]);

  const updateAddress = (type, field, value) => {
    const errorKey = `${type}.${field}`;
    if (errors[errorKey]) {
      setErrors((prev) => ({
        ...prev,
        [errorKey]: '',
      }));
    }

    if (type === 'pickup') {
      setPickupAddress((prev) => ({ ...prev, [field]: value }));
      return;
    }
    setDestinationAddress((prev) => ({ ...prev, [field]: value }));
  };

  const updateProduct = (field, value) => {
    const errorKey = `products.${product.id}.${field}`;
    if (errors[errorKey]) {
      setErrors((prev) => ({
        ...prev,
        [errorKey]: '',
      }));
    }

    setProduct((prev) => ({ ...prev, [field]: value }));
  };

  const validateAddress = (type, address) => {
    const nextErrors = {};
    const useCityName = CITY_NAME_COUNTRIES.includes(address.country);
    const key = (field) => `${type}.${field}`;

    if (!address.companyName.trim()) nextErrors[key('companyName')] = 'Company name is required';
    if (!address.country) nextErrors[key('country')] = 'Country is required';
    if (!address.pincode.trim()) nextErrors[key('pincode')] = useCityName ? 'City is required' : 'Pincode is required';
    if (!address.mobileNo.trim()) {
      nextErrors[key('mobileNo')] = 'Mobile number is required';
    } else if (!/^\d{10,15}$/.test(address.mobileNo.replace(/[\s-]/g, ''))) {
      nextErrors[key('mobileNo')] = 'Please enter a valid mobile number';
    }
    if (!address.fullName.trim()) nextErrors[key('fullName')] = 'Full name is required';
    if (!address.completeAddress.trim()) nextErrors[key('completeAddress')] = 'Complete address is required';
    if (!address.landmark.trim()) nextErrors[key('landmark')] = 'Landmark is required';
    if (!address.city.trim()) nextErrors[key('city')] = 'City is required';
    if (!address.state.trim()) nextErrors[key('state')] = 'State is required';
    if (address.alternateNo && !/^\d{10,15}$/.test(address.alternateNo.replace(/[\s-]/g, ''))) {
      nextErrors[key('alternateNo')] = 'Please enter a valid alternate number';
    }
    if (address.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(address.email)) {
      nextErrors[key('email')] = 'Please enter a valid email address';
    }

    return nextErrors;
  };

  const validateForm = () => {
    const pickupErrors = validateAddress('pickup', pickupAddress);
    const destinationErrors = validateAddress('destination', destinationAddress);
    const productErrors = {};

    if (!product.name.trim()) {
      productErrors[`products.${product.id}.name`] = 'Product name is required';
    }
    if (!product.unitPrice || Number(product.unitPrice) <= 0) {
      productErrors[`products.${product.id}.unitPrice`] = 'Invoice value must be greater than 0';
    }

    const nextErrors = { ...pickupErrors, ...destinationErrors, ...productErrors };
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitted) {
      return;
    }
    if (!validateForm()) {
      toast.error('Please fill in all required fields correctly.');
      return;
    }

    try {
      setSubmitting(true);
      await api.submitPublicAddressForm(formCode, {
        pickupAddress,
        destinationAddress,
        products: [product],
      });
      setSubmitted(true);
      toast.success('Address details submitted successfully.');
    } catch (err) {
      toast.error(err.message || 'Failed to submit form.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="public-form-page">
        <div className="public-form-card">
          <p>Loading form...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="public-form-page">
        <div className="public-form-card">
          <h1>Address Form</h1>
          <p className="public-form-error">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="public-form-page">
      <div className="public-form-card">
        <h1>Address Form</h1>
        <p className="public-form-subtitle">Code: {formCode}</p>

        {submitted && (
          <p className="public-form-success">
            This form has already been submitted.
          </p>
        )}

        <form onSubmit={handleSubmit} className="public-form">
          <AddressFields
            prefix="pickup"
            value={pickupAddress}
            errors={errors}
            onChange={(field, value) => updateAddress('pickup', field, value)}
            disabled={submitted}
          />
          <AddressFields
            prefix="destination"
            value={destinationAddress}
            errors={errors}
            onChange={(field, value) => updateAddress('destination', field, value)}
            disabled={submitted}
          />
          <ProductFields
            product={product}
            errors={errors}
            onChange={updateProduct}
            disabled={submitted}
          />

          {!submitted && (
            <button type="submit" className="public-submit-btn" disabled={submitting}>
              {submitting ? 'Submitting...' : 'Submit Address Details'}
            </button>
          )}
        </form>
      </div>
    </div>
  );
}

export default AddressFormPublic;
