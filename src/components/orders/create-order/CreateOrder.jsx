import { Fragment, useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../../../services/api';
import { useNavigate, Link, useSearchParams, useLocation } from 'react-router-dom';
import { formatCurrency } from '../../../utils/currency';
import { toCreateOrderPrefill, extractAddressFormPayload } from '../../../utils/addressForms';
import { calculateInvoiceTotal, syncInvoiceProduct } from '../../../utils/invoiceValues';
import {
  normalizeSavedBoxDetail,
  toPackagesFromSavedBoxDetail,
} from '../../../utils/boxDetails';
import {
  normalizeContactDetail,
  normalizeContactSuggestions,
  toContactDetailPayload,
} from '../../../utils/contactDetails';
import {
  applyDeliveryContactToFormData,
  applyPickupContactToFormData,
  loadSavedDeliveryContacts,
  loadSavedPickupContacts,
  toDeliveryContactPayload,
  toPickupContactPayload,
} from '../../../utils/savedContacts';
import { toCreateOrderFormPrefill } from '../../../utils/orderActions';
import './CreateOrder.css';
import ImportantNotes from '../../shipping/ImportantNotes';

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

const formatQuoteAmount = (amount, currency = 'AED') => {
  const numericAmount = Number(amount) || 0;
  try {
    return new Intl.NumberFormat('en-AE', {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(numericAmount);
  } catch {
    return `${formatCurrency(numericAmount)} ${currency}`;
  }
};

const formatWeight = (value, unit = 'kg') => {
  const numericValue = Number(value);

  if (!Number.isFinite(numericValue)) {
    return null;
  }

  const formattedValue = Number.isInteger(numericValue)
    ? numericValue
    : numericValue.toFixed(2);

  return `${formattedValue} ${unit}`;
};

const isOfferConditionSatisfied = (offer) => {
  if (!offer) return false;

  const currentActualWeight = Number(offer.current?.actualWeight);
  const currentChargeableWeight = Number(offer.current?.chargeableWeight);
  const minimumActualWeight = Number(offer.thresholds?.minimumActualWeight);
  const minimumChargeableWeight = Number(offer.thresholds?.minimumChargeableWeight);

  const meetsActualWeight =
    !Number.isFinite(minimumActualWeight) ||
    minimumActualWeight <= 0 ||
    (Number.isFinite(currentActualWeight) && currentActualWeight >= minimumActualWeight);

  const meetsChargeableWeight =
    !Number.isFinite(minimumChargeableWeight) ||
    minimumChargeableWeight <= 0 ||
    (Number.isFinite(currentChargeableWeight) && currentChargeableWeight >= minimumChargeableWeight);

  return meetsActualWeight && meetsChargeableWeight;
};

const isFedExCarrier = (carrierName = '') => carrierName.toLowerCase().includes('fedex');

const getOfferCarrierName = (offer) => (offer?.carrier || '').toLowerCase();


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

const PRE_CREATE_ORDER_NOTICES = [
  "NOTE :- VERY HIGH VALUE SHIPMENT , PLEASE INSURE IT EXTERNALLY OUR QUOTATIONS DOESN'T INCLUDE INSUARANCE CHARGES , MAXIMUM LIABILITY TOWARDS ANY LOSS OR DAMAGE WILL BE LIMITED TO 100 USD ONLY FROM AWATMCLLC.",
  'ALSO INFORM SHIPPER TO APPLY THE CORRECT LABELS ON ALL THE SIDES OF THE BOXES , ATLEASE 1 COPIES ON EACH SIDE.',
  'Dear Customer ,\n\nKindly confirm on the last page of self dispatch link option to get your shipment collected.',
  'Please note that the collection has been registered online with DHL under the pickup reference number\nAttached is the AWB, Please take the print out of the attached AWB and hand it over to DHL Courier person along with 3 copies of Invoice and packing list,\nPls call DHL office and connect the shipment ASAP, Ensure that you quote the pickup reference number\n\nwhile calling DHL for the collection.\nKindly inform DHL that this is an online booking.\n\nYour courier Pickup has been scheduled as follows:',
  'The UAE Ministry of Foreign Affairs and International Cooperation (MOFAIC) has issued a notice on the launch of eDAS 2.0, an online platform for attesting documents required for imported goods. Effective September 1, 2024, companies in the UAE should meet the following requirements to ensure smooth clearance of goods into the UAE\n• Registration on eDAS 2.0: All companies, even those previously registered on eDAS, must register on eDAS 2.0 using this link: https://www.mofa.gov.ae/en/Services/EDAS-Attestation-v2 and complete manual registration using their Company Trade License details.\n• Attestation documents: The following documents are required to be attested:\n1. Commercial Invoice (AED 150/- + VAT) and Service fees\n2. COO (Country of Origin) - If unavailable then MOFAIC can create one for AED 150/- + VAT and Service fees\n\nPlease adhere to the guidelines to avoid clearance delays. Customers not registered on EDAS 2.0 will be unable to have their Invoices attested with MOFAIC and will end up paying penalty, if documents are not attested within 14 days.\nThe Ministry of Foreign Affairs and International Cooperation (MOFAIC), United Arab Emirates, has introduced a system for electronic attestation of Import commercial invoices.\nAll customers will require to get the Import Commercial invoices attested from MOFAIC If the value is more than 10000 AED for Customs Declarations with Dubai Customs effective from 01st February 2023\n\nhttps://www.mofaic.gov.ae/en/Services/attestation',
  'We are experiencing increased cases of Port/Airport Congestion, Equipment shortages and Capacity constraints; subsequent adverse impact to truck and landside capabilities as well. This problem is across Airports / Ports and terminals worldwide. AWAT MARINE CARGO LLC endeavors to meet all estimated schedules provided. However, we will not accept any liabilities for changes in schedules or transit delay caused as a result of the aforesaid challenges',
];

const INITIAL_ORDER_FORM_DATA = {
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
};

function CreateOrder() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const addressFormIdFromQuery = searchParams.get('addressFormId');

  const [formData, setFormData] = useState(INITIAL_ORDER_FORM_DATA);

  const [extractPrompt, setExtractPrompt] = useState(
    "Extract Shipper company name, address, postal code/city, phone number, contact person and email."
  );

  const [extractImage, setExtractImage] = useState(null);
  const [extractPreview, setExtractPreview] = useState("");
  const [extracting, setExtracting] = useState(false);
  const [products, setProducts] = useState([
    syncInvoiceProduct({
      id: 1,
      name: '',
      currency: 'AED',
      unitPrice: ''
    })
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
    dutyExemption: false,
    temporaryExportForRepairAndReturn: false,
    insurance: false,
  });
  const [invoiceFiles, setInvoiceFiles] = useState([]);
  const [packingListFiles, setPackingListFiles] = useState([]);

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [rateResult, setRateResult] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [rateError, setRateError] = useState(null);
  const [creatingQuoteIndex, setCreatingQuoteIndex] = useState(null);
  const [expandedQuoteIndex, setExpandedQuoteIndex] = useState(null);
  const [preCreateModalOpen, setPreCreateModalOpen] = useState(false);
  const [pendingQuoteSelection, setPendingQuoteSelection] = useState(null);
  const [creatingAddressFormLink, setCreatingAddressFormLink] = useState(false);
  const [loadingPrefill, setLoadingPrefill] = useState(false);
  const [selectedAddressFormId, setSelectedAddressFormId] = useState('');
  const [createdAddressForm, setCreatedAddressForm] = useState({
    code: '',
    url: '',
  });
  const [savedPackageCode, setSavedPackageCode] = useState('');
  const [loadingSavedPackage, setLoadingSavedPackage] = useState(false);
  const [rateCalculatorCode, setRateCalculatorCode] = useState('');
  const [loadingRateCalculatorCode, setLoadingRateCalculatorCode] = useState(false);
  const [savedPickupContacts, setSavedPickupContacts] = useState([]);
  const [savedDeliveryContacts, setSavedDeliveryContacts] = useState([]);
  const [pickupContactSuggestions, setPickupContactSuggestions] = useState([]);
  const [deliveryContactSuggestions, setDeliveryContactSuggestions] = useState([]);
  const [loadingPickupSuggestions, setLoadingPickupSuggestions] = useState(false);
  const [loadingDeliverySuggestions, setLoadingDeliverySuggestions] = useState(false);
  const [pickupSuggestionsOpen, setPickupSuggestionsOpen] = useState(false);
  const [deliverySuggestionsOpen, setDeliverySuggestionsOpen] = useState(false);
  const isUsingAddressForm = Boolean(addressFormIdFromQuery || selectedAddressFormId);
  const allOffers = rateResult?.offers || [];
  const satisfiedOffers = allOffers.filter(isOfferConditionSatisfied);
  const unsatisfiedOffers = allOffers.filter((offer) => !isOfferConditionSatisfied(offer));
  const hasFedExQuote = (rateResult?.quotes || []).some((quote) => isFedExCarrier(quote.carrier));
  const offersForCards = hasFedExQuote ? unsatisfiedOffers : allOffers;
  const fedExRowOffers = hasFedExQuote ? satisfiedOffers : [];

  const [deliveryExtractPrompt, setDeliveryExtractPrompt] = useState(
    "Extract Receiver company name, address, postal code/city, phone number, contact person and email."
  );

  const [deliveryExtractImage, setDeliveryExtractImage] = useState(null);
  const [deliveryExtractPreview, setDeliveryExtractPreview] = useState("");
  const [deliveryExtracting, setDeliveryExtracting] = useState(false);
  useEffect(() => {
    setSavedPickupContacts(loadSavedPickupContacts());
    setSavedDeliveryContacts(loadSavedDeliveryContacts());
  }, []);

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

  useEffect(() => {
    if (!pickupSuggestionsOpen) {
      return;
    }

    const query = formData.pickupCompanyName.trim();
    if (!query) {
      setPickupContactSuggestions([]);
      setLoadingPickupSuggestions(false);
      return;
    }

    const timeoutId = setTimeout(async () => {
      try {
        setLoadingPickupSuggestions(true);
        const response = await api.getContactDetailSuggestions(query, 'pickup');
        setPickupContactSuggestions(normalizeContactSuggestions(response));
      } catch (error) {
        console.error('Pickup contact suggestions error:', error);
        setPickupContactSuggestions([]);
      } finally {
        setLoadingPickupSuggestions(false);
      }
    }, 250);

    return () => clearTimeout(timeoutId);
  }, [formData.pickupCompanyName, pickupSuggestionsOpen]);

  useEffect(() => {
    if (!deliverySuggestionsOpen) {
      return;
    }

    const query = formData.deliveryCompanyName.trim();
    if (!query) {
      setDeliveryContactSuggestions([]);
      setLoadingDeliverySuggestions(false);
      return;
    }

    const timeoutId = setTimeout(async () => {
      try {
        setLoadingDeliverySuggestions(true);
        const response = await api.getContactDetailSuggestions(query, 'delivery');
        setDeliveryContactSuggestions(normalizeContactSuggestions(response));
      } catch (error) {
        console.error('Delivery contact suggestions error:', error);
        setDeliveryContactSuggestions([]);
      } finally {
        setLoadingDeliverySuggestions(false);
      }
    }, 250);

    return () => clearTimeout(timeoutId);
  }, [formData.deliveryCompanyName, deliverySuggestionsOpen]);

  useEffect(() => {
    const prefillOrder = location.state?.prefillOrder;
    if (!prefillOrder) return;

    const prefill = toCreateOrderFormPrefill(prefillOrder);
    setSelectedAddressFormId('');
    setFormData(prefill.formData);
    setProducts(prefill.products);
    setPackages(prefill.packages);
    setSavedPackageCode('');
    setCompliance(prefill.compliance);
    setInvoiceFiles([]);
    setPackingListFiles([]);
    setErrors({});
    setRateResult(null);
    setRateError(null);
    setExpandedQuoteIndex(null);
    setIsModalOpen(false);
    setPreCreateModalOpen(false);
    setPendingQuoteSelection(null);

    toast.success('Order details loaded into the create order form.');
    navigate(location.pathname, { replace: true });
  }, [location.pathname, location.state, navigate]);

  useEffect(() => {
    const addressFormId = searchParams.get('addressFormId');
    if (!addressFormId) return;

    const prefillFromAddressForm = async () => {
      try {
        setLoadingPrefill(true);
        const response = await api.getAddressFormById(addressFormId);
        const parsed = extractAddressFormPayload(response);
        const prefill = toCreateOrderPrefill(response);
        setSelectedAddressFormId(addressFormId);
        setFormData((prev) => ({ ...prev, ...prefill }));
        if (parsed.products.length > 0) {
          setProducts(parsed.products.map((product) => syncInvoiceProduct(product)));
        }
        toast.success(`Address form ${parsed.code || addressFormId} loaded.`);
      } catch (error) {
        setSelectedAddressFormId('');
        toast.error(error.message || 'Failed to prefill from address form.');
      } finally {
        setLoadingPrefill(false);
        const nextParams = new URLSearchParams(searchParams);
        nextParams.delete('addressFormId');
        setSearchParams(nextParams, { replace: true });
      }
    };

    prefillFromAddressForm();
  }, [searchParams, setSearchParams]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (name === 'pickupCompanyName') {
      setPickupSuggestionsOpen(true);
    }
    if (name === 'deliveryCompanyName') {
      setDeliverySuggestionsOpen(true);
    }
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleScreenshotUpload = (e) => {
  const file = e.target.files[0];
  if (!file) return;

  setExtractImage(file);
  setExtractPreview(URL.createObjectURL(file));
};

const handlePasteScreenshot = (e) => {
  const items = e.clipboardData?.items || [];

  for (const item of items) {
    if (item.type.startsWith("image")) {
      const file = item.getAsFile();

      setExtractImage(file);
      setExtractPreview(URL.createObjectURL(file));

      toast.success("Screenshot pasted successfully.");
      break;
    }
  }
};

const handleExtractAddress = async () => {
  if (!extractImage) {
    toast.error("Upload or paste a screenshot.");
    return;
  }

  try {
    setExtracting(true);

    const formData = new FormData();
    formData.append("screenshot", extractImage);
    formData.append("prompt", extractPrompt);

    const response = await api.extractText(formData);

    const data = response.data;

    setFormData(prev => ({
      ...prev,

      pickupCompanyName: data.companyName || "",
      pickupCompleteAddress: data.address || "",
      pickupPincode: data.postalCode || data.city || "",
      pickupMobileNo: data.phoneNumber || "",
      pickupFullName: data.contactPerson || "",
      pickupEmail: data.email || ""
    }));

    toast.success("Address extracted successfully.");
  } catch (err) {
    toast.error(err.message || "Extraction failed.");
  } finally {
    setExtracting(false);
  }
};

const handleDeliveryScreenshotUpload = (e) => {
  const file = e.target.files[0];
  if (!file) return;

  setDeliveryExtractImage(file);
  setDeliveryExtractPreview(URL.createObjectURL(file));
};

const handleDeliveryPasteScreenshot = (e) => {
  const items = e.clipboardData?.items || [];

  for (const item of items) {
    if (item.type.startsWith("image")) {
      const file = item.getAsFile();

      setDeliveryExtractImage(file);
      setDeliveryExtractPreview(URL.createObjectURL(file));

      toast.success("Screenshot pasted successfully.");
      break;
    }
  }
};

const handleExtractDeliveryAddress = async () => {
  if (!deliveryExtractImage) {
    toast.error("Upload or paste a screenshot.");
    return;
  }

  try {
    setDeliveryExtracting(true);

    const formData = new FormData();

    formData.append("screenshot", deliveryExtractImage);
    formData.append("prompt", deliveryExtractPrompt);

    const response = await api.extractText(formData);

    const data = response.data;

    setFormData((prev) => ({
      ...prev,
      deliveryCompanyName: data.companyName || "",
      deliveryCompleteAddress: data.address || "",
      deliveryPincode: data.postalCode || data.city || "",
      deliveryCity: data.city || "",
      deliveryMobileNo: data.phone || "",
      deliveryFullName: data.contactPerson || "",
      deliveryEmail: data.email || "",
    }));

    toast.success("Destination address extracted successfully.");
  } catch (err) {
    toast.error(err.message || "Extraction failed.");
  } finally {
    setDeliveryExtracting(false);
  }
};

  const handleInvoiceFilesChange = (e) => {
    setInvoiceFiles(Array.from(e.target.files || []));
    e.target.value = '';
  };

  const handlePackingListFilesChange = (e) => {
    setPackingListFiles(Array.from(e.target.files || []));
    e.target.value = '';
  };

  const handleRemoveInvoiceFile = (fileIndex) => {
    setInvoiceFiles((prev) => prev.filter((_, index) => index !== fileIndex));
  };

  const handleRemovePackingListFile = (fileIndex) => {
    setPackingListFiles((prev) => prev.filter((_, index) => index !== fileIndex));
  };

  const handleGenerateAddressFormLink = async () => {
    try {
      setCreatingAddressFormLink(true);
      const response = await api.createAddressForm();
      const payload = extractAddressFormPayload(response);
      const code = payload.code || '';
      const generatedUrl =
        response?.data?.publicUrl ||
        response?.publicUrl ||
        (code ? `${window.location.origin}/address-forms/${code}` : '');

      if (!code) {
        throw new Error('Address form code not returned by server.');
      }

      setCreatedAddressForm({ code, url: generatedUrl });
      toast.success('Shareable address form link created.');
    } catch (error) {
      toast.error(error.message || 'Failed to create shareable link.');
    } finally {
      setCreatingAddressFormLink(false);
    }
  };

  const handleCopyAddressFormLink = async () => {
    if (!createdAddressForm.url) return;

    try {
      await navigator.clipboard.writeText(createdAddressForm.url);
      toast.success('Link copied to clipboard.');
    } catch {
      toast.error('Could not copy link. Please copy it manually.');
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
    products.forEach((product) => {
      if (!product.name.trim()) {
        newErrors[`product_${product.id}_name`] = 'Product name is required';
      }
      if (calculateInvoiceTotal(product.invoiceValues) <= 0) {
        newErrors[`product_${product.id}_unitPrice`] = 'Total invoice value must be greater than 0';
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
      const invoiceValue = calculateInvoiceTotal(product.invoiceValues);
      return total + invoiceValue;
    }, 0);
  };

  const getSelectedCurrency = () => {
    const currencies = new Set(products.map(p => p.currency || 'AED'));
    return currencies.size === 1 ? [...currencies][0] : null;
  };

  const handleCreateOrder = (selectedQuote, quoteIndex) => {
    setPendingQuoteSelection({ selectedQuote, quoteIndex });
    setPreCreateModalOpen(true);
  };

  const handleClosePreCreateModal = () => {
    if (creatingQuoteIndex !== null) {
      return;
    }

    setPreCreateModalOpen(false);
    setPendingQuoteSelection(null);
  };

  const handleConfirmCreateOrder = async () => {
    if (!pendingQuoteSelection) {
      return;
    }

    const { selectedQuote, quoteIndex } = pendingQuoteSelection;
    setCreatingQuoteIndex(quoteIndex);

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
    const shipmentValue = calculateShipmentValue();
    const insuranceCharge = compliance.insurance ? Math.max(45, shipmentValue * 0.02) : 0;
    const selectedCurrency = getSelectedCurrency() || products[0]?.currency || selectedQuote.currency || 'AED';
    const detailedProducts = products.map((product) =>
      syncInvoiceProduct({
        ...product,
        invoiceValues: product.invoiceValues,
      })
    );
    const detailedPackages = packages.map((pkg, index) => ({
      id: pkg.id || index + 1,
      actualWeight: Number(pkg.actualWeight) || 0,
      length: Number(pkg.length) || 0,
      breadth: Number(pkg.breadth) || 0,
      height: Number(pkg.height) || 0,
    }));
  
    const orderObject = {
      pickupCountry: formData.pickupCountry,
      pickupPincode: formData.pickupPincode,
      destinationCountry: formData.deliveryCountry,
      destinationPincode: formData.deliveryPincode,
      actualWeight: Number(actualWeight.toFixed(2)),
      boxes,
      shipmentValue: shipmentValue,
      requireBOE: compliance.requireBOE,
      requireDO: compliance.requireDO,
      exportDeclaration: compliance.exportDeclaration,
      dutyExemption: compliance.dutyExemption,
      temporaryExportForRepairAndReturn: compliance.temporaryExportForRepairAndReturn,
      insurance: compliance.insurance,
      insuranceCharge,
      pickupCompanyName: formData.pickupCompanyName,
      pickupMobileNo: formData.pickupMobileNo,
      pickupFullName: formData.pickupFullName,
      pickupCompleteAddress: formData.pickupCompleteAddress,
      pickupLandmark: formData.pickupLandmark,
      pickupCity: formData.pickupCity,
      pickupState: formData.pickupState,
      pickupAlternateNo: formData.pickupAlternateNo,
      pickupEmail: formData.pickupEmail,
      deliveryCompanyName: formData.deliveryCompanyName,
      deliveryMobileNo: formData.deliveryMobileNo,
      deliveryFullName: formData.deliveryFullName,
      deliveryCompleteAddress: formData.deliveryCompleteAddress,
      deliveryLandmark: formData.deliveryLandmark,
      deliveryCity: formData.deliveryCity,
      deliveryState: formData.deliveryState,
      deliveryAlternateNo: formData.deliveryAlternateNo,
      deliveryEmail: formData.deliveryEmail,
      pickupAddress: {
        companyName: formData.pickupCompanyName,
        country: formData.pickupCountry,
        pincode: formData.pickupPincode,
        mobileNo: formData.pickupMobileNo,
        fullName: formData.pickupFullName,
        completeAddress: formData.pickupCompleteAddress,
        landmark: formData.pickupLandmark,
        city: formData.pickupCity,
        state: formData.pickupState,
        alternateNo: formData.pickupAlternateNo,
        email: formData.pickupEmail,
      },
      destinationAddress: {
        companyName: formData.deliveryCompanyName,
        country: formData.deliveryCountry,
        pincode: formData.deliveryPincode,
        mobileNo: formData.deliveryMobileNo,
        fullName: formData.deliveryFullName,
        completeAddress: formData.deliveryCompleteAddress,
        landmark: formData.deliveryLandmark,
        city: formData.deliveryCity,
        state: formData.deliveryState,
        alternateNo: formData.deliveryAlternateNo,
        email: formData.deliveryEmail,
      },
      products: detailedProducts,
      packages: detailedPackages,
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
        dutyExemption: compliance.dutyExemption,
        temporaryExportForRepairAndReturn: compliance.temporaryExportForRepairAndReturn,
        insurance: compliance.insurance,
        insuranceCharge,
      },
      orderMeta: {
        shipmentValueCurrency: selectedCurrency,
      },
      addressFormId: selectedAddressFormId || null,
    };
  
    // 🔥 LOG FINAL OBJECT
    console.group('📦 FINAL ORDER OBJECT');
    console.log(orderObject);
    console.groupEnd();

    try{
      const formPayload = new FormData();
      formPayload.append('order', JSON.stringify(orderObject));
      invoiceFiles.forEach((file) => {
        formPayload.append('invoices', file);
      });
      packingListFiles.forEach((file) => {
        formPayload.append('packing-lists', file);
      });

      // Call create order API
      const response = await api.createOrder(formPayload);
      
      if (response.success && response.data) {
        toast.success('Shipment created successfully!');
        const createdOrder = response.data;
        setSelectedAddressFormId('');
        setPreCreateModalOpen(false);
        setPendingQuoteSelection(null);
        handleReset(false);
        setLoading(false);
        setIsModalOpen(false);
        navigate('/orders/confirmed', {
          state: {
            order: createdOrder,
          },
        });
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (error) {
      console.error('Shipment creation error:', error);
      const errorMsg = error.message || 'Failed to create shipment. Please try again.';
      toast.error(errorMsg);
    } finally {
      setCreatingQuoteIndex(null);
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
    setExpandedQuoteIndex(null);
    
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
        shipmentValue: shipmentValue,
        requireBOE: compliance.requireBOE,
        requireDO: compliance.requireDO,
        exportDeclaration: compliance.exportDeclaration,
        dutyExemption: compliance.dutyExemption,
        temporaryExportForRepairAndReturn: compliance.temporaryExportForRepairAndReturn,
        insurance: compliance.insurance,
        insuranceCharge: compliance.insurance ? Math.max(45, shipmentValue * 0.02) : 0,
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
    setFormData(INITIAL_ORDER_FORM_DATA);
  
    setProducts([
      syncInvoiceProduct({ id: 1, name: '', currency: 'AED', unitPrice: '' })
    ]);
  
    setPackages([
      { id: 1, actualWeight: '', length: '', breadth: '', height: '' }
    ]);
    setCompliance({
      requireBOE: false,
      requireDO: false,
      exportDeclaration: false,
      dutyExemption: false,
      temporaryExportForRepairAndReturn: false,
      insurance: false,
    });
    setSavedPackageCode('');
    setInvoiceFiles([]);
    setPackingListFiles([]);
  
    setErrors({});
    setRateResult(null);
    setRateError(null);
    setCreatingQuoteIndex(null);
    setExpandedQuoteIndex(null);
    setIsModalOpen(false);
    setPreCreateModalOpen(false);
    setPendingQuoteSelection(null);
    if (showToast) {
      toast.info('Form reset successfully');
    }
  };
  

  const renderAddressSection = (prefix, title) => {
    const country = formData[`${prefix}Country`];
    const useCityName = CITY_NAME_COUNTRIES.includes(country);
    const isPickupSection = prefix === 'pickup';
    const isDeliverySection = prefix === 'delivery';
    const pickupSuggestions = isPickupSection ? pickupContactSuggestions : [];
    const deliverySuggestions = isDeliverySection ? deliveryContactSuggestions : [];
    
    return (
      <div className="address-section">
        <h2 className="section-title">{title}</h2>
        {isPickupSection && (
          <div className="saved-contact-tools">
            <div className="saved-contact-tools-copy">
              <h3>Saved Pickup Contacts</h3>
              <p>Save the current pickup contact, then reuse it by typing the company name.</p>
            </div>
            <button
              type="button"
              className="btn-save-contact"
              onClick={handleSavePickupContact}
            >
              Save Pickup Contact
            </button>
          </div>
        )}
        {isDeliverySection && (
          <div className="saved-contact-tools">
            <div className="saved-contact-tools-copy">
              <h3>Saved Delivery Contacts</h3>
              <p>Save the current delivery contact, then reuse it by typing the company name.</p>
            </div>
            <button
              type="button"
              className="btn-save-contact"
              onClick={handleSaveDeliveryContact}
            >
              Save Delivery Contact
            </button>
          </div>
        )}
        <div className="form-grid">
          <div className={`form-group ${isPickupSection || isDeliverySection ? 'company-suggestion-group' : ''}`}>
            <label htmlFor={`${prefix}CompanyName`}>
              Company Name <span className="required">*</span>
            </label>
            <input
              type="text"
              id={`${prefix}CompanyName`}
              name={`${prefix}CompanyName`}
              value={formData[`${prefix}CompanyName`]}
              onChange={handleChange}
              onFocus={() => {
                if (isPickupSection) {
                  setPickupSuggestionsOpen(true);
                }
                if (isDeliverySection) {
                  setDeliverySuggestionsOpen(true);
                }
              }}
              onBlur={() => {
                if (isPickupSection) {
                  setTimeout(() => setPickupSuggestionsOpen(false), 150);
                }
                if (isDeliverySection) {
                  setTimeout(() => setDeliverySuggestionsOpen(false), 150);
                }
              }}
              placeholder="Enter company name"
              className={errors[`${prefix}CompanyName`] ? 'error' : ''}
              autoComplete="off"
            />
            {isPickupSection && pickupSuggestionsOpen && pickupSuggestions.length > 0 && (
              <div className="company-suggestions">
                {pickupSuggestions.map((contact) => (
                  <button
                    key={`${contact.companyName}-${contact.mobileNo}-${contact.savedAt || ''}`}
                    type="button"
                    className="company-suggestion-item"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => handleApplyPickupContact(contact)}
                  >
                    <span className="company-suggestion-title">{contact.companyName}</span>
                    <span className="company-suggestion-meta">
                      {[contact.fullName, contact.mobileNo, contact.city].filter(Boolean).join(' • ')}
                    </span>
                  </button>
                ))}
              </div>
            )}
            {isPickupSection && pickupSuggestionsOpen && loadingPickupSuggestions && (
              <div className="company-suggestions company-suggestions-status">
                <span className="company-suggestion-meta">Loading suggestions...</span>
              </div>
            )}
            {isDeliverySection && deliverySuggestionsOpen && deliverySuggestions.length > 0 && (
              <div className="company-suggestions">
                {deliverySuggestions.map((contact) => (
                  <button
                    key={`${contact.companyName}-${contact.mobileNo}-${contact.savedAt || ''}`}
                    type="button"
                    className="company-suggestion-item"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => handleApplyDeliveryContact(contact)}
                  >
                    <span className="company-suggestion-title">{contact.companyName}</span>
                    <span className="company-suggestion-meta">
                      {[contact.fullName, contact.mobileNo, contact.city].filter(Boolean).join(' • ')}
                    </span>
                  </button>
                ))}
              </div>
            )}
            {isDeliverySection && deliverySuggestionsOpen && loadingDeliverySuggestions && (
              <div className="company-suggestions company-suggestions-status">
                <span className="company-suggestion-meta">Loading suggestions...</span>
              </div>
            )}
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
          ? syncInvoiceProduct({ ...product, [field]: value })
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

  const handleInvoiceValueChange = (productId, invoiceIndex, value) => {
    setProducts((prevProducts) =>
      prevProducts.map((product) => {
        if (product.id !== productId) {
          return product;
        }

        return syncInvoiceProduct({
          ...product,
          invoiceValues: product.invoiceValues.map((invoiceValue, currentIndex) =>
            currentIndex === invoiceIndex ? value : invoiceValue
          ),
        });
      })
    );

    const errorKey = `product_${productId}_unitPrice`;
    if (errors[errorKey]) {
      setErrors((prev) => ({
        ...prev,
        [errorKey]: '',
      }));
    }
  };

  const addInvoiceValue = (productId) => {
    setProducts((prevProducts) =>
      prevProducts.map((product) =>
        product.id === productId
          ? syncInvoiceProduct({
              ...product,
              invoiceValues: [...product.invoiceValues, ''],
            })
          : product
      )
    );
  };

  const removeInvoiceValue = (productId, invoiceIndex) => {
    setProducts((prevProducts) =>
      prevProducts.map((product) => {
        if (product.id !== productId || product.invoiceValues.length === 1) {
          return product;
        }

        return syncInvoiceProduct({
          ...product,
          invoiceValues: product.invoiceValues.filter((_, currentIndex) => currentIndex !== invoiceIndex),
        });
      })
    );
  };

  const addProduct = () => {
    const newId = Math.max(...products.map(p => p.id), 0) + 1;
    setProducts(prevProducts => [
      ...prevProducts,
      syncInvoiceProduct({
        id: newId,
        name: '',
        currency: 'AED',
        unitPrice: ''
      })
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

  const handleSavePickupContact = () => {
    const pickupContact = toPickupContactPayload(formData);

    if (!pickupContact.companyName) {
      toast.error('Enter pickup company name before saving contact details.');
      return;
    }

    if (!pickupContact.mobileNo || !pickupContact.fullName || !pickupContact.completeAddress) {
      toast.error('Enter the main pickup contact details before saving.');
      return;
    }

    const savePickup = async () => {
      try {
        const response = await api.saveContactDetail(
          toContactDetailPayload(pickupContact, 'pickup')
        );
        const savedContact = normalizeContactDetail(response);
        setSavedPickupContacts((prev) => [
          savedContact,
          ...prev.filter((item) => item.id !== savedContact.id && item.companyName !== savedContact.companyName),
        ]);
        setPickupContactSuggestions((prev) => [
          savedContact,
          ...prev.filter((item) => item.id !== savedContact.id && item.companyName !== savedContact.companyName),
        ]);
        setPickupSuggestionsOpen(false);
        toast.success(`Pickup contact saved for ${savedContact.companyName || pickupContact.companyName}.`);
      } catch (error) {
        console.error('Pickup contact save error:', error);
        toast.error(error.message || 'Failed to save pickup contact details.');
      }
    };

    savePickup();
  };

  const handleApplyPickupContact = (contact) => {
    const applyPickup = async () => {
      try {
        const response = contact.id ? await api.getContactDetailById(contact.id) : contact;
        const fullContact = normalizeContactDetail(response);
        setFormData((prev) => applyPickupContactToFormData(fullContact, prev));
        setPickupSuggestionsOpen(false);
        setErrors((prev) => {
          const nextErrors = { ...prev };
          [
            'pickupCompanyName',
            'pickupCountry',
            'pickupPincode',
            'pickupMobileNo',
            'pickupFullName',
            'pickupCompleteAddress',
            'pickupLandmark',
            'pickupCity',
            'pickupState',
            'pickupAlternateNo',
            'pickupEmail',
          ].forEach((key) => delete nextErrors[key]);
          return nextErrors;
        });
        toast.success(`Pickup details loaded for ${fullContact.companyName}.`);
      } catch (error) {
        console.error('Pickup contact fetch error:', error);
        toast.error(error.message || 'Failed to load pickup contact details.');
      }
    };

    applyPickup();
  };

  const handleSaveDeliveryContact = () => {
    const deliveryContact = toDeliveryContactPayload(formData);

    if (!deliveryContact.companyName) {
      toast.error('Enter delivery company name before saving contact details.');
      return;
    }

    if (!deliveryContact.mobileNo || !deliveryContact.fullName || !deliveryContact.completeAddress) {
      toast.error('Enter the main delivery contact details before saving.');
      return;
    }

    const saveDelivery = async () => {
      try {
        const response = await api.saveContactDetail(
          toContactDetailPayload(deliveryContact, 'delivery')
        );
        const savedContact = normalizeContactDetail(response);
        setSavedDeliveryContacts((prev) => [
          savedContact,
          ...prev.filter((item) => item.id !== savedContact.id && item.companyName !== savedContact.companyName),
        ]);
        setDeliveryContactSuggestions((prev) => [
          savedContact,
          ...prev.filter((item) => item.id !== savedContact.id && item.companyName !== savedContact.companyName),
        ]);
        setDeliverySuggestionsOpen(false);
        toast.success(`Delivery contact saved for ${savedContact.companyName || deliveryContact.companyName}.`);
      } catch (error) {
        console.error('Delivery contact save error:', error);
        toast.error(error.message || 'Failed to save delivery contact details.');
      }
    };

    saveDelivery();
  };

  const handleApplyDeliveryContact = (contact) => {
    const applyDelivery = async () => {
      try {
        const response = contact.id ? await api.getContactDetailById(contact.id) : contact;
        const fullContact = normalizeContactDetail(response);
        setFormData((prev) => applyDeliveryContactToFormData(fullContact, prev));
        setDeliverySuggestionsOpen(false);
        setErrors((prev) => {
          const nextErrors = { ...prev };
          [
            'deliveryCompanyName',
            'deliveryCountry',
            'deliveryPincode',
            'deliveryMobileNo',
            'deliveryFullName',
            'deliveryCompleteAddress',
            'deliveryLandmark',
            'deliveryCity',
            'deliveryState',
            'deliveryAlternateNo',
            'deliveryEmail',
          ].forEach((key) => delete nextErrors[key]);
          return nextErrors;
        });
        toast.success(`Delivery details loaded for ${fullContact.companyName}.`);
      } catch (error) {
        console.error('Delivery contact fetch error:', error);
        toast.error(error.message || 'Failed to load delivery contact details.');
      }
    };

    applyDelivery();
  };

  const handleLoadSavedPackage = async () => {
    const trimmedCode = savedPackageCode.trim();

    if (!trimmedCode) {
      toast.error('Enter a saved package code first.');
      return;
    }

    try {
      setLoadingSavedPackage(true);
      const response = await api.getBoxDetailByCode(trimmedCode);
      const savedBoxDetail = normalizeSavedBoxDetail(response);
      const mappedPackages = toPackagesFromSavedBoxDetail(savedBoxDetail);

      setPackages(mappedPackages);
      setSavedPackageCode(savedBoxDetail.code || trimmedCode);
      setErrors((prev) => {
        const nextErrors = { ...prev };
        Object.keys(nextErrors)
          .filter((key) => key.startsWith('package_'))
          .forEach((key) => delete nextErrors[key]);
        return nextErrors;
      });

      if (savedBoxDetail.weightUnit === 'pound' || savedBoxDetail.dimensionUnit === 'inches') {
        toast.success(`Package details loaded from ${savedBoxDetail.code || trimmedCode} and converted to kg/cm.`);
      } else {
        toast.success(`Package details loaded from ${savedBoxDetail.code || trimmedCode}.`);
      }
    } catch (loadError) {
      console.error('Load saved package error:', loadError);
      toast.error(loadError.message || 'Failed to load saved package details.');
    } finally {
      setLoadingSavedPackage(false);
    }
  };

  const handleLoadRateCalculatorDetails = async () => {
    const code = rateCalculatorCode.trim();
    if (!code) {
      toast.error('Enter a saved rate calculator code first.');
      return;
    }

    try {
      setLoadingRateCalculatorCode(true);
      const response = await api.getRateCalculatorDetails(code);
      const responseData = response?.data || response || {};
      const savedData = responseData.rateData || responseData.calculatorData || responseData.formData || responseData;
      const savedBoxes = Array.isArray(savedData.boxes) ? savedData.boxes : [];
      const packagesFromCalculator = savedBoxes.flatMap((box, boxIndex) => {
        const quantity = Math.max(1, Number.parseInt(box.quantity, 10) || 1);
        const totalWeight = Number(box.actualWeight ?? box.weight) || 0;
        const weightPerPackage = totalWeight / quantity;
        return Array.from({ length: quantity }, (_, quantityIndex) => ({
          id: boxIndex * 1000 + quantityIndex + 1,
          actualWeight: String(weightPerPackage || ''),
          length: String(box.length ?? ''),
          breadth: String(box.breadth ?? ''),
          height: String(box.height ?? ''),
        }));
      });
      const savedInvoiceValues = Array.isArray(savedData.invoiceValues)
        ? savedData.invoiceValues
        : [String(savedData.shipmentValue ?? '')];

      setFormData({
        ...INITIAL_ORDER_FORM_DATA,
        pickupCountry: String(savedData.pickupCountry || ''),
        pickupPincode: String(savedData.pickupPincode || ''),
        deliveryCountry: String(savedData.destinationCountry || savedData.deliveryCountry || ''),
        deliveryPincode: String(savedData.destinationPincode || savedData.deliveryPincode || ''),
      });
      setProducts([
        syncInvoiceProduct({
          id: 1,
          name: 'Shipment Item',
          currency: 'AED',
          invoiceValues: savedInvoiceValues,
        }),
      ]);
      setPackages(packagesFromCalculator.length > 0 ? packagesFromCalculator : [{ id: 1, actualWeight: '', length: '', breadth: '', height: '' }]);
      setCompliance({
        requireBOE: Boolean(savedData.requireBOE),
        requireDO: Boolean(savedData.requireDO),
        exportDeclaration: Boolean(savedData.exportDeclaration),
        dutyExemption: Boolean(savedData.dutyExemption),
        temporaryExportForRepairAndReturn: Boolean(savedData.temporaryExportForRepairAndReturn),
        insurance: Boolean(savedData.insurance),
      });
      setRateCalculatorCode(responseData.code || savedData.code || code);
      setErrors({});
      toast.success(`Rate calculator details loaded from ${responseData.code || savedData.code || code}.`);
    } catch (loadError) {
      toast.error(loadError.message || 'Failed to load rate calculator details.');
    } finally {
      setLoadingRateCalculatorCode(false);
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
                  Total Invoice Value <span className="required">*</span>
                </label>
                <span className="field-note">This will be visible in label</span>
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
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    readOnly
                    className={errors[`product_${product.id}_unitPrice`] ? 'error' : ''}
                  />
                </div>
                {errors[`product_${product.id}_unitPrice`] && (
                  <span className="error-message">{errors[`product_${product.id}_unitPrice`]}</span>
                )}
                <div className="invoice-values-list">
                  {product.invoiceValues.map((invoiceValue, invoiceIndex) => (
                    <div key={`product_${product.id}_invoice_${invoiceIndex}`} className="invoice-value-row">
                      <input
                        type="number"
                        value={invoiceValue}
                        onChange={(e) => handleInvoiceValueChange(product.id, invoiceIndex, e.target.value)}
                        placeholder={`Invoice value ${invoiceIndex + 1}`}
                        min="0"
                        step="0.01"
                      />
                      <button
                        type="button"
                        className="invoice-value-remove-btn"
                        onClick={() => removeInvoiceValue(product.id, invoiceIndex)}
                        disabled={product.invoiceValues.length === 1}
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    className="invoice-value-add-btn"
                    onClick={() => addInvoiceValue(product.id)}
                  >
                    Add Invoice Value
                  </button>
                </div>
              </div>
              {product.unitPrice && (
                <div className="form-group">
                  <label>Invoice Value</label>
                  <div className="product-total">
                    {getCurrencySymbol(product.currency)}
                    {(parseFloat(product.unitPrice) || 0).toFixed(2)}
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

        <div className="saved-package-tools">
          <div className="saved-package-tools-copy">
            <h3>Load Saved Package Details</h3>
            <p>Enter the saved code from Rate Calculator to fill package rows automatically.</p>
          </div>
          <div className="saved-package-tools-actions">
            <input
              type="text"
              value={savedPackageCode}
              onChange={(e) => setSavedPackageCode(e.target.value.toUpperCase())}
              placeholder="Enter saved code"
            />
            <button
              type="button"
              onClick={handleLoadSavedPackage}
              className="btn-load-package"
              disabled={loadingSavedPackage}
            >
              {loadingSavedPackage ? 'Loading...' : 'Load Package'}
            </button>
          </div>
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

  const renderDocumentSection = () => (
    <div className="document-section">
      <h2 className="section-title">Documents (Optional)</h2>
      <div className="form-grid">
        <div className="form-group">
          <label htmlFor="invoiceFiles">Invoice Upload</label>
          <input
            type="file"
            id="invoiceFiles"
            multiple
            onChange={handleInvoiceFilesChange}
            className="file-input"
          />
          {invoiceFiles.length > 0 && (
            <div className="file-list">
              {invoiceFiles.map((file, index) => (
                <div key={`${file.name}-${index}`} className="file-item">
                  <span className="file-name">{file.name}</span>
                  <button
                    type="button"
                    className="file-remove-btn"
                    onClick={() => handleRemoveInvoiceFile(index)}
                    aria-label={`Remove ${file.name}`}
                    title={`Remove ${file.name}`}
                  >
                    &times;
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="packingListFiles">Packaging List Upload</label>
          <input
            type="file"
            id="packingListFiles"
            multiple
            onChange={handlePackingListFilesChange}
            className="file-input"
          />
          {packingListFiles.length > 0 && (
            <div className="file-list">
              {packingListFiles.map((file, index) => (
                <div key={`${file.name}-${index}`} className="file-item">
                  <span className="file-name">{file.name}</span>
                  <button
                    type="button"
                    className="file-remove-btn"
                    onClick={() => handleRemovePackingListFile(index)}
                    aria-label={`Remove ${file.name}`}
                    title={`Remove ${file.name}`}
                  >
                    &times;
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="create-order">
      <div className="create-order-container">
        <div className="create-order-header">
          <h1>Create Order</h1>
          <p>Fill in the pickup and delivery details</p>
        </div>

        {!isUsingAddressForm && (
          <div className="address-form-tools">
            <div className="address-form-tools-main">
              <h3>Address Form Link</h3>
              <p>Create a public link to collect pickup and destination address details.</p>
              <div className="address-form-tools-actions">
                <button
                  type="button"
                  className="btn-submit"
                  onClick={handleGenerateAddressFormLink}
                  disabled={creatingAddressFormLink}
                >
                  {creatingAddressFormLink ? 'Generating Link...' : 'Generate Link'}
                </button>
                <Link to="/orders/address-forms" className="address-form-list-link">
                  Open Submitted Forms
                </Link>
              </div>
            </div>
            {createdAddressForm.code && (
              <div className="address-form-tools-result">
                <p><strong>Code:</strong> {createdAddressForm.code}</p>
                <p className="address-form-link">{createdAddressForm.url}</p>
                <button type="button" className="btn-copy-link" onClick={handleCopyAddressFormLink}>
                  Copy Link
                </button>
              </div>
            )}
            {loadingPrefill && <p className="prefill-loading-note">Loading selected form data...</p>}
          </div>
        )}
        <div className="rate-calculator-code-tools">
          <div>
            <h3>Load Saved Rate Calculator Details</h3>
            <p>Enter an RC code to fill the route, package details, invoice value, compliance options, and insurance selection.</p>
          </div>
          <div className="rate-calculator-code-actions">
            <input
              type="text"
              value={rateCalculatorCode}
              onChange={(event) => setRateCalculatorCode(event.target.value.toUpperCase())}
              placeholder="RC-123456"
              aria-label="Saved rate calculator code"
            />
            <button type="button" className="btn-load-rate-calculator" onClick={handleLoadRateCalculatorDetails} disabled={loadingRateCalculatorCode}>
              {loadingRateCalculatorCode ? 'Loading...' : 'Load Details'}
            </button>
          </div>
        </div>
        {isUsingAddressForm && loadingPrefill && <p className="prefill-loading-note">Loading selected form data...</p>}

        <form onSubmit={handleSubmit} className="create-order-form">
          <div
    className="document-section"
    onPaste={handlePasteScreenshot}
    tabIndex={0}
>
    <h2 className="section-title">
        AI Address Extractor
    </h2>

    <div className="form-grid">

        <div className="form-group">
            <label>Screenshot</label>

            <input
                type="file"
                accept="image/*"
                onChange={handleScreenshotUpload}
            />

            <small>
                Upload a screenshot or click here and press
                <strong> Ctrl + V </strong>
                to paste one.
            </small>

            {extractPreview && (
                <div
                    style={{
                        marginTop: 10
                    }}
                >
                    <img
                        src={extractPreview}
                        alt="preview"
                        style={{
                            maxWidth: 350,
                            borderRadius: 8
                        }}
                    />
                </div>
            )}
        </div>

        <div className="form-group full-width">
            <label>Prompt</label>

            <textarea
                rows={4}
                value={extractPrompt}
                onChange={(e) => setExtractPrompt(e.target.value)}
            />
        </div>

    </div>

    <button
        type="button"
        className="btn-submit"
        onClick={handleExtractAddress}
        disabled={extracting}
    >
        {extracting ? "Extracting..." : "Extract Pickup Address"}
    </button>
</div>
          {renderAddressSection('pickup', 'Pickup Address')}

          <div
  className="document-section"
  onPaste={handleDeliveryPasteScreenshot}
  tabIndex={0}
>
  <h2 className="section-title">
    AI Destination Address Extractor
  </h2>

  <div className="form-grid">

    <div className="form-group">
      <label>Receiver Screenshot</label>

      <input
        type="file"
        accept="image/*"
        onChange={handleDeliveryScreenshotUpload}
      />

      <small>
        Upload a receiver screenshot or press <strong>Ctrl + V</strong>.
      </small>

      {deliveryExtractPreview && (
        <div style={{ marginTop: 10 }}>
          <img
            src={deliveryExtractPreview}
            alt="preview"
            style={{
              maxWidth: 350,
              borderRadius: 8
            }}
          />
        </div>
      )}
    </div>

    <div className="form-group full-width">
      <label>Prompt</label>

      <textarea
        rows={4}
        value={deliveryExtractPrompt}
        onChange={(e) => setDeliveryExtractPrompt(e.target.value)}
      />
    </div>

  </div>

  <button
    type="button"
    className="btn-submit"
    onClick={handleExtractDeliveryAddress}
    disabled={deliveryExtracting}
  >
    {deliveryExtracting
      ? "Extracting..."
      : "Extract Destination Address"}
  </button>
</div>
          {renderAddressSection('delivery', 'Delivery Address')}
          {renderProductSection()}
          {renderPackageSection()}
          {renderDocumentSection()}

          <div className="compliance-section">
          <h3 className="section-title">Compliance & Declarations</h3>

          <div className="checkbox-group compliance-option">
              <input
                id="requireBOE"
                type="checkbox"
                checked={compliance.requireBOE}
                onChange={(e) =>
                  setCompliance(prev => ({ ...prev, requireBOE: e.target.checked }))
                }
              />
            <label htmlFor="requireBOE">
              Require BOE (Bill of Entry) - Fee: 100 AED
            </label>
          </div>

          <div className="checkbox-group compliance-option">
            <input
              id="requireDO"
              type="checkbox"
              checked={compliance.requireDO}
              onChange={(e) =>
                setCompliance(prev => ({ ...prev, requireDO: e.target.checked }))
              }
            />
            <label htmlFor="requireDO">
              Require D/O (Delivery Order) - Fee: 100 AED
            </label>
          </div>

          <div className="checkbox-group compliance-option">
            <input
              id="exportDeclaration"
              type="checkbox"
              checked={compliance.exportDeclaration}
              disabled={
                formData.pickupCountry === 'UAE' &&
                formData.deliveryCountry &&
                formData.deliveryCountry !== 'UAE'
              }
            />
            <label htmlFor="exportDeclaration">
              Export Declaration (Mandatory for UAE exports) - Fee: 120 AED
            </label>
            {formData.pickupCountry === 'UAE' &&
              formData.deliveryCountry &&
              formData.deliveryCountry !== 'UAE' && (
                <p className="charge-note">
                  This fee is applied automatically for UAE export shipments.
                </p>
              )}
          </div>

          <div className="radio-group">
            <span className="radio-group-title">Duty Exemption</span>
            <div className="radio-options">
              <label className="compliance-option compliance-radio-option" htmlFor="dutyExemptionYes">
              <input
                id="dutyExemptionYes"
                type="radio"
                name="dutyExemption"
                checked={compliance.dutyExemption === true}
                onChange={() =>
                  setCompliance(prev => ({ ...prev, dutyExemption: true }))
                }
              />
              Yes
            </label>
              <label className="compliance-option compliance-radio-option" htmlFor="dutyExemptionNo">
              <input
                id="dutyExemptionNo"
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

          <div className="radio-group">
            <span className="radio-group-title">Temporary Export For Repair And Return</span>
            <div className="radio-options">
              <label
                className="compliance-option compliance-radio-option"
                htmlFor="temporaryExportForRepairAndReturnYes"
              >
                <input
                  id="temporaryExportForRepairAndReturnYes"
                  type="radio"
                  name="temporaryExportForRepairAndReturn"
                  checked={compliance.temporaryExportForRepairAndReturn === true}
                  onChange={() =>
                    setCompliance(prev => ({ ...prev, temporaryExportForRepairAndReturn: true }))
                  }
                />
                Yes
              </label>
              <label
                className="compliance-option compliance-radio-option"
                htmlFor="temporaryExportForRepairAndReturnNo"
              >
                <input
                  id="temporaryExportForRepairAndReturnNo"
                  type="radio"
                  name="temporaryExportForRepairAndReturn"
                  checked={compliance.temporaryExportForRepairAndReturn === false}
                  onChange={() =>
                    setCompliance(prev => ({ ...prev, temporaryExportForRepairAndReturn: false }))
                  }
                />
                No
              </label>
            </div>
          </div>

          <div className="checkbox-group compliance-option">
            <input
              id="insurance"
              type="checkbox"
              checked={compliance.insurance}
              onChange={(e) => setCompliance(prev => ({ ...prev, insurance: e.target.checked }))}
            />
            <label htmlFor="insurance">Add Shipment Insurance</label>
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
          <div className="app-modal-overlay" onClick={() => setIsModalOpen(false)}>
            <div className="app-modal app-modal--wide" onClick={(e) => e.stopPropagation()}>
              <div className="app-modal-header">
                <h2 className="app-modal-title">Rate Calculation Results</h2>
                <button className="app-modal-close" onClick={() => setIsModalOpen(false)}>
                  ×
                </button>
              </div>
              <div className="app-modal-body">
                {rateError ? (
                  <div className="error-message">
                    <p>{rateError}</p>
                  </div>
                ) : (
                  <>
                    {offersForCards.length > 0 && (
                      <div className="offers-section">
                        <h3>Available Offers</h3>
                        <div className="offers-list">
                          {offersForCards.map((offer, index) => {
                            const minimumActualWeight = formatWeight(offer.thresholds?.minimumActualWeight);
                            const minimumChargeableWeight = formatWeight(offer.thresholds?.minimumChargeableWeight);
                            const currentActualWeight = formatWeight(offer.current?.actualWeight);
                            const currentChargeableWeight = formatWeight(offer.current?.chargeableWeight);

                            return (
                              <div className="offer-card" key={offer.code || `${offer.title}-${index}`}>
                                <div className="offer-card-header">
                                  <h4>{offer.title || 'Special offer available'}</h4>
                                  {offer.code && <span className="offer-badge">{offer.code}</span>}
                                </div>

                                {offer.message && <p className="offer-message">{offer.message}</p>}

                                {(currentActualWeight || currentChargeableWeight || minimumActualWeight || minimumChargeableWeight) && (
                                  <div className="offer-metrics">
                                    {currentActualWeight && (
                                      <div className="offer-metric">
                                        <span>Current Actual Weight</span>
                                        <strong>{currentActualWeight}</strong>
                                      </div>
                                    )}
                                    {currentChargeableWeight && (
                                      <div className="offer-metric">
                                        <span>Current Chargeable Weight</span>
                                        <strong>{currentChargeableWeight}</strong>
                                      </div>
                                    )}
                                    {minimumActualWeight && (
                                      <div className="offer-metric">
                                        <span>Minimum Actual Weight</span>
                                        <strong>{minimumActualWeight}</strong>
                                      </div>
                                    )}
                                    {minimumChargeableWeight && (
                                      <div className="offer-metric">
                                        <span>Minimum Chargeable Weight</span>
                                        <strong>{minimumChargeableWeight}</strong>
                                      </div>
                                    )}
                                  </div>
                                )}

                                {offer.rules && offer.rules.length > 0 && (
                                  <ul className="offer-rules">
                                    {offer.rules.map((rule, ruleIndex) => (
                                      <li key={`${offer.code || index}-rule-${ruleIndex}`}>{rule}</li>
                                    ))}
                                  </ul>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

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
                              {rateResult.quotes.map((quote, index) => {
                                const breakdown = quote.costBreakdown || {};
                                const compliance = breakdown.complianceCharges || {};
                                const currency = breakdown.currency || quote.currency || 'AED';
                                const boeCharge = Number(compliance.boeCharge) || 0;
                                const doCharge = Number(compliance.doCharge) || 0;
                                const exportCharge = Number(compliance.exportDeclarationCharge) || 0;
                                const additionalCharge = Number(breakdown.additionalCharges) || 0;
                                const complianceAndAdditionalTotal = additionalCharge;
                                const showFedExOfferInfo = isFedExCarrier(quote.carrier) && fedExRowOffers.length > 0;
                                const matchingSatisfiedOffer = satisfiedOffers.find(
                                  (offer) => getOfferCarrierName(offer) === (quote.carrier || '').toLowerCase()
                                );
                                const discountedRatePerKg = Number(matchingSatisfiedOffer?.discountedRatePerKg);
                                const hasDiscountedRatePerKg = Number.isFinite(discountedRatePerKg) && discountedRatePerKg > 0;

                                return (
                                  <Fragment key={`${quote.carrier}-${index}`}>
                                    <tr
                                      className={`quote-row ${expandedQuoteIndex === index ? 'expanded' : ''} ${matchingSatisfiedOffer ? 'quote-row--discounted' : ''}`}
                                      onClick={() =>
                                        setExpandedQuoteIndex((current) =>
                                          current === index ? null : index
                                        )
                                      }
                                    >
                                      <td className="carrier-name">
                                        <div className="carrier-cell">
                                          <span>{quote.carrier}</span>
                                          <span className="quote-expand-indicator">
                                            {expandedQuoteIndex === index ? 'Hide cost details' : 'View cost details'}
                                          </span>
                                        </div>
                                      </td>
                                      <td className={`cost ${matchingSatisfiedOffer ? 'cost--discounted' : ''}`}>
                                        <div className="cost-cell">
                                          <span>{formatQuoteAmount(quote.cost, currency)}</span>
                                          {matchingSatisfiedOffer && (
                                            <span className="discount-pill">Discounted</span>
                                          )}
                                        </div>
                                      </td>
                                      <td>{quote.estimatedDelivery}</td>
                                      <td className="delivery-date">{quote.estimatedDeliveryReadable}</td>
                                      <td onClick={(e) => e.stopPropagation()}>
                                        <button
                                          className="btn-create-order"
                                          onClick={() => handleCreateOrder(quote, index)}
                                          disabled={creatingQuoteIndex !== null}
                                        >
                                          {creatingQuoteIndex === index ? 'Creating Order...' : 'Create Order'}
                                        </button>
                                      </td>
                                    </tr>
                                    {showFedExOfferInfo && (
                                      <tr className="quote-offer-row">
                                        <td colSpan="5">
                                          <div className="quote-offer-note">
                                            {fedExRowOffers.map((offer, offerIndex) => (
                                              <p key={offer.code || `${offer.title}-${offerIndex}`}>
                                                {offer.title || 'Offer applied'}
                                                {offer.message ? `: ${offer.message}` : ' is already applied to this FedEx rate.'}
                                                {Number.isFinite(Number(offer.discountedRatePerKg)) && Number(offer.discountedRatePerKg) > 0
                                                  ? ` Discounted rate: ${formatQuoteAmount(Number(offer.discountedRatePerKg), currency)}/kg.`
                                                  : ''}
                                              </p>
                                            ))}
                                          </div>
                                        </td>
                                      </tr>
                                    )}
                                    {expandedQuoteIndex === index && (
                                      <tr className="quote-breakdown-row">
                                        <td colSpan="5">
                                          <div className="quote-breakdown-grid">
                                            <div>
                                              <span>Rate/kg:</span>
                                              <strong className={hasDiscountedRatePerKg ? 'discounted-rate-text' : ''}>
                                                {formatQuoteAmount(
                                                  hasDiscountedRatePerKg ? discountedRatePerKg : breakdown.ratePerKg,
                                                  currency
                                                )}
                                              </strong>
                                            </div>
                                            <div>
                                              <span>Chargeable Weight:</span>
                                              <strong>{breakdown.weight ?? quote?.weight ?? 0} kg</strong>
                                            </div>
                                            <div>
                                              <span>Base Shipping:</span>
                                              <strong>{formatQuoteAmount(breakdown.baseShippingCost, currency)}</strong>
                                            </div>
                                            <div className="quote-breakdown-section">
                                              <span>Compliance & Additional Charges:</span>
                                              <strong>{formatQuoteAmount(complianceAndAdditionalTotal, currency)}</strong>
                                            </div>
                                            <div className="quote-breakdown-subline">
                                              <span>
                                                BOE {formatQuoteAmount(boeCharge, currency)} + D/O {formatQuoteAmount(doCharge, currency)} + Export {formatQuoteAmount(exportCharge, currency)}
                                              </span>
                                            </div>
                                            <div className="quote-breakdown-total">
                                              <span>Total Cost:</span>
                                              <strong>{formatQuoteAmount(breakdown.totalCost ?? quote.cost, currency)}</strong>
                                            </div>
                                          </div>
                                        </td>
                                      </tr>
                                    )}
                                  </Fragment>
                                );
                              })}
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
              <div className="app-modal-footer">
                <button
                  className="app-modal-primary-btn"
                  onClick={() => setIsModalOpen(false)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {preCreateModalOpen && (
          <div className="app-modal-overlay" onClick={handleClosePreCreateModal}>
            <div className="app-modal app-modal--wide app-modal--notice" onClick={(e) => e.stopPropagation()}>
              <div className="app-modal-header">
                <h2 className="app-modal-title">Confirm Before Creating Order</h2>
                <button
                  className="app-modal-close"
                  onClick={handleClosePreCreateModal}
                  disabled={creatingQuoteIndex !== null}
                >
                  ×
                </button>
              </div>
              <div className="app-modal-body">
                <div className="pre-create-notice-list">
                  {PRE_CREATE_ORDER_NOTICES.map((notice, index) => (
                    <div key={`pre-create-notice-${index}`} className="pre-create-notice-card">
                      <p>{notice}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="app-modal-footer">
                <button
                  className="app-modal-secondary-btn"
                  onClick={handleClosePreCreateModal}
                  disabled={creatingQuoteIndex !== null}
                >
                  Cancel
                </button>
                <button
                  className="app-modal-primary-btn"
                  onClick={handleConfirmCreateOrder}
                  disabled={creatingQuoteIndex !== null}
                >
                  {creatingQuoteIndex !== null ? 'Creating Order...' : 'Continue'}
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

