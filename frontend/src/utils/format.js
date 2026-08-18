/** Indian Rupee formatting — e.g. ₹8,42,500.00 */
export function formatINR(amount, { compact = false, decimals = 2 } = {}) {
  const value = Number(amount) || 0;
  const abs = Math.abs(value);
  const sign = value < 0 ? '-' : '';

  if (compact && abs >= 100000) {
    if (abs >= 10000000) return `${sign}₹${(abs / 10000000).toFixed(2)}Cr`;
    if (abs >= 100000) return `${sign}₹${(abs / 100000).toFixed(2)}L`;
  }

  const formatted = abs.toLocaleString('en-IN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });

  return `${sign}₹${formatted}`;
}

export function formatINRChart(value) {
  return formatINR(value, { decimals: 0 });
}

export const TAGLINE = 'Your AI money coach for India';
