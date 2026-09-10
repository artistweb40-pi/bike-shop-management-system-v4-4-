/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { FinanceAccount, Sale } from '../types';

// Pakistani Motorcycle Database Catalog
export const PAKISTANI_BIKE_BRANDS: Record<string, string[]> = {
  Honda: [
    'CD 70',
    'CD 70 Dream',
    'Pridor 100',
    'CG 125',
    'CG 125 Self',
    'CG 125S Gold Edition',
    'CB 125F',
    'CB 125F Special Edition',
    'CB 150F',
    'CB 150F Special',
    'ICON e',
  ],
  Yamaha: [
    'YBR 125',
    'YBR 125G',
    'YBR 125G Matt Dark Grey',
    'YB 125Z',
    'YB 125Z-DX',
  ],
  Suzuki: [
    'GD 110S',
    'GS 150',
    'GS 150SE',
    'GR 150',
    'Gixxer 150',
  ],
  United: [
    'US 70',
    'US 100',
    'US 125 Euro II',
    'US 150 Ultimate',
    'Electric Sharp',
    'Electric Smart',
    'EV Bullet',
    'EV Revolt',
    'US Scooty 100',
  ],
  'Road Prince': [
    'RP 70',
    '100 Power Plus',
    '110 Power Plus',
    '110 Jack Pot',
    'Road Prince 125',
    '150 Wego',
    '150 Robinson',
    'Bella Scooty',
    'E-Go Electric',
    'Zeus',
    'RX3 250',
  ],
  'Super Power': [
    'SP Dollar 70',
    'SP 70',
    'SP Premium 70',
    'SP 70 Tokyo',
    'Deluxe 70',
    'SP 125',
    'SP 110 Cheetah',
    'SP 150 Archi',
    'Leo 200',
    'Sultan SP 250',
  ],
  Unique: [
    'UD 70',
    'UD 100',
    'UD 125',
    'Crazer UD-150',
  ],
  Crown: [
    'CR 70 Fairy',
    'CR 70 Victory',
    'CR 100 Champion',
    'CR 125 Raftaar',
    'CR 150 Markhor',
    'Cherry 70',
  ],
  Metro: [
    'MR 70',
    'MR 70 Premier',
    'Boom 125',
    'T9 Electric Scooty',
  ],
  Ravi: [
    'Ravi Hamsafar 70',
    'Ravi Premium 125',
    'Piaggio Storm 125',
  ],
  'Hi-Speed': [
    'Alpha 100',
    'Infinity 150',
    'SR 125',
    'Alpha 70',
  ],
  Benelli: [
    'TNT 150i',
    'TNT 25',
    'TNT 302S',
    'TRK 502X',
    'LeonCino 500',
  ],
  Other: ['Custom Model', 'Electric Bike', 'Scooty', 'Imported Heavy Bike'],
};

export const BIKE_COLORS = [
  'Black',
  'Red',
  'Blue',
  'Silver',
  'Grey',
  'White',
  'Golden',
  'Green',
  'Matt Black',
  'Matt Grey',
  'Other',
];

export const BIKE_CONDITIONS = [
  'Brand New (0 km)',
  '10 / 10 (Like New)',
  '9 / 10 (Excellent)',
  '8 / 10 (Very Good)',
  '7 / 10 (Good)',
  'Refurbished / Overhauled',
  'As Is (Rough)',
];

export const EXPENSE_CATEGORIES: Array<{ key: string; label: string; urdu: string }> = [
  { key: 'Repair', label: 'Repair & Mechanics', urdu: 'مرمت و مکینک' },
  { key: 'Parts', label: 'Spare Parts & Accessories', urdu: 'اسپیئر پارٹس' },
  { key: 'Tuning', label: 'Tuning & Engine Work', urdu: 'ٹیوننگ اور کام' },
  { key: 'Washing', label: 'Washing, Polishing & Detailing', urdu: 'دھلائی اور پالش' },
  { key: 'Transportation', label: 'Transportation & Freight', urdu: 'کرایہ و ترسیل' },
  { key: 'Documentation', label: 'File & Transfer Documents', urdu: 'دستاویزات و فائل' },
  { key: 'Registration', label: 'Registration & Token Tax', urdu: 'رجسٹریشن و ٹوکن' },
  { key: 'Other', label: 'Other Miscellaneous', urdu: 'دیگر اخراجات' },
];

export const PAYMENT_METHODS_LIST = [
  'Cash',
  'Bank Transfer',
  'Easypaisa',
  'JazzCash',
  'Cheque',
  'Finance',
  'Credit',
  'Other',
];

export const REGISTRATION_STATUSES = [
  { value: 'Open', label: 'Open (Unregistered / Showroom Letter)', badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' },
  { value: 'Registered', label: 'Registered with Number Plate', badge: 'bg-blue-500/20 text-blue-300 border-blue-500/30' },
  { value: 'Transfer Pending', label: 'Transfer Pending / Biometric Due', badge: 'bg-amber-500/20 text-amber-300 border-amber-500/30' },
  { value: 'File Available', label: 'Original File Available at Showroom', badge: 'bg-teal-500/20 text-teal-300 border-teal-500/30' },
  { value: 'File Missing', label: 'Original File Missing / Duplicate in Hand', badge: 'bg-rose-500/20 text-rose-300 border-rose-500/30' },
  { value: 'Other', label: 'Other Documentation Condition', badge: 'bg-slate-500/20 text-slate-300 border-slate-500/30' },
];

/**
 * Format monetary amount into Pakistani Rupee style (e.g., Rs. 145,000)
 */
export function formatPKR(amount: number | string | undefined | null): string {
  const num = Number(amount) || 0;
  return `Rs. ${num.toLocaleString('en-PK', { maximumFractionDigits: 0 })}`;
}

/**
 * Format monetary amount without prefix
 */
export function formatNum(num: number | undefined | null): string {
  return Number(num || 0).toLocaleString('en-PK', { maximumFractionDigits: 0 });
}

/**
 * Current date string in YYYY-MM-DD
 */
export function getCurrentDate(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Current time string in HH:mm
 */
export function getCurrentTime(): string {
  const d = new Date();
  return d.toTimeString().slice(0, 5);
}

/**
 * Pakistani Friendly Date and Time Display
 * e.g., "01 September 2026 — 07:30 PM"
 */
export function formatPKDateTime(dateStr?: string, timeStr?: string): string {
  if (!dateStr) return '—';
  try {
    const [year, month, day] = dateStr.split('-').map(Number);
    const dateObj = new Date(year, month - 1, day);
    
    const formattedDate = dateObj.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });

    if (!timeStr) return formattedDate;

    const [hours, minutes] = timeStr.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const formattedHours = hours % 12 || 12;
    const formattedMinutes = String(minutes || 0).padStart(2, '0');
    const formattedTime = `${String(formattedHours).padStart(2, '0')}:${formattedMinutes} ${period}`;

    return `${formattedDate} — ${formattedTime}`;
  } catch {
    return dateStr + (timeStr ? ` ${timeStr}` : '');
  }
}

/**
 * Short Date format e.g., "01 Sep 2026"
 */
export function formatShortDate(dateStr?: string): string {
  if (!dateStr) return '—';
  try {
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(year, month - 1, day).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

/**
 * Pakistani CNIC Formatter: 35202-1234567-1 (13 digits)
 */
export function formatCNICInput(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 13);
  if (digits.length <= 5) {
    return digits;
  }
  if (digits.length <= 12) {
    return `${digits.slice(0, 5)}-${digits.slice(5)}`;
  }
  return `${digits.slice(0, 5)}-${digits.slice(5, 12)}-${digits.slice(12)}`;
}

export function formatCNICDisplay(cnic?: string): string {
  if (!cnic) return '—';
  return formatCNICInput(cnic);
}

/**
 * Validate Pakistani CNIC
 */
export function isValidCNIC(cnic?: string): boolean {
  if (!cnic) return true; // optional in some forms
  return /^\d{5}-\d{7}-\d{1}$/.test(cnic);
}

/**
 * Pakistani Phone Formatter: 0300-1234567 (11 digits)
 */
export function formatPhoneInput(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 4) {
    return digits;
  }
  return `${digits.slice(0, 4)}-${digits.slice(4)}`;
}

export function formatPhoneDisplay(phone?: string): string {
  if (!phone) return '—';
  return formatPhoneInput(phone);
}

/**
 * Compress an uploaded file into a compact WebP/JPEG data URL for offline IndexedDB storage
 */
export function fileToDataURL(file: File, maxWidth = 1000, quality = 0.75): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file) {
      resolve('');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, maxWidth / img.width);
        const w = Math.round(img.width * scale);
        const h = Math.round(img.height * scale);
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(reader.result as string);
          return;
        }
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = () => resolve(reader.result as string || '');
      img.src = e.target?.result as string;
    };
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}

/**
 * Helper to determine if a sale is a financed installment transaction.
 * Checks financeId, saleType, paymentMethod, and cross-references financeAccounts.
 */
export function isSaleFinanced(sale: Sale, financeAccounts: FinanceAccount[] = []): boolean {
  if (sale.financeId) return true;
  if (sale.saleType === 'Installment') return true;
  if (sale.paymentMethod === 'Finance') return true;
  if (
    financeAccounts.some(
      (f) =>
        f.saleId === sale.id ||
        (f.bikeId && sale.bikeId && f.bikeId === sale.bikeId) ||
        (sale.financeId && f.id === sale.financeId) ||
        f.id === sale.id
    )
  ) {
    return true;
  }
  return false;
}

/**
 * Accurately calculate a customer's total outstanding balance across direct credit sales and installment plans.
 * Avoids double-counting installment sales that have linked FinanceAccounts.
 */
export function calculateCustomerOutstanding(
  customerId: string,
  sales: Sale[] = [],
  financeAccounts: FinanceAccount[] = []
): { totalOutstanding: number; creditRemaining: number; unpaidFin: number } {
  const custSales = sales.filter((s) => s.customerId === customerId);
  const custFinances = financeAccounts.filter((f) => f.customerId === customerId);

  // Unpaid remaining balance on active installment finance schedules
  const unpaidFin = custFinances.reduce((s, f) => {
    const due = (f.schedule || [])
      .filter((x) => !x.paid)
      .reduce((acc, x) => acc + (Number(x.amount || 0) - Number(x.paidAmount || 0)), 0);
    return s + due;
  }, 0);

  // Only direct credit sales (NOT installment/finance sales, which are tracked via financeAccounts above)
  const creditRemaining = custSales
    .filter((s) => !isSaleFinanced(s, financeAccounts))
    .reduce((s, x) => s + Math.max(0, Number(x.remainingBalance || 0)), 0);

  const totalOutstanding = Math.max(0, Number((creditRemaining + unpaidFin).toFixed(2)));

  return {
    totalOutstanding,
    creditRemaining: Number(creditRemaining.toFixed(2)),
    unpaidFin: Number(unpaidFin.toFixed(2)),
  };
}

