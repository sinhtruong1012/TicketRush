/**
 * Format phone number as user types: 0xxx xxx xxx
 * Strips non-digits, preserves leading 0, adds spaces.
 */
export function formatPhoneInput(raw) {
  const digits = raw.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 4) return digits;
  if (digits.length <= 7) return `${digits.slice(0, 4)} ${digits.slice(4)}`;
  return `${digits.slice(0, 4)} ${digits.slice(4, 7)} ${digits.slice(7)}`;
}

/**
 * Format number as Vietnamese currency: 1.000.000
 * Input: raw string or number → Output: "1.000.000"
 */
export function formatCurrencyInput(raw) {
  const digits = raw.toString().replace(/\D/g, '');
  if (!digits) return '';
  return parseInt(digits, 10).toLocaleString('vi-VN');
}

/**
 * Parse formatted currency back to number: "1.000.000" → 1000000
 */
export function parseCurrencyInput(formatted) {
  return parseInt(formatted.replace(/\D/g, ''), 10) || 0;
}
