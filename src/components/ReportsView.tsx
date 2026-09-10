/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  BarChart3,
  Printer,
  FileSpreadsheet,
  Download,
  Calendar,
  DollarSign,
  TrendingUp,
  Receipt,
  Boxes,
  Users,
  Filter,
} from 'lucide-react';
import {
  Bike,
  BikeExpense,
  CashbookEntry,
  Customer,
  FinanceAccount,
  Purchase,
  Sale,
  ShowroomSettings,
} from '../types';
import { calculateCustomerOutstanding, formatPKDateTime, formatPKR, getCurrentDate } from '../utils/formatters';
import {
  generateExpensesReportPDF,
  generateInventoryReportPDF,
  generateSalesReportPDF,
} from '../utils/pdfGenerator';
import { DEFAULT_SETTINGS } from '../db/indexedDB';

interface ReportsViewProps {
  bikes?: Bike[];
  purchases?: Purchase[];
  sales?: Sale[];
  expenses?: BikeExpense[];
  customers?: Customer[];
  financeAccounts?: FinanceAccount[];
  cashbook?: CashbookEntry[];
  settings?: Partial<ShowroomSettings>;
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  bikes = [],
  purchases = [],
  sales = [],
  expenses = [],
  customers = [],
  financeAccounts = [],
  cashbook = [],
  settings = DEFAULT_SETTINGS,
}) => {
  const fullSettings: ShowroomSettings = { ...DEFAULT_SETTINGS, ...settings };
  const [selectedReport, setSelectedReport] = useState<
    'sales' | 'inventory' | 'expenses' | 'cashbook' | 'customers'
  >('sales');

  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(1); // 1st of this month
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(getCurrentDate());

  // Filtered lists
  const filteredSales = sales.filter((s) => s.saleDate >= startDate && s.saleDate <= endDate);
  const filteredExpenses = expenses.filter((e) => e.date >= startDate && e.date <= endDate);
  const filteredPurchases = purchases.filter((p) => p.purchaseDate >= startDate && p.purchaseDate <= endDate);
  const filteredCashbook = cashbook.filter((c) => c.date >= startDate && c.date <= endDate);

  const totalSalesVolume = filteredSales.reduce((s, x) => s + Number(x.salePrice || 0), 0);
  const totalActualCost = filteredSales.reduce((s, x) => s + Number(x.actualBikeCost || 0), 0);
  const totalRealProfit = filteredSales.reduce((s, x) => s + Number(x.profit || 0), 0);
  const totalExpensesSum = filteredExpenses.reduce((s, x) => s + Number(x.amount || 0), 0);

  const customerMap = new Map<string, Customer>(customers.map((c) => [c.id, c]));

  const handlePrintPDF = () => {
    if (selectedReport === 'sales') {
      generateSalesReportPDF(filteredSales, fullSettings, startDate, endDate);
    } else if (selectedReport === 'inventory') {
      generateInventoryReportPDF(bikes, expenses, fullSettings);
    } else if (selectedReport === 'expenses') {
      generateExpensesReportPDF(filteredExpenses, fullSettings, startDate, endDate);
    } else {
      window.print();
    }
  };

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-xl font-black text-white flex items-center gap-2.5">
            <BarChart3 className="w-6 h-6 text-amber-400" />
            <span>Showroom Financial Reports & PDF Export</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Generate verifiable balance sheets, profit & loss summaries, stock audit and expense registers.
          </p>
        </div>
        <button
          onClick={handlePrintPDF}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 transition shadow-lg font-bold"
        >
          <Printer className="w-4 h-4" />
          <span>Generate / Print PDF Report</span>
        </button>
      </div>

      {/* Report Type Selector & Date Filter */}
      <div className="flex flex-col lg:flex-row items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-md">
        
        {/* Report Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full lg:w-auto">
          {[
            { id: 'sales', label: 'Sales & Real Profit Report' },
            { id: 'inventory', label: 'Inventory Stock Audit' },
            { id: 'expenses', label: 'Bike Maintenance Expenses' },
            { id: 'cashbook', label: 'Cashbook Statement' },
            { id: 'customers', label: 'Customer Receivables' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedReport(tab.id as any)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                selectedReport === tab.id
                  ? 'bg-amber-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Date Range Controls */}
        <div className="flex items-center gap-2 w-full lg:w-auto">
          <span className="text-xs text-slate-400">From:</span>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200"
          />
          <span className="text-xs text-slate-400">To:</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200"
          />
        </div>

      </div>

      {/* Key Metrics Bar for Selected Range */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Period Sales Volume</span>
          <span className="text-xl font-black text-emerald-400 font-mono mt-1 block">{formatPKR(totalSalesVolume)}</span>
          <span className="text-[11px] text-slate-400">{filteredSales.length} bikes sold</span>
        </div>

        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Period Actual Bike Cost</span>
          <span className="text-xl font-black text-slate-300 font-mono mt-1 block">{formatPKR(totalActualCost)}</span>
          <span className="text-[11px] text-slate-400">Purchase + linked expenses</span>
        </div>

        <div className="p-4 bg-slate-900 border border-emerald-500/30 rounded-xl bg-emerald-950/10">
          <span className="text-[10px] font-bold text-emerald-300 uppercase tracking-wider block">Period Net Profit</span>
          <span className="text-xl font-black text-emerald-400 font-mono mt-1 block">{formatPKR(totalRealProfit)}</span>
          <span className="text-[11px] text-emerald-400/80">Price − Actual Cost</span>
        </div>

        <div className="p-4 bg-slate-900 border border-orange-500/30 rounded-xl bg-orange-950/10">
          <span className="text-[10px] font-bold text-orange-300 uppercase tracking-wider block">Period Maintenance Expenses</span>
          <span className="text-xl font-black text-orange-400 font-mono mt-1 block">{formatPKR(totalExpensesSum)}</span>
          <span className="text-[11px] text-orange-400/80">{filteredExpenses.length} repair entries</span>
        </div>
      </div>

      {/* Active Report Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-4 bg-slate-950/70 border-b border-slate-800 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-100 uppercase tracking-wider">
            {selectedReport === 'sales' && 'Sales & Net Profit Statement'}
            {selectedReport === 'inventory' && 'Inventory Stock & Valuation'}
            {selectedReport === 'expenses' && 'Bike Expenses Ledger'}
            {selectedReport === 'cashbook' && 'Cashbook Inflow & Outflow'}
            {selectedReport === 'customers' && 'Customer Outstanding Balances'}
          </h2>
          <span className="text-xs text-slate-400">
            {startDate} to {endDate}
          </span>
        </div>

        <div className="overflow-x-auto">
          {selectedReport === 'sales' && (
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/40 text-[10px] font-bold text-slate-400 uppercase">
                  <th className="py-2.5 px-4">Receipt</th>
                  <th className="py-2.5 px-4">Date</th>
                  <th className="py-2.5 px-4">Bike Details</th>
                  <th className="py-2.5 px-4">Engine / Chassis</th>
                  <th className="py-2.5 px-4">Customer</th>
                  <th className="py-2.5 px-4 text-right">Sale Price</th>
                  <th className="py-2.5 px-4 text-right">Actual Cost</th>
                  <th className="py-2.5 px-4 text-right">Net Profit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredSales.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-800/30">
                    <td className="py-2.5 px-4 font-mono font-bold text-amber-400">{s.receiptNo}</td>
                    <td className="py-2.5 px-4 text-slate-300">{s.saleDate}</td>
                    <td className="py-2.5 px-4 font-bold text-slate-100">{s.make} {s.model}</td>
                    <td className="py-2.5 px-4 font-mono text-[11px] text-slate-400">Eng: {s.engineNumber}</td>
                    <td className="py-2.5 px-4 text-slate-300">{customerMap.get(s.customerId)?.name || 'Walk-in'}</td>
                    <td className="py-2.5 px-4 text-right font-mono font-bold text-emerald-400">{formatPKR(s.salePrice)}</td>
                    <td className="py-2.5 px-4 text-right font-mono text-slate-400">{formatPKR(s.actualBikeCost)}</td>
                    <td className="py-2.5 px-4 text-right font-mono font-black text-emerald-400">{formatPKR(s.profit)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {selectedReport === 'inventory' && (
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/40 text-[10px] font-bold text-slate-400 uppercase">
                  <th className="py-2.5 px-4">Bike ID</th>
                  <th className="py-2.5 px-4">Make & Model</th>
                  <th className="py-2.5 px-4">Engine / Chassis</th>
                  <th className="py-2.5 px-4">Status</th>
                  <th className="py-2.5 px-4 text-right">Purchase Cost</th>
                  <th className="py-2.5 px-4 text-right">Expenses</th>
                  <th className="py-2.5 px-4 text-right">Total Showroom Cost</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {bikes.map((b) => {
                  const bExp = expenses.filter((e) => e.bikeId === b.id).reduce((s, e) => s + Number(e.amount || 0), 0);
                  return (
                    <tr key={b.id} className="hover:bg-slate-800/30">
                      <td className="py-2.5 px-4 font-mono font-bold text-amber-400">{b.id}</td>
                      <td className="py-2.5 px-4 font-bold text-slate-100">{b.make} {b.model} ({b.year})</td>
                      <td className="py-2.5 px-4 font-mono text-[11px] text-slate-400">Eng: {b.engineNumber}</td>
                      <td className="py-2.5 px-4">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${b.status === 'Available' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-300'}`}>
                          {b.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono text-slate-300">{formatPKR(b.purchaseCost)}</td>
                      <td className="py-2.5 px-4 text-right font-mono text-orange-400">{formatPKR(bExp)}</td>
                      <td className="py-2.5 px-4 text-right font-mono font-bold text-emerald-400">{formatPKR(b.purchaseCost + bExp)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}

          {selectedReport === 'expenses' && (
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/40 text-[10px] font-bold text-slate-400 uppercase">
                  <th className="py-2.5 px-4">Expense ID</th>
                  <th className="py-2.5 px-4">Date</th>
                  <th className="py-2.5 px-4">Bike ID</th>
                  <th className="py-2.5 px-4">Category</th>
                  <th className="py-2.5 px-4">Description</th>
                  <th className="py-2.5 px-4 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredExpenses.map((e) => (
                  <tr key={e.id} className="hover:bg-slate-800/30">
                    <td className="py-2.5 px-4 font-mono font-bold text-amber-400">{e.id}</td>
                    <td className="py-2.5 px-4 text-slate-300">{e.date}</td>
                    <td className="py-2.5 px-4 font-mono text-slate-200">{e.bikeId}</td>
                    <td className="py-2.5 px-4 text-orange-400 font-bold">{e.category}</td>
                    <td className="py-2.5 px-4 text-slate-300">{e.description}</td>
                    <td className="py-2.5 px-4 text-right font-mono font-bold text-orange-400">{formatPKR(e.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {selectedReport === 'cashbook' && (
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/40 text-[10px] font-bold text-slate-400 uppercase">
                  <th className="py-2.5 px-4">ID</th>
                  <th className="py-2.5 px-4">Date</th>
                  <th className="py-2.5 px-4">Category</th>
                  <th className="py-2.5 px-4">Description</th>
                  <th className="py-2.5 px-4 text-right">Inflow (+)</th>
                  <th className="py-2.5 px-4 text-right">Outflow (-)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredCashbook.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-800/30">
                    <td className="py-2.5 px-4 font-mono text-amber-400">{c.id}</td>
                    <td className="py-2.5 px-4 text-slate-300">{c.date}</td>
                    <td className="py-2.5 px-4 text-slate-300">{c.category}</td>
                    <td className="py-2.5 px-4 text-slate-300">{c.description}</td>
                    <td className="py-2.5 px-4 text-right font-mono font-bold text-emerald-400">
                      {c.type === 'IN' ? formatPKR(c.amount) : '—'}
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono font-bold text-rose-400">
                      {c.type === 'OUT' ? formatPKR(c.amount) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {selectedReport === 'customers' && (
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/40 text-[10px] font-bold text-slate-400 uppercase">
                  <th className="py-2.5 px-4">Customer ID</th>
                  <th className="py-2.5 px-4">Customer Name</th>
                  <th className="py-2.5 px-4">Phone</th>
                  <th className="py-2.5 px-4">CNIC</th>
                  <th className="py-2.5 px-4 text-right">Current Outstanding Khata</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {customers.map((c) => {
                  const { totalOutstanding } = calculateCustomerOutstanding(c.id, sales, financeAccounts);
                  return (
                    <tr key={c.id} className="hover:bg-slate-800/30">
                      <td className="py-2.5 px-4 font-mono text-blue-400">{c.id}</td>
                      <td className="py-2.5 px-4 font-bold text-slate-100">{c.name}</td>
                      <td className="py-2.5 px-4 font-mono text-slate-300">{c.phone || '—'}</td>
                      <td className="py-2.5 px-4 font-mono text-slate-400">{c.cnic || '—'}</td>
                      <td className="py-2.5 px-4 text-right font-mono font-bold text-rose-400">
                        {formatPKR(totalOutstanding)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

    </div>
  );
};
