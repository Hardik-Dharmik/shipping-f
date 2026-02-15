export const ADDRESS_FIELD_KEYS = {
  companyName: ['companyName', 'company_name', 'company', 'organization'],
  country: ['country', 'countryCode', 'country_code'],
  pincode: ['pincode', 'pinCode', 'postalCode', 'postal_code', 'zip', 'zipCode', 'zip_code'],
  mobileNo: ['mobileNo', 'mobile_no', 'mobile', 'phone', 'phoneNumber', 'phone_number'],
  fullName: ['fullName', 'full_name', 'name', 'contactName', 'contact_name'],
  completeAddress: ['completeAddress', 'complete_address', 'address', 'addressLine1', 'address_line_1', 'streetAddress'],
  landmark: ['landmark'],
  city: ['city', 'town'],
  state: ['state', 'province', 'region'],
  alternateNo: ['alternateNo', 'alternate_no', 'alternatePhone', 'alternate_phone'],
  email: ['email', 'emailAddress', 'email_address'],
};

const ADDRESS_FORM_PATHS = {
  pickup: ['pickupAddress', 'pickup', 'pickup_address'],
  destination: ['destinationAddress', 'destination', 'deliveryAddress', 'delivery', 'destination_address', 'delivery_address'],
};

const isNonEmptyValue = (value) => value !== undefined && value !== null && value !== '';

const pickFirstValue = (source, keys = []) => {
  for (const key of keys) {
    if (isNonEmptyValue(source?.[key])) {
      return source[key];
    }
  }
  return '';
};

const pickFirstObject = (source, keys = []) => {
  for (const key of keys) {
    if (source?.[key] && typeof source[key] === 'object') {
      return source[key];
    }
  }
  return null;
};

const normalizeAddress = (address) => ({
  companyName: String(pickFirstValue(address, ADDRESS_FIELD_KEYS.companyName)),
  country: String(pickFirstValue(address, ADDRESS_FIELD_KEYS.country)),
  pincode: String(pickFirstValue(address, ADDRESS_FIELD_KEYS.pincode)),
  mobileNo: String(pickFirstValue(address, ADDRESS_FIELD_KEYS.mobileNo)),
  fullName: String(pickFirstValue(address, ADDRESS_FIELD_KEYS.fullName)),
  completeAddress: String(pickFirstValue(address, ADDRESS_FIELD_KEYS.completeAddress)),
  landmark: String(pickFirstValue(address, ADDRESS_FIELD_KEYS.landmark)),
  city: String(pickFirstValue(address, ADDRESS_FIELD_KEYS.city)),
  state: String(pickFirstValue(address, ADDRESS_FIELD_KEYS.state)),
  alternateNo: String(pickFirstValue(address, ADDRESS_FIELD_KEYS.alternateNo)),
  email: String(pickFirstValue(address, ADDRESS_FIELD_KEYS.email)),
});

export const extractAddressFormPayload = (rawData) => {
  const data = rawData?.data && typeof rawData.data === 'object' ? rawData.data : rawData || {};
  const pickupRaw =
    pickFirstObject(data, ADDRESS_FORM_PATHS.pickup) ||
    pickFirstObject(data?.submission || {}, ADDRESS_FORM_PATHS.pickup);
  const destinationRaw =
    pickFirstObject(data, ADDRESS_FORM_PATHS.destination) ||
    pickFirstObject(data?.submission || {}, ADDRESS_FORM_PATHS.destination);

  return {
    id: data.id || data._id || '',
    code: data.code || data.formCode || data.form_code || data.publicCode || '',
    status: String(data.status || ''),
    submitted: Boolean(
      data.submitted ||
      data.isSubmitted ||
      String(data.status || '').toLowerCase() === 'submitted'
    ),
    createdAt: data.createdAt || data.created_at || '',
    submittedAt: data.submittedAt || data.submitted_at || '',
    pickupAddress: normalizeAddress(pickupRaw),
    destinationAddress: normalizeAddress(destinationRaw),
  };
};

export const toCreateOrderPrefill = (formData) => {
  const payload = extractAddressFormPayload(formData);
  const pickup = payload.pickupAddress;
  const destination = payload.destinationAddress;

  return {
    pickupCompanyName: pickup.companyName,
    pickupCountry: pickup.country,
    pickupPincode: pickup.pincode,
    pickupMobileNo: pickup.mobileNo,
    pickupFullName: pickup.fullName,
    pickupCompleteAddress: pickup.completeAddress,
    pickupLandmark: pickup.landmark,
    pickupCity: pickup.city,
    pickupState: pickup.state,
    pickupAlternateNo: pickup.alternateNo,
    pickupEmail: pickup.email,
    deliveryCompanyName: destination.companyName,
    deliveryCountry: destination.country,
    deliveryPincode: destination.pincode,
    deliveryMobileNo: destination.mobileNo,
    deliveryFullName: destination.fullName,
    deliveryCompleteAddress: destination.completeAddress,
    deliveryLandmark: destination.landmark,
    deliveryCity: destination.city,
    deliveryState: destination.state,
    deliveryAlternateNo: destination.alternateNo,
    deliveryEmail: destination.email,
  };
};
