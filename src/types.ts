/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type Language = 'en' | 'ur';

export type BikeStatus = 'Available' | 'Reserved' | 'Sold' | 'Returned' | 'Archived';

export type RegistrationStatus =
  | 'Open'
  | 'Registered'
  | 'Pending'
  | 'Transfer Pending'
  | 'File Available'
  | 'File Missing'
  | 'Other';

export type ExpenseCategory =
  | 'Repair'
  | 'Parts'
  | 'Tuning'
  | 'Washing'
  | 'Transportation'
  | 'Documentation'
  | 'Registration'
  | 'Other';

export type PaymentMethod =
  | 'Cash'
  | 'Bank Transfer'
  | 'Easypaisa'
  | 'JazzCash'
  | 'Cheque'
  | 'Credit'
  | 'Finance'
  | 'Other';

export type TransactionType =
  | 'Bike Purchase'
  | 'Bike Expense'
  | 'Bike Sale'
  | 'Customer Payment'
  | 'Other Income'
  | 'Other Expense'
  | 'IN'
  | 'OUT';

export type FinanceStatus = 'ACTIVE' | 'PAID' | 'OVERDUE';
export type SaleType = 'Cash' | 'Installment' | 'Credit';
export type Documentation = BikeDocument;
export type InstallmentItem = InstallmentScheduleItem;

export type NavigationTab =
  | 'dashboard'
  | 'purchases'
  | 'inventory'
  | 'expenses'
  | 'documentation'
  | 'sales'
  | 'customers'
  | 'sellers'
  | 'finance'
  | 'cashbook'
  | 'reports'
  | 'backup'
  | 'health';

export interface DatabaseHealthReport {
  status: 'HEALTHY' | 'WARNING' | 'CORRUPTED';
  timestamp: string;
  counts: {
    bikes: number;
    purchases: number;
    sales: number;
    expenses: number;
    customers: number;
    cashbook: number;
  };
  issues: string[];
}

export interface Seller {
  id: string; // e.g., SEL-2026-0001
  name: string;
  phone: string;
  cnic: string;
  photoBlob?: string; // Base64 or Blob Data URL
  cnicFrontBlob?: string;
  cnicBackBlob?: string;
  address?: string;
  notes?: string;
  createdAt: string;
}

export interface Purchase {
  id: string; // e.g., PUR-2026-0001
  bikeId: string; // connects to Bike
  sellerId: string; // connects to Seller
  purchaseDate: string; // YYYY-MM-DD
  purchaseTime: string; // HH:mm
  purchaseCost: number; // Purchase Cost in PKR
  condition: string; // e.g., New, 10/10, 9/10, Used
  notes?: string;
  supplier?: string;
  invoiceNo?: string;
  invoiceNumber?: string;
  paymentMethod?: PaymentMethod | string;
  cashbookId?: string;
  createdAt: string;
}

export interface BikeExpense {
  id: string; // e.g., EXP-2026-0001
  bikeId: string; // connects to Bike
  date: string;
  time: string;
  category: ExpenseCategory;
  description: string;
  amount: number;
  notes?: string;
  cashbookId?: string;
  createdAt: string;
}

export interface BikeDocument {
  id: string; // e.g., DOC-2026-0001
  bikeId: string; // connects to Bike
  registrationStatus: RegistrationStatus;
  registrationNumber?: string;
  registrationCity?: string;
  registrationProvince?: string;
  ownerName?: string;
  engineNumber: string;
  chassisNumber: string;
  originalFileAvailable: boolean;
  smartCardAvailable: boolean;
  tokenTaxStatus: string; // e.g., Lifetime Paid, Paid up to 2026, Unpaid
  transferStatus: string; // e.g., Open, In Process, Transferred
  saleLetterAvailable: boolean;
  otherDocuments?: string;
  docPhotos?: string[]; // Data URLs of paper/smart card photos
  docNotes: string; // Permanent documentation notes, e.g., "Bike is open. Original file available."
  updatedAt: string;
}

export interface Bike {
  id: string; // Permanent Unique Bike ID: BIKE-2026-0001
  purchaseId: string;
  sellerId: string;
  make: string; // e.g., Honda, Yamaha, Suzuki, United
  model: string; // e.g., CD 70, CG 125, YBR 125
  year: number; // e.g., 2024, 2025, 2026
  color: string;
  engineNumber: string; // Primary Unique identification
  chassisNumber: string; // Primary Unique identification
  registrationNumber?: string;
  condition: string;
  purchaseCost: number; // Initial purchase cost
  totalExpenses: number; // Sum of all linked expenses (computed / cached)
  totalCost: number; // Purchase Cost + Sum of Linked Expenses
  actualCost?: number;
  status: BikeStatus; // Available, Reserved, Sold, Returned, Archived
  docId?: string;
  saleId?: string;
  photoBlob?: string; // High-res / Compressed image of the motorcycle
  photos?: string[]; // Multiple photos if uploaded
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Customer {
  id: string; // CUST-2026-0001
  name: string;
  fatherName?: string;
  cnic?: string;
  phone?: string;
  photoBlob?: string;
  cnicFrontBlob?: string;
  cnicBackBlob?: string;
  address?: string;
  city?: string;
  guarantor1Name?: string;
  guarantor1Phone?: string;
  guarantor1Cnic?: string;
  guarantor1Address?: string;
  guarantor1PhotoBlob?: string;
  guarantor2Name?: string;
  guarantor2Phone?: string;
  guarantor2Cnic?: string;
  notes?: string;
  balance?: number;
  createdAt: string;
}

export interface Sale {
  id: string; // SALE-2026-0001
  receiptNo: string; // e.g., S-00001
  bikeId: string;
  customerId: string;
  saleDate: string;
  saleTime: string;
  make: string;
  model: string;
  engineNumber: string;
  chassisNumber: string;
  registrationNumber?: string;
  actualBikeCost: number; // Purchase Cost + Linked Expenses at moment of sale
  salePrice: number;
  profit: number; // salePrice - actualBikeCost
  amountReceived: number;
  remainingBalance: number; // salePrice - amountReceived (for cash/credit) or 0 if finance
  paymentMethod: PaymentMethod;
  saleType?: string;
  broker?: string;
  notes?: string;
  financeId?: string; // If sold on finance / installments
  cashbookId?: string;
  createdAt: string;
}

export interface InstallmentScheduleItem {
  no: number;
  dueDate: string;
  amount: number;
  paid: boolean;
  paidAmount: number;
  paidDate?: string;
  paidMethod?: string;
  paymentId?: string;
  status?: 'PAID' | 'PENDING' | 'OVERDUE';
}

export interface FinanceAccount {
  id: string; // FIN-2026-0001
  receiptNo: string; // F-00001
  saleId: string; // References original Sale ID
  customerId: string;
  bikeId: string;
  brand: string;
  model: string;
  engineNumber: string;
  chassisNumber: string;
  bikePrice: number;
  downPayment: number;
  markup: number; // Finance charges
  totalPayable: number; // bikePrice + markup
  financedAmount: number; // totalPayable - downPayment
  installmentCount: number;
  firstDueDate: string;
  schedule: InstallmentScheduleItem[];
  status: FinanceStatus;
  notes?: string;
  createdAt: string;
}

export interface Payment {
  id: string; // PAY-2026-0001
  receiptNo: string; // R-00001
  date: string;
  time: string;
  customerId: string;
  saleId?: string;
  financeId?: string;
  installmentNo?: number;
  amount: number;
  method: PaymentMethod;
  paymentMethod?: PaymentMethod | string;
  note?: string;
  notes?: string;
  cashbookId?: string;
  createdAt: string;
}

export interface CashbookEntry {
  id: string; // CB-2026-0001
  date: string;
  time: string;
  type: TransactionType;
  referenceId?: string; // Purchase ID, Sale ID, Expense ID, or Payment ID
  description: string;
  amount: number; // Positive for inflow, negative for outflow
  paymentMethod: string;
  category?: string;
  account: 'Cash' | 'Bank' | 'Easypaisa' | 'JazzCash' | 'Other';
  createdAt: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  action: string;
  entityType: string;
  entityId: string;
  details: string;
}

export interface ShowroomSettings {
  shopName: string;
  showroomName?: string;
  phone: string;
  phone1?: string;
  phone2?: string;
  address: string;
  city: string;
  currency: string;
  currencySymbol?: string;
  ownerName: string;
  ntnNumber?: string;
  receiptTerms?: string;
  receiptFooter?: string;
  excludeSensitiveImagesOnExport: boolean;
  language: Language;
  sequenceCounters: {
    bike: number;
    purchase: number;
    seller: number;
    customer: number;
    sale: number;
    expense: number;
    document: number;
    finance: number;
    payment: number;
    cashbook: number;
  };
}

export interface FullBackupData {
  version: number;
  exportedAt: string;
  appName: string;
  shopName: string;
  counts: {
    bikes: number;
    purchases: number;
    sellers: number;
    customers: number;
    sales: number;
    expenses: number;
    documents: number;
    financeAccounts: number;
    payments: number;
    cashbook: number;
    auditLogs: number;
  };
  data: {
    bikes: Bike[];
    purchases: Purchase[];
    sellers: Seller[];
    customers: Customer[];
    sales: Sale[];
    expenses: BikeExpense[];
    documents: BikeDocument[];
    financeAccounts: FinanceAccount[];
    payments: Payment[];
    cashbook: CashbookEntry[];
    auditLogs: AuditLog[];
    settings: ShowroomSettings;
  };
}

export interface HealthCheckItem {
  id: string;
  name: string;
  category: 'Storage' | 'Integrity' | 'Calculations' | 'Relations';
  status: 'passed' | 'failed' | 'warning';
  message: string;
  details?: string;
  fixable?: boolean;
}
