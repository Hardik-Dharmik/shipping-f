const PICKUP_STORAGE_KEY = 'shipping.savedPickupContacts';
const DELIVERY_STORAGE_KEY = 'shipping.savedDeliveryContacts';

const normalizeContactValue = (value) => {
  if (value === undefined || value === null) {
    return '';
  }

  return String(value).trim();
};

export const toPickupContactPayload = (formData = {}) => ({
  companyName: normalizeContactValue(formData.pickupCompanyName),
  country: normalizeContactValue(formData.pickupCountry),
  pincode: normalizeContactValue(formData.pickupPincode),
  mobileNo: normalizeContactValue(formData.pickupMobileNo),
  fullName: normalizeContactValue(formData.pickupFullName),
  completeAddress: normalizeContactValue(formData.pickupCompleteAddress),
  landmark: normalizeContactValue(formData.pickupLandmark),
  city: normalizeContactValue(formData.pickupCity),
  state: normalizeContactValue(formData.pickupState),
  alternateNo: normalizeContactValue(formData.pickupAlternateNo),
  email: normalizeContactValue(formData.pickupEmail),
  savedAt: new Date().toISOString(),
});

export const loadSavedPickupContacts = () => {
  try {
    const rawValue = localStorage.getItem(PICKUP_STORAGE_KEY);
    if (!rawValue) {
      return [];
    }

    const parsedValue = JSON.parse(rawValue);
    return Array.isArray(parsedValue) ? parsedValue : [];
  } catch {
    return [];
  }
};

export const saveSavedPickupContacts = (contacts) => {
  localStorage.setItem(PICKUP_STORAGE_KEY, JSON.stringify(contacts));
};

export const upsertSavedPickupContact = (contacts, contact) => {
  const normalizedCompanyName = normalizeContactValue(contact.companyName).toLowerCase();

  return [
    contact,
    ...contacts.filter(
      (item) => normalizeContactValue(item.companyName).toLowerCase() !== normalizedCompanyName
    ),
  ].slice(0, 20);
};

export const applyPickupContactToFormData = (contact, currentFormData) => ({
  ...currentFormData,
  pickupCompanyName: normalizeContactValue(contact.companyName),
  pickupCountry: normalizeContactValue(contact.country),
  pickupPincode: normalizeContactValue(contact.pincode),
  pickupMobileNo: normalizeContactValue(contact.mobileNo),
  pickupFullName: normalizeContactValue(contact.fullName),
  pickupCompleteAddress: normalizeContactValue(contact.completeAddress),
  pickupLandmark: normalizeContactValue(contact.landmark),
  pickupCity: normalizeContactValue(contact.city),
  pickupState: normalizeContactValue(contact.state),
  pickupAlternateNo: normalizeContactValue(contact.alternateNo),
  pickupEmail: normalizeContactValue(contact.email),
});

export const toDeliveryContactPayload = (formData = {}) => ({
  companyName: normalizeContactValue(formData.deliveryCompanyName),
  country: normalizeContactValue(formData.deliveryCountry),
  pincode: normalizeContactValue(formData.deliveryPincode),
  mobileNo: normalizeContactValue(formData.deliveryMobileNo),
  fullName: normalizeContactValue(formData.deliveryFullName),
  completeAddress: normalizeContactValue(formData.deliveryCompleteAddress),
  landmark: normalizeContactValue(formData.deliveryLandmark),
  city: normalizeContactValue(formData.deliveryCity),
  state: normalizeContactValue(formData.deliveryState),
  alternateNo: normalizeContactValue(formData.deliveryAlternateNo),
  email: normalizeContactValue(formData.deliveryEmail),
  savedAt: new Date().toISOString(),
});

export const loadSavedDeliveryContacts = () => {
  try {
    const rawValue = localStorage.getItem(DELIVERY_STORAGE_KEY);
    if (!rawValue) {
      return [];
    }

    const parsedValue = JSON.parse(rawValue);
    return Array.isArray(parsedValue) ? parsedValue : [];
  } catch {
    return [];
  }
};

export const saveSavedDeliveryContacts = (contacts) => {
  localStorage.setItem(DELIVERY_STORAGE_KEY, JSON.stringify(contacts));
};

export const applyDeliveryContactToFormData = (contact, currentFormData) => ({
  ...currentFormData,
  deliveryCompanyName: normalizeContactValue(contact.companyName),
  deliveryCountry: normalizeContactValue(contact.country),
  deliveryPincode: normalizeContactValue(contact.pincode),
  deliveryMobileNo: normalizeContactValue(contact.mobileNo),
  deliveryFullName: normalizeContactValue(contact.fullName),
  deliveryCompleteAddress: normalizeContactValue(contact.completeAddress),
  deliveryLandmark: normalizeContactValue(contact.landmark),
  deliveryCity: normalizeContactValue(contact.city),
  deliveryState: normalizeContactValue(contact.state),
  deliveryAlternateNo: normalizeContactValue(contact.alternateNo),
  deliveryEmail: normalizeContactValue(contact.email),
});
