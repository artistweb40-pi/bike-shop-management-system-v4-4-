/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  BookOpen,
  ArrowUpRight,
  ArrowDownRight,
  PlusCircle,
  Search,
  CheckCircle2,
  Calendar,
  Wallet,
  Building,
  CreditCard,
  Filter,
} from 'lucide-react';
import { CashbookEntry } from '../types';
import {
  formatPKDateTime,
  formatPKR,
  getCurrentDate,
  getCurrentTime,
} from '../utils/formatters';

interface CashbookViewProps {
  entries?: CashbookEntry[];
  onAddManualEntry: (params: any) => Promise<any>;
}

export const CashbookView: React.FC<CashbookViewProps> = ({
  entries = [],
  onAddManualEntry,
}) => {
  const [showModal, setShowModal] = useState(false);
  const [type, setType] = useState<'IN' | 'OUT'>('IN');
  const [category, setCategory] = useState('Manual Entry');
  const [amount, setAmount] = useState<number | ''>('');
  const [description, setDescription] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [date, setDate] = useState(getCurrentDate());
  const [time, setTime] = useState(getCurrentTime());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'IN' | 'OUT'>('ALL');

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || Number(amount) <= 0 || !description.trim()) return;

    setIsSubmitting(true);
    try {
      await onAddManualEntry({
        date,
        time,
        type,
        category: category.trim(),
        description: description.trim(),
        amount: Number(amount),
        paymentMethod,
      });
      setShowModal(false);
      setAmount('');
      setDescription('');
    } catch (err: any) {
      alert(err.message || 'Failed to add cashbook entry.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalInflow = entries
    .filter((e) => e.type === 'IN')
    .reduce((s, e) => s + Number(e.amount || 0), 0);

  const totalOutflow = entries
    .filter((e) => e.type === 'OUT')
    .reduce((s, e) => s + Number(e.amount || 0), 0);

  const netBalance = totalInflow - totalOutflow;

  const filteredEntries = entries
    .filter((e) => {
      if (typeFilter !== 'ALL' && e.type !== typeFilter) return false;
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return (
        e.description.toLowerCase().includes(q) ||
        e.category.toLowerCase().includes(q) ||
        (e.referenceId?.toLowerCase() || '').includes(q) ||
        e.id.toLowerCase().includes(q)
      );
    })
    .slice()
    .reverse();

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-xl font-black text-white flex items-center gap-2.5">
            <BookOpen className="w-6 h-6 text-amber-400" />
            <span>Showroom Cashbook & Daily Financial Ledger</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time verified cash flow register of bike sales, purchases, maintenance expenses and shop overheads.
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 transition shadow-lg font-bold"
        >
          <PlusCircle className="w-4 h-4" />
          <span>+ Manual Cash Entry</span>
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 bg-slate-900 border border-emerald-500/30 rounded-2xl bg-emerald-950/10">
          <div className="flex items-center justify-between text-emerald-300 text-xs font-bold uppercase mb-1">
            <span>Total Cash Inflow</span>
            <ArrowUpRight className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400 font-mono">
            {formatPKR(totalInflow)}
          </div>
          <div className="text-[11px] text-emerald-400/80 mt-1">Sales, advances & installment receipts</div>
        </div>

        <div className="p-4 bg-slate-900 border border-rose-500/30 rounded-2xl bg-rose-950/10">
          <div className="flex items-center justify-between text-rose-300 text-xs font-bold uppercase mb-1">
            <span>Total Cash Outflow</span>
            <ArrowDownRight className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-black text-rose-400 font-mono">
            {formatPKR(totalOutflow)}
          </div>
          <div className="text-[11px] text-rose-400/80 mt-1">Bike purchases, repairs & shop expenses</div>
        </div>

        <div className="p-4 bg-slate-900 border border-slate-700 rounded-2xl">
          <div className="flex items-center justify-between text-slate-300 text-xs font-bold uppercase mb-1">
            <span>Net Showroom Balance</span>
            <Wallet className="w-4 h-4 text-amber-400" />
          </div>
          <div className={`text-2xl font-black font-mono ${netBalance >= 0 ? 'text-amber-400' : 'text-rose-400'}`}>
            {formatPKR(netBalance)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Current liquid funds on hand</div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900 border border-slate-800 p-3 rounded-2xl shadow-md">
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
          {[
            { id: 'ALL', label: 'All Transactions' },
            { id: 'IN', label: 'Cash Inflow (+)' },
            { id: 'OUT', label: 'Cash Outflow (-)' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setTypeFilter(tab.id as any)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                typeFilter === tab.id
                  ? 'bg-amber-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by description, category, ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-4 py-1.5 text-xs text-slate-200 placeholder-slate-500"
          />
        </div>
      </div>

      {/* Entries Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/60 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-4">Transaction ID</th>
                <th className="py-3 px-4">Date & Time</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Description & Ref</th>
                <th className="py-3 px-4">Method</th>
                <th className="py-3 px-4 text-right">Inflow (PKR)</th>
                <th className="py-3 px-4 text-right">Outflow (PKR)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-xs">
              {filteredEntries.length > 0 ? (
                filteredEntries.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3 px-4 font-mono font-bold text-amber-400">{item.id}</td>
                    <td className="py-3 px-4 text-slate-300">{formatPKDateTime(item.date, item.time)}</td>
                    <td className="py-3 px-4">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                        {item.category}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-200">
                      <div>{item.description}</div>
                      {item.referenceId && (
                        <div className="text-[10px] font-mono text-slate-400">Ref: {item.referenceId}</div>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-300 font-medium">{item.paymentMethod}</td>
                    
                    {/* Inflow Column */}
                    <td className="py-3 px-4 text-right font-mono font-bold text-emerald-400">
                      {item.type === 'IN' ? formatPKR(item.amount) : '—'}
                    </td>

                    {/* Outflow Column */}
                    <td className="py-3 px-4 text-right font-mono font-bold text-rose-400">
                      {item.type === 'OUT' ? formatPKR(item.amount) : '—'}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500">
                    No cashbook transactions found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Manual Entry Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <form
            onSubmit={handleAdd}
            className="relative max-w-md w-full bg-slate-900 border border-slate-700 rounded-2xl overflow-hidden shadow-2xl p-6 space-y-4"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h2 className="text-base font-black text-white flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-amber-400" />
                <span>Add Cash / Expense Transaction</span>
              </h2>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-white font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              {/* Type Select */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setType('IN')}
                  className={`py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                    type === 'IN'
                      ? 'bg-emerald-600 text-white shadow-md'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <ArrowUpRight className="w-4 h-4" />
                  <span>Cash Inflow (+)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setType('OUT')}
                  className={`py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                    type === 'OUT'
                      ? 'bg-rose-600 text-white shadow-md'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <ArrowDownRight className="w-4 h-4" />
                  <span>Cash Outflow (-)</span>
                </button>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">Amount (PKR) *</label>
                <input
                  type="number"
                  required
                  min="1"
                  placeholder="e.g. 5000"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full bg-slate-800 border border-amber-500 rounded-lg px-3 py-2 text-sm font-bold text-amber-400"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">Category</label>
                <input
                  type="text"
                  placeholder="e.g. Electricity Bill, Shop Rent, Owner Capital, Tea"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">Description *</label>
                <input
                  type="text"
                  required
                  placeholder="Details of expense or income..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 mb-1">Date</label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 mb-1">Method</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200"
                  >
                    <option value="Cash">Cash</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="Easypaisa">Easypaisa</option>
                    <option value="JazzCash">JazzCash</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2.5 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-lg font-bold"
              >
                {isSubmitting ? 'Saving...' : 'Add Cashbook Entry'}
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
};
