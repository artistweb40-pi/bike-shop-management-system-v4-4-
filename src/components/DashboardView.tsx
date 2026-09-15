/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  Bike as BikeIcon,
  CheckCircle2,
  TrendingUp,
  DollarSign,
  Receipt,
  FileCheck,
  AlertCircle,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  ShieldCheck,
  Layers,
  Banknote,
  PlusCircle,
} from 'lucide-react';
import {
  Bike,
  BikeDocument,
  BikeExpense,
  Customer,
  FinanceAccount,
  Payment,
  Purchase,
  Sale,
  ShowroomSettings,
} from '../types';
import { formatPKDateTime, formatPKR, getCurrentDate, isSaleFinanced } from '../utils/formatters';

interface DashboardViewProps {
  bikes?: Bike[];
  purchases?: Purchase[];
  sales?: Sale[];
  expenses?: BikeExpense[];
  documents?: BikeDocument[];
  customers?: Customer[];
  financeAccounts?: FinanceAccount[];
  payments?: Payment[];
  cashbook?: any[];
  cashbookBalance?: number;
  settings?: Partial<ShowroomSettings>;
  onNavigate?: (tab: any) => void;
  onNavigateTab?: (tab: any) => void;
  onViewSaleReceipt?: (sale: Sale) => void;
  onQuickPurchase?: () => void;
  onQuickSale?: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  bikes = [],
  purchases = [],
  sales = [],
  expenses = [],
  documents = [],
  customers = [],
  financeAccounts = [],
  payments = [],
  cashbook = [],
  cashbookBalance = 0,
  settings = {},
  onNavigate,
  onNavigateTab,
  onViewSaleReceipt,
  onQuickPurchase,
  onQuickSale,
}) => {
  const handleNav = onNavigate || onNavigateTab || (() => {});
  const today = getCurrentDate();

  // Metrics derived purely from IndexedDB records
  const totalBikes = bikes.length;
  const availableBikes = bikes.filter((b) => b.status === 'Available').length;
  const soldBikes = bikes.filter((b) => b.status === 'Sold').length;
  const reservedBikes = bikes.filter((b) => b.status === 'Reserved').length;

  const docMap = new Map<string, BikeDocument>(documents.map((d) => [d.bikeId, d]));
  const openBikes = bikes.filter((b) => {
    const doc = docMap.get(b.id);
    return doc?.registrationStatus === 'Open';
  }).length;
  const registeredBikes = bikes.filter((b) => {
    const doc = docMap.get(b.id);
    return doc?.registrationStatus === 'Registered';
  }).length;

  const totalPurchaseCost = purchases.reduce((sum, p) => sum + Number(p.purchaseCost || 0), 0);
  const totalBikeExpenses = expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);
  const totalSales = sales.reduce((sum, s) => sum + Number(s.salePrice || 0), 0);
  const totalProfit = sales.reduce((sum, s) => sum + Number(s.profit || 0), 0);

  // Customer outstanding balances (Direct credit sales + Financed installment schedules)
  const creditOutstanding = sales
    .filter((s) => !isSaleFinanced(s, financeAccounts))
    .reduce((sum, s) => sum + Number(s.remainingBalance || 0), 0);
  const financeOutstanding = financeAccounts.reduce((sum, f) => {
    const unpaid = (f.schedule || []).filter((x) => !x.paid).reduce((s, x) => s + (x.amount - (x.paidAmount || 0)), 0);
    return sum + unpaid;
  }, 0);
  const totalOutstanding = creditOutstanding + financeOutstanding;

  // Today's specific figures
  const todaySales = sales.filter((s) => s.saleDate === today);
  const todaySalesTotal = todaySales.reduce((sum, s) => sum + Number(s.salePrice || 0), 0);
  const todayCollections = payments
    .filter((p) => p.date === today)
    .reduce((sum, p) => sum + Number(p.amount || 0), 0);

  // Overdue Installments
  const overdueList: Array<{
    finance: FinanceAccount;
    installmentNo: number;
    dueDate: string;
    dueAmount: number;
    customerName: string;
    customerPhone?: string;
  }> = [];

  const customerMap = new Map<string, Customer>(customers.map((c) => [c.id, c]));

  financeAccounts.forEach((f) => {
    f.schedule
      .filter((item) => !item.paid && item.dueDate < today)
      .forEach((item) => {
        const cust = customerMap.get(f.customerId);
        overdueList.push({
          finance: f,
          installmentNo: item.no,
          dueDate: item.dueDate,
          dueAmount: item.amount - (item.paidAmount || 0),
          customerName: cust?.name || 'Customer',
          customerPhone: cust?.phone,
        });
      });
  });

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      
      {/* Top Banner / Welcome */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border border-slate-700/70 p-5 rounded-2xl shadow-xl">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            Showroom Executive Dashboard
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time verified metrics calculated dynamically from local <b className="text-amber-400">IndexedDB</b> records.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
          <button
            id="dash-quick-purchase"
            onClick={onQuickPurchase}
            className="flex items-center justify-center gap-1.5 px-3.5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-md transition"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Buy Motorcycle</span>
          </button>
          <button
            id="dash-quick-sale"
            onClick={onQuickSale}
            className="flex items-center justify-center gap-1.5 px-3.5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-xl shadow-md transition"
          >
            <TrendingUp className="w-4 h-4" />
            <span>Sell Motorcycle</span>
          </button>
        </div>
      </div>

      {/* Primary 12-Metric Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3.5">
        
        {/* Total Stock */}
        <div
          onClick={() => handleNav('inventory')}
          className="bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 p-4 rounded-xl cursor-pointer transition group"
        >
          <div className="flex items-center justify-between text-slate-400 mb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider">Total Showroom Bikes</span>
            <BikeIcon className="w-4 h-4 text-amber-400 group-hover:scale-110 transition" />
          </div>
          <div className="text-2xl font-black text-white">{totalBikes}</div>
          <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-2">
            <span className="text-emerald-400 font-bold">{availableBikes} Available</span>
            <span>•</span>
            <span className="text-slate-400">{soldBikes} Sold</span>
          </div>
        </div>

        {/* Available Stock */}
        <div
          onClick={() => handleNav('inventory')}
          className="bg-slate-800/80 hover:bg-slate-800 border border-emerald-500/30 p-4 rounded-xl cursor-pointer transition group bg-emerald-950/10"
        >
          <div className="flex items-center justify-between text-slate-400 mb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-300">Available in Showroom</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition" />
          </div>
          <div className="text-2xl font-black text-emerald-400">{availableBikes}</div>
          <div className="text-[11px] text-emerald-400/80 mt-1">Ready for Immediate Sale</div>
        </div>

        {/* Sold Bikes */}
        <div
          onClick={() => handleNav('sales')}
          className="bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 p-4 rounded-xl cursor-pointer transition group"
        >
          <div className="flex items-center justify-between text-slate-400 mb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider">Total Bikes Sold</span>
            <TrendingUp className="w-4 h-4 text-blue-400 group-hover:scale-110 transition" />
          </div>
          <div className="text-2xl font-black text-blue-400">{soldBikes}</div>
          <div className="text-[11px] text-slate-400 mt-1">Delivered to Customers</div>
        </div>

        {/* Reserved / Return Bikes */}
        <div
          onClick={() => handleNav('inventory')}
          className="bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 p-4 rounded-xl cursor-pointer transition group"
        >
          <div className="flex items-center justify-between text-slate-400 mb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider">Reserved / Token</span>
            <Layers className="w-4 h-4 text-purple-400 group-hover:scale-110 transition" />
          </div>
          <div className="text-2xl font-black text-purple-400">{reservedBikes}</div>
          <div className="text-[11px] text-slate-400 mt-1">Pending Deal Completion</div>
        </div>

        {/* Open (Unregistered) Papers */}
        <div
          onClick={() => handleNav('documentation')}
          className="bg-slate-800/80 hover:bg-slate-800 border border-amber-500/30 p-4 rounded-xl cursor-pointer transition group bg-amber-950/10"
        >
          <div className="flex items-center justify-between text-slate-400 mb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-300">OPEN Bikes</span>
            <FileCheck className="w-4 h-4 text-amber-400 group-hover:scale-110 transition" />
          </div>
          <div className="text-2xl font-black text-amber-400">{openBikes}</div>
          <div className="text-[11px] text-amber-400/80 mt-1">Showroom / Open Letter</div>
        </div>

        {/* Registered Papers */}
        <div
          onClick={() => handleNav('documentation')}
          className="bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 p-4 rounded-xl cursor-pointer transition group"
        >
          <div className="flex items-center justify-between text-slate-400 mb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider">REGISTERED Bikes</span>
            <ShieldCheck className="w-4 h-4 text-teal-400 group-hover:scale-110 transition" />
          </div>
          <div className="text-2xl font-black text-teal-400">{registeredBikes}</div>
          <div className="text-[11px] text-slate-400 mt-1">With Assigned Number Plate</div>
        </div>

        {/* Total Purchase Investment */}
        <div
          onClick={() => handleNav('purchases')}
          className="bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 p-4 rounded-xl cursor-pointer transition group"
        >
          <div className="flex items-center justify-between text-slate-400 mb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider">Total Purchase Cost</span>
            <DollarSign className="w-4 h-4 text-rose-400 group-hover:scale-110 transition" />
          </div>
          <div className="text-lg font-black text-slate-100 truncate">{formatPKR(totalPurchaseCost)}</div>
          <div className="text-[11px] text-slate-400 mt-1">Initial buying capital</div>
        </div>

        {/* Total Bike Expenses */}
        <div
          onClick={() => handleNav('expenses')}
          className="bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 p-4 rounded-xl cursor-pointer transition group"
        >
          <div className="flex items-center justify-between text-slate-400 mb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider">Bike Expenses</span>
            <Receipt className="w-4 h-4 text-orange-400 group-hover:scale-110 transition" />
          </div>
          <div className="text-lg font-black text-orange-400 truncate">{formatPKR(totalBikeExpenses)}</div>
          <div className="text-[11px] text-slate-400 mt-1">Repair, Parts, Tuning, Docs</div>
        </div>

        {/* Total Sales Volume */}
        <div
          onClick={() => handleNav('sales')}
          className="bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 p-4 rounded-xl cursor-pointer transition group"
        >
          <div className="flex items-center justify-between text-slate-400 mb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider">Total Sales Volume</span>
            <ArrowUpRight className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition" />
          </div>
          <div className="text-lg font-black text-emerald-400 truncate">{formatPKR(totalSales)}</div>
          <div className="text-[11px] text-slate-400 mt-1">Across all completed sales</div>
        </div>

        {/* Total Realized Profit */}
        <div
          onClick={() => handleNav('reports')}
          className="bg-slate-800/80 hover:bg-slate-800 border border-emerald-500/40 p-4 rounded-xl cursor-pointer transition group bg-emerald-950/20"
        >
          <div className="flex items-center justify-between text-slate-400 mb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-300">Total Net Profit</span>
            <TrendingUp className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition" />
          </div>
          <div className="text-lg font-black text-emerald-400 truncate">{formatPKR(totalProfit)}</div>
          <div className="text-[11px] text-emerald-400/80 mt-1 font-mono">Sale Price - Actual Cost</div>
        </div>

        {/* Customer Outstanding Balance */}
        <div
          onClick={() => handleNav('customers')}
          className="bg-slate-800/80 hover:bg-slate-800 border border-rose-500/30 p-4 rounded-xl cursor-pointer transition group bg-rose-950/10"
        >
          <div className="flex items-center justify-between text-slate-400 mb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-rose-300">Customer Receivable</span>
            <AlertCircle className="w-4 h-4 text-rose-400 group-hover:scale-110 transition" />
          </div>
          <div className="text-lg font-black text-rose-400 truncate">{formatPKR(totalOutstanding)}</div>
          <div className="text-[11px] text-rose-400/80 mt-1">Credit + Installment Dues</div>
        </div>

        {/* Cashbook Balance */}
        <div
          onClick={() => handleNav('cashbook')}
          className="bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 p-4 rounded-xl cursor-pointer transition group"
        >
          <div className="flex items-center justify-between text-slate-400 mb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider">Cash & Bank Balance</span>
            <Banknote className="w-4 h-4 text-amber-400 group-hover:scale-110 transition" />
          </div>
          <div className={`text-lg font-black truncate ${cashbookBalance >= 0 ? 'text-amber-400' : 'text-rose-400'}`}>
            {formatPKR(cashbookBalance)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Inflow vs Outflow Net</div>
        </div>
      </div>

      {/* Two Column Layout: Today's Activity + Overdue Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Today's Sales Feed */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-400" />
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                Today's Activity ({today})
              </h2>
            </div>
            <div className="text-xs text-slate-400">
              Sales: <b className="text-emerald-400">{formatPKR(todaySalesTotal)}</b> · Col: <b className="text-amber-400">{formatPKR(todayCollections)}</b>
            </div>
          </div>

          {todaySales.length > 0 ? (
            <div className="space-y-2.5">
              {todaySales.map((sale) => {
                const cust = customerMap.get(sale.customerId);
                return (
                  <div
                    key={sale.id}
                    className="p-3 bg-slate-800/70 hover:bg-slate-800 border border-slate-700/60 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2 transition"
                  >
                    <div>
                      <div className="text-xs font-bold text-slate-100 flex items-center gap-2">
                        <span>{sale.make} {sale.model}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-700 text-slate-300 font-mono">
                          {sale.receiptNo}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        Customer: <b className="text-slate-300">{cust?.name || 'Walk-in'}</b> · Method: {sale.paymentMethod}
                      </div>
                    </div>
                    <div className="text-left sm:text-right border-t sm:border-t-0 border-slate-700/50 pt-1.5 sm:pt-0">
                      <div className="text-xs font-black text-emerald-400">{formatPKR(sale.salePrice)}</div>
                      <div className="text-[10px] text-slate-400">Profit: <span className="text-emerald-300 font-bold">{formatPKR(sale.profit)}</span></div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-8 text-center text-xs text-slate-500">
              No sales recorded today yet. Click "Sell Motorcycle" to record a sale.
            </div>
          )}
        </div>

        {/* Overdue Installments Alert */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400" />
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                Overdue Installment Collections ({overdueList.length})
              </h2>
            </div>
            <button
              onClick={() => handleNav('finance')}
              className="text-xs text-amber-400 hover:text-amber-300 font-semibold"
            >
              View Finance Register →
            </button>
          </div>

          {overdueList.length > 0 ? (
            <div className="space-y-2.5 max-h-72 overflow-y-auto custom-scrollbar pr-1">
              {overdueList.map((item, idx) => (
                <div
                  key={`${item.finance.id}-${item.installmentNo}-${idx}`}
                  className="p-3 bg-rose-950/20 border border-rose-500/30 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                >
                  <div>
                    <div className="text-xs font-bold text-slate-100 flex items-center gap-2">
                      <span>{item.customerName}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 font-bold">
                        Inst #{item.installmentNo} Due
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      Bike: {item.finance.brand} {item.finance.model} · Due Date: <b className="text-rose-300">{item.dueDate}</b>
                      {item.customerPhone && ` · Phone: ${item.customerPhone}`}
                    </div>
                  </div>
                  <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-2 border-t sm:border-t-0 border-rose-900/40 pt-1.5 sm:pt-0">
                    <div className="text-xs font-black text-rose-400">{formatPKR(item.dueAmount)}</div>
                    <button
                      onClick={() => handleNav('finance')}
                      className="px-2 py-1 text-[10px] font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 rounded transition"
                    >
                      Collect Now
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-xs text-emerald-400 flex flex-col items-center gap-1.5">
              <CheckCircle2 className="w-6 h-6 text-emerald-400" />
              <span>Great! All installment schedules are up to date. No overdue accounts.</span>
            </div>
          )}
        </div>

      </div>

    </div>
  );
};
