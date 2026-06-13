import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currency = 'PKR') {
  return new Intl.NumberFormat('en-PK', { style: 'currency', currency }).format(amount);
}

export function formatDate(date: string | Date | null | undefined) {
  if (!date) return '—';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '—';
  return new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium' }).format(d);
}
