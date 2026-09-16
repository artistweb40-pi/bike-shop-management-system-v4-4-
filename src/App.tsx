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
import { AuthView } from './components/AuthView';
import { onAuthChange, logoutUser, getMasterSession } from './services/authService';
import { cloudSyncService, CloudSyncStatus } from './services/cloudSyncService';
import { User } from 'firebase/auth';
import {
  RefreshCw,
  Bike as BikeIcon,
  Menu,
  X,
  Sparkles,
  LogOut,
  LayoutDashboard,
  ShoppingCart,
  Boxes,
  TrendingUp,
} from 'lucide-react';

export default function App() {
  const [currentTab, setCurrentTab] = useState<NavigationTab>('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Authentication State
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [cloudSyncStatus, setCloudSyncStatus] = useState<CloudSyncStatus>(cloudSyncService.getStatus());

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

  // Safety Watchdog: Never freeze on loading screen longer than 2.5s under any condition
  useEffect(() => {
    const watchdog = setTimeout(() => {
      setAuthLoading(false);
      setIsLoading(false);
    }, 2500);
    return () => clearTimeout(watchdog);
  }, []);

  useEffect(() => {
    const master = getMasterSession();
    if (master) {
      setCurrentUser(master as any);
      setAuthLoading(false);
    }
    const unsubscribe = onAuthChange((user) => {
      if (user) {
        setCurrentUser(user);
      } else {
        const fallback = getMasterSession();
        setCurrentUser(fallback as any);
      }
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Subscribe to Cloud Sync status changes
  useEffect(() => {
    const unsubscribe = cloudSyncService.subscribeStatus((status) => {
      setCloudSyncStatus(status);
    });
    return () => unsubscribe();
  }, []);

  // Real-time automatic Firestore sync across all browsers and devices
  useEffect(() => {
    if (!currentUser?.uid) return;

    const stopSync = cloudSyncService.startRealtimeSync(currentUser.uid, () => {
      refreshAllData();
    });

    return () => {
      stopSync();
    };
  }, [currentUser?.uid, refreshAllData]);

  // Background cloud push after local state changes
  const triggerBackgroundCloudPush = useCallback(() => {
    if (!currentUser?.uid) return;
    // Debounced or non-blocking push
    setTimeout(() => {
      cloudSyncService.pushAllToCloud(currentUser.uid).catch((err) => {
        console.warn('Background cloud sync:', err);
      });
    }, 200);
  }, [currentUser?.uid]);

  const handleTriggerCloudSync = async () => {
    if (!currentUser?.uid) return;
    const res = await cloudSyncService.pushAllToCloud(currentUser.uid);
    if (res.success) {
      alert(`Showroom Cloud Sync Completed!\n\nAll ${res.count} records (bikes, sales, accounts, cashbook) are synchronized across all your browsers and devices.`);
    } else {
      alert(`Cloud sync notice: ${res.error || 'Failed to complete cloud push'}`);
    }
  };

  const handleLogout = async () => {
    cloudSyncService.stopRealtimeSync();
    try {
      await logoutUser();
      setCurrentUser(null);
    } catch (err) {
      console.error('Sign out error:', err);
    }
  };

  // Handlers for Transaction Operations
  const handleAddPurchase = async (params: any) => {
    const res = await dbManager.createPurchaseTransaction(params);
    await refreshAllData();
    triggerBackgroundCloudPush();
    return res;
  };

  const handleUpdateBikeStatus = async (bikeId: string, status: BikeStatus) => {
    await dbManager.updateBikeStatus(bikeId, status);
    await refreshAllData();
    triggerBackgroundCloudPush();
  };

  const handleUpdateBike = async (bike: Bike) => {
    await dbManager.updateBike(bike);
    await refreshAllData();
    triggerBackgroundCloudPush();
  };

  const handleAddSale = async (params: any) => {
    const res = await dbManager.createSaleTransaction(params);
    await refreshAllData();
    triggerBackgroundCloudPush();
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
    triggerBackgroundCloudPush();
    return res;
  };

  const handleUpdateExpense = async (expense: BikeExpense) => {
    const res = await dbManager.updateBikeExpenseTransaction(expense);
    await refreshAllData();
    triggerBackgroundCloudPush();
    return res;
  };

  const handleDeleteExpense = async (expenseId: string) => {
    const res = await dbManager.deleteBikeExpenseTransaction(expenseId);
    await refreshAllData();
    triggerBackgroundCloudPush();
    return res;
  };

  const handleUpdateDocuments = async (doc: Documentation) => {
    const res = await dbManager.updateDocumentation(doc);
    await refreshAllData();
    triggerBackgroundCloudPush();
    return res;
  };

  const handleAddCustomer = async (cust: any) => {
    const res = await dbManager.addCustomer(cust);
    await refreshAllData();
    triggerBackgroundCloudPush();
    return res;
  };

  const handleUpdateCustomer = async (cust: Customer) => {
    await dbManager.updateCustomer(cust);
    await refreshAllData();
    triggerBackgroundCloudPush();
  };

  const handleReceivePayment = async (params: any) => {
    const res = await dbManager.receiveCustomerPayment(params);
    await refreshAllData();
    triggerBackgroundCloudPush();
    return res;
  };

  const handleAddSeller = async (sel: any) => {
    const res = await dbManager.addSeller(sel);
    await refreshAllData();
    triggerBackgroundCloudPush();
    return res;
  };

  const handleUpdateSeller = async (sel: Seller) => {
    await dbManager.updateSeller(sel);
    await refreshAllData();
    triggerBackgroundCloudPush();
  };

  const handleUpdatePurchase = async (purchase: Purchase) => {
    await dbManager.updatePurchase(purchase);
    await refreshAllData();
    triggerBackgroundCloudPush();
  };

  const handleUpdateSale = async (sale: Sale) => {
    await dbManager.updateSale(sale);
    await refreshAllData();
    triggerBackgroundCloudPush();
  };

  const handlePayInstallment = async (params: any) => {
    const res = await dbManager.payInstallmentTransaction(params);
    await refreshAllData();
    triggerBackgroundCloudPush();
    return res;
  };

  const handleAddManualCashbook = async (params: any) => {
    const res = await dbManager.addManualCashbookEntry(params);
    await refreshAllData();
    triggerBackgroundCloudPush();
    return res;
  };

  const handleSaveSettings = async (newSettings: ShowroomSettings) => {
    await dbManager.saveSettings(newSettings);
    setSettings(newSettings);
    triggerBackgroundCloudPush();
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

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-300 space-y-4 p-4">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 p-0.5 shadow-xl flex items-center justify-center">
          <div className="w-full h-full bg-slate-900 rounded-[14px] flex items-center justify-center">
            <BikeIcon className="w-6 h-6 text-emerald-400" />
          </div>
        </div>
        <RefreshCw className="w-7 h-7 text-emerald-400 animate-spin" />
        <div className="text-center max-w-xs">
          <h1 className="text-base font-black text-white tracking-tight">
            {settings.showroomName || 'Usman Trader and Autos'}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Loading showroom security & IndexedDB database...
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setAuthLoading(false);
            setIsLoading(false);
          }}
          className="mt-2 text-[11px] text-slate-400 hover:text-emerald-400 underline transition cursor-pointer"
        >
          Taking longer than usual? Click to open now
        </button>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <AuthView
        onLoginSuccess={refreshAllData}
        showroomTitle={settings.showroomName || 'Usman Trader and Autos'}
        showroomCity={settings.city || 'Circular Road, Lahore'}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-amber-500 selection:text-slate-950 font-sans">
      
      {/* Top Application Header */}
      <Header
        settings={settings}
        activeTab={currentTab}
        onSelectTab={(tab) => {
          setCurrentTab(tab);
          setIsMobileMenuOpen(false);
        }}
        onOpenSettings={() => setIsSettingsModalOpen(true)}
        onOpenTestSimulation={() => setIsTestModalOpen(true)}
        user={currentUser}
        onLogout={handleLogout}
        cloudSyncStatus={cloudSyncStatus}
        onTriggerCloudSync={handleTriggerCloudSync}
        isMobileMenuOpen={isMobileMenuOpen}
        onToggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
      />

      {/* Mobile Quick Horizontal Category Scroll Bar (md:hidden) */}
      <div className="md:hidden sticky top-16 z-20 bg-slate-900/95 backdrop-blur border-b border-slate-800 px-3 py-2 overflow-x-auto custom-scrollbar flex items-center gap-1.5 shadow-md">
        {[
          { id: 'dashboard', label: 'Dashboard' },
          { id: 'inventory', label: 'Stock / Bikes', badge: availableBikesCount > 0 ? `${availableBikesCount} Avail` : undefined },
          { id: 'purchases', label: 'Purchases' },
          { id: 'sales', label: 'Sales' },
          { id: 'finance', label: 'Installments', badge: overdueInstallmentsCount > 0 ? `${overdueInstallmentsCount} Due` : undefined },
          { id: 'cashbook', label: 'Cashbook' },
          { id: 'expenses', label: 'Expenses' },
          { id: 'documentation', label: 'Docs', badge: pendingDocsCount > 0 ? `${pendingDocsCount} Open` : undefined },
          { id: 'customers', label: 'Customers' },
          { id: 'sellers', label: 'Sellers' },
          { id: 'reports', label: 'Reports' },
          { id: 'backup', label: 'Cloud Sync' },
        ].map((tab) => {
          const isActive = currentTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setCurrentTab(tab.id as NavigationTab)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap flex items-center gap-1.5 shrink-0 ${
                isActive
                  ? 'bg-amber-500 text-slate-950 shadow-md'
                  : 'bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <span>{tab.label}</span>
              {tab.badge && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                    isActive ? 'bg-slate-950 text-amber-400' : 'bg-slate-700 text-amber-300'
                  }`}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Main Workspace Layout */}
      <div className="flex-1 flex flex-col md:flex-row w-full max-w-7xl mx-auto px-3 sm:px-6 py-4 gap-6 pb-24 md:pb-6">
        
        {/* Navigation Sidebar (Desktop only) */}
        <div className="hidden md:block w-64 shrink-0">
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
            <BackupRestoreView onRefreshData={refreshAllData} currentUser={currentUser} />
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
          user={currentUser}
          onLogout={handleLogout}
        />
      )}

      {/* Mobile Slide-Over Navigation Drawer (md:hidden) */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex animate-fade-in">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
            onClick={() => setIsMobileMenuOpen(false)}
            aria-hidden="true"
          />

          {/* Drawer Container */}
          <div className="relative w-80 max-w-[85vw] bg-slate-900 border-r border-slate-800 h-full flex flex-col z-10 shadow-2xl">
            {/* Drawer Header */}
            <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center text-slate-950 font-black shadow shrink-0">
                  <BikeIcon className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-black text-white truncate">
                    {settings.showroomName || 'Usman Trader & Autos'}
                  </div>
                  <div className="text-[10px] text-amber-400 font-semibold">Showroom Menu</div>
                </div>
              </div>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition shrink-0"
                aria-label="Close Menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Body: Full 14-tab Sidebar */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
              <Sidebar
                currentTab={currentTab}
                onSelectTab={(tab) => {
                  setCurrentTab(tab);
                  setIsMobileMenuOpen(false);
                }}
                availableBikesCount={availableBikesCount}
                pendingDocsCount={pendingDocsCount}
                overdueInstallmentsCount={overdueInstallmentsCount}
                onOpenSettings={() => {
                  setIsSettingsModalOpen(true);
                  setIsMobileMenuOpen(false);
                }}
                onCloseMobileDrawer={() => setIsMobileMenuOpen(false)}
              />
            </div>

            {/* Drawer Footer Actions */}
            <div className="p-3 border-t border-slate-800 bg-slate-950/80 space-y-2">
              <button
                onClick={() => {
                  setIsTestModalOpen(true);
                  setIsMobileMenuOpen(false);
                }}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-bold bg-indigo-900/60 hover:bg-indigo-800 text-indigo-200 border border-indigo-700/60 transition shadow-sm min-h-[44px]"
              >
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>A to Z Showroom QA Suite</span>
              </button>

              {currentUser && (
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    handleLogout();
                  }}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-bold bg-rose-950/50 hover:bg-rose-900/70 text-rose-300 border border-rose-800/50 transition shadow-sm min-h-[44px]"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Mobile Sticky Bottom Navigation Bar (md:hidden) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 backdrop-blur border-t border-slate-800 px-2 py-1 shadow-2xl flex items-center justify-around">
        <button
          onClick={() => setCurrentTab('dashboard')}
          className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition min-w-[56px] min-h-[44px] ${
            currentTab === 'dashboard' ? 'text-amber-400 font-black' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <LayoutDashboard className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">Home</span>
        </button>

        <button
          onClick={() => setCurrentTab('inventory')}
          className={`relative flex flex-col items-center justify-center py-1 px-3 rounded-xl transition min-w-[56px] min-h-[44px] ${
            currentTab === 'inventory' ? 'text-amber-400 font-black' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Boxes className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">Stock</span>
          {availableBikesCount > 0 && (
            <span className="absolute top-0.5 right-2 bg-emerald-500 text-slate-950 text-[9px] font-black rounded-full px-1.5 py-0.2">
              {availableBikesCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setCurrentTab('purchases')}
          className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition min-w-[56px] min-h-[44px] ${
            currentTab === 'purchases' ? 'text-amber-400 font-black' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <ShoppingCart className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">Buy</span>
        </button>

        <button
          onClick={() => setCurrentTab('sales')}
          className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition min-w-[56px] min-h-[44px] ${
            currentTab === 'sales' ? 'text-amber-400 font-black' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <TrendingUp className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">Sell</span>
        </button>

        <button
          onClick={() => setIsMobileMenuOpen(true)}
          className="relative flex flex-col items-center justify-center py-1 px-3 rounded-xl transition min-w-[56px] min-h-[44px] text-slate-400 hover:text-white"
        >
          <Menu className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">Menu</span>
          {(overdueInstallmentsCount > 0 || pendingDocsCount > 0) && (
            <span className="absolute top-1 right-2.5 w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
          )}
        </button>
      </nav>

    </div>
  );
}
