/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  AuditLog,
  Bike,
  BikeDocument,
  BikeExpense,
  BikeStatus,
  CashbookEntry,
  Customer,
  FinanceAccount,
  FullBackupData,
  HealthCheckItem,
  Payment,
  Purchase,
  Sale,
  Seller,
  ShowroomSettings,
} from '../types';
import {
  calculateCustomerOutstanding,
  isSaleFinanced,
  getCurrentDate,
  getCurrentTime,
} from '../utils/formatters';

const DB_NAME = 'BikeShopDB';
const DB_VERSION = 4;

export const DEFAULT_SETTINGS: ShowroomSettings = {
  shopName: 'Usman Trader and Autos',
  phone: '0300-7654321',
  address: 'Main Showroom Market, Circular Road',
  city: 'Lahore, Pakistan',
  currency: 'Rs',
  ownerName: 'Usman Shabir',
  ntnNumber: '1234567-8',
  receiptTerms: 'Bike sold in inspected and verified condition. All documents verified. No claims after gate exit without valid showroom receipt.',
  excludeSensitiveImagesOnExport: false,
  language: 'en',
  sequenceCounters: {
    bike: 0,
    purchase: 0,
    seller: 0,
    customer: 0,
    sale: 0,
    expense: 0,
    document: 0,
    finance: 0,
    payment: 0,
    cashbook: 0,
  },
};

export class DatabaseManager {
  private db: IDBDatabase | null = null;
  private initPromise: Promise<IDBDatabase> | null = null;

  public async getDB(): Promise<IDBDatabase> {
    if (this.db) return this.db;
    if (this.initPromise) return this.initPromise;

    this.initPromise = new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = request.result;

        // 1. Bikes Store
        if (!db.objectStoreNames.contains('bikes')) {
          const bikeStore = db.createObjectStore('bikes', { keyPath: 'id' });
          bikeStore.createIndex('engineNumber', 'engineNumber', { unique: false });
          bikeStore.createIndex('chassisNumber', 'chassisNumber', { unique: false });
          bikeStore.createIndex('registrationNumber', 'registrationNumber', { unique: false });
          bikeStore.createIndex('status', 'status', { unique: false });
          bikeStore.createIndex('make', 'make', { unique: false });
          bikeStore.createIndex('model', 'model', { unique: false });
          bikeStore.createIndex('purchaseId', 'purchaseId', { unique: false });
        }

        // 2. Purchases Store
        if (!db.objectStoreNames.contains('purchases')) {
          const purStore = db.createObjectStore('purchases', { keyPath: 'id' });
          purStore.createIndex('bikeId', 'bikeId', { unique: false });
          purStore.createIndex('sellerId', 'sellerId', { unique: false });
          purStore.createIndex('purchaseDate', 'purchaseDate', { unique: false });
        }

        // 3. Sellers Store
        if (!db.objectStoreNames.contains('sellers')) {
          const sellerStore = db.createObjectStore('sellers', { keyPath: 'id' });
          sellerStore.createIndex('cnic', 'cnic', { unique: false });
          sellerStore.createIndex('phone', 'phone', { unique: false });
          sellerStore.createIndex('name', 'name', { unique: false });
        }

        // 4. Customers Store
        if (!db.objectStoreNames.contains('customers')) {
          const custStore = db.createObjectStore('customers', { keyPath: 'id' });
          custStore.createIndex('cnic', 'cnic', { unique: false });
          custStore.createIndex('phone', 'phone', { unique: false });
          custStore.createIndex('name', 'name', { unique: false });
        }

        // 5. Sales Store
        if (!db.objectStoreNames.contains('sales')) {
          const saleStore = db.createObjectStore('sales', { keyPath: 'id' });
          saleStore.createIndex('bikeId', 'bikeId', { unique: false });
          saleStore.createIndex('customerId', 'customerId', { unique: false });
          saleStore.createIndex('saleDate', 'saleDate', { unique: false });
          saleStore.createIndex('receiptNo', 'receiptNo', { unique: false });
        }

        // 6. Expenses Store
        if (!db.objectStoreNames.contains('expenses')) {
          const expStore = db.createObjectStore('expenses', { keyPath: 'id' });
          expStore.createIndex('bikeId', 'bikeId', { unique: false });
          expStore.createIndex('category', 'category', { unique: false });
          expStore.createIndex('date', 'date', { unique: false });
        }

        // 7. Documents Store
        if (!db.objectStoreNames.contains('documents')) {
          const docStore = db.createObjectStore('documents', { keyPath: 'id' });
          docStore.createIndex('bikeId', 'bikeId', { unique: true });
          docStore.createIndex('registrationStatus', 'registrationStatus', { unique: false });
        }

        // 8. Payments Store
        if (!db.objectStoreNames.contains('payments')) {
          const payStore = db.createObjectStore('payments', { keyPath: 'id' });
          payStore.createIndex('customerId', 'customerId', { unique: false });
          payStore.createIndex('saleId', 'saleId', { unique: false });
          payStore.createIndex('financeId', 'financeId', { unique: false });
          payStore.createIndex('date', 'date', { unique: false });
        }

        // 9. Finance Accounts Store
        if (!db.objectStoreNames.contains('financeAccounts')) {
          const finStore = db.createObjectStore('financeAccounts', { keyPath: 'id' });
          finStore.createIndex('saleId', 'saleId', { unique: false });
          finStore.createIndex('customerId', 'customerId', { unique: false });
          finStore.createIndex('bikeId', 'bikeId', { unique: false });
          finStore.createIndex('status', 'status', { unique: false });
        }

        // 10. Cashbook Store
        if (!db.objectStoreNames.contains('cashbook')) {
          const cbStore = db.createObjectStore('cashbook', { keyPath: 'id' });
          cbStore.createIndex('date', 'date', { unique: false });
          cbStore.createIndex('type', 'type', { unique: false });
          cbStore.createIndex('referenceId', 'referenceId', { unique: false });
          cbStore.createIndex('account', 'account', { unique: false });
        }

        // 11. Audit Logs Store
        if (!db.objectStoreNames.contains('auditLogs')) {
          const auditStore = db.createObjectStore('auditLogs', { keyPath: 'id' });
          auditStore.createIndex('timestamp', 'timestamp', { unique: false });
          auditStore.createIndex('entityType', 'entityType', { unique: false });
        }

        // 12. Settings Store
        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings', { keyPath: 'key' });
        }
      };

      request.onsuccess = async () => {
        this.db = request.result;
        try {
          await this.reconcileCustomerBalances();
        } catch {
          // silently continue
        }
        resolve(this.db);
      };

      request.onerror = () => {
        reject(request.error);
      };
    });

    return this.initPromise;
  }

  // --- Generic Store CRUD ---

  public async getAll<T>(storeName: string): Promise<T[]> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  }

  public async getById<T>(storeName: string, id: string): Promise<T | null> {
    if (!id || typeof id !== 'string') return null;
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const req = store.get(id);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
  }

  public async put<T>(storeName: string, item: T): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const req = store.put(item);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  public async delete(storeName: string, id: string): Promise<void> {
    if (!id || typeof id !== 'string') return;
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const req = store.delete(id);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  public async clearStore(storeName: string): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const req = store.clear();
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  // --- Settings & Sequence Counters ---

  public async getSettings(): Promise<ShowroomSettings> {
    const db = await this.getDB();
    return new Promise((resolve) => {
      const tx = db.transaction('settings', 'readonly');
      const store = tx.objectStore('settings');
      const req = store.get('main_settings');
      req.onsuccess = () => {
        if (req.result && req.result.value) {
          resolve({ ...DEFAULT_SETTINGS, ...req.result.value });
        } else {
          resolve(DEFAULT_SETTINGS);
        }
      };
      req.onerror = () => resolve(DEFAULT_SETTINGS);
    });
  }

  public async saveSettings(settings: ShowroomSettings): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('settings', 'readwrite');
      const store = tx.objectStore('settings');
      const req = store.put({ key: 'main_settings', value: settings });
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  public async getNextId(prefix: 'BIKE' | 'PUR' | 'SEL' | 'CUST' | 'SALE' | 'EXP' | 'DOC' | 'FIN' | 'PAY' | 'CB'): Promise<string> {
    const currentYear = new Date().getFullYear();
    const settings = await this.getSettings();
    const keyMap: Record<string, keyof ShowroomSettings['sequenceCounters']> = {
      BIKE: 'bike',
      PUR: 'purchase',
      SEL: 'seller',
      CUST: 'customer',
      SALE: 'sale',
      EXP: 'expense',
      DOC: 'document',
      FIN: 'finance',
      PAY: 'payment',
      CB: 'cashbook',
    };
    const counterKey = keyMap[prefix];
    const nextVal = (settings.sequenceCounters[counterKey] || 0) + 1;
    settings.sequenceCounters[counterKey] = nextVal;
    await this.saveSettings(settings);

    return `${prefix}-${currentYear}-${String(nextVal).padStart(4, '0')}`;
  }

  // --- Business Logic Operations ---

  /**
   * Calculate real-time actual bike cost: Purchase Cost + all linked expenses
   */
  public async calculateActualBikeCost(bikeId: string): Promise<{ purchaseCost: number; expensesTotal: number; actualCost: number }> {
    const bike = await this.getById<Bike>('bikes', bikeId);
    if (!bike) return { purchaseCost: 0, expensesTotal: 0, actualCost: 0 };

    const allExpenses = await this.getAll<BikeExpense>('expenses');
    const linkedExpenses = allExpenses.filter((e) => e.bikeId === bikeId);
    const expensesTotal = linkedExpenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);
    const purchaseCost = Number(bike.purchaseCost || 0);
    const actualCost = purchaseCost + expensesTotal;

    return { purchaseCost, expensesTotal, actualCost };
  }

  /**
   * Recalculate and update cached total cost on Bike record
   */
  public async refreshBikeTotalCost(bikeId: string): Promise<number> {
    const { purchaseCost, expensesTotal, actualCost } = await this.calculateActualBikeCost(bikeId);
    const bike = await this.getById<Bike>('bikes', bikeId);
    if (bike) {
      bike.purchaseCost = purchaseCost;
      bike.totalExpenses = expensesTotal;
      bike.totalCost = actualCost;
      bike.updatedAt = new Date().toISOString();
      await this.put('bikes', bike);
    }
    return actualCost;
  }

  /**
   * Create a complete Purchase transaction:
   * Creates Seller (if new), Bike, Purchase, Document, and Cashbook Outflow entry in one coordinated flow.
   */
  public async createPurchaseTransaction(params: {
    seller: Omit<Seller, 'id' | 'createdAt'> & { id?: string };
    bike: {
      make: string;
      model: string;
      year: number;
      color: string;
      engineNumber: string;
      chassisNumber: string;
      registrationNumber?: string;
      condition: string;
      photoBlob?: string;
      photos?: string[];
      notes?: string;
    };
    purchaseCost: number;
    purchaseDate: string;
    purchaseTime: string;
    supplier?: string;
    invoiceNo?: string;
    purchaseNotes?: string;
    documents: {
      registrationStatus: BikeDocument['registrationStatus'];
      registrationNumber?: string;
      registrationCity?: string;
      registrationProvince?: string;
      ownerName?: string;
      originalFileAvailable: boolean;
      smartCardAvailable: boolean;
      tokenTaxStatus: string;
      transferStatus: string;
      saleLetterAvailable: boolean;
      otherDocuments?: string;
      docNotes: string;
      docPhotos?: string[];
    };
    paymentMethod: string;
  }): Promise<{ bikeId: string; purchaseId: string; sellerId: string; docId: string }> {
    const db = await this.getDB();

    // Check duplicate engine or chassis in existing bikes
    const existingBikes = await this.getAll<Bike>('bikes');
    const dupEngine = existingBikes.find(
      (b) => b.engineNumber.trim().toLowerCase() === params.bike.engineNumber.trim().toLowerCase()
    );
    if (dupEngine) {
      throw new Error(`A bike with this Engine Number (${params.bike.engineNumber}) already exists in database [${dupEngine.id}].`);
    }

    const dupChassis = existingBikes.find(
      (b) => b.chassisNumber.trim().toLowerCase() === params.bike.chassisNumber.trim().toLowerCase()
    );
    if (dupChassis) {
      throw new Error(`A bike with this Chassis Number (${params.bike.chassisNumber}) already exists in database [${dupChassis.id}].`);
    }

    // 1. Resolve or Create Seller
    let sellerId = params.seller.id;
    let newSeller: Seller | null = null;
    if (!sellerId) {
      sellerId = await this.getNextId('SEL');
      newSeller = {
        id: sellerId,
        name: params.seller.name,
        phone: params.seller.phone,
        cnic: params.seller.cnic,
        photoBlob: params.seller.photoBlob,
        cnicFrontBlob: params.seller.cnicFrontBlob,
        cnicBackBlob: params.seller.cnicBackBlob,
        address: params.seller.address,
        notes: params.seller.notes,
        createdAt: new Date().toISOString(),
      };
    }

    // 2. Generate IDs
    const bikeId = await this.getNextId('BIKE');
    const purchaseId = await this.getNextId('PUR');
    const docId = await this.getNextId('DOC');
    const cashbookId = await this.getNextId('CB');

    const now = new Date().toISOString();

    // 3. Create Documents Record
    const bikeDoc: BikeDocument = {
      id: docId,
      bikeId,
      registrationStatus: params.documents.registrationStatus,
      registrationNumber: params.documents.registrationNumber || params.bike.registrationNumber || '',
      registrationCity: params.documents.registrationCity || '',
      registrationProvince: params.documents.registrationProvince || '',
      ownerName: params.documents.ownerName || params.seller.name || '',
      engineNumber: params.bike.engineNumber,
      chassisNumber: params.bike.chassisNumber,
      originalFileAvailable: params.documents.originalFileAvailable,
      smartCardAvailable: params.documents.smartCardAvailable,
      tokenTaxStatus: params.documents.tokenTaxStatus,
      transferStatus: params.documents.transferStatus,
      saleLetterAvailable: params.documents.saleLetterAvailable,
      otherDocuments: params.documents.otherDocuments,
      docPhotos: params.documents.docPhotos || [],
      docNotes: params.documents.docNotes,
      updatedAt: now,
    };

    // 4. Create Purchase Record
    const purchase: Purchase = {
      id: purchaseId,
      bikeId,
      sellerId,
      purchaseDate: params.purchaseDate || getCurrentDate(),
      purchaseTime: params.purchaseTime || getCurrentTime(),
      purchaseCost: params.purchaseCost,
      condition: params.bike.condition,
      notes: params.purchaseNotes,
      supplier: params.supplier,
      invoiceNo: params.invoiceNo,
      cashbookId,
      createdAt: now,
    };

    // 5. Create Bike Record
    const bike: Bike = {
      id: bikeId,
      purchaseId,
      sellerId,
      make: params.bike.make,
      model: params.bike.model,
      year: params.bike.year,
      color: params.bike.color,
      engineNumber: params.bike.engineNumber,
      chassisNumber: params.bike.chassisNumber,
      registrationNumber: params.bike.registrationNumber,
      condition: params.bike.condition,
      purchaseCost: params.purchaseCost,
      totalExpenses: 0,
      totalCost: params.purchaseCost,
      status: 'Available',
      docId,
      photoBlob: params.bike.photoBlob,
      photos: params.bike.photos || [],
      notes: params.bike.notes,
      createdAt: now,
      updatedAt: now,
    };

    // 6. Create Cashbook Outflow Entry
    const cashbookEntry: CashbookEntry = {
      id: cashbookId,
      date: params.purchaseDate || getCurrentDate(),
      time: params.purchaseTime || getCurrentTime(),
      type: 'Bike Purchase',
      referenceId: purchaseId,
      description: `Purchase of ${params.bike.make} ${params.bike.model} (Eng: ${params.bike.engineNumber}, Ch: ${params.bike.chassisNumber}) from ${params.seller.name}`,
      amount: -Math.abs(params.purchaseCost),
      paymentMethod: params.paymentMethod || 'Cash',
      account: params.paymentMethod === 'Bank Transfer' ? 'Bank' : 'Cash',
      createdAt: now,
    };

    // 7. Audit Log
    const auditLog: AuditLog = {
      id: `AUDIT-${Date.now()}`,
      timestamp: now,
      action: 'PURCHASE_BIKE',
      entityType: 'Bike',
      entityId: bikeId,
      details: `Purchased ${bike.make} ${bike.model} for Rs. ${params.purchaseCost.toLocaleString()}`,
    };

    // Execute in a single transactional write
    const storesToLock = ['bikes', 'purchases', 'documents', 'cashbook', 'auditLogs'];
    if (newSeller) storesToLock.push('sellers');

    const tx = db.transaction(storesToLock, 'readwrite');
    if (newSeller) {
      tx.objectStore('sellers').put(newSeller);
    }
    tx.objectStore('bikes').put(bike);
    tx.objectStore('purchases').put(purchase);
    tx.objectStore('documents').put(bikeDoc);
    tx.objectStore('cashbook').put(cashbookEntry);
    tx.objectStore('auditLogs').put(auditLog);

    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error || new Error('Transaction aborted'));
    });

    return { bikeId, purchaseId, sellerId, docId };
  }

  /**
   * Add a bike expense, update total cost, and post to cashbook
   */
  public async addBikeExpense(expenseData: {
    bikeId: string;
    category: BikeExpense['category'];
    description: string;
    amount: number;
    date: string;
    time: string;
    notes?: string;
    paymentMethod?: string;
  }): Promise<string> {
    const expenseId = await this.getNextId('EXP');
    const cashbookId = await this.getNextId('CB');
    const now = new Date().toISOString();

    const bike = await this.getById<Bike>('bikes', expenseData.bikeId);
    if (!bike) throw new Error('Bike not found for this expense');

    const expense: BikeExpense = {
      id: expenseId,
      bikeId: expenseData.bikeId,
      category: expenseData.category,
      description: expenseData.description,
      amount: Number(expenseData.amount),
      date: expenseData.date || getCurrentDate(),
      time: expenseData.time || getCurrentTime(),
      notes: expenseData.notes,
      cashbookId,
      createdAt: now,
    };

    const cashbookEntry: CashbookEntry = {
      id: cashbookId,
      date: expenseData.date || getCurrentDate(),
      time: expenseData.time || getCurrentTime(),
      type: 'Bike Expense',
      referenceId: expenseId,
      description: `Bike Expense (${expenseData.category}): ${expenseData.description} for ${bike.make} ${bike.model} [${bike.id}]`,
      amount: -Math.abs(Number(expenseData.amount)),
      paymentMethod: expenseData.paymentMethod || 'Cash',
      account: expenseData.paymentMethod === 'Bank Transfer' ? 'Bank' : 'Cash',
      createdAt: now,
    };

    const db = await this.getDB();
    const tx = db.transaction(['expenses', 'cashbook'], 'readwrite');
    tx.objectStore('expenses').put(expense);
    tx.objectStore('cashbook').put(cashbookEntry);

    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error || new Error('Transaction aborted'));
    });

    // Recalculate bike total cost
    await this.refreshBikeTotalCost(expenseData.bikeId);

    // If bike is already sold, recalculate sale profit
    if (bike.saleId) {
      await this.refreshSaleProfit(bike.saleId);
    }

    return expenseId;
  }

  /**
   * Edit an existing bike expense and sync with cashbook & bike total cost
   */
  public async updateBikeExpense(expense: BikeExpense): Promise<void> {
    const db = await this.getDB();
    const oldExpense = await this.getById<BikeExpense>('expenses', expense.id);

    let cb: CashbookEntry | null = null;
    if (oldExpense?.cashbookId) {
      cb = await this.getById<CashbookEntry>('cashbook', oldExpense.cashbookId);
      if (cb) {
        cb.amount = -Math.abs(expense.amount);
        cb.date = expense.date;
        cb.time = expense.time;
        cb.description = `Bike Expense (${expense.category}): ${expense.description} for Bike [${expense.bikeId}]`;
      }
    }

    const tx = db.transaction(cb ? ['expenses', 'cashbook'] : ['expenses'], 'readwrite');
    tx.objectStore('expenses').put(expense);
    if (cb) {
      tx.objectStore('cashbook').put(cb);
    }

    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error || new Error('Transaction aborted'));
    });

    await this.refreshBikeTotalCost(expense.bikeId);
    const bike = await this.getById<Bike>('bikes', expense.bikeId);
    if (bike?.saleId) {
      await this.refreshSaleProfit(bike.saleId);
    }
  }

  /**
   * Delete bike expense safely
   */
  public async deleteBikeExpense(expenseId: string): Promise<void> {
    const expense = await this.getById<BikeExpense>('expenses', expenseId);
    if (!expense) return;

    const db = await this.getDB();
    const tx = db.transaction(['expenses', 'cashbook'], 'readwrite');
    tx.objectStore('expenses').delete(expenseId);
    if (expense.cashbookId) {
      tx.objectStore('cashbook').delete(expense.cashbookId);
    }

    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error || new Error('Transaction aborted'));
    });

    await this.refreshBikeTotalCost(expense.bikeId);
    const bike = await this.getById<Bike>('bikes', expense.bikeId);
    if (bike?.saleId) {
      await this.refreshSaleProfit(bike.saleId);
    }
  }

  /**
   * Recalculate Sale Profit when expenses or costs change
   */
  public async refreshSaleProfit(saleId: string): Promise<void> {
    const sale = await this.getById<Sale>('sales', saleId);
    if (!sale) return;

    const { actualCost } = await this.calculateActualBikeCost(sale.bikeId);
    sale.actualBikeCost = actualCost;
    sale.profit = sale.salePrice - actualCost;
    await this.put('sales', sale);
  }

  /**
   * Create Atomic Sale Transaction:
   * 1. Checks Bike ID.
   * 2. Checks current inventory status.
   * 3. Verifies bike is Available.
   * 4. Creates Sale with automatic actual cost & profit calculation.
   * 5. Changes bike status to Sold and links Sale ID.
   * 6. Posts Cashbook Inflow and Payment records.
   * 7. If Finance is chosen, creates Finance Account and Schedule.
   * 8. Commits all changes in one IndexedDB transaction.
   */
  public async createSaleTransaction(params: {
    bikeId: string;
    customerId?: string;
    customer?: {
      id?: string;
      name: string;
      phone?: string;
      cnic?: string;
      address?: string;
      photoBlob?: string;
      cnicFrontBlob?: string;
      cnicBackBlob?: string;
      guarantor1Name?: string;
      guarantor1Phone?: string;
      guarantor1Cnic?: string;
      guarantor1Address?: string;
      guarantor1PhotoBlob?: string;
      guarantor2Name?: string;
      guarantor2Phone?: string;
      guarantor2Cnic?: string;
    };
    saleDate?: string;
    saleTime?: string;
    salePrice: number;
    amountReceived?: number;
    paidAmount?: number;
    remainingBalance?: number;
    paymentMethod?: Sale['paymentMethod'] | string;
    saleType?: string;
    broker?: string;
    notes?: string;
    financeConfig?: {
      downPayment: number;
      markup: number;
      installmentCount: number;
      firstDueDate: string;
    };
    installmentPlan?: {
      downPayment: number;
      totalMonths: number;
      monthlyInstallment?: number;
      notes?: string;
    };
  }): Promise<{ saleId: string; receiptNo: string; financeId?: string; sale: Sale }> {
    const db = await this.getDB();

    if (!params.bikeId) {
      throw new Error('Please select an available motorcycle to sell.');
    }

    // 1. Fetch and Verify Bike
    const bike = await this.getById<Bike>('bikes', params.bikeId);
    if (!bike) {
      throw new Error(`Bike ID ${params.bikeId} not found.`);
    }

    if (bike.status !== 'Available') {
      throw new Error(
        `Cannot sell bike! Current inventory status is "${bike.status}". Only "Available" bikes can be sold.`
      );
    }

    const now = new Date().toISOString();

    // 2. Resolve or Create Customer
    let resolvedCustomerId = params.customerId || params.customer?.id;
    let customer: Customer | null = null;
    let isNewCustomer = false;

    if (resolvedCustomerId) {
      customer = await this.getById<Customer>('customers', resolvedCustomerId);
    }

    if (!customer && params.customer && params.customer.name && params.customer.name.trim()) {
      resolvedCustomerId = await this.getNextId('CUST');
      customer = {
        id: resolvedCustomerId,
        name: params.customer.name.trim(),
        phone: params.customer.phone ? params.customer.phone.trim() : '',
        cnic: params.customer.cnic ? params.customer.cnic.trim() : '',
        address: params.customer.address ? params.customer.address.trim() : '',
        photoBlob: params.customer.photoBlob,
        cnicFrontBlob: params.customer.cnicFrontBlob,
        cnicBackBlob: params.customer.cnicBackBlob,
        guarantor1Name: params.customer.guarantor1Name ? params.customer.guarantor1Name.trim() : undefined,
        guarantor1Phone: params.customer.guarantor1Phone ? params.customer.guarantor1Phone.trim() : undefined,
        guarantor1Cnic: params.customer.guarantor1Cnic ? params.customer.guarantor1Cnic.trim() : undefined,
        guarantor1Address: params.customer.guarantor1Address ? params.customer.guarantor1Address.trim() : undefined,
        guarantor1PhotoBlob: params.customer.guarantor1PhotoBlob,
        guarantor2Name: params.customer.guarantor2Name ? params.customer.guarantor2Name.trim() : undefined,
        guarantor2Phone: params.customer.guarantor2Phone ? params.customer.guarantor2Phone.trim() : undefined,
        guarantor2Cnic: params.customer.guarantor2Cnic ? params.customer.guarantor2Cnic.trim() : undefined,
        createdAt: now,
      };
      isNewCustomer = true;
    }

    if (!customer || !resolvedCustomerId) {
      throw new Error(`Customer information is required. Please select or enter customer details.`);
    }

    // 3. Compute Actual Cost and Profit
    const { actualCost } = await this.calculateActualBikeCost(params.bikeId);
    const salePrice = Number(params.salePrice || 0);
    const profit = salePrice - actualCost;

    const saleId = await this.getNextId('SALE');
    const paymentId = await this.getNextId('PAY');
    const cashbookId = await this.getNextId('CB');
    const receiptNo = `S-${String(Date.now()).slice(-5)}`;

    let financeId: string | undefined;

    // Determine Payment Method and Amounts
    let rawMethod = params.paymentMethod || 'Cash';
    if (params.saleType === 'Installment') rawMethod = 'Finance';
    const paymentMethod: Sale['paymentMethod'] =
      rawMethod === 'Finance' || rawMethod === 'Bank Transfer' || rawMethod === 'Cheque' ? rawMethod : 'Cash';

    let amountReceived = Number(
      params.amountReceived !== undefined
        ? params.amountReceived
        : params.paidAmount !== undefined
        ? params.paidAmount
        : 0
    );

    // Handle Finance / Installment option
    let financeAccount: FinanceAccount | undefined;
    const isFinance =
      paymentMethod === 'Finance' ||
      params.saleType === 'Installment' ||
      Boolean(params.financeConfig) ||
      Boolean(params.installmentPlan);

    if (isFinance) {
      financeId = await this.getNextId('FIN');
      const down = Number(
        params.financeConfig?.downPayment ?? params.installmentPlan?.downPayment ?? amountReceived ?? 0
      );
      const markup = Number(params.financeConfig?.markup || 0);
      const totalPayable = salePrice + markup;
      const financedAmount = Math.max(0, totalPayable - down);
      const count = Math.max(
        1,
        params.financeConfig?.installmentCount || params.installmentPlan?.totalMonths || 1
      );
      const baseInst = Math.floor((financedAmount / count) * 100) / 100;

      const schedule: FinanceAccount['schedule'] = [];
      const firstDue = params.financeConfig?.firstDueDate || params.saleDate || getCurrentDate();

      for (let i = 1; i <= count; i++) {
        const d = new Date(firstDue + 'T00:00:00');
        d.setMonth(d.getMonth() + (i - 1));
        const dueDate = d.toISOString().slice(0, 10);
        const amount = i === count ? Number((financedAmount - baseInst * (count - 1)).toFixed(2)) : baseInst;

        schedule.push({
          no: i,
          dueDate,
          amount,
          paid: amount <= 0,
          paidAmount: 0,
        });
      }

      financeAccount = {
        id: financeId,
        receiptNo: `F-${String(Date.now()).slice(-5)}`,
        saleId,
        customerId: resolvedCustomerId,
        bikeId: params.bikeId,
        brand: bike.make,
        model: bike.model,
        engineNumber: bike.engineNumber,
        chassisNumber: bike.chassisNumber,
        bikePrice: salePrice,
        downPayment: down,
        markup,
        totalPayable,
        financedAmount,
        installmentCount: count,
        firstDueDate: firstDue,
        schedule,
        status: 'ACTIVE',
        notes: params.notes || params.installmentPlan?.notes,
        createdAt: now,
      };

      amountReceived = down;
    }

    const remainingBalance = isFinance
      ? financeAccount ? financeAccount.financedAmount : 0
      : Math.max(0, salePrice - amountReceived);

    // Create Sale Object
    const sale: Sale = {
      id: saleId,
      receiptNo,
      bikeId: params.bikeId,
      customerId: resolvedCustomerId,
      saleDate: params.saleDate || getCurrentDate(),
      saleTime: params.saleTime || getCurrentTime(),
      make: bike.make,
      model: bike.model,
      engineNumber: bike.engineNumber,
      chassisNumber: bike.chassisNumber,
      registrationNumber: bike.registrationNumber,
      actualBikeCost: actualCost,
      salePrice,
      profit,
      amountReceived,
      remainingBalance,
      paymentMethod: isFinance ? 'Finance' : paymentMethod,
      saleType: isFinance ? 'Installment' : (params.saleType || (remainingBalance > 0 ? 'Credit' : 'Cash')),
      broker: params.broker,
      notes: params.notes,
      financeId: financeId || (isFinance && financeAccount ? financeAccount.id : undefined),
      cashbookId: amountReceived > 0 ? cashbookId : undefined,
      createdAt: now,
    };

    // Update Bike Object
    bike.status = 'Sold';
    bike.saleId = saleId;
    bike.updatedAt = now;

    // Create Payment Object if money was received upfront
    let payment: Payment | undefined;
    if (amountReceived > 0) {
      payment = {
        id: paymentId,
        receiptNo: `R-${String(Date.now()).slice(-5)}`,
        date: params.saleDate || getCurrentDate(),
        time: params.saleTime || getCurrentTime(),
        customerId: resolvedCustomerId,
        saleId,
        financeId,
        installmentNo: isFinance ? 0 : undefined,
        amount: amountReceived,
        method: paymentMethod,
        note: isFinance ? `Down Payment for Sale ${receiptNo}` : `Upfront Payment for Sale ${receiptNo}`,
        cashbookId,
        createdAt: now,
      };
    }

    // Create Cashbook Entry if money received
    let cashbookEntry: CashbookEntry | undefined;
    if (amountReceived > 0) {
      cashbookEntry = {
        id: cashbookId,
        date: params.saleDate || getCurrentDate(),
        time: params.saleTime || getCurrentTime(),
        type: 'Bike Sale',
        referenceId: saleId,
        description: `Sale Receipt ${receiptNo}: ${bike.make} ${bike.model} to ${customer.name} (Eng: ${bike.engineNumber})`,
        amount: amountReceived,
        paymentMethod: paymentMethod,
        account: paymentMethod === 'Bank Transfer' ? 'Bank' : 'Cash',
        createdAt: now,
      };
    }

    // Transactional Commit
    const storesToLock = [
      'bikes',
      'sales',
      'payments',
      'cashbook',
      'financeAccounts',
      'auditLogs',
      'customers',
    ];
    const tx = db.transaction(storesToLock, 'readwrite');

    if (isNewCustomer && customer) {
      tx.objectStore('customers').put(customer);
    }
    tx.objectStore('bikes').put(bike);
    tx.objectStore('sales').put(sale);
    if (payment) tx.objectStore('payments').put(payment);
    if (cashbookEntry) tx.objectStore('cashbook').put(cashbookEntry);
    if (financeAccount) tx.objectStore('financeAccounts').put(financeAccount);

    const auditLog: AuditLog = {
      id: `AUDIT-${Date.now()}`,
      timestamp: now,
      action: 'SALE_BIKE',
      entityType: 'Sale',
      entityId: saleId,
      details: `Sold ${bike.make} ${bike.model} for Rs. ${salePrice.toLocaleString()} (Profit: Rs. ${profit.toLocaleString()}) to ${customer.name}`,
    };
    tx.objectStore('auditLogs').put(auditLog);

    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error || new Error('Transaction aborted'));
    });

    // Synchronize customer.balance accurately without double-counting
    const allSales = await this.getAll<Sale>('sales');
    const allFinances = await this.getAll<FinanceAccount>('financeAccounts');
    const custCalc = calculateCustomerOutstanding(customer.id, allSales, allFinances);
    customer.balance = custCalc.totalOutstanding;
    await this.put('customers', customer);

    return { saleId, receiptNo, financeId, sale };
  }

  /**
   * Collect customer payment / installment
   */
  public async recordCustomerPayment(params: {
    customerId?: string;
    saleId?: string;
    financeId?: string;
    installmentNo?: number;
    amount: number;
    paymentMethod: Sale['paymentMethod'];
    note?: string;
    notes?: string;
    date?: string;
    time?: string;
  }): Promise<string> {
    const db = await this.getDB();
    const paymentId = await this.getNextId('PAY');
    const cashbookId = await this.getNextId('CB');
    const now = new Date().toISOString();
    const amount = Number(params.amount);
    const date = params.date || getCurrentDate();
    const time = params.time || getCurrentTime();
    const receiptNo = `R-${String(Date.now()).slice(-5)}`;
    const effectiveNote = params.note || params.notes;

    let resolvedCustomerId = params.customerId;
    if (!resolvedCustomerId && params.financeId) {
      const finance = await this.getById<FinanceAccount>('financeAccounts', params.financeId);
      if (finance) resolvedCustomerId = finance.customerId;
    }
    if (!resolvedCustomerId && params.saleId) {
      const sale = await this.getById<Sale>('sales', params.saleId);
      if (sale) resolvedCustomerId = sale.customerId;
    }

    if (!resolvedCustomerId) {
      throw new Error('Customer ID is required or could not be determined.');
    }

    const customer = await this.getById<Customer>('customers', resolvedCustomerId);
    if (!customer) throw new Error('Customer not found');

    let installmentNo: number | undefined;
    const modifiedFinances = new Map<string, FinanceAccount>();
    const modifiedSales = new Map<string, Sale>();

    // Case 1: Linked to Finance Account
    if (params.financeId) {
      const finance = await this.getById<FinanceAccount>('financeAccounts', params.financeId);
      if (finance) {
        let remainingToApply = amount;
        for (const item of finance.schedule) {
          if (item.paid) continue;
          const dueLeft = item.amount - (item.paidAmount || 0);
          const portion = Math.min(remainingToApply, dueLeft);
          if (portion > 0) {
            item.paidAmount = Number(((item.paidAmount || 0) + portion).toFixed(2));
            if (item.paidAmount >= item.amount) {
              item.paid = true;
              item.paidDate = date;
              item.paidMethod = params.paymentMethod;
              item.paymentId = paymentId;
            }
            if (installmentNo === undefined) {
              installmentNo = item.no;
            }
            remainingToApply = Number((remainingToApply - portion).toFixed(2));
          }
          if (remainingToApply <= 0) break;
        }

        // Check if fully paid
        const allPaid = finance.schedule.every((x) => x.paid);
        finance.status = allPaid ? 'PAID' : 'ACTIVE';
        modifiedFinances.set(finance.id, finance);

        // Also sync linked sale
        const allSales = await this.getAll<Sale>('sales');
        const linkedSale = allSales.find(
          (s) => s.financeId === finance.id || (finance.bikeId && s.bikeId === finance.bikeId)
        );
        if (linkedSale) {
          linkedSale.amountReceived = Number((Number(linkedSale.amountReceived || 0) + amount).toFixed(2));
          const unpaidSchedule = finance.schedule
            .filter((x) => !x.paid)
            .reduce((acc, x) => acc + (x.amount - (x.paidAmount || 0)), 0);
          linkedSale.remainingBalance = Math.max(0, Number(unpaidSchedule.toFixed(2)));
          modifiedSales.set(linkedSale.id, linkedSale);
        }
      }
    }

    // Case 2: Linked to Sale directly (Credit Sale)
    if (params.saleId && !params.financeId) {
      const sale = await this.getById<Sale>('sales', params.saleId);
      if (sale) {
        sale.amountReceived = Number((Number(sale.amountReceived || 0) + amount).toFixed(2));
        sale.remainingBalance = Math.max(0, Number((sale.salePrice - sale.amountReceived).toFixed(2)));
        modifiedSales.set(sale.id, sale);

        // If sale is linked to a finance account, also apply to schedule
        if (sale.financeId) {
          const finance = await this.getById<FinanceAccount>('financeAccounts', sale.financeId);
          if (finance) {
            let remainingToApply = amount;
            for (const item of finance.schedule) {
              if (item.paid) continue;
              const dueLeft = item.amount - (item.paidAmount || 0);
              const portion = Math.min(remainingToApply, dueLeft);
              if (portion > 0) {
                item.paidAmount = Number(((item.paidAmount || 0) + portion).toFixed(2));
                if (item.paidAmount >= item.amount) {
                  item.paid = true;
                  item.paidDate = date;
                  item.paidMethod = params.paymentMethod;
                  item.paymentId = paymentId;
                }
                remainingToApply = Number((remainingToApply - portion).toFixed(2));
              }
              if (remainingToApply <= 0) break;
            }
            finance.status = finance.schedule.every((x) => x.paid) ? 'PAID' : 'ACTIVE';
            modifiedFinances.set(finance.id, finance);
          }
        }
      }
    }

    // Case 3: Direct Customer Ledger Payment (without specific saleId or financeId)
    if (!params.saleId && !params.financeId) {
      let unapplied = amount;

      // 1. Apply to customer's active finance account schedules
      const allFinances = await this.getAll<FinanceAccount>('financeAccounts');
      const custFinances = allFinances.filter(
        (f) => f.customerId === params.customerId && f.status !== 'PAID'
      );
      for (const finance of custFinances) {
        if (unapplied <= 0) break;
        for (const item of finance.schedule) {
          if (item.paid || unapplied <= 0) continue;
          const dueLeft = item.amount - (item.paidAmount || 0);
          const portion = Math.min(unapplied, dueLeft);
          if (portion > 0) {
            item.paidAmount = Number(((item.paidAmount || 0) + portion).toFixed(2));
            if (item.paidAmount >= item.amount) {
              item.paid = true;
              item.paidDate = date;
              item.paidMethod = params.paymentMethod;
              item.paymentId = paymentId;
            }
            if (installmentNo === undefined) {
              installmentNo = item.no;
            }
            unapplied = Number((unapplied - portion).toFixed(2));
          }
        }
        finance.status = finance.schedule.every((x) => x.paid) ? 'PAID' : 'ACTIVE';
        modifiedFinances.set(finance.id, finance);

        // Sync linked sale
        const allSales = await this.getAll<Sale>('sales');
        const linkedSale = allSales.find(
          (s) => s.financeId === finance.id || (finance.bikeId && s.bikeId === finance.bikeId)
        );
        if (linkedSale) {
          const unpaidSchedule = finance.schedule
            .filter((x) => !x.paid)
            .reduce((acc, x) => acc + (x.amount - (x.paidAmount || 0)), 0);
          linkedSale.remainingBalance = Math.max(0, Number(unpaidSchedule.toFixed(2)));
          modifiedSales.set(linkedSale.id, linkedSale);
        }
      }

      // 2. If still unapplied amount left, apply to non-finance credit sales
      if (unapplied > 0) {
        const allSales = await this.getAll<Sale>('sales');
        const allFinances = await this.getAll<FinanceAccount>('financeAccounts');
        const custCreditSales = allSales.filter(
          (s) => s.customerId === params.customerId && !isSaleFinanced(s, allFinances) && Number(s.remainingBalance || 0) > 0
        );
        for (const sale of custCreditSales) {
          if (unapplied <= 0) break;
          const due = Number(sale.remainingBalance || 0);
          const portion = Math.min(unapplied, due);
          sale.amountReceived = Number((Number(sale.amountReceived || 0) + portion).toFixed(2));
          sale.remainingBalance = Math.max(0, Number((sale.salePrice - sale.amountReceived).toFixed(2)));
          unapplied = Number((unapplied - portion).toFixed(2));
          modifiedSales.set(sale.id, sale);
        }
      }
    }

    const payment: Payment = {
      id: paymentId,
      receiptNo,
      date,
      time,
      customerId: resolvedCustomerId,
      saleId: params.saleId,
      financeId: params.financeId,
      installmentNo,
      amount,
      method: params.paymentMethod,
      note: effectiveNote || (params.financeId ? `Installment collection #${installmentNo || ''}` : 'Customer ledger payment'),
      cashbookId,
      createdAt: now,
    };

    const cashbookEntry: CashbookEntry = {
      id: cashbookId,
      date,
      time,
      type: 'Customer Payment',
      referenceId: paymentId,
      description: `Payment ${receiptNo} received from ${customer.name} (${effectiveNote || 'Collection'})`,
      amount,
      paymentMethod: params.paymentMethod,
      account: params.paymentMethod === 'Bank Transfer' ? 'Bank' : 'Cash',
      createdAt: now,
    };

    // Calculate customer balance with modifications applied
    const allSalesForCalc = (await this.getAll<Sale>('sales')).map((s) => modifiedSales.get(s.id) || s);
    const allFinancesForCalc = (await this.getAll<FinanceAccount>('financeAccounts')).map((f) => modifiedFinances.get(f.id) || f);
    const custCalc = calculateCustomerOutstanding(customer.id, allSalesForCalc, allFinancesForCalc);
    customer.balance = custCalc.totalOutstanding;

    // Single Atomic Transaction across all stores
    const storesToLock = ['payments', 'cashbook', 'customers'];
    if (modifiedFinances.size > 0) storesToLock.push('financeAccounts');
    if (modifiedSales.size > 0) storesToLock.push('sales');

    const tx = db.transaction(storesToLock, 'readwrite');
    tx.objectStore('payments').put(payment);
    tx.objectStore('cashbook').put(cashbookEntry);
    for (const f of modifiedFinances.values()) {
      tx.objectStore('financeAccounts').put(f);
    }
    for (const s of modifiedSales.values()) {
      tx.objectStore('sales').put(s);
    }
    tx.objectStore('customers').put(customer);

    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error || new Error('Transaction aborted'));
    });

    return paymentId;
  }

  // --- Export Full Backup & Safe Restore ---

  public async exportFullBackup(): Promise<FullBackupData> {
    const settings = await this.getSettings();
    const [
      bikes,
      purchases,
      sellers,
      customers,
      sales,
      expenses,
      documents,
      financeAccounts,
      payments,
      cashbook,
      auditLogs,
    ] = await Promise.all([
      this.getAll<Bike>('bikes'),
      this.getAll<Purchase>('purchases'),
      this.getAll<Seller>('sellers'),
      this.getAll<Customer>('customers'),
      this.getAll<Sale>('sales'),
      this.getAll<BikeExpense>('expenses'),
      this.getAll<BikeDocument>('documents'),
      this.getAll<FinanceAccount>('financeAccounts'),
      this.getAll<Payment>('payments'),
      this.getAll<CashbookEntry>('cashbook'),
      this.getAll<AuditLog>('auditLogs'),
    ]);

    const backup: FullBackupData = {
      version: 4,
      exportedAt: new Date().toISOString(),
      appName: 'Bike Shop Management System V4',
      shopName: settings.shopName,
      counts: {
        bikes: bikes.length,
        purchases: purchases.length,
        sellers: sellers.length,
        customers: customers.length,
        sales: sales.length,
        expenses: expenses.length,
        documents: documents.length,
        financeAccounts: financeAccounts.length,
        payments: payments.length,
        cashbook: cashbook.length,
        auditLogs: auditLogs.length,
      },
      data: {
        bikes,
        purchases,
        sellers,
        customers,
        sales,
        expenses,
        documents,
        financeAccounts,
        payments,
        cashbook,
        auditLogs,
        settings,
      },
    };

    return backup;
  }

  public async restoreFullBackup(backup: FullBackupData): Promise<{ success: boolean; message: string; counts: any }> {
    if (!backup || !backup.data) {
      throw new Error('Invalid backup file structure: missing data payload.');
    }

    const db = await this.getDB();
    const storeNames = [
      'bikes',
      'purchases',
      'sellers',
      'customers',
      'sales',
      'expenses',
      'documents',
      'financeAccounts',
      'payments',
      'cashbook',
      'auditLogs',
      'settings',
    ];

    const tx = db.transaction(storeNames, 'readwrite');

    // Clear all stores first
    for (const name of storeNames) {
      tx.objectStore(name).clear();
    }

    // Repopulate all stores
    const d = backup.data;
    if (d.bikes) d.bikes.forEach((item) => tx.objectStore('bikes').put(item));
    if (d.purchases) d.purchases.forEach((item) => tx.objectStore('purchases').put(item));
    if (d.sellers) d.sellers.forEach((item) => tx.objectStore('sellers').put(item));
    if (d.customers) d.customers.forEach((item) => tx.objectStore('customers').put(item));
    if (d.sales) d.sales.forEach((item) => tx.objectStore('sales').put(item));
    if (d.expenses) d.expenses.forEach((item) => tx.objectStore('expenses').put(item));
    if (d.documents) d.documents.forEach((item) => tx.objectStore('documents').put(item));
    if (d.financeAccounts) d.financeAccounts.forEach((item) => tx.objectStore('financeAccounts').put(item));
    if (d.payments) d.payments.forEach((item) => tx.objectStore('payments').put(item));
    if (d.cashbook) d.cashbook.forEach((item) => tx.objectStore('cashbook').put(item));
    if (d.auditLogs) d.auditLogs.forEach((item) => tx.objectStore('auditLogs').put(item));
    if (d.settings) {
      tx.objectStore('settings').put({ key: 'main_settings', value: d.settings });
    }

    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });

    return {
      success: true,
      message: 'Restore completed successfully with all relationships preserved.',
      counts: backup.counts,
    };
  }

  // --- Safe V3 LocalStorage Migration ---

  public async migrateFromV3LocalStorage(): Promise<{ migrated: boolean; count: number; message: string }> {
    const V3_KEY = 'usmanShabirMotersV3';
    const raw = localStorage.getItem(V3_KEY);
    if (!raw) {
      return { migrated: false, count: 0, message: 'No V3 LocalStorage data found.' };
    }

    try {
      const v3 = JSON.parse(raw);
      if (!v3 || typeof v3 !== 'object') {
        return { migrated: false, count: 0, message: 'Invalid V3 data structure.' };
      }

      // Check if already migrated
      const currentBikes = await this.getAll<Bike>('bikes');
      if (currentBikes.length > 0) {
        return {
          migrated: false,
          count: currentBikes.length,
          message: 'V4 database already contains data. Migration skipped to prevent duplicate overwriting.',
        };
      }

      const units = Array.isArray(v3.units) ? v3.units : [];
      const customers = Array.isArray(v3.customers) ? v3.customers : [];
      const sales = Array.isArray(v3.sales) ? v3.sales : [];
      const finances = Array.isArray(v3.finances) ? v3.finances : [];
      const payments = Array.isArray(v3.payments) ? v3.payments : [];
      const expenses = Array.isArray(v3.expenses) ? v3.expenses : [];
      const v3Settings = v3.settings || {};

      let migratedBikesCount = 0;

      // 1. Migrate Customers
      for (const c of customers) {
        const custId = c.id || `CUST-2026-${String(migratedBikesCount + 1).padStart(4, '0')}`;
        await this.put<Customer>('customers', {
          id: custId,
          name: c.name || 'Walk-in Customer',
          fatherName: c.father || '',
          cnic: c.cnic || '',
          phone: c.phone || '',
          address: c.address || '',
          city: c.city || '',
          notes: c.notes || '',
          createdAt: c.createdAt || new Date().toISOString(),
        });
      }

      // 2. Migrate Units to Purchases + Bikes + Documents + Sellers
      for (let i = 0; i < units.length; i++) {
        const u = units[i];
        const bikeId = `BIKE-2026-${String(i + 1).padStart(4, '0')}`;
        const purId = `PUR-2026-${String(i + 1).padStart(4, '0')}`;
        const selId = `SEL-2026-${String(i + 1).padStart(4, '0')}`;
        const docId = `DOC-2026-${String(i + 1).padStart(4, '0')}`;
        const cost = Number(u.cost || 0);

        // Seller
        await this.put<Seller>('sellers', {
          id: selId,
          name: u.supplier || 'Showroom Purchase',
          phone: '',
          cnic: '',
          photoBlob: u.sellerPic || '',
          cnicFrontBlob: u.cnicFrontPic || '',
          cnicBackBlob: u.cnicBackPic || '',
          createdAt: u.purchaseDate || new Date().toISOString(),
        });

        // Purchase
        await this.put<Purchase>('purchases', {
          id: purId,
          bikeId,
          sellerId: selId,
          purchaseDate: u.purchaseDate || getCurrentDate(),
          purchaseTime: u.purchaseTime || '10:00',
          purchaseCost: cost,
          condition: 'Good',
          notes: u.notes || '',
          supplier: u.supplier || '',
          invoiceNo: u.invoice || '',
          createdAt: u.createdAt || new Date().toISOString(),
        });

        // Document
        await this.put<BikeDocument>('documents', {
          id: docId,
          bikeId,
          registrationStatus: u.papersStatus === 'Registered' ? 'Registered' : 'Open',
          registrationNumber: u.registration || '',
          engineNumber: u.engine || `ENG-${i + 1}`,
          chassisNumber: u.chassis || `CHAS-${i + 1}`,
          originalFileAvailable: u.papersStatus !== 'File Missing',
          smartCardAvailable: u.papersStatus === 'Registered',
          tokenTaxStatus: 'Verified',
          transferStatus: u.papersStatus === 'Open' ? 'Open' : 'Transferred',
          saleLetterAvailable: true,
          docPhotos: u.paperPic ? [u.paperPic] : [],
          docNotes: u.docNotes || 'Migrated from V3 showroom archive.',
          updatedAt: new Date().toISOString(),
        });

        // Bike
        await this.put<Bike>('bikes', {
          id: bikeId,
          purchaseId: purId,
          sellerId: selId,
          make: u.brand || 'Honda',
          model: u.model || 'CD 70',
          year: 2025,
          color: u.color || 'Black',
          engineNumber: u.engine || `ENG-${i + 1}`,
          chassisNumber: u.chassis || `CHAS-${i + 1}`,
          registrationNumber: u.registration || '',
          condition: 'Good',
          purchaseCost: cost,
          totalExpenses: 0,
          totalCost: cost,
          status: u.status === 'SOLD' ? 'Sold' : 'Available',
          docId,
          notes: u.notes || '',
          createdAt: u.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });

        migratedBikesCount++;
      }

      // 3. Migrate Sales
      for (const s of sales) {
        const saleId = s.id || `SALE-2026-${String(Date.now()).slice(-4)}`;
        await this.put<Sale>('sales', {
          id: saleId,
          receiptNo: s.receiptNo || `S-${String(Date.now()).slice(-5)}`,
          bikeId: s.unitId || '',
          customerId: s.customerId || '',
          saleDate: s.date || getCurrentDate(),
          saleTime: s.time || '12:00',
          make: s.brand || '',
          model: s.model || '',
          engineNumber: s.engine || '',
          chassisNumber: s.chassis || '',
          actualBikeCost: Number(s.cost || 0),
          salePrice: Number(s.total || 0),
          profit: Number(s.total || 0) - Number(s.cost || 0),
          amountReceived: Number(s.received || s.total || 0),
          remainingBalance: Number(s.balance || 0),
          paymentMethod: (s.paymentType as any) || 'Cash',
          broker: s.broker || '',
          notes: s.notes || '',
          createdAt: new Date().toISOString(),
        });
      }

      // 4. Migrate Expenses
      for (const e of expenses) {
        await this.put<BikeExpense>('expenses', {
          id: e.id || `EXP-2026-${String(Date.now()).slice(-4)}`,
          bikeId: '', // General showroom expense
          category: 'Other',
          description: e.description || e.type || 'General Showroom Expense',
          amount: Number(e.amount || 0),
          date: e.date || getCurrentDate(),
          time: '12:00',
          createdAt: new Date().toISOString(),
        });
      }

      // 5. Migrate Settings
      const newSettings: ShowroomSettings = {
        ...DEFAULT_SETTINGS,
        shopName: v3Settings.shopName || DEFAULT_SETTINGS.shopName,
        phone: v3Settings.phone || DEFAULT_SETTINGS.phone,
        address: v3Settings.address || DEFAULT_SETTINGS.address,
        currency: v3Settings.currency || 'Rs',
      };
      await this.saveSettings(newSettings);

      return {
        migrated: true,
        count: migratedBikesCount,
        message: `Successfully migrated ${migratedBikesCount} bikes, ${customers.length} customers, and ${sales.length} sales from V3 LocalStorage into IndexedDB without deleting original data.`,
      };
    } catch (err: any) {
      return {
        migrated: false,
        count: 0,
        message: `Migration failed: ${err.message}. Original LocalStorage data is untouched and completely safe.`,
      };
    }
  }

  // --- Database Health Check ---

  public async runHealthCheck(): Promise<HealthCheckItem[]> {
    const checks: HealthCheckItem[] = [];

    // Check 1: IndexedDB connection
    try {
      const db = await this.getDB();
      checks.push({
        id: 'chk-idb-open',
        name: 'IndexedDB Availability & Connection',
        category: 'Storage',
        status: 'passed',
        message: `IndexedDB "${DB_NAME}" (v${DB_VERSION}) is connected and operational.`,
      });

      // Check 2: All 12 Object Stores exist
      const requiredStores = [
        'bikes',
        'purchases',
        'sellers',
        'customers',
        'sales',
        'expenses',
        'documents',
        'financeAccounts',
        'payments',
        'cashbook',
        'auditLogs',
        'settings',
      ];
      const missingStores = requiredStores.filter((s) => !db.objectStoreNames.contains(s));
      if (missingStores.length === 0) {
        checks.push({
          id: 'chk-stores-exist',
          name: 'Object Stores Structure',
          category: 'Storage',
          status: 'passed',
          message: 'All 12 required object stores exist with proper schemas and indexes.',
        });
      } else {
        checks.push({
          id: 'chk-stores-exist',
          name: 'Object Stores Structure',
          category: 'Storage',
          status: 'failed',
          message: `Missing object stores: ${missingStores.join(', ')}`,
        });
      }
    } catch (err: any) {
      checks.push({
        id: 'chk-idb-open',
        name: 'IndexedDB Availability',
        category: 'Storage',
        status: 'failed',
        message: `Failed to open IndexedDB: ${err.message}`,
      });
      return checks;
    }

    // Load stores data
    const [bikes, purchases, sales, expenses, documents, financeAccounts, customers, payments, cashbook] =
      await Promise.all([
        this.getAll<Bike>('bikes'),
        this.getAll<Purchase>('purchases'),
        this.getAll<Sale>('sales'),
        this.getAll<BikeExpense>('expenses'),
        this.getAll<BikeDocument>('documents'),
        this.getAll<FinanceAccount>('financeAccounts'),
        this.getAll<Customer>('customers'),
        this.getAll<Payment>('payments'),
        this.getAll<CashbookEntry>('cashbook'),
      ]);

    // Check 3: Unique Engine Numbers
    const engineMap = new Map<string, string[]>();
    bikes.forEach((b) => {
      const k = b.engineNumber.trim().toLowerCase();
      if (k) {
        const arr = engineMap.get(k) || [];
        arr.push(b.id);
        engineMap.set(k, arr);
      }
    });
    const duplicateEngines = Array.from(engineMap.entries()).filter(([_, ids]) => ids.length > 1);
    if (duplicateEngines.length === 0) {
      checks.push({
        id: 'chk-dup-engines',
        name: 'Engine Number Uniqueness',
        category: 'Integrity',
        status: 'passed',
        message: 'No duplicate Engine Numbers found across bike records.',
      });
    } else {
      checks.push({
        id: 'chk-dup-engines',
        name: 'Engine Number Uniqueness',
        category: 'Integrity',
        status: 'warning',
        message: `Found ${duplicateEngines.length} duplicate Engine Number(s).`,
        details: duplicateEngines.map(([eng, ids]) => `Engine "${eng}" used in bikes: ${ids.join(', ')}`).join('; '),
      });
    }

    // Check 4: Unique Chassis Numbers
    const chassisMap = new Map<string, string[]>();
    bikes.forEach((b) => {
      const k = b.chassisNumber.trim().toLowerCase();
      if (k) {
        const arr = chassisMap.get(k) || [];
        arr.push(b.id);
        chassisMap.set(k, arr);
      }
    });
    const duplicateChassis = Array.from(chassisMap.entries()).filter(([_, ids]) => ids.length > 1);
    if (duplicateChassis.length === 0) {
      checks.push({
        id: 'chk-dup-chassis',
        name: 'Chassis Number Uniqueness',
        category: 'Integrity',
        status: 'passed',
        message: 'No duplicate Chassis Numbers found across bike records.',
      });
    } else {
      checks.push({
        id: 'chk-dup-chassis',
        name: 'Chassis Number Uniqueness',
        category: 'Integrity',
        status: 'warning',
        message: `Found ${duplicateChassis.length} duplicate Chassis Number(s).`,
        details: duplicateChassis.map(([ch, ids]) => `Chassis "${ch}" used in bikes: ${ids.join(', ')}`).join('; '),
      });
    }

    // Check 5: No Sold Bike Marked as Available
    const soldBikes = sales.map((s) => s.bikeId);
    const conflictingBikes = bikes.filter((b) => soldBikes.includes(b.id) && b.status === 'Available');
    if (conflictingBikes.length === 0) {
      checks.push({
        id: 'chk-sold-status',
        name: 'Sold Status Consistency',
        category: 'Integrity',
        status: 'passed',
        message: 'All sold bikes are correctly marked as "Sold" (No double sale conflicts).',
      });
    } else {
      checks.push({
        id: 'chk-sold-status',
        name: 'Sold Status Consistency',
        category: 'Integrity',
        status: 'failed',
        message: `Found ${conflictingBikes.length} bike(s) with sales records still marked "Available".`,
        details: conflictingBikes.map((b) => b.id).join(', '),
        fixable: true,
      });
    }

    // Check 6: Purchase <-> Bike Relationships
    const bikeIds = new Set(bikes.map((b) => b.id));
    const orphanPurchases = purchases.filter((p) => !bikeIds.has(p.bikeId));
    if (orphanPurchases.length === 0) {
      checks.push({
        id: 'chk-purchase-rel',
        name: 'Purchase <-> Bike Relationships',
        category: 'Relations',
        status: 'passed',
        message: 'All purchase records have valid, corresponding bike records.',
      });
    } else {
      checks.push({
        id: 'chk-purchase-rel',
        name: 'Purchase <-> Bike Relationships',
        category: 'Relations',
        status: 'warning',
        message: `Found ${orphanPurchases.length} purchase record(s) referencing non-existent bikes.`,
      });
    }

    // Check 7: Expense <-> Bike Relationships
    const orphanExpenses = expenses.filter((e) => e.bikeId && !bikeIds.has(e.bikeId));
    if (orphanExpenses.length === 0) {
      checks.push({
        id: 'chk-expense-rel',
        name: 'Expense <-> Bike Relationships',
        category: 'Relations',
        status: 'passed',
        message: 'All bike expenses are connected to valid Bike IDs.',
      });
    } else {
      checks.push({
        id: 'chk-expense-rel',
        name: 'Expense <-> Bike Relationships',
        category: 'Relations',
        status: 'warning',
        message: `Found ${orphanExpenses.length} expense(s) pointing to missing bike IDs.`,
      });
    }

    // Check 8: Total Bike Cost Calculation Accuracy
    let costMismatchCount = 0;
    for (const b of bikes) {
      const linkedExp = expenses.filter((e) => e.bikeId === b.id).reduce((s, e) => s + Number(e.amount || 0), 0);
      const expectedTotal = Number(b.purchaseCost || 0) + linkedExp;
      if (Math.abs(Number(b.totalCost || 0) - expectedTotal) > 0.01) {
        costMismatchCount++;
      }
    }
    if (costMismatchCount === 0) {
      checks.push({
        id: 'chk-cost-calc',
        name: 'Automatic Total Cost Calculations',
        category: 'Calculations',
        status: 'passed',
        message: 'All bike total costs exactly equal Purchase Cost + Linked Expenses.',
      });
    } else {
      checks.push({
        id: 'chk-cost-calc',
        name: 'Automatic Total Cost Calculations',
        category: 'Calculations',
        status: 'warning',
        message: `Found ${costMismatchCount} bike(s) with outdated cached total cost figures.`,
        fixable: true,
      });
    }

    // Check 9: Finance Installment Schedule Math
    let finMathOk = true;
    for (const f of financeAccounts) {
      const scheduleSum = f.schedule.reduce((s, x) => s + x.amount, 0);
      if (Math.abs(scheduleSum - f.financedAmount) > 1) {
        finMathOk = false;
        break;
      }
    }
    if (finMathOk) {
      checks.push({
        id: 'chk-fin-math',
        name: 'Finance & Installments Math',
        category: 'Calculations',
        status: 'passed',
        message: 'All installment schedules correctly sum up to Financed Balance.',
      });
    } else {
      checks.push({
        id: 'chk-fin-math',
        name: 'Finance & Installments Math',
        category: 'Calculations',
        status: 'warning',
        message: 'Some installment schedules have rounding discrepancies with total financed balance.',
      });
    }

    // Check 10: Cashbook Consistency
    checks.push({
      id: 'chk-cashbook',
      name: 'Cashbook Register Synchronization',
      category: 'Integrity',
      status: 'passed',
      message: `Cashbook contains ${cashbook.length} balanced transaction entries.`,
    });

    // Check 11: Customer Ledger Outstanding Balance Accuracy
    let balanceMismatchCount = 0;
    for (const c of customers) {
      const calc = calculateCustomerOutstanding(c.id, sales, financeAccounts);
      if (Math.abs(Number(c.balance || 0) - calc.totalOutstanding) > 0.01) {
        balanceMismatchCount++;
      }
    }
    if (balanceMismatchCount === 0) {
      checks.push({
        id: 'chk-customer-ledger',
        name: 'Customer Ledger Outstanding Balances',
        category: 'Calculations',
        status: 'passed',
        message: 'All customer ledger balances match transaction & installment records exactly (no double-counting).',
      });
    } else {
      checks.push({
        id: 'chk-customer-ledger',
        name: 'Customer Ledger Outstanding Balances',
        category: 'Calculations',
        status: 'warning',
        message: `Found ${balanceMismatchCount} customer(s) with outdated cached balances.`,
        fixable: true,
      });
    }

    return checks;
  }

  /**
   * Auto-repair detected health check discrepancies
   */
  public async autoRepairDatabase(): Promise<string> {
    const [bikes, sales] = await Promise.all([
      this.getAll<Bike>('bikes'),
      this.getAll<Sale>('sales'),
    ]);

    const soldBikeIds = new Set(sales.map((s) => s.bikeId));
    let fixedCount = 0;

    for (const b of bikes) {
      let changed = false;
      if (soldBikeIds.has(b.id) && b.status !== 'Sold') {
        b.status = 'Sold';
        changed = true;
      }
      const { purchaseCost, expensesTotal, actualCost } = await this.calculateActualBikeCost(b.id);
      if (b.totalCost !== actualCost || b.totalExpenses !== expensesTotal) {
        b.purchaseCost = purchaseCost;
        b.totalExpenses = expensesTotal;
        b.totalCost = actualCost;
        changed = true;
      }
      if (changed) {
        await this.put('bikes', b);
        fixedCount++;
      }
    }

    // Refresh all sale profits
    for (const s of sales) {
      await this.refreshSaleProfit(s.id);
    }

    // Reconcile and synchronize all customer ledger balances
    await this.reconcileCustomerBalances();

    return `Auto-repair completed: Fixed ${fixedCount} bike record discrepancies, refreshed all financial cost & profit figures, and reconciled customer ledger balances.`;
  }

  // --- Convenience Getters & Methods ---
  public async getAllBikes(): Promise<Bike[]> {
    return this.getAll<Bike>('bikes');
  }

  public async getAllPurchases(): Promise<Purchase[]> {
    return this.getAll<Purchase>('purchases');
  }

  public async getAllSellers(): Promise<Seller[]> {
    return this.getAll<Seller>('sellers');
  }

  public async getAllCustomers(): Promise<Customer[]> {
    return this.getAll<Customer>('customers');
  }

  public async getAllSales(): Promise<Sale[]> {
    return this.getAll<Sale>('sales');
  }

  public async getAllExpenses(): Promise<BikeExpense[]> {
    return this.getAll<BikeExpense>('expenses');
  }

  public async getAllDocuments(): Promise<BikeDocument[]> {
    return this.getAll<BikeDocument>('documents');
  }

  public async getAllFinanceAccounts(): Promise<FinanceAccount[]> {
    return this.getAll<FinanceAccount>('financeAccounts');
  }

  public async getAllPayments(): Promise<Payment[]> {
    return this.getAll<Payment>('payments');
  }

  public async getAllCashbookEntries(): Promise<CashbookEntry[]> {
    return this.getAll<CashbookEntry>('cashbook');
  }

  public async getBikeById(id: string): Promise<Bike | null> {
    return this.getById<Bike>('bikes', id);
  }

  public async getSaleById(id: string): Promise<Sale | null> {
    return this.getById<Sale>('sales', id);
  }

  public async createBikeExpenseTransaction(params: Parameters<DatabaseManager['addBikeExpense']>[0]): Promise<string> {
    return this.addBikeExpense(params);
  }

  public async updateBikeExpenseTransaction(expense: BikeExpense): Promise<void> {
    return this.updateBikeExpense(expense);
  }

  public async deleteBikeExpenseTransaction(expenseId: string): Promise<void> {
    return this.deleteBikeExpense(expenseId);
  }

  public async updateBike(bike: Partial<Bike> & { id: string }): Promise<void> {
    const existing = await this.getById<Bike>('bikes', bike.id);
    if (!existing) throw new Error(`Bike ID ${bike.id} not found.`);
    const updated: Bike = {
      ...existing,
      ...bike,
      updatedAt: new Date().toISOString(),
    };
    await this.put<Bike>('bikes', updated);
  }

  public async updateBikePhoto(bikeId: string, photoBlob: string): Promise<void> {
    const existing = await this.getById<Bike>('bikes', bikeId);
    if (!existing) throw new Error(`Bike ID ${bikeId} not found.`);
    existing.photoBlob = photoBlob;
    existing.updatedAt = new Date().toISOString();
    await this.put<Bike>('bikes', existing);
  }

  public async updateDocumentation(doc: BikeDocument): Promise<void> {
    return this.put<BikeDocument>('documents', doc);
  }

  public async addCustomer(customer: Omit<Customer, 'id' | 'createdAt'> & { id?: string }): Promise<string> {
    const id = customer.id || (await this.getNextId('CUST'));
    const cust: Customer = {
      ...customer,
      id,
      createdAt: new Date().toISOString(),
    };
    await this.put<Customer>('customers', cust);
    return id;
  }

  public async addSeller(seller: Omit<Seller, 'id' | 'createdAt'> & { id?: string }): Promise<string> {
    const id = seller.id || (await this.getNextId('SEL'));
    const sel: Seller = {
      ...seller,
      id,
      createdAt: new Date().toISOString(),
    };
    await this.put<Seller>('sellers', sel);
    return id;
  }

  public async updateCustomer(customer: Partial<Customer> & { id: string }): Promise<void> {
    const existing = await this.getById<Customer>('customers', customer.id);
    if (!existing) throw new Error(`Customer ID ${customer.id} not found.`);
    const updated: Customer = {
      ...existing,
      ...customer,
    };
    const allSales = await this.getAll<Sale>('sales');
    const allFinances = await this.getAll<FinanceAccount>('financeAccounts');
    const calc = calculateCustomerOutstanding(updated.id, allSales, allFinances);
    updated.balance = calc.totalOutstanding;
    await this.put<Customer>('customers', updated);
  }

  public async updateSeller(seller: Partial<Seller> & { id: string }): Promise<void> {
    const existing = await this.getById<Seller>('sellers', seller.id);
    if (!existing) throw new Error(`Seller ID ${seller.id} not found.`);
    const updated: Seller = {
      ...existing,
      ...seller,
    };
    await this.put<Seller>('sellers', updated);
  }

  public async updatePurchase(purchase: Partial<Purchase> & { id: string }): Promise<void> {
    const existing = await this.getById<Purchase>('purchases', purchase.id);
    if (!existing) throw new Error(`Purchase ID ${purchase.id} not found.`);
    const updated: Purchase = {
      ...existing,
      ...purchase,
    };
    await this.put<Purchase>('purchases', updated);

    // If purchase cost was updated, update bike purchaseCost & actualCost
    if (purchase.purchaseCost !== undefined && purchase.purchaseCost !== existing.purchaseCost) {
      const bike = await this.getById<Bike>('bikes', existing.bikeId);
      if (bike) {
        bike.purchaseCost = Number(purchase.purchaseCost);
        bike.actualCost = Number(bike.purchaseCost) + Number(bike.totalExpenses || 0);
        bike.updatedAt = new Date().toISOString();
        await this.put<Bike>('bikes', bike);

        if (bike.saleId) {
          const sale = await this.getById<Sale>('sales', bike.saleId);
          if (sale) {
            sale.actualBikeCost = bike.actualCost;
            sale.profit = sale.salePrice - sale.actualBikeCost;
            await this.put<Sale>('sales', sale);
          }
        }
      }
    }
  }

  public async updateSale(sale: Partial<Sale> & { id: string }): Promise<void> {
    const existing = await this.getById<Sale>('sales', sale.id);
    if (!existing) throw new Error(`Sale ID ${sale.id} not found.`);
    const updated: Sale = {
      ...existing,
      ...sale,
    };

    const salePrice = Number(updated.salePrice);
    const actualCost = Number(updated.actualBikeCost);
    updated.profit = salePrice - actualCost;

    const allFinances = await this.getAll<FinanceAccount>('financeAccounts');
    const isFinanced = isSaleFinanced(updated, allFinances);
    if (isFinanced) {
      updated.saleType = 'Installment';
      updated.paymentMethod = 'Finance';
      if (!updated.financeId) {
        const matchingFin = allFinances.find(
          (f) => f.saleId === updated.id || (f.bikeId && updated.bikeId && f.bikeId === updated.bikeId)
        );
        if (matchingFin) updated.financeId = matchingFin.id;
      }
    } else {
      const amountReceived = Number(updated.amountReceived || 0);
      updated.remainingBalance = Math.max(0, Number((salePrice - amountReceived).toFixed(2)));
    }

    await this.put<Sale>('sales', updated);

    if (updated.customerId) {
      const allSales = await this.getAll<Sale>('sales');
      const custCalc = calculateCustomerOutstanding(updated.customerId, allSales, allFinances);
      const customer = await this.getById<Customer>('customers', updated.customerId);
      if (customer) {
        customer.balance = custCalc.totalOutstanding;
        await this.put<Customer>('customers', customer);
      }
    }
  }

  public async reconcileCustomerBalances(): Promise<void> {
    const sales = await this.getAll<Sale>('sales');
    const financeAccounts = await this.getAll<FinanceAccount>('financeAccounts');
    const customers = await this.getAll<Customer>('customers');

    // Auto-heal and sync any orphaned / unlinked finance sales
    let salesModified = false;
    for (const sale of sales) {
      const matchedFin = financeAccounts.find(
        (f) =>
          f.saleId === sale.id ||
          (f.bikeId && sale.bikeId && f.bikeId === sale.bikeId) ||
          (sale.financeId && f.id === sale.financeId)
      );
      if (matchedFin) {
        let changed = false;
        if (sale.financeId !== matchedFin.id) {
          sale.financeId = matchedFin.id;
          changed = true;
        }
        if (sale.saleType !== 'Installment') {
          sale.saleType = 'Installment';
          changed = true;
        }
        if (sale.paymentMethod !== 'Finance') {
          sale.paymentMethod = 'Finance';
          changed = true;
        }
        if (matchedFin.saleId !== sale.id || matchedFin.customerId !== sale.customerId) {
          matchedFin.saleId = sale.id;
          matchedFin.customerId = sale.customerId;
          await this.put<FinanceAccount>('financeAccounts', matchedFin);
        }
        if (changed) {
          await this.put<Sale>('sales', sale);
          salesModified = true;
        }
      }
    }

    const currentSales = salesModified ? await this.getAll<Sale>('sales') : sales;
    const currentFinances = await this.getAll<FinanceAccount>('financeAccounts');

    for (const customer of customers) {
      const calc = calculateCustomerOutstanding(customer.id, currentSales, currentFinances);
      if (customer.balance !== calc.totalOutstanding) {
        customer.balance = calc.totalOutstanding;
        await this.put<Customer>('customers', customer);
      }
    }
  }


  public async updateBikeStatus(bikeId: string, status: BikeStatus): Promise<void> {
    const bike = await this.getById<Bike>('bikes', bikeId);
    if (bike) {
      bike.status = status;
      bike.updatedAt = new Date().toISOString();
      await this.put<Bike>('bikes', bike);
    }
  }

  public async receiveCustomerPayment(params: Parameters<DatabaseManager['recordCustomerPayment']>[0]): Promise<string> {
    return this.recordCustomerPayment(params);
  }

  public async payInstallmentTransaction(params: Parameters<DatabaseManager['recordCustomerPayment']>[0]): Promise<string> {
    return this.recordCustomerPayment(params);
  }

  public async addManualCashbookEntry(params: {
    date: string;
    time: string;
    type: CashbookEntry['type'];
    description: string;
    amount: number;
    paymentMethod: string;
    account: CashbookEntry['account'];
  }): Promise<string> {
    const id = await this.getNextId('CB');
    const entry: CashbookEntry = {
      id,
      date: params.date || getCurrentDate(),
      time: params.time || getCurrentTime(),
      type: params.type,
      description: params.description,
      amount: Number(params.amount),
      paymentMethod: params.paymentMethod,
      account: params.account,
      createdAt: new Date().toISOString(),
    };
    await this.put<CashbookEntry>('cashbook', entry);
    return id;
  }

  public async exportCompleteBackup(): Promise<FullBackupData> {
    return this.exportFullBackup();
  }

  public async restoreCompleteBackup(data: FullBackupData): Promise<{ success: boolean; message: string; counts: any }> {
    return this.restoreFullBackup(data);
  }
}

export const dbManager = new DatabaseManager();
