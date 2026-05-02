const toNumericAmount = (value) => {
  const amount = Number.parseFloat(value);
  return Number.isFinite(amount) ? amount : 0;
};

export const calculateInvoiceTotal = (invoiceValues = []) => {
  return invoiceValues.reduce((total, value) => total + toNumericAmount(value), 0);
};

export const normalizeInvoiceValues = (invoiceValues, fallbackValue = '') => {
  if (Array.isArray(invoiceValues) && invoiceValues.length > 0) {
    return invoiceValues.map((value) => String(value ?? ''));
  }

  if (fallbackValue !== undefined && fallbackValue !== null && fallbackValue !== '') {
    return [String(fallbackValue)];
  }

  return [''];
};

export const syncInvoiceProduct = (product = {}) => {
  const invoiceValues = normalizeInvoiceValues(product.invoiceValues, product.unitPrice);
  const total = calculateInvoiceTotal(invoiceValues);
  const hasAnyValue = invoiceValues.some((value) => value !== '');

  return {
    ...product,
    invoiceValues,
    unitPrice: hasAnyValue ? total.toFixed(2) : '',
  };
};
