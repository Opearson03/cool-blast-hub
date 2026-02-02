import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * For input value display - handles 0 correctly using nullish coalescing.
 * Returns the value if it's a number (including 0), otherwise returns empty string.
 */
export function inputValue(val: number | undefined | null): string | number {
  return val ?? "";
}

/**
 * For numeric onChange handlers - preserves 0, converts empty string to fallback.
 * @param value - The input string value from e.target.value
 * @param fallback - Value to use when input is empty (defaults to 0)
 */
export function parseNumericInput(
  value: string, 
  fallback: number = 0
): number {
  if (value === "") return fallback;
  const num = Number(value);
  return isNaN(num) ? fallback : num;
}

/**
 * For extracting values from scopeData with a default - preserves 0.
 * Only uses defaultValue when value is undefined or null.
 * @param value - The value to extract (possibly undefined/null)
 * @param defaultValue - Fallback when value is undefined or null
 */
export function numericWithDefault(
  value: unknown, 
  defaultValue: number
): number {
  if (value === undefined || value === null) return defaultValue;
  const num = Number(value);
  return isNaN(num) ? defaultValue : num;
}
