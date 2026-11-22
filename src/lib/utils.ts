import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatNum(val: number, precision = 4): string {
  if (!Number.isFinite(val)) return '—';
  return val.toFixed(precision);
}

export function formatSigned(val: number, precision = 4): string {
  if (!Number.isFinite(val)) return '—';
  const sign = val > 0 ? '+' : '';
  return `${sign}${val.toFixed(precision)}`;
}

export function formatScientific(val: number, precision = 3): string {
  if (!Number.isFinite(val)) return '—';
  if (val === 0) return '0';
  const abs = Math.abs(val);
  if (abs >= 0.001 && abs < 10000) {
    return Number(val.toPrecision(precision + 1)).toString();
  }
  const exp = Math.floor(Math.log10(abs));
  const mantissa = val / Math.pow(10, exp);
  return `${mantissa.toFixed(precision - 1)} × 10^${exp}`;
}
