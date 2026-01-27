import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../../services/api';
import { useNavigate, Link } from 'react-router-dom';
import { formatCurrency, getCurrencyName } from '../../utils/currency';
import './CreateOrder.css';
import ImportantNotes from '../shipping/ImportantNotes';

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
  'EGYPT'
];

// Countries that use city name instead of pincode
const CITY_NAME_COUNTRIES = ['UAE', 'OMAN', 'QATAR', 'EGYPT'];

const CURRENCY_SYMBOLS = {
  AED: 'د.إ',
  USD: '$',
  EUR: '€',
  GBP: '£',
  INR: '₹',
  SAR: '﷼',
  CAD: '$',
  AUD: '$',
  CNY: '¥',
  KRW: '₩'
};

const getCurrencySymbol = (code = 'AED') => {
  return CURRENCY_SYMBOLS[code] || code;
};


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
  { code: 'KRW', label: 'KRW' }
];

// Calculate volumetric weight: (length × breadth × height) / 5000
const calculateVolumetricWeight = (length, breadth, height) => {
  if (!length || !breadth || !height) return 0;
  return (length * breadth * height) / 5000;
};

// Calculate chargeable weight: max(actual weight, volumetric weight)
const calculateChargeableWeight = (actualWeight, length, breadth, height) => {
  const volumetricWeight = calculateVolumetricWeight(length, breadth, height);
  return Math.max(actualWeight || 0, volumetricWeight);
};

function CreateOrder() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    // Pickup fields
    pickupCompanyName: '',
    pickupCountry: '',
    pickupPincode: '',
    pickupMobileNo: '',
    pickupFullName: '',
    pickupCompleteAddress: '',
    pickupLandmark: '',
    pickupCity: '',
    pickupState: '',
    pickupAlternateNo: '',
    pickupEmail: '',
    // Delivery fields
    deliveryCompanyName: '',
    deliveryCountry: '',
    deliveryPincode: '',
    deliveryMobileNo: '',
    deliveryFullName: '',
    deliveryCompleteAddress: '',
    deliveryLandmark: '',
    deliveryCity: '',
    deliveryState: '',
    deliveryAlternateNo: '',
    deliveryEmail: '',
  });

  const [products, setProducts] = useState([
    {
      id: 1,
      name: '',
      currency: 'AED',
      unitPrice: '',
      quantity: ''
    }
  ]);
  const [packages, setPackages] = useState([
    {
      id: 1,
      actualWeight: '',
      length: '',
      breadth: '',
      height: ''
    }
  ]);
  const [compliance, setCompliance] = useState({
    requireBOE: false,
    requireDO: false,
    exportDeclaration: false,
    dutyExemption: false
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [rateResult, setRateResult] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [rateError, setRateError] = useState(null);

  useEffect(() => {
    if (
      formData.pickupCountry === 'UAE' &&
      formData.deliveryCountry &&
      formData.deliveryCountry !== 'UAE'
    ) {
      setCompliance(prev => ({
        ...prev,
        exportDeclaration: true
      }));
    } else {
      setCompliance(prev => ({
        ...prev,
        exportDeclaration: false
      }));
    }
  }, [formData.pickupCountry, formData.deliveryCountry]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Validate pickup fields
    if (!formData.pickupCompanyName.trim()) {
      newErrors.pickupCompanyName = 'Company name is required';
    }
    if (!formData.pickupCountry) {
      newErrors.pickupCountry = 'Country is required';
    }
    if (!formData.pickupPincode.trim()) {
      const useCityName = CITY_NAME_COUNTRIES.includes(formData.pickupCountry);
      newErrors.pickupPincode = useCityName ? 'City is required' : 'Pincode is required';
    }
    if (!formData.pickupMobileNo.trim()) {
      newErrors.pickupMobileNo = 'Mobile number is required';
    } else if (!/^\d{10,15}$/.test(formData.pickupMobileNo.replace(/[\s-]/g, ''))) {
      newErrors.pickupMobileNo = 'Please enter a valid mobile number';
    }
    if (!formData.pickupFullName.trim()) {
      newErrors.pickupFullName = 'Full name is required';
    }
    if (!formData.pickupCompleteAddress.trim()) {
      newErrors.pickupCompleteAddress = 'Complete address is required';
    }
    if (!formData.pickupLandmark.trim()) {
      newErrors.pickupLandmark = 'Landmark is required';
    }
    if (!formData.pickupCity.trim()) {
      newErrors.pickupCity = 'City is required';
    }
    if (!formData.pickupState.trim()) {
      newErrors.pickupState = 'State is required';
    }
    if (formData.pickupAlternateNo && !/^\d{10,15}$/.test(formData.pickupAlternateNo.replace(/[\s-]/g, ''))) {
      newErrors.pickupAlternateNo = 'Please enter a valid alternate number';
    }
    if (formData.pickupEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.pickupEmail)) {
      newErrors.pickupEmail = 'Please enter a valid email address';
    }

    // Validate delivery fields
    if (!formData.deliveryCompanyName.trim()) {
      newErrors.deliveryCompanyName = 'Company name is required';
    }
    if (!formData.deliveryCountry) {
      newErrors.deliveryCountry = 'Country is required';
    }
    if (!formData.deliveryPincode.trim()) {
      const useCityName = CITY_NAME_COUNTRIES.includes(formData.deliveryCountry);
      newErrors.deliveryPincode = useCityName ? 'City is required' : 'Pincode is required';
    }
    if (!formData.deliveryMobileNo.trim()) {
      newErrors.deliveryMobileNo = 'Mobile number is required';
    } else if (!/^\d{10,15}$/.test(formData.deliveryMobileNo.replace(/[\s-]/g, ''))) {
      newErrors.deliveryMobileNo = 'Please enter a valid mobile number';
    }
    if (!formData.deliveryFullName.trim()) {
      newErrors.deliveryFullName = 'Full name is required';
    }
    if (!formData.deliveryCompleteAddress.trim()) {
      newErrors.deliveryCompleteAddress = 'Complete address is required';
    }
    if (!formData.deliveryLandmark.trim()) {
      newErrors.deliveryLandmark = 'Landmark is required';
    }
    if (!formData.deliveryCity.trim()) {
      newErrors.deliveryCity = 'City is required';
    }
    if (!formData.deliveryState.trim()) {
      newErrors.deliveryState = 'State is required';
    }
    if (formData.deliveryAlternateNo && !/^\d{10,15}$/.test(formData.deliveryAlternateNo.replace(/[\s-]/g, ''))) {
      newErrors.deliveryAlternateNo = 'Please enter a valid alternate number';
    }
    if (formData.deliveryEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.deliveryEmail)) {
      newErrors.deliveryEmail = 'Please enter a valid email address';
    }

    // Validate product fields
    products.forEach((product, index) => {
      if (!product.name.trim()) {
        newErrors[`product_${product.id}_name`] = 'Product name is required';
      }
      if (!product.unitPrice || parseFloat(product.unitPrice) <= 0) {
        newErrors[`product_${product.id}_unitPrice`] = 'Unit price must be greater than 0';
      }
      if (!product.quantity || parseInt(product.quantity) <= 0) {
        newErrors[`product_${product.id}_quantity`] = 'Quantity must be greater than 0';
      }
    });

    // Validate package details
    packages.forEach((pkg) => {
      if (!pkg.actualWeight || parseFloat(pkg.actualWeight) <= 0) {
        newErrors[`package_${pkg.id}_actualWeight`] = 'Actual weight must be greater than 0';
      }
      if (!pkg.length || parseFloat(pkg.length) <= 0) {
        newErrors[`package_${pkg.id}_length`] = 'Length must be greater than 0';
      }
      if (!pkg.breadth || parseFloat(pkg.breadth) <= 0) {
        newErrors[`package_${pkg.id}_breadth`] = 'Breadth must be greater than 0';
      }
      if (!pkg.height || parseFloat(pkg.height) <= 0) {
        newErrors[`package_${pkg.id}_height`] = 'Height must be greater than 0';
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const calculateShipmentValue = () => {
    return products.reduce((total, product) => {
      const price = parseFloat(product.unitPrice) || 0;
      const qty = parseInt(product.quantity) || 0;
      return total + (price * qty);
    }, 0);
  };

  const getSelectedCurrency = () => {
    const currencies = new Set(products.map(p => p.currency || 'AED'));
    return currencies.size === 1 ? [...currencies][0] : null;
  };

  const handleCreateOrder = async(selectedQuote) => {
    // Prepare boxes
    const boxes = packages.map(pkg => ({
      quantity: 1,
      actualWeight: Number(pkg.actualWeight),
      length: Number(pkg.length),
      breadth: Number(pkg.breadth),
      height: Number(pkg.height)
    }));
  
    // Calculate total chargeable weight
    const actualWeight = boxes.reduce((sum, box) => {
      const volumetric = (box.length * box.breadth * box.height) / 5000;
      const chargeable = Math.max(box.actualWeight, volumetric);
      return sum + chargeable;
    }, 0);

    const exportDeclarationCharge = compliance.exportDeclaration ? 120 : 0;
  
    const orderObject = {
      pickupCountry: formData.pickupCountry,
      pickupPincode: formData.pickupPincode,
      destinationCountry: formData.deliveryCountry,
      destinationPincode: formData.deliveryPincode,
      actualWeight: Number(actualWeight.toFixed(2)),
      boxes,
      shipmentValue: calculateShipmentValue(),
      carrier: {
        name: selectedQuote.carrier,
        cost: selectedQuote.cost,
        currency: selectedQuote.currency,
        estimatedDelivery: selectedQuote.estimatedDelivery,
        estimatedDeliveryReadable: selectedQuote.estimatedDeliveryReadable
      },
      compliance: {
        requireBOE: compliance.requireBOE,
        requireDO: compliance.requireDO,
        exportDeclaration: compliance.exportDeclaration,
        exportDeclarationCharge,
        dutyExemption: compliance.dutyExemption
      }
    };
  
    // 🔥 LOG FINAL OBJECT
    console.group('📦 FINAL ORDER OBJECT');
    console.log(orderObject);
    console.groupEnd();

    try{
      // Call create order API
      const response = await api.createOrder(orderObject);
      
      if (response.success && response.data) {
        toast.success('Shipment created successfully!');
        handleReset(false);
        setLoading(false);
        setIsModalOpen(false);
        navigate('/orders');
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (error) {
      console.error('Shipment creation error:', error);
      const errorMsg = error.message || 'Failed to create shipment. Please try again.';
      toast.error(errorMsg);
    } finally {
      setLoading(false);
      setIsModalOpen(false);
    }
  };
  
  

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Please fill in all required fields correctly');
      return;
    }

    setLoading(true);
    setRateError(null);
    setRateResult(null);
    
    try {
      // Calculate shipment value from products
      const shipmentValue = calculateShipmentValue();
      const selectedCurrency = getSelectedCurrency();
      if (!selectedCurrency) {
        toast.info('Multiple currencies selected. Using the first product currency for rate calculation.');
      }
      
      // Compute package weights
      const packageSummaries = packages.map((pkg) => {
        const actual = parseFloat(pkg.actualWeight) || 0;
        const length = parseFloat(pkg.length) || 0;
        const breadth = parseFloat(pkg.breadth) || 0;
        const height = parseFloat(pkg.height) || 0;
        const volumetric = calculateVolumetricWeight(length, breadth, height);
        const chargeable = Math.max(actual, volumetric);
        return {
          id: pkg.id,
          actual,
          length,
          breadth,
          height,
          volumetric,
          chargeable
        };
      });

      const totalChargeableWeight = packageSummaries.reduce((sum, pkg) => sum + pkg.chargeable, 0);

      // Prepare rate calculation data
      const rateData = {
        pickupCountry: formData.pickupCountry,
        pickupPincode: formData.pickupPincode,
        destinationCountry: formData.deliveryCountry,
        destinationPincode: formData.deliveryPincode,
        actualWeight: totalChargeableWeight,
        boxes: packageSummaries.map(pkg => ({
          quantity: 1,
          actualWeight: pkg.chargeable,
          length: pkg.length,
          breadth: pkg.breadth,
          height: pkg.height
        })),
        shipmentValue: shipmentValue
      };

      // Call rate calculation API
      const response = await api.calculateRate(rateData);
      
      if (response.success && response.data) {
        setRateResult(response.data);
        setIsModalOpen(true);
        toast.success('Rate calculated successfully!');
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (error) {
      console.error('Rate calculation error:', error);
      const errorMsg = error.message || 'Failed to calculate rate. Please try again.';
      setRateError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = (showToast = true) => {
    setFormData({
      pickupCompanyName: '',
      pickupCountry: '',
      pickupPincode: '',
      pickupMobileNo: '',
      pickupFullName: '',
      pickupCompleteAddress: '',
      pickupLandmark: '',
      pickupCity: '',
      pickupState: '',
      pickupAlternateNo: '',
      pickupEmail: '',
      deliveryCompanyName: '',
      deliveryCountry: '',
      deliveryPincode: '',
      deliveryMobileNo: '',
      deliveryFullName: '',
      deliveryCompleteAddress: '',
      deliveryLandmark: '',
      deliveryCity: '',
      deliveryState: '',
      deliveryAlternateNo: '',
      deliveryEmail: '',
    });
  
    setProducts([
      { id: 1, name: '', currency: 'AED', unitPrice: '', quantity: '' }
    ]);
  
    setPackages([
      { id: 1, actualWeight: '', length: '', breadth: '', height: '' }
    ]);
  
    setErrors({});
    setRateResult(null);
    setRateError(null);
    setIsModalOpen(false);
    if (showToast) {
      toast.info('Form reset successfully');
    }
  };
  

  const renderAddressSection = (prefix, title) => {
    const country = formData[`${prefix}Country`];
    const useCityName = CITY_NAME_COUNTRIES.includes(country);
    
    return (
      <div className="address-section">
        <h2 className="section-title">{title}</h2>
        <div className="form-grid">
          <div className="form-group">
            <label htmlFor={`${prefix}CompanyName`}>
              Company Name <span className="required">*</span>
            </label>
            <input
              type="text"
              id={`${prefix}CompanyName`}
              name={`${prefix}CompanyName`}
              value={formData[`${prefix}CompanyName`]}
              onChange={handleChange}
              placeholder="Enter company name"
              className={errors[`${prefix}CompanyName`] ? 'error' : ''}
            />
            {errors[`${prefix}CompanyName`] && (
              <span className="error-message">{errors[`${prefix}CompanyName`]}</span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor={`${prefix}Country`}>
              Country <span className="required">*</span>
            </label>
            <select
              id={`${prefix}Country`}
              name={`${prefix}Country`}
              value={formData[`${prefix}Country`]}
              onChange={handleChange}
              className={errors[`${prefix}Country`] ? 'error' : ''}
            >
              <option value="">Select Country</option>
              {COUNTRIES.map(country => (
                <option key={country} value={country}>{country}</option>
              ))}
            </select>
            {errors[`${prefix}Country`] && (
              <span className="error-message">{errors[`${prefix}Country`]}</span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor={`${prefix}Pincode`}>
              {useCityName ? 'City' : 'Pincode'} <span className="required">*</span>
            </label>
            <input
              type="text"
              id={`${prefix}Pincode`}
              name={`${prefix}Pincode`}
              value={formData[`${prefix}Pincode`]}
              onChange={handleChange}
              placeholder={useCityName ? 'Enter city' : 'Enter pincode'}
              className={errors[`${prefix}Pincode`] ? 'error' : ''}
            />
            {errors[`${prefix}Pincode`] && (
              <span className="error-message">{errors[`${prefix}Pincode`]}</span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor={`${prefix}MobileNo`}>
              Mobile No. <span className="required">*</span>
            </label>
            <input
              type="tel"
              id={`${prefix}MobileNo`}
              name={`${prefix}MobileNo`}
              value={formData[`${prefix}MobileNo`]}
              onChange={handleChange}
              placeholder="Enter mobile number"
              className={errors[`${prefix}MobileNo`] ? 'error' : ''}
            />
            {errors[`${prefix}MobileNo`] && (
              <span className="error-message">{errors[`${prefix}MobileNo`]}</span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor={`${prefix}FullName`}>
              Full Name <span className="required">*</span>
            </label>
            <input
              type="text"
              id={`${prefix}FullName`}
              name={`${prefix}FullName`}
              value={formData[`${prefix}FullName`]}
              onChange={handleChange}
              placeholder="Enter full name"
              className={errors[`${prefix}FullName`] ? 'error' : ''}
            />
            {errors[`${prefix}FullName`] && (
              <span className="error-message">{errors[`${prefix}FullName`]}</span>
            )}
          </div>

          <div className="form-group full-width">
            <label htmlFor={`${prefix}CompleteAddress`}>
              Complete Address <span className="required">*</span>
            </label>
            <textarea
              id={`${prefix}CompleteAddress`}
              name={`${prefix}CompleteAddress`}
              value={formData[`${prefix}CompleteAddress`]}
              onChange={handleChange}
              placeholder="Enter complete address"
              rows="3"
              className={errors[`${prefix}CompleteAddress`] ? 'error' : ''}
            />
            {errors[`${prefix}CompleteAddress`] && (
              <span className="error-message">{errors[`${prefix}CompleteAddress`]}</span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor={`${prefix}Landmark`}>
              Landmark <span className="required">*</span>
            </label>
            <input
              type="text"
              id={`${prefix}Landmark`}
              name={`${prefix}Landmark`}
              value={formData[`${prefix}Landmark`]}
              onChange={handleChange}
              placeholder="Enter landmark"
              className={errors[`${prefix}Landmark`] ? 'error' : ''}
            />
            {errors[`${prefix}Landmark`] && (
              <span className="error-message">{errors[`${prefix}Landmark`]}</span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor={`${prefix}City`}>
              City <span className="required">*</span>
            </label>
            <input
              type="text"
              id={`${prefix}City`}
              name={`${prefix}City`}
              value={formData[`${prefix}City`]}
              onChange={handleChange}
              placeholder="Enter city"
              className={errors[`${prefix}City`] ? 'error' : ''}
            />
            {errors[`${prefix}City`] && (
              <span className="error-message">{errors[`${prefix}City`]}</span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor={`${prefix}State`}>
              State <span className="required">*</span>
            </label>
            <input
              type="text"
              id={`${prefix}State`}
              name={`${prefix}State`}
              value={formData[`${prefix}State`]}
              onChange={handleChange}
              placeholder="Enter state"
              className={errors[`${prefix}State`] ? 'error' : ''}
            />
            {errors[`${prefix}State`] && (
              <span className="error-message">{errors[`${prefix}State`]}</span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor={`${prefix}AlternateNo`}>
              Alternate No. <span className="optional">(Optional)</span>
            </label>
            <input
              type="tel"
              id={`${prefix}AlternateNo`}
              name={`${prefix}AlternateNo`}
              value={formData[`${prefix}AlternateNo`]}
              onChange={handleChange}
              placeholder="Enter alternate number"
              className={errors[`${prefix}AlternateNo`] ? 'error' : ''}
            />
            {errors[`${prefix}AlternateNo`] && (
              <span className="error-message">{errors[`${prefix}AlternateNo`]}</span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor={`${prefix}Email`}>
              Email <span className="optional">(Optional)</span>
            </label>
            <input
              type="email"
              id={`${prefix}Email`}
              name={`${prefix}Email`}
              value={formData[`${prefix}Email`]}
              onChange={handleChange}
              placeholder="Enter email address"
              className={errors[`${prefix}Email`] ? 'error' : ''}
            />
            {errors[`${prefix}Email`] && (
              <span className="error-message">{errors[`${prefix}Email`]}</span>
            )}
          </div>
        </div>
      </div>
    );
  };

  const handleProductChange = (productId, field, value) => {
    setProducts(prevProducts =>
      prevProducts.map(product =>
        product.id === productId
          ? { ...product, [field]: value }
          : product
      )
    );
    // Clear error when user starts typing
    const errorKey = `product_${productId}_${field}`;
    if (errors[errorKey]) {
      setErrors(prev => ({
        ...prev,
        [errorKey]: ''
      }));
    }
  };

  const addProduct = () => {
    const newId = Math.max(...products.map(p => p.id), 0) + 1;
    setProducts(prevProducts => [
      ...prevProducts,
      {
        id: newId,
        name: '',
        currency: 'AED',
        unitPrice: '',
        quantity: ''
      }
    ]);
  };

  const handlePackageChange = (packageId, field, value) => {
    setPackages(prev =>
      prev.map(pkg =>
        pkg.id === packageId ? { ...pkg, [field]: value } : pkg
      )
    );
    const errorKey = `package_${packageId}_${field}`;
    if (errors[errorKey]) {
      setErrors(prev => ({
        ...prev,
        [errorKey]: ''
      }));
    }
  };

  const addPackage = () => {
    const newId = Math.max(...packages.map(p => p.id), 0) + 1;
    setPackages(prev => [
      ...prev,
      {
        id: newId,
        actualWeight: '',
        length: '',
        breadth: '',
        height: ''
      }
    ]);
  };

  const removePackage = (packageId) => {
    if (packages.length > 1) {
      setPackages(prev => prev.filter(pkg => pkg.id !== packageId));
      const packageErrors = Object.keys(errors).filter(key => key.startsWith(`package_${packageId}_`));
      const newErrors = { ...errors };
      packageErrors.forEach(key => delete newErrors[key]);
      setErrors(newErrors);
    }
  };

  const removeProduct = (productId) => {
    if (products.length > 1) {
      setProducts(prevProducts => prevProducts.filter(product => product.id !== productId));
      // Clear errors for removed product
      const productErrors = Object.keys(errors).filter(key => key.startsWith(`product_${productId}_`));
      const newErrors = { ...errors };
      productErrors.forEach(key => delete newErrors[key]);
      setErrors(newErrors);
    }
  };

  const renderProductSection = () => {
    return (
      <div className="product-section">
        <div className="product-section-header">
          <h2 className="section-title">Product Details</h2>
        </div>

        {products.map((product, index) => (
          <div key={product.id} className="product-item">
            {products.length > 1 && (
              <div className="product-item-header">
                <span className="product-item-number">Product {index + 1}</span>
                <button
                  type="button"
                  onClick={() => removeProduct(product.id)}
                  className="btn-remove-product"
                  aria-label="Remove product"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
            )}
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor={`product_${product.id}_name`}>
                  Product Name <span className="required">*</span>
                </label>
                <input
                  type="text"
                  id={`product_${product.id}_name`}
                  value={product.name}
                  onChange={(e) => handleProductChange(product.id, 'name', e.target.value)}
                  placeholder="Enter product name"
                  className={errors[`product_${product.id}_name`] ? 'error' : ''}
                />
                {errors[`product_${product.id}_name`] && (
                  <span className="error-message">{errors[`product_${product.id}_name`]}</span>
                )}
              </div>

              <div className="form-group">
                <label htmlFor={`product_${product.id}_unitPrice`}>
                  Unit Price <span className="required">*</span>
                </label>
                <div className="currency-input-group">
                  <select
                    aria-label="Currency"
                    value={product.currency || 'AED'}
                    onChange={(e) => handleProductChange(product.id, 'currency', e.target.value)}
                    className="currency-select"
                  >
                    {PRODUCT_CURRENCIES.map((c) => (
                      <option key={c.code} value={c.code}>{c.label} ({getCurrencySymbol(c.code)})</option>
                    ))}
                  </select>
                  <input
                    type="number"
                    id={`product_${product.id}_unitPrice`}
                    value={product.unitPrice}
                    onChange={(e) => handleProductChange(product.id, 'unitPrice', e.target.value)}
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    className={errors[`product_${product.id}_unitPrice`] ? 'error' : ''}
                  />
                </div>
                {errors[`product_${product.id}_unitPrice`] && (
                  <span className="error-message">{errors[`product_${product.id}_unitPrice`]}</span>
                )}
              </div>

              <div className="form-group">
                <label htmlFor={`product_${product.id}_quantity`}>
                  Quantity <span className="required">*</span>
                </label>
                <input
                  type="number"
                  id={`product_${product.id}_quantity`}
                  value={product.quantity}
                  onChange={(e) => handleProductChange(product.id, 'quantity', e.target.value)}
                  placeholder="0"
                  min="1"
                  step="1"
                  className={errors[`product_${product.id}_quantity`] ? 'error' : ''}
                />
                {errors[`product_${product.id}_quantity`] && (
                  <span className="error-message">{errors[`product_${product.id}_quantity`]}</span>
                )}
              </div>

              {product.unitPrice && product.quantity && (
                <div className="form-group">
                  <label>Total</label>
                  <div className="product-total">
                    {getCurrencySymbol(product.currency)}
                    {(parseFloat(product.unitPrice) * parseInt(product.quantity) || 0).toFixed(2)}
                  </div>

                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderPackageSection = () => {
    const packageSummaries = packages.map(pkg => {
      const actualWeight = parseFloat(pkg.actualWeight) || 0;
      const length = parseFloat(pkg.length) || 0;
      const breadth = parseFloat(pkg.breadth) || 0;
      const height = parseFloat(pkg.height) || 0;
      const volumetricWeight = calculateVolumetricWeight(length, breadth, height);
      const chargeableWeight = calculateChargeableWeight(actualWeight, length, breadth, height);
      return { id: pkg.id, actualWeight, length, breadth, height, volumetricWeight, chargeableWeight };
    });

    const totalChargeable = packageSummaries.reduce((sum, pkg) => sum + pkg.chargeableWeight, 0);

    return (
      <div className="package-section">
        <div className="package-section-header">
          <h2 className="section-title">Package Details</h2>
          <button
            type="button"
            onClick={addPackage}
            className="btn-add-package"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Add Package
          </button>
        </div>

        {packages.map((pkg, index) => (
          <div key={pkg.id} className="package-item">
            {packages.length > 1 && (
              <div className="package-item-header">
                <span className="package-item-number">Package {index + 1}</span>
                <button
                  type="button"
                  onClick={() => removePackage(pkg.id)}
                  className="btn-remove-package"
                  aria-label="Remove package"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
            )}

            <div className="package-row">
              <div className="form-group">
                <label htmlFor={`package_${pkg.id}_actualWeight`}>
                  Actual Weight (kg) <span className="required">*</span>
                </label>
                <input
                  type="number"
                  id={`package_${pkg.id}_actualWeight`}
                  value={pkg.actualWeight}
                  onChange={(e) => handlePackageChange(pkg.id, 'actualWeight', e.target.value)}
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                  className={errors[`package_${pkg.id}_actualWeight`] ? 'error' : ''}
                />
                {errors[`package_${pkg.id}_actualWeight`] && (
                  <span className="error-message">{errors[`package_${pkg.id}_actualWeight`]}</span>
                )}
              </div>
            </div>

            <div className="package-row">
              <div className="form-grid dimensions-grid">
                <div className="form-group">
                  <label htmlFor={`package_${pkg.id}_length`}>
                    Length (cm) <span className="required">*</span>
                  </label>
                  <input
                    type="number"
                    id={`package_${pkg.id}_length`}
                    value={pkg.length}
                    onChange={(e) => handlePackageChange(pkg.id, 'length', e.target.value)}
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    className={errors[`package_${pkg.id}_length`] ? 'error' : ''}
                  />
                  {errors[`package_${pkg.id}_length`] && (
                    <span className="error-message">{errors[`package_${pkg.id}_length`]}</span>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor={`package_${pkg.id}_breadth`}>
                    Breadth (cm) <span className="required">*</span>
                  </label>
                  <input
                    type="number"
                    id={`package_${pkg.id}_breadth`}
                    value={pkg.breadth}
                    onChange={(e) => handlePackageChange(pkg.id, 'breadth', e.target.value)}
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    className={errors[`package_${pkg.id}_breadth`] ? 'error' : ''}
                  />
                  {errors[`package_${pkg.id}_breadth`] && (
                    <span className="error-message">{errors[`package_${pkg.id}_breadth`]}</span>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor={`package_${pkg.id}_height`}>
                    Height (cm) <span className="required">*</span>
                  </label>
                  <input
                    type="number"
                    id={`package_${pkg.id}_height`}
                    value={pkg.height}
                    onChange={(e) => handlePackageChange(pkg.id, 'height', e.target.value)}
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    className={errors[`package_${pkg.id}_height`] ? 'error' : ''}
                  />
                  {errors[`package_${pkg.id}_height`] && (
                    <span className="error-message">{errors[`package_${pkg.id}_height`]}</span>
                  )}
                </div>
              </div>
            </div>

            {(pkg.actualWeight || (pkg.length && pkg.breadth && pkg.height)) && (
              <div className="package-calculations">
                <div className="calculation-row">
                  <span className="calculation-label">Actual Weight:</span>
                  <span className="calculation-value">{packageSummaries.find(p => p.id === pkg.id)?.actualWeight.toFixed(2) || '0.00'} kg</span>
                </div>
                <div className="calculation-row">
                  <span className="calculation-label">Volumetric Weight:</span>
                  <span className="calculation-value">{packageSummaries.find(p => p.id === pkg.id)?.volumetricWeight.toFixed(2) || '0.00'} kg</span>
                </div>
                <div className="calculation-row chargeable">
                  <span className="calculation-label">Chargeable Weight:</span>
                  <span className="calculation-value">{packageSummaries.find(p => p.id === pkg.id)?.chargeableWeight.toFixed(2) || '0.00'} kg</span>
                </div>
              </div>
            )}
          </div>
        ))}

        <div className="package-total">
          <div className="calculation-row chargeable">
            <span className="calculation-label">Total Chargeable Weight:</span>
            <span className="calculation-value">{totalChargeable.toFixed(2)} kg</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="create-order">
      <div className="create-order-container">
        <div className="create-order-header">
          <h1>Create Order</h1>
          <p>Fill in the pickup and delivery details</p>
        </div>

        <form onSubmit={handleSubmit} className="create-order-form">
          {renderAddressSection('pickup', 'Pickup Address')}
          {renderAddressSection('delivery', 'Delivery Address')}
          {renderProductSection()}
          {renderPackageSection()}

          <div className="compliance-section">
          <h3 className="section-title">Compliance & Declarations</h3>

          <div className="checkbox-group">
              <input
                type="checkbox"
                checked={compliance.requireBOE}
                onChange={(e) =>
                  setCompliance(prev => ({ ...prev, requireBOE: e.target.checked }))
                }
              />
            <label htmlFor="">
              REQUIRE BOE 
            </label>
          </div>

          <div className="checkbox-group">
            <label>
              <input
                type="checkbox"
                checked={compliance.requireDO}
                onChange={(e) =>
                  setCompliance(prev => ({ ...prev, requireDO: e.target.checked }))
                }
              />
              REQUIRE D/O
            </label>
          </div>

          <div className="checkbox-group">
            <label>
              <input
                type="checkbox"
                checked={compliance.exportDeclaration}
                disabled={
                  formData.pickupCountry === 'UAE' &&
                  formData.deliveryCountry &&
                  formData.deliveryCountry !== 'UAE'
                }
              />
              EXPORT DECLARATION (Mandatory for UAE exports)
            </label>
            {formData.pickupCountry === 'UAE' &&
              formData.deliveryCountry &&
              formData.deliveryCountry !== 'UAE' && (
                <p className="charge-note">
                  Charges: <strong>120 AED</strong>
                </p>
              )}
          </div>

          <div className="radio-group">
            <label>DUTY EXEMPTION:</label>
            <label>
              <input
                type="radio"
                name="dutyExemption"
                checked={compliance.dutyExemption === true}
                onChange={() =>
                  setCompliance(prev => ({ ...prev, dutyExemption: true }))
                }
              />
              Yes
            </label>
            <label>
              <input
                type="radio"
                name="dutyExemption"
                checked={compliance.dutyExemption === false}
                onChange={() =>
                  setCompliance(prev => ({ ...prev, dutyExemption: false }))
                }
              />
              No
            </label>
          </div>
        </div>


          <div className="form-actions">
            <button
              type="button"
              className="btn-submit"
              onClick={handleReset}
              disabled={loading}
            >
              Reset
            </button>
            <button
              type="submit"
              className="btn-submit"
              disabled={loading}
            >
              {loading ? 'Creating Order...' : 'Create Order'}
            </button>
          </div>
        </form>

        {/* Rate Calculation Results Modal */}
        {isModalOpen && rateResult && (
          <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Rate Calculation Results</h2>
                <button className="modal-close" onClick={() => setIsModalOpen(false)}>
                  ×
                </button>
              </div>
              <div className="modal-body">
                {rateError ? (
                  <div className="error-message">
                    <p>{rateError}</p>
                  </div>
                ) : (
                  <>
                    {rateResult.quotes && rateResult.quotes.length > 0 ? (
                      <div className="quotes-table">
                        <h3>Available Shipping Services</h3>
                        <div className="table-container">
                          <table>
                            <thead>
                              <tr>
                                <th>Carrier</th>
                                <th>Cost</th>
                                <th>Delivery Time</th>
                                <th>Estimated Delivery</th>
                                <th>Action</th>
                              </tr>
                            </thead>
                            <tbody>
                              {rateResult.quotes.map((quote, index) => (
                                <tr key={index}>
                                  <td className="carrier-name">{quote.carrier}</td>
                                  <td className="cost">{formatCurrency(quote.cost)}</td>
                                  <td>{quote.estimatedDelivery}</td>
                                  <td className="delivery-date">{quote.estimatedDeliveryReadable}</td>
                                  <td>
                                    <button
                                      className="btn-create-order"
                                      onClick={() => handleCreateOrder(quote)}
                                    >
                                      Create Order
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ) : (
                      <div className="no-quotes">
                        <p>No shipping quotes available for this route.</p>
                      </div>
                    )}
                    
                    {rateResult && (
                      <div className="order-summary">
                        <h3>Order Summary</h3>
                        <div className="summary-details">
                          <div className="summary-item">
                            <span className="summary-label">Pickup:</span>
                            <span className="summary-value">
                              {rateResult.pickup?.country} - {rateResult.pickup?.pincode}
                            </span>
                          </div>
                          <div className="summary-item">
                            <span className="summary-label">Delivery:</span>
                            <span className="summary-value">
                              {rateResult.destination?.country} - {rateResult.destination?.pincode}
                            </span>
                          </div>
                          {rateResult.weight && (
                            <div className="summary-item">
                              <span className="summary-label">Weight:</span>
                              <span className="summary-value">
                                {rateResult.weight.actualWeight} {rateResult.weight.unit}
                              </span>
                            </div>
                          )}
                          {rateResult.shipmentValue && (
                            <div className="summary-item">
                              <span className="summary-label">Shipment Value:</span>
                              <span className="summary-value">
                                {formatCurrency(rateResult.shipmentValue.value)}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                    <ImportantNotes style={{ marginTop: '15px', padding: '10px', fontSize: '0.75rem' }} />
                  </>
                )}
              </div>
              <div className="modal-footer">
                <button
                  className="btn-modal-close"
                  onClick={() => setIsModalOpen(false)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default CreateOrder;

