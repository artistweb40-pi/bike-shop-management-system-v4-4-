/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Users,
  Search,
  PlusCircle,
  CreditCard,
  User,
  Shield,
  Eye,
  CheckCircle2,
  DollarSign,
  AlertCircle,
  Receipt,
  FileText,
  Phone,
  MapPin,
  Edit2,
} from 'lucide-react';
import { Customer, FinanceAccount, Payment, Sale } from '../types';
import {
  calculateCustomerOutstanding,
  isSaleFinanced,
  fileToDataURL,
  formatCNICInput,
  formatPKDateTime,
  formatPKR,
  formatPhoneInput,
  getCurrentDate,
  getCurrentTime,
  isValidCNIC,
} from '../utils/formatters';

interface CustomersViewProps {
  customers?: Customer[];
  sales?: Sale[];
  financeAccounts?: FinanceAccount[];
  payments?: Payment[];
  onAddCustomer: (customer: any) => Promise<any>;
  onUpdateCustomer?: (customer: Customer) => Promise<any>;
  onReceivePayment: (params: any) => Promise<any>;
  onViewImage?: (url: string, title: string) => void;
}

export const CustomersView: React.FC<CustomersViewProps> = ({
  customers = [],
  sales = [],
  financeAccounts = [],
  payments = [],
  onAddCustomer,
  onUpdateCustomer,
  onReceivePayment,
  onViewImage = (_url: string, _title: string) => {},
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState<Customer | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  // New Customer Form State
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [cnic, setCnic] = useState('');
  const [address, setAddress] = useState('');
  const [photoBlob, setPhotoBlob] = useState('');
  const [cnicFront, setCnicFront] = useState('');
  const [cnicBack, setCnicBack] = useState('');

  // Payment Form State
  const [paymentAmount, setPaymentAmount] = useState<number | ''>('');
  const [paymentDate, setPaymentDate] = useState(getCurrentDate());
  const [paymentTime, setPaymentTime] = useState(getCurrentTime());
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [paymentNotes, setPaymentNotes] = useState('');

  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: (val: string) => void
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const dataUrl = await fileToDataURL(file);
        setter(dataUrl);
      } catch {
        alert('Failed to read image file.');
      }
    }
  };

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    if (cnic && !isValidCNIC(cnic)) {
      alert('CNIC format should be 13 digits (35202-1234567-1).');
      return;
    }

    setIsSubmitting(true);
    try {
      await onAddCustomer({
        name: name.trim(),
        phone: phone.trim(),
        cnic: cnic.trim(),
        address: address.trim(),
        photoBlob,
        cnicFrontBlob: cnicFront,
        cnicBackBlob: cnicBack,
      });
      setMsg('Customer registered successfully!');
      setTimeout(() => setMsg(null), 3000);
      setName('');
      setPhone('');
      setCnic('');
      setAddress('');
      setPhotoBlob('');
      setCnicFront('');
      setCnicBack('');
      setShowAddModal(false);
    } catch (err: any) {
      alert(err.message || 'Failed to add customer.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCollectPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showPaymentModal || !paymentAmount || Number(paymentAmount) <= 0) return;

    setIsSubmitting(true);
    try {
      await onReceivePayment({
        customerId: showPaymentModal.id,
        amount: Number(paymentAmount),
        date: paymentDate,
        time: paymentTime,
        paymentMethod,
        notes: paymentNotes.trim(),
      });
      setMsg(`Payment of ${formatPKR(Number(paymentAmount))} recorded for ${showPaymentModal.name}. Cashbook updated!`);
      setTimeout(() => setMsg(null), 3000);
      setShowPaymentModal(null);
      setPaymentAmount('');
      setPaymentNotes('');
    } catch (err: any) {
      alert(err.message || 'Failed to record payment.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredCustomers = customers
    .filter((c) => {
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return (
        c.name.toLowerCase().includes(q) ||
        (c.cnic?.toLowerCase() || '').includes(q) ||
        (c.phone?.toLowerCase() || '').includes(q) ||
        (c.address?.toLowerCase() || '').includes(q) ||
        c.id.toLowerCase().includes(q)
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
            <Users className="w-6 h-6 text-blue-400" />
            <span>Customer Directory & Khata Ledger</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Track customer identities with verified CNIC cards, purchases history, credit balances & installment payments.
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white transition shadow-lg"
        >
          <PlusCircle className="w-4 h-4" />
          <span>+ Register New Customer</span>
        </button>
      </div>

      {msg && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs text-emerald-400 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{msg}</span>
        </div>
      )}

      {/* Filter and Search */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative max-w-sm w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search customer by name, CNIC, phone, address..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-200"
          />
        </div>
        <div className="text-xs text-slate-400">
          Total Customers: <b>{customers.length}</b>
        </div>
      </div>

      {/* Customers Grid / Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/60 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">CNIC & Phone</th>
                <th className="py-3 px-4">Address</th>
                <th className="py-3 px-4 text-center">Bikes Bought</th>
                <th className="py-3 px-4 text-right">Outstanding Balance</th>
                <th className="py-3 px-4 text-center">Identity</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-xs">
              {filteredCustomers.length > 0 ? (
                filteredCustomers.map((cust) => {
                  const custSales = sales.filter((s) => s.customerId === cust.id);
                  const { totalOutstanding } = calculateCustomerOutstanding(
                    cust.id,
                    sales,
                    financeAccounts
                  );

                  return (
                    <tr key={cust.id} className="hover:bg-slate-800/40 transition">
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-100 flex items-center gap-2">
                          <User className="w-4 h-4 text-blue-400" />
                          <span>{cust.name}</span>
                        </div>
                        <div className="text-[10px] font-mono text-slate-500">{cust.id}</div>
                      </td>

                      <td className="py-3 px-4 font-mono">
                        <div className="text-slate-200">{cust.cnic || 'CNIC: —'}</div>
                        <div className="text-slate-400 text-[11px]">{cust.phone || 'No phone'}</div>
                      </td>

                      <td className="py-3 px-4 text-slate-300 max-w-xs truncate">
                        {cust.address || '—'}
                      </td>

                      <td className="py-3 px-4 text-center">
                        <span className="font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-200">
                          {custSales.length}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <span
                          className={`font-mono font-black ${
                            totalOutstanding > 0 ? 'text-rose-400' : 'text-emerald-400'
                          }`}
                        >
                          {formatPKR(totalOutstanding)}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {cust.photoBlob && (
                            <button
                              onClick={() => onViewImage(cust.photoBlob!, `Customer: ${cust.name}`)}
                              className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-blue-400"
                              title="View Customer Photo"
                            >
                              <User className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {cust.cnicFrontBlob && (
                            <button
                              onClick={() => onViewImage(cust.cnicFrontBlob!, `CNIC Front: ${cust.name}`)}
                              className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-amber-400"
                              title="View CNIC Front"
                            >
                              <Shield className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {cust.cnicBackBlob && (
                            <button
                              onClick={() => onViewImage(cust.cnicBackBlob!, `CNIC Back: ${cust.name}`)}
                              className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-amber-400"
                              title="View CNIC Back"
                            >
                              <CreditCard className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>

                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => setSelectedCustomer(cust)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-blue-400"
                            title="View Customer Dossier & Khata"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          {onUpdateCustomer && (
                            <button
                              onClick={() => setEditingCustomer(cust)}
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-400"
                              title="Edit Customer Info"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {totalOutstanding > 0 && (
                            <button
                              onClick={() => setShowPaymentModal(cust)}
                              className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] flex items-center gap-1 shadow-sm"
                              title="Receive Payment"
                            >
                              <CreditCard className="w-3 h-3" />
                              Collect
                            </button>
                          )}
                        </div>
                      </td>

                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500">
                    No customer records match your query.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Customer Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <form
            onSubmit={handleCreateCustomer}
            className="relative max-w-2xl w-full bg-slate-900 border border-slate-700 rounded-2xl overflow-hidden shadow-2xl p-6 space-y-4"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h2 className="text-base font-black text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-400" />
                <span>Register New Customer Account</span>
              </h2>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">Customer Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Tariq Mehmood"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">Mobile Number</label>
                <input
                  type="text"
                  placeholder="0300-1234567"
                  value={phone}
                  onChange={(e) => setPhone(formatPhoneInput(e.target.value))}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">Customer CNIC (13 Digits)</label>
                <input
                  type="text"
                  placeholder="35202-1234567-1"
                  value={cnic}
                  onChange={(e) => setCnic(formatCNICInput(e.target.value))}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-slate-200"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">Residential Address</label>
                <input
                  type="text"
                  placeholder="Street / City"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200"
                />
              </div>
            </div>

            {/* Photo Uploads */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <label className="flex flex-col items-center justify-center h-24 border-2 border-dashed border-slate-700 hover:border-slate-500 rounded-lg cursor-pointer bg-slate-800/40 text-center p-2">
                <User className="w-5 h-5 text-slate-400 mb-1" />
                <span className="text-[11px] text-slate-300 font-medium">Customer Photo</span>
                {photoBlob && <span className="text-emerald-400 text-[10px]">Loaded ✓</span>}
                <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, setPhotoBlob)} />
              </label>

              <label className="flex flex-col items-center justify-center h-24 border-2 border-dashed border-slate-700 hover:border-slate-500 rounded-lg cursor-pointer bg-slate-800/40 text-center p-2">
                <Shield className="w-5 h-5 text-amber-400 mb-1" />
                <span className="text-[11px] text-slate-300 font-medium">CNIC Front</span>
                {cnicFront && <span className="text-emerald-400 text-[10px]">Loaded ✓</span>}
                <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, setCnicFront)} />
              </label>

              <label className="flex flex-col items-center justify-center h-24 border-2 border-dashed border-slate-700 hover:border-slate-500 rounded-lg cursor-pointer bg-slate-800/40 text-center p-2">
                <CreditCard className="w-5 h-5 text-amber-400 mb-1" />
                <span className="text-[11px] text-slate-300 font-medium">CNIC Back</span>
                {cnicBack && <span className="text-emerald-400 text-[10px]">Loaded ✓</span>}
                <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, setCnicBack)} />
              </label>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-lg"
              >
                {isSubmitting ? 'Saving...' : 'Register Customer'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Collect Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <form
            onSubmit={handleCollectPayment}
            className="relative max-w-md w-full bg-slate-900 border border-slate-700 rounded-2xl overflow-hidden shadow-2xl p-6 space-y-4"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h2 className="text-base font-black text-white">Receive Khata / Installment Payment</h2>
                <div className="text-xs text-amber-400 font-bold">{showPaymentModal.name}</div>
              </div>
              <button
                type="button"
                onClick={() => setShowPaymentModal(null)}
                className="text-slate-400 hover:text-white font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              {(() => {
                const bal = calculateCustomerOutstanding(showPaymentModal.id, sales, financeAccounts);
                return (
                  <div className="bg-slate-950/70 p-2.5 rounded-xl border border-slate-800 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Current Outstanding</span>
                      <span className="text-[10px] text-slate-400">
                        Credit: {formatPKR(bal.creditRemaining)} · Inst: {formatPKR(bal.unpaidFin)}
                      </span>
                    </div>
                    <span className="text-sm font-black font-mono text-rose-400">
                      {formatPKR(bal.totalOutstanding)}
                    </span>
                  </div>
                );
              })()}

              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">Payment Amount (PKR) *</label>
                <input
                  type="number"
                  required
                  min="1"
                  placeholder="e.g. 15000"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full bg-slate-800 border border-emerald-500 rounded-lg px-3 py-2 text-sm font-bold text-emerald-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 mb-1">Date</label>
                  <input
                    type="date"
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
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

              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">Payment Notes / Receipt Ref</label>
                <input
                  type="text"
                  placeholder="Installment payment for Honda CD70"
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowPaymentModal(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg"
              >
                {isSubmitting ? 'Recording...' : 'Record Payment & Inflow'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Customer Dossier Modal */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="relative max-w-2xl w-full bg-slate-900 border border-slate-700 rounded-2xl overflow-hidden shadow-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <div className="font-mono text-xs font-bold text-amber-400">{selectedCustomer.id}</div>
                <h2 className="text-lg font-black text-white">{selectedCustomer.name}</h2>
              </div>
              <button
                onClick={() => setSelectedCustomer(null)}
                className="text-slate-400 hover:text-white text-lg font-bold"
              >
                ✕
              </button>
            </div>

            {(() => {
              const { totalOutstanding, creditRemaining, unpaidFin } = calculateCustomerOutstanding(
                selectedCustomer.id,
                sales,
                financeAccounts
              );
              return (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                  <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-700/60">
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Phone Number</span>
                    <span className="font-bold text-slate-200">{selectedCustomer.phone || '—'}</span>
                  </div>
                  <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-700/60">
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">CNIC Number</span>
                    <span className="font-mono font-bold text-amber-300">{selectedCustomer.cnic || '—'}</span>
                  </div>
                  <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-700/60">
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Outstanding Balance</span>
                    <span className={`font-mono font-black ${totalOutstanding > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                      {formatPKR(totalOutstanding)}
                    </span>
                    {(creditRemaining > 0 || unpaidFin > 0) && (
                      <div className="text-[10px] text-slate-400 mt-0.5 flex gap-2">
                        <span>Credit: {formatPKR(creditRemaining)}</span>
                        <span>·</span>
                        <span>Inst: {formatPKR(unpaidFin)}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}

            {/* Sales History */}
            {(() => {
              const custSales = sales.filter((s) => s.customerId === selectedCustomer.id);
              return (
                <div className="space-y-2 text-xs">
                  <div className="font-bold text-slate-200 flex items-center justify-between">
                    <span className="flex items-center gap-1.5"><Receipt className="w-4 h-4 text-emerald-400" /> Bikes Purchased ({custSales.length})</span>
                  </div>
                  {custSales.length > 0 ? (
                    <div className="space-y-1.5">
                      {custSales.map((s) => (
                        <div key={s.id} className="p-2.5 bg-slate-800 rounded-lg flex items-center justify-between">
                          <div>
                            <div className="font-bold text-slate-100">{s.make} {s.model} ({s.bikeId})</div>
                            <div className="text-[10px] text-slate-400 font-mono">
                              Eng: {s.engineNumber} · Date: {s.saleDate} · Type: {isSaleFinanced(s, financeAccounts) ? 'Installment' : (s.saleType || 'Cash')}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-emerald-400">{formatPKR(s.salePrice)}</div>
                            <div className="text-[10px] text-slate-400">
                              {isSaleFinanced(s, financeAccounts) ? (
                                <span className="text-indigo-300 font-bold">Installment Plan</span>
                              ) : (
                                <span>Remaining: {formatPKR(s.remainingBalance)}</span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-slate-500 py-2">No purchases recorded yet.</div>
                  )}
                </div>
              );
            })()}

            {/* Payment History */}
            {(() => {
              const custPayments = payments.filter((p) => p.customerId === selectedCustomer.id);
              return (
                <div className="space-y-2 text-xs">
                  <div className="font-bold text-slate-200 flex items-center justify-between">
                    <span className="flex items-center gap-1.5"><DollarSign className="w-4 h-4 text-amber-400" /> Payment Ledger ({custPayments.length})</span>
                  </div>
                  {custPayments.length > 0 ? (
                    <div className="space-y-1.5 max-h-36 overflow-y-auto">
                      {custPayments.map((p) => (
                        <div key={p.id} className="p-2 bg-slate-800/80 rounded-lg flex items-center justify-between text-xs">
                          <div>
                            <span className="font-mono text-slate-400">{p.date}</span>
                            <span className="text-slate-300 ml-2">{p.notes || p.paymentMethod}</span>
                          </div>
                          <span className="font-bold text-emerald-400 font-mono">{formatPKR(p.amount)}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-slate-500 py-2">No payment transactions recorded yet.</div>
                  )}
                </div>
              );
            })()}

            <div className="flex items-center justify-between pt-3 border-t border-slate-800">
              <div className="flex items-center gap-2">
                {onUpdateCustomer && (
                  <button
                    onClick={() => {
                      const c = selectedCustomer;
                      setSelectedCustomer(null);
                      setEditingCustomer(c);
                    }}
                    className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 border border-amber-500/30 flex items-center gap-1.5"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    Edit Profile
                  </button>
                )}
                <button
                  onClick={() => {
                    const c = selectedCustomer;
                    setSelectedCustomer(null);
                    setShowPaymentModal(c);
                  }}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-1.5"
                >
                  <CreditCard className="w-3.5 h-3.5" />
                  Collect Payment
                </button>
              </div>
              <button
                onClick={() => setSelectedCustomer(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Customer Modal */}
      {editingCustomer && (
        <EditCustomerModal
          customer={editingCustomer}
          onClose={() => setEditingCustomer(null)}
          onSave={async (updated) => {
            if (onUpdateCustomer) {
              await onUpdateCustomer(updated);
            }
            setEditingCustomer(null);
          }}
        />
      )}

    </div>
  );
};

interface EditCustomerModalProps {
  customer: Customer;
  onClose: () => void;
  onSave: (customer: Customer) => Promise<void>;
}

const EditCustomerModal: React.FC<EditCustomerModalProps> = ({
  customer,
  onClose,
  onSave,
}) => {
  const [formData, setFormData] = useState({
    name: customer.name || '',
    fatherName: customer.fatherName || '',
    phone: customer.phone || '',
    cnic: customer.cnic || '',
    address: customer.address || '',
    notes: customer.notes || '',
    photoBlob: customer.photoBlob || '',
    cnicFrontBlob: customer.cnicFrontBlob || '',
    cnicBackBlob: customer.cnicBackBlob || '',
  });
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    field: 'photoBlob' | 'cnicFrontBlob' | 'cnicBackBlob'
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await fileToDataURL(file);
      setFormData((prev) => ({ ...prev, [field]: dataUrl }));
    } catch {
      setError('Failed to read image file');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setError('Customer Name is required');
      return;
    }

    if (formData.cnic && !isValidCNIC(formData.cnic)) {
      setError('Please enter a valid 13-digit Pakistani CNIC (e.g., 35201-1234567-1)');
      return;
    }

    setIsSaving(true);
    setError(null);
    try {
      const updatedCustomer: Customer = {
        ...customer,
        name: formData.name.trim(),
        fatherName: formData.fatherName.trim() || undefined,
        phone: formData.phone.trim(),
        cnic: formData.cnic.trim(),
        address: formData.address.trim(),
        notes: formData.notes.trim() || undefined,
        photoBlob: formData.photoBlob || undefined,
        cnicFrontBlob: formData.cnicFrontBlob || undefined,
        cnicBackBlob: formData.cnicBackBlob || undefined,
      };

      await onSave(updatedCustomer);
    } catch (err: any) {
      setError(err?.message || 'Failed to update customer');
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl my-8">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-950/70 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Edit2 className="w-5 h-5 text-amber-400" />
            <h2 className="text-base font-bold text-white">Edit Customer Profile</h2>
            <span className="text-xs font-mono text-slate-400">({customer.id})</span>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white text-lg font-bold"
          >
            ✕
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {error && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-400 font-semibold mb-1">
                Full Name <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:border-amber-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-400 font-semibold mb-1">
                Father / Husband Name
              </label>
              <input
                type="text"
                value={formData.fatherName}
                onChange={(e) => setFormData({ ...formData, fatherName: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:border-amber-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-400 font-semibold mb-1">
                Phone Number (e.g., 0300-1234567)
              </label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: formatPhoneInput(e.target.value) })
                }
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 font-mono text-slate-100 focus:border-amber-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-400 font-semibold mb-1">
                CNIC Number (13-Digits)
              </label>
              <input
                type="text"
                value={formData.cnic}
                onChange={(e) =>
                  setFormData({ ...formData, cnic: formatCNICInput(e.target.value) })
                }
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 font-mono text-slate-100 focus:border-amber-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-400 font-semibold mb-1">
              Residential / Business Address
            </label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:border-amber-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-slate-400 font-semibold mb-1">
              Internal Showroom Notes
            </label>
            <textarea
              rows={2}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:border-amber-500 focus:outline-none"
              placeholder="e.g. Reliable customer, runs shop in Shah Alam Market..."
            />
          </div>

          {/* Photo & Document Uploads */}
          <div className="pt-2 border-t border-slate-800/80">
            <h4 className="font-bold text-slate-300 mb-2">Customer Documents & Photo</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Profile Photo */}
              <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 space-y-2">
                <span className="text-[11px] font-bold text-slate-400 block">Profile Photo</span>
                {formData.photoBlob ? (
                  <div className="relative group">
                    <img
                      src={formData.photoBlob}
                      alt="Customer"
                      className="w-full h-24 object-cover rounded-lg border border-slate-700"
                    />
                    <button
                      type="button"
                      onClick={() => setFormData((p) => ({ ...p, photoBlob: '' }))}
                      className="absolute top-1 right-1 bg-rose-600 text-white rounded p-1 text-[10px] hover:bg-rose-500"
                      title="Remove"
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <div className="h-24 border border-dashed border-slate-700 rounded-lg flex flex-col items-center justify-center text-slate-500">
                    <User className="w-6 h-6 mb-1 opacity-40" />
                    <span className="text-[10px]">No photo</span>
                  </div>
                )}
                <label className="block text-center py-1.5 px-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg cursor-pointer text-[11px] font-semibold transition">
                  Upload Photo
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleFileUpload(e, 'photoBlob')}
                  />
                </label>
              </div>

              {/* CNIC Front */}
              <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 space-y-2">
                <span className="text-[11px] font-bold text-slate-400 block">CNIC Front</span>
                {formData.cnicFrontBlob ? (
                  <div className="relative group">
                    <img
                      src={formData.cnicFrontBlob}
                      alt="CNIC Front"
                      className="w-full h-24 object-cover rounded-lg border border-slate-700"
                    />
                    <button
                      type="button"
                      onClick={() => setFormData((p) => ({ ...p, cnicFrontBlob: '' }))}
                      className="absolute top-1 right-1 bg-rose-600 text-white rounded p-1 text-[10px] hover:bg-rose-500"
                      title="Remove"
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <div className="h-24 border border-dashed border-slate-700 rounded-lg flex flex-col items-center justify-center text-slate-500">
                    <Shield className="w-6 h-6 mb-1 opacity-40" />
                    <span className="text-[10px]">No CNIC Front</span>
                  </div>
                )}
                <label className="block text-center py-1.5 px-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg cursor-pointer text-[11px] font-semibold transition">
                  Upload Front
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleFileUpload(e, 'cnicFrontBlob')}
                  />
                </label>
              </div>

              {/* CNIC Back */}
              <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 space-y-2">
                <span className="text-[11px] font-bold text-slate-400 block">CNIC Back</span>
                {formData.cnicBackBlob ? (
                  <div className="relative group">
                    <img
                      src={formData.cnicBackBlob}
                      alt="CNIC Back"
                      className="w-full h-24 object-cover rounded-lg border border-slate-700"
                    />
                    <button
                      type="button"
                      onClick={() => setFormData((p) => ({ ...p, cnicBackBlob: '' }))}
                      className="absolute top-1 right-1 bg-rose-600 text-white rounded p-1 text-[10px] hover:bg-rose-500"
                      title="Remove"
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <div className="h-24 border border-dashed border-slate-700 rounded-lg flex flex-col items-center justify-center text-slate-500">
                    <CreditCard className="w-6 h-6 mb-1 opacity-40" />
                    <span className="text-[10px]">No CNIC Back</span>
                  </div>
                )}
                <label className="block text-center py-1.5 px-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg cursor-pointer text-[11px] font-semibold transition">
                  Upload Back
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleFileUpload(e, 'cnicBackBlob')}
                  />
                </label>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="px-4 py-2 rounded-xl font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2 rounded-xl font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 transition flex items-center gap-1.5 shadow-lg shadow-amber-500/20"
            >
              {isSaving ? 'Saving Changes...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
