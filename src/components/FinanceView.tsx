/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Calculator,
  Search,
  Calendar,
  DollarSign,
  CheckCircle2,
  AlertCircle,
  Clock,
  User,
  Bike as BikeIcon,
  Filter,
  Eye,
  CreditCard,
} from 'lucide-react';
import { Customer, FinanceAccount, InstallmentItem } from '../types';
import {
  formatPKDateTime,
  formatPKR,
  getCurrentDate,
  getCurrentTime,
} from '../utils/formatters';

interface FinanceViewProps {
  financeAccounts?: FinanceAccount[];
  customers?: Customer[];
  onPayInstallment: (params: any) => Promise<any>;
}

export const FinanceView: React.FC<FinanceViewProps> = ({
  financeAccounts = [],
  customers = [],
  onPayInstallment,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'Active' | 'Completed' | 'Overdue'>('ALL');
  const [selectedAccount, setSelectedAccount] = useState<FinanceAccount | null>(null);
  const [payingItem, setPayingItem] = useState<{ account: FinanceAccount; item: InstallmentItem } | null>(null);
  const [payAmount, setPayAmount] = useState<number | ''>('');
  const [payDate, setPayDate] = useState(getCurrentDate());
  const [payTime, setPayTime] = useState(getCurrentTime());
  const [payMethod, setPayMethod] = useState('Cash');
  const [payNotes, setPayNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const today = getCurrentDate();
  const customerMap = new Map<string, Customer>(customers.map((c) => [c.id, c]));

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payingItem || !payAmount || Number(payAmount) <= 0) return;

    setIsSubmitting(true);
    try {
      await onPayInstallment({
        customerId: payingItem.account.customerId,
        financeId: payingItem.account.id,
        installmentNo: payingItem.item.no,
        amount: Number(payAmount),
        date: payDate,
        time: payTime,
        paymentMethod: payMethod,
        notes: payNotes.trim(),
      });
      setMsg(`Installment #${payingItem.item.no} paid successfully! Cashbook updated.`);
      setTimeout(() => setMsg(null), 3000);
      setPayingItem(null);
      setPayAmount('');
      setPayNotes('');
    } catch (err: any) {
      alert(err.message || 'Failed to record installment payment.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openPayModal = (account: FinanceAccount, item: InstallmentItem) => {
    setPayingItem({ account, item });
    setPayAmount(item.amount - (item.paidAmount || 0));
    setPayDate(getCurrentDate());
    setPayTime(getCurrentTime());
    setPayNotes(`Installment #${item.no} for ${account.brand} ${account.model}`);
  };

  const filteredAccounts = financeAccounts
    .filter((acc) => {
      const isOverdue = acc.schedule.some((x) => !x.paid && x.dueDate < today);
      const isCompleted = acc.status === 'PAID' || acc.schedule.every((x) => x.paid);
      const isActive = !isCompleted;

      if (statusFilter === 'Overdue' && !isOverdue) return false;
      if (statusFilter === 'Active' && !isActive) return false;
      if (statusFilter === 'Completed' && !isCompleted) return false;

      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      const cust = customerMap.get(acc.customerId);
      return (
        acc.id.toLowerCase().includes(q) ||
        acc.bikeId.toLowerCase().includes(q) ||
        acc.brand.toLowerCase().includes(q) ||
        acc.model.toLowerCase().includes(q) ||
        (cust?.name.toLowerCase() || '').includes(q) ||
        (cust?.cnic?.toLowerCase() || '').includes(q) ||
        (cust?.phone?.toLowerCase() || '').includes(q)
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
            <Calculator className="w-6 h-6 text-indigo-400" />
            <span>Installments & Finance Register (اقساط)</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Track monthly installment schedules, overdue recovery, guarantor commitments and collection inflows.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">
            Total Finance Accounts: <b className="text-white">{financeAccounts.length}</b>
          </span>
        </div>
      </div>

      {msg && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs text-emerald-400 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{msg}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900 border border-slate-800 p-3 rounded-2xl shadow-md">
        
        {/* Status Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
          {[
            { id: 'ALL', label: 'All Accounts' },
            { id: 'Active', label: 'Active Plans' },
            { id: 'Overdue', label: 'Overdue Recovery' },
            { id: 'Completed', label: 'Fully Paid (Completed)' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id as any)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                statusFilter === tab.id
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search finance by Customer, Phone, Bike..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-4 py-1.5 text-xs text-slate-200 placeholder-slate-500"
          />
        </div>

      </div>

      {/* Finance Accounts Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/60 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-4">Account ID</th>
                <th className="py-3 px-4">Customer & Phone</th>
                <th className="py-3 px-4">Bike Details</th>
                <th className="py-3 px-4 text-right">Total Financed</th>
                <th className="py-3 px-4 text-right">Down Payment</th>
                <th className="py-3 px-4 text-center">Installments</th>
                <th className="py-3 px-4 text-right">Remaining Balance</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-center">Schedule</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-xs">
              {filteredAccounts.length > 0 ? (
                filteredAccounts.map((acc) => {
                  const cust = customerMap.get(acc.customerId);
                  const paidCount = acc.schedule.filter((x) => x.paid).length;
                  const totalCount = acc.schedule.length;
                  const remainingBal = acc.schedule
                    .filter((x) => !x.paid)
                    .reduce((s, x) => s + (x.amount - (x.paidAmount || 0)), 0);
                  const hasOverdue = acc.schedule.some((x) => !x.paid && x.dueDate < today);

                  return (
                    <tr key={acc.id} className="hover:bg-slate-800/40 transition">
                      <td className="py-3 px-4 font-mono font-bold text-indigo-400">{acc.id}</td>

                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-100">{cust?.name || 'Customer'}</div>
                        <div className="text-[11px] text-slate-400 font-mono">{cust?.phone || 'No phone'}</div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-200">{acc.brand} {acc.model}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{acc.bikeId}</div>
                      </td>

                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-200">
                        {formatPKR(acc.totalPayable || acc.financedAmount || acc.bikePrice || 0)}
                      </td>

                      <td className="py-3 px-4 text-right font-mono text-emerald-400">
                        {formatPKR(acc.downPayment || 0)}
                      </td>

                      <td className="py-3 px-4 text-center">
                        <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                          {paidCount} / {totalCount}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right font-mono font-black text-rose-400">
                        {formatPKR(remainingBal)}
                      </td>

                      <td className="py-3 px-4">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            acc.status === 'PAID' || acc.schedule.every((x) => x.paid)
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                              : hasOverdue
                              ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                              : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30'
                          }`}
                        >
                          {acc.status === 'PAID' || acc.schedule.every((x) => x.paid)
                            ? 'Completed'
                            : hasOverdue
                            ? 'Overdue'
                            : 'Active'}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => setSelectedAccount(acc)}
                          className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-indigo-300 rounded-lg text-xs font-bold border border-slate-700 flex items-center gap-1 mx-auto"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Schedule</span>
                        </button>
                      </td>

                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-500">
                    No finance accounts found matching filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Schedule Ledger Modal */}
      {selectedAccount && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="relative max-w-3xl w-full bg-slate-900 border border-slate-700 rounded-2xl overflow-hidden shadow-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <div className="font-mono text-xs font-bold text-indigo-400">{selectedAccount.id}</div>
                <h2 className="text-base font-black text-white">
                  Installment Schedule: {selectedAccount.brand} {selectedAccount.model}
                </h2>
                <div className="text-xs text-slate-400 mt-0.5">
                  Customer: <b className="text-slate-200">{customerMap.get(selectedAccount.customerId)?.name}</b> · Advance: <b className="text-emerald-400">{formatPKR(selectedAccount.downPayment || 0)}</b>
                </div>
              </div>
              <button
                onClick={() => setSelectedAccount(null)}
                className="text-slate-400 hover:text-white text-lg font-bold"
              >
                ✕
              </button>
            </div>

            {/* Schedule Items Table */}
            <div className="border border-slate-800 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-950/70 border-b border-slate-800 text-[10px] font-bold text-slate-400 uppercase">
                    <th className="py-2.5 px-3">#</th>
                    <th className="py-2.5 px-3">Due Date</th>
                    <th className="py-2.5 px-3 text-right">Amount Due</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">Paid Date</th>
                    <th className="py-2.5 px-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {selectedAccount.schedule.map((item) => {
                    const isOverdue = !item.paid && item.dueDate < today;
                    return (
                      <tr key={item.no} className="hover:bg-slate-800/50">
                        <td className="py-2.5 px-3 font-mono font-bold text-indigo-300">#{item.no}</td>
                        <td className="py-2.5 px-3 font-mono text-slate-300">{item.dueDate}</td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-200">
                          {formatPKR(item.amount)}
                        </td>
                        <td className="py-2.5 px-3">
                          {item.paid ? (
                            <span className="text-emerald-400 font-bold flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Paid
                            </span>
                          ) : isOverdue ? (
                            <span className="text-rose-400 font-bold flex items-center gap-1">
                              <AlertCircle className="w-3.5 h-3.5" /> Overdue
                            </span>
                          ) : (
                            <span className="text-amber-400 font-medium">Pending</span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-slate-400">
                          {item.paidDate || '—'}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          {!item.paid && (
                            <button
                              onClick={() => {
                                const acc = selectedAccount;
                                setSelectedAccount(null);
                                openPayModal(acc, item);
                              }}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-bold text-[10px]"
                            >
                              Collect
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-end pt-2">
              <button
                onClick={() => setSelectedAccount(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200"
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Pay Installment Modal */}
      {payingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <form
            onSubmit={handlePay}
            className="relative max-w-md w-full bg-slate-900 border border-slate-700 rounded-2xl overflow-hidden shadow-2xl p-6 space-y-4"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h2 className="text-base font-black text-white">
                  Collect Installment #{payingItem.item.no}
                </h2>
                <div className="text-xs text-indigo-300 font-bold">
                  {payingItem.account.brand} {payingItem.account.model}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPayingItem(null)}
                className="text-slate-400 hover:text-white font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">Received Amount (PKR) *</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full bg-slate-800 border border-emerald-500 rounded-lg px-3 py-2 text-sm font-bold text-emerald-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 mb-1">Payment Date</label>
                  <input
                    type="date"
                    value={payDate}
                    onChange={(e) => setPayDate(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 mb-1">Method</label>
                  <select
                    value={payMethod}
                    onChange={(e) => setPayMethod(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200"
                  >
                    <option value="Cash">Cash</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="Easypaisa">Easypaisa</option>
                    <option value="JazzCash">JazzCash</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">Notes / Slip Ref</label>
                <input
                  type="text"
                  value={payNotes}
                  onChange={(e) => setPayNotes(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setPayingItem(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg"
              >
                {isSubmitting ? 'Recording...' : 'Collect & Update Cashbook'}
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
};
