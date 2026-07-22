import { ADDRESS_FIELD_KEYS } from './addressForms';

const isNonEmptyValue = (value) => value !== undefined && value !== null && value !== '';

const pickFirstValue = (source, keys = []) => {
  for (const key of keys) {
    if (isNonEmptyValue(source?.[key])) {
      return source[key];
    }
  }

  return '';
};

const getResponseData = (response) => response?.data || response?.contact || response || {};

const normalizeContactAddress = (contact) => ({
  companyName: String(pickFirstValue(contact, ADDRESS_FIELD_KEYS.companyName)),
  country: String(pickFirstValue(contact, ADDRESS_FIELD_KEYS.country)),
  pincode: String(pickFirstValue(contact, ADDRESS_FIELD_KEYS.pincode)),
  mobileNo: String(pickFirstValue(contact, ADDRESS_FIELD_KEYS.mobileNo)),
  fullName: String(pickFirstValue(contact, ADDRESS_FIELD_KEYS.fullName)),
  completeAddress: String(pickFirstValue(contact, ADDRESS_FIELD_KEYS.completeAddress)),
  landmark: String(pickFirstValue(contact, ADDRESS_FIELD_KEYS.landmark)),
  city: String(pickFirstValue(contact, ADDRESS_FIELD_KEYS.city)),
  state: String(pickFirstValue(contact, ADDRESS_FIELD_KEYS.state)),
  alternateNo: String(pickFirstValue(contact, ADDRESS_FIELD_KEYS.alternateNo)),
  email: String(pickFirstValue(contact, ADDRESS_FIELD_KEYS.email)),
});

export const normalizeContactDetail = (response) => {
  const payload = getResponseData(response);
  const detailsSource =
    payload.details && typeof payload.details === 'object'
      ? payload.details
      : payload.contactDetails && typeof payload.contactDetails === 'object'
        ? payload.contactDetails
        : payload;

  return {
    id: payload.id || payload._id || payload.contactId || payload.contact_detail_id || '',
    contactType: String(payload.contactType || payload.contact_type || ''),
    ...normalizeContactAddress(detailsSource),
  };
};

export const normalizeContactSuggestions = (response) => {
  const payload = getResponseData(response);
  const rawList = Array.isArray(payload)
    ? payload
    : Array.isArray(payload?.items)
      ? payload.items
      : Array.isArray(payload?.suggestions)
        ? payload.suggestions
        : Array.isArray(payload?.results)
          ? payload.results
          : Array.isArray(payload?.contactDetails)
            ? payload.contactDetails
            : [];

  return rawList.map((item) => normalizeContactDetail(item));
};

export const normalizeContactDetails = (response) => {
  const payload = getResponseData(response);
  const rawList = Array.isArray(payload)
    ? payload
    : Array.isArray(payload?.items)
      ? payload.items
      : Array.isArray(payload?.contacts)
        ? payload.contacts
        : Array.isArray(payload?.contactDetails)
          ? payload.contactDetails
          : Array.isArray(payload?.results)
            ? payload.results
            : [];

  return rawList.map((item) => normalizeContactDetail(item));
};

export const toContactDetailPayload = (contact = {}, contactType = 'pickup') => ({
  contactType,
  details: {
    companyName: String(contact.companyName || ''),
    country: String(contact.country || ''),
    pincode: String(contact.pincode || ''),
    mobileNo: String(contact.mobileNo || ''),
    fullName: String(contact.fullName || ''),
    completeAddress: String(contact.completeAddress || ''),
    landmark: String(contact.landmark || ''),
    city: String(contact.city || ''),
    state: String(contact.state || ''),
    alternateNo: String(contact.alternateNo || ''),
    email: String(contact.email || ''),
  },
});
