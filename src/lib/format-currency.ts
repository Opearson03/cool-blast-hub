/**
 * Centralized currency formatting utility
 * Always formats to exactly 2 decimal places (e.g., $8,109.00)
 */
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

/**
 * Round a number to exactly 2 decimal places (cents)
 * Use this for all monetary calculations before storage
 */
export const roundToCents = (amount: number): number => {
  return Math.round(amount * 100) / 100;
};
