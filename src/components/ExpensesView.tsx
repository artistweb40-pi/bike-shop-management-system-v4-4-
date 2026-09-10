/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Receipt,
  PlusCircle,
  Search,
  Trash2,
  Edit2,
  CheckCircle2,
  AlertCircle,
  Bike as BikeIcon,
  Tag,
  DollarSign,
  Clock,
  Calendar,
} from 'lucide-react';
import { Bike, BikeExpense, ExpenseCategory } from '../types';
import {
  EXPENSE_CATEGORIES,
  formatPKDateTime,
  formatPKR,
  getCurrentDate,
  getCurrentTime,
} from '../utils/formatters';

interface ExpensesViewProps {
  expenses?: BikeExpense[];
  bikes?: Bike[];
  preselectedBikeId?: string;
  onAddExpense: (expense: any) => Promise<any>;
  onUpdateExpense: (expense: BikeExpense) => Promise<any>;
  onDeleteExpense: (expenseId: string) => Promise<any>;
}

export const ExpensesView: React.FC<ExpensesViewProps> = ({
  expenses = [],
  bikes = [],
  preselectedBikeId,
  onAddExpense,
  onUpdateExpense,
  onDeleteExpense,
}) => {
  const [showForm, setShowForm] = useState(Boolean(preselectedBikeId));
  const [editingExpense, setEditingExpense] = useState<BikeExpense | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  // Form State
  const [bikeId, setBikeId] = useState(preselectedBikeId || (bikes[0]?.id || ''));
  const [category, setCategory] = useState<ExpenseCategory>('Repair');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState<number | ''>('');
  const [date, setDate] = useState(getCurrentDate());
  const [time, setTime] = useState(getCurrentTime());
  const [notes, setNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Cash');

  const bikeMap = new Map<string, Bike>(bikes.map((b) => [b.id, b]));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (!amount || Number(amount) <= 0) {
      setMessage({ type: 'error', text: 'Please enter a valid expense amount in PKR.' });
      return;
    }
    if (!description.trim()) {
      setMessage({ type: 'error', text: 'Expense description is required.' });
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingExpense) {
        await onUpdateExpense({
          ...editingExpense,
          bikeId,
          category,
          description: description.trim(),
          amount: Number(amount),
          date,
          time,
          notes: notes.trim(),
        });
        setMessage({ type: 'success', text: `Expense updated. Total bike cost and profit recalculated.` });
        setEditingExpense(null);
      } else {
        await onAddExpense({
          bikeId,
          category,
          description: description.trim(),
          amount: Number(amount),
          date,
          time,
          notes: notes.trim(),
          paymentMethod,
        });
        setMessage({ type: 'success', text: `Expense added. Bike total cost and cashbook updated.` });
      }

      setDescription('');
      setAmount('');
      setNotes('');
      setShowForm(false);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to save expense.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const startEdit = (exp: BikeExpense) => {
    setEditingExpense(exp);
    setBikeId(exp.bikeId);
    setCategory(exp.category);
    setDescription(exp.description);
    setAmount(exp.amount);
    setDate(exp.date);
    setTime(exp.time);
    setNotes(exp.notes || '');
    setShowForm(true);
  };

  const handleDelete = async (expId: string) => {
    if (!confirm('Are you sure you want to delete this expense? This will update the bike total cost, sale profit and cashbook.')) {
      return;
    }
    try {
      await onDeleteExpense(expId);
      setMessage({ type: 'success', text: 'Expense deleted and calculations updated successfully.' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to delete expense.' });
    }
  };

  const filteredExpenses = expenses
    .filter((e) => {
      if (categoryFilter && e.category !== categoryFilter) return false;
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      const bike = bikeMap.get(e.bikeId);
      return (
        e.id.toLowerCase().includes(q) ||
        e.description.toLowerCase().includes(q) ||
        e.category.toLowerCase().includes(q) ||
        e.bikeId.toLowerCase().includes(q) ||
        (bike?.engineNumber.toLowerCase() || '').includes(q) ||
        (bike?.make.toLowerCase() || '').includes(q) ||
        (bike?.model.toLowerCase() || '').includes(q)
      );
    })
    .slice()
    .reverse();

  const totalExpenseAmount = filteredExpenses.reduce((s, e) => s + Number(e.amount || 0), 0);

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-xl font-black text-white flex items-center gap-2.5">
            <Receipt className="w-6 h-6 text-orange-400" />
            <span>Motorcycle Expenses & Maintenance Ledger</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Track repairs, spare parts, tuning, documentation, and freight. Automatically added to Total Bike Cost.
          </p>
        </div>
        <button
          onClick={() => {
            setEditingExpense(null);
            setShowForm(!showForm);
            setMessage(null);
          }}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-orange-600 hover:bg-orange-500 text-white transition shadow-lg"
        >
          {showForm ? '✕ Close Form' : '+ Add Bike Expense'}
        </button>
      </div>

      {/* Alerts */}
      {message && (
        <div
          className={`p-4 rounded-xl text-xs flex items-center gap-2 ${
            message.type === 'success'
              ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
              : 'bg-rose-500/10 border border-rose-500/30 text-rose-400'
          }`}
        >
          {message.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
          <span>{message.text}</span>
        </div>
      )}

      {/* Expense Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h2 className="text-sm font-bold text-slate-100 uppercase tracking-wider flex items-center gap-2">
              <Receipt className="w-4 h-4 text-orange-400" />
              <span>{editingExpense ? 'Edit Bike Expense' : 'Record New Bike Expense'}</span>
            </h2>
            <span className="text-xs text-slate-400">Formula: Total Cost = Purchase + Expenses</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            
            {/* Target Bike Selection */}
            <div>
              <label className="block text-[11px] font-bold text-slate-400 mb-1">Target Motorcycle (Bike ID) *</label>
              <select
                required
                value={bikeId}
                onChange={(e) => setBikeId(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200"
              >
                {bikes.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.id} — {b.make} {b.model} ({b.color}) · Eng: {b.engineNumber} [{b.status}]
                  </option>
                ))}
              </select>
            </div>

            {/* Category */}
            <div>
              <label className="block text-[11px] font-bold text-slate-400 mb-1">Expense Category *</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200"
              >
                {EXPENSE_CATEGORIES.map((c) => (
                  <option key={c.key} value={c.key}>{c.label} ({c.urdu})</option>
                ))}
              </select>
            </div>

            {/* Amount */}
            <div>
              <label className="block text-[11px] font-bold text-slate-400 mb-1">Amount (PKR) *</label>
              <input
                type="number"
                required
                min="1"
                placeholder="e.g. 5000"
                value={amount}
                onChange={(e) => setAmount(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full bg-slate-800 border border-orange-500/50 rounded-lg px-3 py-2 text-sm font-bold text-orange-400"
              />
            </div>

            {/* Description */}
            <div className="sm:col-span-2">
              <label className="block text-[11px] font-bold text-slate-400 mb-1">Description / Mechanic Details *</label>
              <input
                type="text"
                required
                placeholder="e.g. Oil change, ring piston repair, meter cable replacement"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200"
              />
            </div>

            {/* Payment Method */}
            <div>
              <label className="block text-[11px] font-bold text-slate-400 mb-1">Paid Via</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200"
              >
                <option value="Cash">Cash</option>
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="Easypaisa">Easypaisa</option>
                <option value="JazzCash">JazzCash</option>
              </select>
            </div>

            {/* Date */}
            <div>
              <label className="block text-[11px] font-bold text-slate-400 mb-1">Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200"
              />
            </div>

            {/* Time */}
            <div>
              <label className="block text-[11px] font-bold text-slate-400 mb-1">Time</label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200"
              />
            </div>

            {/* Notes */}
            <div>
              <label className="block text-[11px] font-bold text-slate-400 mb-1">Additional Notes</label>
              <input
                type="text"
                placeholder="Mechanic name, receipt reference..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200"
              />
            </div>

          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                setEditingExpense(null);
              }}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-xl text-xs font-bold bg-orange-600 hover:bg-orange-500 text-white shadow-lg"
            >
              {isSubmitting ? 'Saving...' : editingExpense ? 'Update Expense' : 'Save Expense & Recalculate Cost'}
            </button>
          </div>
        </form>
      )}

      {/* Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search expenses by Bike ID, Engine, Description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-200"
            />
          </div>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300"
          >
            <option value="">All Categories</option>
            {EXPENSE_CATEGORIES.map((c) => (
              <option key={c.key} value={c.key}>{c.label}</option>
            ))}
          </select>
        </div>

        <div className="text-xs text-slate-400">
          Filtered Sum: <b className="text-orange-400 font-mono text-sm">{formatPKR(totalExpenseAmount)}</b> ({filteredExpenses.length} entries)
        </div>
      </div>

      {/* Expenses Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/60 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-4">Expense ID</th>
                <th className="py-3 px-4">Date & Time</th>
                <th className="py-3 px-4">Target Bike</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Description</th>
                <th className="py-3 px-4 text-right">Amount (PKR)</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-xs">
              {filteredExpenses.length > 0 ? (
                filteredExpenses.map((exp) => {
                  const bike = bikeMap.get(exp.bikeId);
                  return (
                    <tr key={exp.id} className="hover:bg-slate-800/40 transition">
                      <td className="py-3 px-4 font-mono font-bold text-amber-400">{exp.id}</td>
                      <td className="py-3 px-4 text-slate-300">{formatPKDateTime(exp.date, exp.time)}</td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-100">{exp.bikeId}</div>
                        <div className="text-[11px] text-slate-400">{bike ? `${bike.make} ${bike.model} (Eng: ${bike.engineNumber})` : '—'}</div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-400 border border-orange-500/30">
                          {exp.category}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-200">
                        <div>{exp.description}</div>
                        {exp.notes && <div className="text-[10px] text-slate-500">Note: {exp.notes}</div>}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-orange-400">
                        {formatPKR(exp.amount)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => startEdit(exp)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                            title="Edit Expense"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(exp.id)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-rose-400 transition"
                            title="Delete Expense"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500">
                    No expense records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
