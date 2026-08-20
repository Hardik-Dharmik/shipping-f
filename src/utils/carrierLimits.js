const CARRIER_LIMITS = {
  dhl: { contact: 35, commodity: 170, company: 70, address: 45 },
  fedex: { contact: 35, commodity: 450, company: 35, address: 35 },
  ups: { contact: 35, commodity: 35, company: 35, address: 35 },
};

export const countWords = (value = '') => String(value).trim().split(/\s+/).filter(Boolean).length;

export const carrierWordLimit = (carrier, field) => CARRIER_LIMITS[String(carrier || '').trim().toLowerCase()]?.[field] || null;

export const carrierWordLimitError = (carrier, field, value, label) => {
  const limit = carrierWordLimit(carrier, field);
  return limit && countWords(value) > limit ? `${label} cannot exceed ${limit} words for ${carrier}.` : '';
};
