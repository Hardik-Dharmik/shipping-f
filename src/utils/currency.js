// Currency configuration for the application
export const CURRENCY = {
  code: 'AED',
  symbol: 'د.إ',
  name: 'Dirham',
  namePlural: 'Dirhams'
};

/**
 * Format a number as currency in Dirham (AED)
 * @param {number} amount - The amount to format
 * @param {Object} options - Formatting options
 * @returns {string} Formatted currency string
 */
export const formatCurrency = (amount, options = {}) => {
  const {
    showSymbol = true,
    decimals = 2,
    locale = 'en-AE'
  } = options;

  if (amount === null || amount === undefined || isNaN(amount)) {
    return showSymbol ? `${CURRENCY.symbol} 0.00` : '0.00';
  }

  const formattedAmount = new Intl.NumberFormat(locale, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(amount);

  return showSymbol ? `${CURRENCY.symbol} ${formattedAmount}` : formattedAmount;
};

/**
 * Get currency symbol
 * @returns {string} Currency symbol
 */
export const getCurrencySymbol = () => CURRENCY.symbol;

/**
 * Get currency code
 * @returns {string} Currency code (AED)
 */
export const getCurrencyCode = () => CURRENCY.code;

/**
 * Get currency name
 * @returns {string} Currency name (Dirham)
 */
export const getCurrencyName = () => CURRENCY.name;

