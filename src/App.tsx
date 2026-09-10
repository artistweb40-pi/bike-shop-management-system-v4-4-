/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState, useCallback } from 'react';
import { dbManager, DEFAULT_SETTINGS } from './db/indexedDB';
import {
  Bike,
  BikeExpense,
  BikeStatus,
  CashbookEntry,
  Customer,
  Documentation,
  FinanceAccount,
  NavigationTab,
  Payment,
  Purchase,
  Sale,
  Seller,
  ShowroomSettings,
} from './types';
import { Header } from './components/Header';
import { getCurrentDate } from './utils/formatters';
import { Sidebar } from './components/Sidebar';
import { DashboardView } from './components/DashboardView';
import { PurchasesView } from './components/PurchasesView';
import { InventoryView } from './components/InventoryView';
import { ExpensesView } from './components/ExpensesView';
import { DocumentationView } from './components/DocumentationView';
import { SalesView } from './components/SalesView';
import { CustomersView } from './components/CustomersView';
import { SellersView } from './components/SellersView';
import { FinanceView } from './components/FinanceView';
import { CashbookView } from './components/CashbookView';
import { ReportsView } from './components/ReportsView';
import { BackupRestoreView } from './components/BackupRestoreView';
import { HealthCheckView } from './components/HealthCheckView';
import { DailyShowroomTestModal } from './components/DailyShowroomTestModal';
import { ImageModal } from './components/ImageModal';
import { ReceiptModal } from './components/ReceiptModal';
import { SettingsModal } from './components/SettingsModal';
import { RefreshCw } from 'lucide-react';

export default function App() {
  const [currentTab, setCurrentTab] = useState<NavigationTab>('dashboard');
  const [isLoading, setIsLoading] = useState(true);

  // Global State Stores
  const [bikes, setBikes] = useState<Bike[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [expenses, setExpenses] = useState<BikeExpense[]>([]);
  const [documents, setDocuments] = useState<Documentation[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [financeAccounts, setFinanceAccounts] = useState<FinanceAccount[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [cashbook, setCashbook] = useState<CashbookEntry[]>([]);
  const [settings, setSettings] = useState<ShowroomSettings>(DEFAULT_SETTINGS);

  // Modals state
  const [imageModalData, setImageModalData] = useState<{ url: string; title: string } | null>(null);
  const [activeReceiptSale, setActiveReceiptSale] = useState<Sale | null>(null);
  const [isTestModalOpen, setIsTestModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  // Initial Load from IndexedDB
  const refreshAllData = useCallback(async () => {
    try {
      const [
        bList,
        pList,
        sList,
        eList,
        dList,
        cList,
        selList,
        fList,
        payList,
        cashList,
        storedSettings,
      ] = await Promise.all([
        dbManager.getAllBikes(),
        dbManager.getAllPurchases(),
        dbManager.getAllSales(),
        dbManager.getAllExpenses(),
        dbManager.getAllDocuments(),
        dbManager.getAllCustomers(),
        dbManager.getAllSellers(),
        dbManager.getAllFinanceAccounts(),
        dbManager.getAllPayments(),
        dbManager.getAllCashbookEntries(),
        dbManager.getSettings(),
      ]);

      setBikes(bList);
      setPurchases(pList);
      setSales(sList);
      setExpenses(eList);
      setDocuments(dList);
      setCustomers(cList);
      setSellers(selList);
      setFinanceAccounts(fList);
      setPayments(payList);
      setCashbook(cashList);
      if (storedSettings) {
        setSettings(storedSettings);
      }
    } catch (err) {
      console.error('Failed to load database state:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshAllData();
  }, [refreshAllData]);

  // Handlers for Transaction Operations
  const handleAddPurchase = async (params: any) => {
    const res = await dbManager.createPurchaseTransaction(params);
    await refreshAllData();
    return res;
  };

  const handleUpdateBikeStatus = async (bikeId: string, status: BikeStatus) => {
    await dbManager.updateBikeStatus(bikeId, status);
    await refreshAllData();
  };

  const handleUpdateBike = async (bike: Bike) => {
    await dbManager.updateBike(bike);
    await refreshAllData();
  };

  const handleAddSale = async (params: any) => {
    const res = await dbManager.createSaleTransaction(params);
    await refreshAllData();
    // Open receipt modal automatically
    if (res.saleId) {
      const sale = await dbManager.getSaleById(res.saleId);
      if (sale) setActiveReceiptSale(sale);
    }
    return res;
  };

  const handleAddExpense = async (params: any) => {
    const res = await dbManager.createBikeExpenseTransaction(params);
    await refreshAllData();
    return res;
  };

  const handleUpdateExpense = async (expense: BikeExpense) => {
    const res = await dbManager.updateBikeExpenseTransaction(expense);
    await refreshAllData();
    return res;
  };

  const handleDeleteExpense = async (expenseId: string) => {
    const res = await dbManager.deleteBikeExpenseTransaction(expenseId);
    await refreshAllData();
    return res;
  };

  const handleUpdateDocuments = async (doc: Documentation) => {
    const res = await dbManager.updateDocumentation(doc);
    await refreshAllData();
    return res;
  };

  const handleAddCustomer = async (cust: any) => {
    const res = await dbManager.addCustomer(cust);
    await refreshAllData();
    return res;
  };

  const handleUpdateCustomer = async (cust: Customer) => {
    await dbManager.updateCustomer(cust);
    await refreshAllData();
  };

  const handleReceivePayment = async (params: any) => {
    const res = await dbManager.receiveCustomerPayment(params);
    await refreshAllData();
    return res;
  };

  const handleAddSeller = async (sel: any) => {
    const res = await dbManager.addSeller(sel);
    await refreshAllData();
    return res;
  };

  const handleUpdateSeller = async (sel: Seller) => {
    await dbManager.updateSeller(sel);
    await refreshAllData();
  };

  const handleUpdatePurchase = async (purchase: Purchase) => {
    await dbManager.updatePurchase(purchase);
    await refreshAllData();
  };

  const handleUpdateSale = async (sale: Sale) => {
    await dbManager.updateSale(sale);
    await refreshAllData();
  };

  const handlePayInstallment = async (params: any) => {
    const res = await dbManager.payInstallmentTransaction(params);
    await refreshAllData();
    return res;
  };

  const handleAddManualCashbook = async (params: any) => {
    const res = await dbManager.addManualCashbookEntry(params);
    await refreshAllData();
    return res;
  };

  const handleSaveSettings = async (newSettings: ShowroomSettings) => {
    await dbManager.saveSettings(newSettings);
    setSettings(newSettings);
  };

  // Quick helper counts
  const availableBikesCount = bikes.filter((b) => b.status === 'Available').length;
  const pendingDocsCount = documents.filter((d) => d.registrationStatus === 'Pending' || d.transferStatus === 'Pending').length;
  const today = getCurrentDate();
  const overdueInstallmentsCount = financeAccounts.reduce((acc, f) => {
    const overdue = f.schedule.filter((s) => s.status === 'OVERDUE' || (s.status === 'PENDING' && s.dueDate < today)).length;
    return acc + overdue;
  }, 0);
  const cashbookBalance = cashbook.reduce(
    (sum, c) => sum + (c.type === 'IN' ? Number(c.amount || 0) : -Number(c.amount || 0)),
    0
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-300 space-y-4">
        <RefreshCw className="w-10 h-10 text-amber-500 animate-spin" />
        <div className="text-center">
          <h1 className="text-lg font-black text-white">Opening Showroom Database (V4)</h1>
          <p className="text-xs text-slate-500 mt-1">Initializing IndexedDB relational engine...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-amber-500 selection:text-slate-950 font-sans">
      
      {/* Top Application Header */}
      <Header
        settings={settings}
        activeTab={currentTab}
        onSelectTab={setCurrentTab}
        onOpenSettings={() => setIsSettingsModalOpen(true)}
        onOpenTestSimulation={() => setIsTestModalOpen(true)}
      />

      {/* Main Workspace Layout */}
      <div className="flex-1 flex flex-col md:flex-row w-full max-w-7xl mx-auto px-3 sm:px-6 py-4 gap-6">
        
        {/* Navigation Sidebar */}
        <div className="w-full md:w-64 shrink-0">
          <Sidebar
            currentTab={currentTab}
            onSelectTab={setCurrentTab}
            availableBikesCount={availableBikesCount}
            pendingDocsCount={pendingDocsCount}
            overdueInstallmentsCount={overdueInstallmentsCount}
            onOpenSettings={() => setIsSettingsModalOpen(true)}
          />
        </div>

        {/* Active Tab View Area */}
        <main className="flex-1 min-w-0">
          {currentTab === 'dashboard' && (
            <DashboardView
              bikes={bikes}
              purchases={purchases}
              sales={sales}
              expenses={expenses}
              documents={documents}
              customers={customers}
              financeAccounts={financeAccounts}
              payments={payments}
              cashbook={cashbook}
              cashbookBalance={cashbookBalance}
              settings={settings}
              onNavigate={setCurrentTab}
              onNavigateTab={setCurrentTab}
              onViewSaleReceipt={(sale) => setActiveReceiptSale(sale)}
              onQuickPurchase={() => setCurrentTab('purchases')}
              onQuickSale={() => setCurrentTab('sales')}
            />
          )}

          {currentTab === 'purchases' && (
            <PurchasesView
              purchases={purchases}
              bikes={bikes}
              sellers={sellers}
              documents={documents}
              onAddPurchase={handleAddPurchase}
              onUpdatePurchase={handleUpdatePurchase}
              onViewImage={(url, title) => setImageModalData({ url, title })}
              onNavigateToBike={() => setCurrentTab('inventory')}
            />
          )}

          {currentTab === 'inventory' && (
            <InventoryView
              bikes={bikes}
              documents={documents}
              expenses={expenses}
              purchases={purchases}
              sellers={sellers}
              onNavigateToTab={setCurrentTab}
              onOpenAddExpense={() => setCurrentTab('expenses')}
              onInitiateSale={() => setCurrentTab('sales')}
              onViewImage={(url, title) => setImageModalData({ url, title })}
              onUpdateBikeStatus={handleUpdateBikeStatus}
              onUpdateBike={handleUpdateBike}
              onRefreshData={refreshAllData}
            />
          )}

          {currentTab === 'expenses' && (
            <ExpensesView
              expenses={expenses}
              bikes={bikes}
              onAddExpense={handleAddExpense}
              onUpdateExpense={handleUpdateExpense}
              onDeleteExpense={handleDeleteExpense}
            />
          )}

          {currentTab === 'documentation' && (
            <DocumentationView
              documents={documents}
              bikes={bikes}
              onUpdateDocument={handleUpdateDocuments}
            />
          )}

          {currentTab === 'sales' && (
            <SalesView
              sales={sales}
              bikes={bikes}
              customers={customers}
              expenses={expenses}
              documents={documents}
              settings={settings}
              onAddSale={handleAddSale}
              onUpdateSale={handleUpdateSale}
              onViewReceipt={(sale) => setActiveReceiptSale(sale)}
              onPrintReceipt={(sale) => setActiveReceiptSale(sale)}
              onViewImage={(url, title) => setImageModalData({ url, title })}
            />
          )}

          {currentTab === 'customers' && (
            <CustomersView
              customers={customers}
              sales={sales}
              financeAccounts={financeAccounts}
              payments={payments}
              onAddCustomer={handleAddCustomer}
              onUpdateCustomer={handleUpdateCustomer}
              onReceivePayment={handleReceivePayment}
              onViewImage={(url, title) => setImageModalData({ url, title })}
            />
          )}

          {currentTab === 'sellers' && (
            <SellersView
              sellers={sellers}
              purchases={purchases}
              bikes={bikes}
              onAddSeller={handleAddSeller}
              onUpdateSeller={handleUpdateSeller}
              onViewImage={(url, title) => setImageModalData({ url, title })}
            />
          )}

          {currentTab === 'finance' && (
            <FinanceView
              financeAccounts={financeAccounts}
              customers={customers}
              onPayInstallment={handlePayInstallment}
            />
          )}

          {currentTab === 'cashbook' && (
            <CashbookView
              entries={cashbook}
              onAddManualEntry={handleAddManualCashbook}
            />
          )}

          {currentTab === 'reports' && (
            <ReportsView
              bikes={bikes}
              purchases={purchases}
              sales={sales}
              expenses={expenses}
              customers={customers}
              financeAccounts={financeAccounts}
              cashbook={cashbook}
              settings={settings}
            />
          )}

          {currentTab === 'backup' && (
            <BackupRestoreView onRefreshData={refreshAllData} />
          )}

          {currentTab === 'health' && (
            <HealthCheckView onDatabaseRepaired={refreshAllData} />
          )}
        </main>

      </div>

      {/* Global Modals */}
      {imageModalData && (
        <ImageModal
          isOpen={true}
          imageUrl={imageModalData.url}
          title={imageModalData.title}
          onClose={() => setImageModalData(null)}
        />
      )}

      {activeReceiptSale && (
        <ReceiptModal
          isOpen={true}
          sale={activeReceiptSale}
          customer={customers.find((c) => c.id === activeReceiptSale.customerId)}
          settings={settings}
          onClose={() => setActiveReceiptSale(null)}
        />
      )}

      {isTestModalOpen && (
        <DailyShowroomTestModal
          isOpen={true}
          onClose={() => setIsTestModalOpen(false)}
          onTestsCompleted={refreshAllData}
        />
      )}

      {isSettingsModalOpen && (
        <SettingsModal
          isOpen={true}
          settings={settings}
          onClose={() => setIsSettingsModalOpen(false)}
          onSave={handleSaveSettings}
        />
      )}

    </div>
  );
}
