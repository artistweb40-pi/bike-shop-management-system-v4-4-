/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  PlusCircle,
  Camera,
  FileCheck,
  Search,
  CheckCircle2,
  AlertCircle,
  User,
  Shield,
  CreditCard,
  Printer,
  Bike as BikeIcon,
  DollarSign,
  Calendar,
  Users,
  Eye,
  Edit2,
  Receipt,
  FileText,
} from 'lucide-react';
import {
  Bike,
  BikeDocument,
  BikeExpense,
  Customer,
  PaymentMethod,
  Sale,
  SaleType,
  ShowroomSettings,
} from '../types';
import {
  fileToDataURL,
  formatCNICInput,
  formatPKDateTime,
  formatPKR,
  formatPhoneInput,
  getCurrentDate,
  getCurrentTime,
  isValidCNIC,
} from '../utils/formatters';

interface SalesViewProps {
  sales?: Sale[];
  bikes?: Bike[];
  customers?: Customer[];
  expenses?: BikeExpense[];
  documents?: BikeDocument[];
  settings?: Partial<ShowroomSettings>;
  preselectedBikeId?: string;
  onAddSale: (params: any) => Promise<any>;
  onUpdateSale?: (sale: Sale) => Promise<any>;
  onViewImage?: (url: string, title: string) => void;
  onPrintReceipt?: (sale: Sale) => void;
  onViewReceipt?: (sale: Sale) => void;
}

export const SalesView: React.FC<SalesViewProps> = ({
  sales = [],
  bikes = [],
  customers = [],
  expenses = [],
  documents = [],
  settings = {},
  preselectedBikeId,
  onAddSale,
  onUpdateSale,
  onViewImage = () => {},
  onPrintReceipt,
  onViewReceipt,
}) => {
  const handleReceiptAction = onPrintReceipt || onViewReceipt || (() => {});
  const [showForm, setShowForm] = useState(Boolean(preselectedBikeId));
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [editingSale, setEditingSale] = useState<Sale | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Form State
  const availableBikes = bikes.filter((b) => b.status === 'Available');
  const [selectedBikeId, setSelectedBikeId] = useState(preselectedBikeId || (availableBikes[0]?.id || ''));
  const [saleType, setSaleType] = useState<SaleType>('Cash');
  const [salePrice, setSalePrice] = useState<number | ''>('');
  const [paidAmount, setPaidAmount] = useState<number | ''>('');
  const [saleDate, setSaleDate] = useState(getCurrentDate());
  const [saleTime, setSaleTime] = useState(getCurrentTime());
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Cash');
  const [saleNotes, setSaleNotes] = useState('');

  // Installment Details (if SaleType === 'Installment')
  const [downPayment, setDownPayment] = useState<number | ''>('');
  const [installmentDuration, setInstallmentDuration] = useState<number>(6);
  const [monthlyAmount, setMonthlyAmount] = useState<number | ''>('');
  const [installmentNotes, setInstallmentNotes] = useState('');

  // Customer State
  const [existingCustomerId, setExistingCustomerId] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerCnic, setCustomerCnic] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [customerPhoto, setCustomerPhoto] = useState('');
  const [customerCnicFront, setCustomerCnicFront] = useState('');
  const [customerCnicBack, setCustomerCnicBack] = useState('');

  // Guarantor Details (Crucial for Pakistani Showroom Installment & Credit Sales)
  const [guarantor1Name, setGuarantor1Name] = useState('');
  const [guarantor1Phone, setGuarantor1Phone] = useState('');
  const [guarantor1Cnic, setGuarantor1Cnic] = useState('');
  const [guarantor1Address, setGuarantor1Address] = useState('');
  const [guarantor1Photo, setGuarantor1Photo] = useState('');

  const [guarantor2Name, setGuarantor2Name] = useState('');
  const [guarantor2Phone, setGuarantor2Phone] = useState('');
  const [guarantor2Cnic, setGuarantor2Cnic] = useState('');

  // Update selected bike if props change
  useEffect(() => {
    if (preselectedBikeId) {
      setSelectedBikeId(preselectedBikeId);
      setShowForm(true);
    }
  }, [preselectedBikeId]);

  // Selected Bike Details & Auto Calculated Cost
  const selectedBike = bikes.find((b) => b.id === selectedBikeId);
  const selectedDoc = documents.find((d) => d.bikeId === selectedBikeId);
  const bikeExpensesList = expenses.filter((e) => e.bikeId === selectedBikeId);
  const totalBikeCost = (selectedBike?.purchaseCost || 0) + bikeExpensesList.reduce((s, e) => s + Number(e.amount || 0), 0);

  // Auto calculate profit
  const expectedProfit = salePrice ? Number(salePrice) - totalBikeCost : 0;

  // Auto calculate monthly amount for installments
  useEffect(() => {
    if (saleType === 'Installment' && salePrice && downPayment !== '') {
      const remaining = Number(salePrice) - Number(downPayment || 0);
      if (remaining > 0 && installmentDuration > 0) {
        setMonthlyAmount(Math.ceil(remaining / installmentDuration));
      }
    }
  }, [saleType, salePrice, downPayment, installmentDuration]);

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
        alert('Failed to process image file.');
      }
    }
  };

  const handleSelectExistingCustomer = (cId: string) => {
    setExistingCustomerId(cId);
    const c = customers.find((x) => x.id === cId);
    if (c) {
      setCustomerName(c.name);
      setCustomerPhone(c.phone || '');
      setCustomerCnic(c.cnic || '');
      setCustomerAddress(c.address || '');
      setCustomerPhoto(c.photoBlob || '');
      setCustomerCnicFront(c.cnicFrontBlob || '');
      setCustomerCnicBack(c.cnicBackBlob || '');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!selectedBikeId) {
      setErrorMessage('Please select an available motorcycle to sell.');
      return;
    }
    if (!salePrice || Number(salePrice) <= 0) {
      setErrorMessage('Please enter a valid sale price.');
      return;
    }
    if (!customerName.trim()) {
      setErrorMessage('Customer Name is required.');
      return;
    }
    if (customerCnic && !isValidCNIC(customerCnic)) {
      setErrorMessage('Customer CNIC format should be 13 digits (35202-1234567-1).');
      return;
    }

    const effectivePaid =
      saleType === 'Cash'
        ? Number(paidAmount || salePrice)
        : saleType === 'Installment'
        ? Number(downPayment || 0)
        : Number(paidAmount || 0);

    const effectiveRemaining = Number(salePrice) - effectivePaid;

    setIsSubmitting(true);
    try {
      const res = await onAddSale({
        bikeId: selectedBikeId,
        customer: {
          id: existingCustomerId || undefined,
          name: customerName.trim(),
          phone: customerPhone.trim(),
          cnic: customerCnic.trim(),
          address: customerAddress.trim(),
          photoBlob: customerPhoto,
          cnicFrontBlob: customerCnicFront,
          cnicBackBlob: customerCnicBack,
          guarantor1Name: guarantor1Name.trim(),
          guarantor1Phone: guarantor1Phone.trim(),
          guarantor1Cnic: guarantor1Cnic.trim(),
          guarantor1Address: guarantor1Address.trim(),
          guarantor1PhotoBlob: guarantor1Photo,
          guarantor2Name: guarantor2Name.trim(),
          guarantor2Phone: guarantor2Phone.trim(),
          guarantor2Cnic: guarantor2Cnic.trim(),
        },
        saleType,
        salePrice: Number(salePrice),
        paidAmount: effectivePaid,
        remainingBalance: effectiveRemaining,
        saleDate,
        saleTime,
        paymentMethod,
        notes: saleNotes.trim(),
        installmentPlan:
          saleType === 'Installment'
            ? {
                downPayment: Number(downPayment || 0),
                totalMonths: Number(installmentDuration),
                monthlyInstallment: Number(monthlyAmount || 0),
                notes: installmentNotes.trim(),
              }
            : undefined,
      });

      setSuccessMessage(`Sale completed successfully! Receipt No: ${res.sale.receiptNo} — Profit: ${formatPKR(res.sale.profit)}`);
      setShowForm(false);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to complete sale transaction.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const customerMap = new Map<string, Customer>(customers.map((c) => [c.id, c]));

  const filteredSales = sales
    .filter((s) => {
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      const cust = customerMap.get(s.customerId);
      return (
        s.id.toLowerCase().includes(q) ||
        s.receiptNo.toLowerCase().includes(q) ||
        s.bikeId.toLowerCase().includes(q) ||
        s.engineNumber.toLowerCase().includes(q) ||
        s.chassisNumber.toLowerCase().includes(q) ||
        s.make.toLowerCase().includes(q) ||
        s.model.toLowerCase().includes(q) ||
        (cust?.name.toLowerCase() || '').includes(q) ||
        (cust?.cnic?.toLowerCase() || '').includes(q)
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
            <TrendingUp className="w-6 h-6 text-emerald-400" />
            <span>Motorcycle Sales & Invoicing Module</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Cash, Credit & Installment Deals with automated Profit Calculation, Cashbook Inflow, and Customer CNIC Verification.
          </p>
        </div>
        <button
          onClick={() => {
            setShowForm(!showForm);
            setErrorMessage('');
            setSuccessMessage('');
          }}
          disabled={availableBikes.length === 0 && !showForm}
          className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition shadow-lg w-full sm:w-auto ${
            showForm
              ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
              : availableBikes.length === 0
              ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
              : 'bg-emerald-600 hover:bg-emerald-500 text-white'
          }`}
        >
          {showForm ? '✕ Close Form' : '+ Record New Sale'}
        </button>
      </div>

      {/* Alerts */}
      {successMessage && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs text-emerald-400 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}
      {errorMessage && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-400 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Sales Entry Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h2 className="text-sm font-bold text-slate-100 uppercase tracking-wider flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              <span>Complete Motorcycle Sale & Customer Ledger</span>
            </h2>
            <span className="text-[11px] text-amber-400 font-mono">Date: {saleDate} · Time: {saleTime}</span>
          </div>

          {/* Section 1: Choose Motorcycle */}
          <div className="space-y-3">
            <div className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <BikeIcon className="w-3.5 h-3.5 text-amber-400" />
              <span>1. Select Motorcycle from Available Showroom Stock</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-[11px] font-bold text-slate-400 mb-1">Select Available Bike *</label>
                <select
                  required
                  value={selectedBikeId}
                  onChange={(e) => setSelectedBikeId(e.target.value)}
                  className="w-full bg-slate-800 border border-emerald-500/50 rounded-lg px-3 py-2 text-xs text-slate-200 font-semibold"
                >
                  {availableBikes.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.id} — {b.make} {b.model} ({b.year}, {b.color}) · Eng: {b.engineNumber} · Chas: {b.chassisNumber}
                    </option>
                  ))}
                </select>
              </div>

              {/* Cost Summary Box */}
              {selectedBike && (
                <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700 text-xs space-y-1">
                  <div className="text-slate-400 text-[10px] uppercase font-bold">Auto-Calculated Actual Cost</div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-300">Purchase Cost:</span>
                    <span className="font-mono text-slate-200">{formatPKR(selectedBike.purchaseCost)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-300">Linked Expenses ({bikeExpensesList.length}):</span>
                    <span className="font-mono text-orange-400">{formatPKR(selectedBike.totalExpenses)}</span>
                  </div>
                  <div className="flex items-center justify-between pt-1 border-t border-slate-700 font-bold">
                    <span className="text-emerald-400">Total Actual Cost:</span>
                    <span className="font-mono text-emerald-400">{formatPKR(totalBikeCost)}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Section 2: Sale Type & Price */}
          <div className="space-y-3 pt-3 border-t border-slate-800">
            <div className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
              <span>2. Sale Price, Deal Type & Real Profit</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              
              {/* Sale Type */}
              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">Sale Agreement Type *</label>
                <select
                  value={saleType}
                  onChange={(e) => {
                    const st = e.target.value as SaleType;
                    setSaleType(st);
                    if (st === 'Cash' && salePrice) {
                      setPaidAmount(salePrice);
                    }
                  }}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 font-bold"
                >
                  <option value="Cash">Full Cash Sale</option>
                  <option value="Installment">Installment (Finance / Qist)</option>
                  <option value="Credit">Credit / Khata (Udhar)</option>
                </select>
              </div>

              {/* Agreed Sale Price */}
              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">Agreed Sale Price (PKR) *</label>
                <input
                  type="number"
                  required
                  min="1000"
                  step="500"
                  placeholder="e.g. 145000"
                  value={salePrice}
                  onChange={(e) => {
                    const val = e.target.value === '' ? '' : Number(e.target.value);
                    setSalePrice(val);
                    if (saleType === 'Cash') setPaidAmount(val);
                  }}
                  className="w-full bg-slate-800 border border-emerald-500 rounded-lg px-3 py-2 text-sm font-bold text-emerald-400"
                />
              </div>

              {/* Paid / Downpayment Amount */}
              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">
                  {saleType === 'Installment' ? 'Advance / Down Payment (PKR)' : 'Received Amount (PKR)'}
                </label>
                <input
                  type="number"
                  min="0"
                  placeholder="Amount received today"
                  value={saleType === 'Installment' ? downPayment : paidAmount}
                  onChange={(e) => {
                    const val = e.target.value === '' ? '' : Number(e.target.value);
                    if (saleType === 'Installment') setDownPayment(val);
                    else setPaidAmount(val);
                  }}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm font-bold text-slate-200"
                />
              </div>

              {/* Expected Real Profit (Sale Price - Actual Cost) */}
              <div className="p-3 bg-emerald-950/20 border border-emerald-500/40 rounded-xl">
                <span className="text-[10px] uppercase font-bold text-emerald-300 block">Realized Showroom Profit</span>
                <span className={`text-base font-black font-mono ${expectedProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {formatPKR(expectedProfit)}
                </span>
                <div className="text-[10px] text-slate-400 font-mono mt-0.5">Formula: Price − Actual Cost</div>
              </div>

            </div>

            {/* Installment Plan Sub-Form */}
            {saleType === 'Installment' && (
              <div className="p-4 bg-slate-800/80 border border-indigo-500/40 rounded-xl space-y-3">
                <div className="text-xs font-bold text-indigo-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Installment (Qist) Schedule Configuration</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 mb-1">Plan Duration (Months)</label>
                    <input
                      type="number"
                      min="1"
                      max="36"
                      value={installmentDuration}
                      onChange={(e) => setInstallmentDuration(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 mb-1">Monthly Installment (PKR)</label>
                    <input
                      type="number"
                      value={monthlyAmount}
                      onChange={(e) => setMonthlyAmount(e.target.value === '' ? '' : Number(e.target.value))}
                      className="w-full bg-slate-900 border border-indigo-500/50 rounded-lg px-3 py-1.5 text-xs font-bold text-indigo-300"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 mb-1">Terms & Notes</label>
                    <input
                      type="text"
                      placeholder="e.g. Due 5th of every month"
                      value={installmentNotes}
                      onChange={(e) => setInstallmentNotes(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Section 3: Customer Information */}
          <div className="space-y-3 pt-3 border-t border-slate-800">
            <div className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center justify-between">
              <span className="flex items-center gap-1.5"><User className="w-3.5 h-3.5 text-blue-400" /> 3. Buyer / Customer Information</span>
              {customers.length > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-slate-400">Existing Customer:</span>
                  <select
                    value={existingCustomerId}
                    onChange={(e) => handleSelectExistingCustomer(e.target.value)}
                    className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-[11px] text-slate-200"
                  >
                    <option value="">Select Existing...</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>{c.name} ({c.cnic || c.phone})</option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">Customer Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Tariq Mehmood"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">Customer Mobile Phone</label>
                <input
                  type="text"
                  placeholder="0300-1234567"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(formatPhoneInput(e.target.value))}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">Customer CNIC (13 Digits)</label>
                <input
                  type="text"
                  placeholder="35202-1234567-1"
                  value={customerCnic}
                  onChange={(e) => setCustomerCnic(formatCNICInput(e.target.value))}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-slate-200"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">Customer Address</label>
                <input
                  type="text"
                  placeholder="Street / Tehsil / City"
                  value={customerAddress}
                  onChange={(e) => setCustomerAddress(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200"
                />
              </div>
            </div>

            {/* Customer Photo Uploads */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div className="p-3 bg-slate-800/60 border border-slate-700/60 rounded-xl space-y-2">
                <div className="flex items-center justify-between text-[11px] font-bold text-slate-300">
                  <span className="flex items-center gap-1.5"><Camera className="w-3.5 h-3.5 text-blue-400" /> Customer Picture</span>
                  {customerPhoto && <span className="text-emerald-400 text-[10px]">Uploaded ✓</span>}
                </div>
                {customerPhoto ? (
                  <div className="relative group">
                    <img src={customerPhoto} alt="Customer" className="h-24 w-full object-cover rounded-lg border border-slate-700" />
                    <button
                      type="button"
                      onClick={() => setCustomerPhoto('')}
                      className="absolute top-1 right-1 px-1.5 py-0.5 bg-rose-600 text-[10px] text-white rounded opacity-0 group-hover:opacity-100"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center h-24 border-2 border-dashed border-slate-700 hover:border-slate-500 rounded-lg cursor-pointer bg-slate-900/40">
                    <Camera className="w-5 h-5 text-slate-500 mb-1" />
                    <span className="text-[11px] text-slate-400">Upload Photo</span>
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, setCustomerPhoto)} />
                  </label>
                )}
              </div>

              <div className="p-3 bg-slate-800/60 border border-slate-700/60 rounded-xl space-y-2">
                <div className="flex items-center justify-between text-[11px] font-bold text-slate-300">
                  <span className="flex items-center gap-1.5"><Shield className="w-3.5 h-3.5 text-amber-400" /> CNIC Front</span>
                  {customerCnicFront && <span className="text-emerald-400 text-[10px]">Uploaded ✓</span>}
                </div>
                {customerCnicFront ? (
                  <div className="relative group">
                    <img src={customerCnicFront} alt="CNIC Front" className="h-24 w-full object-cover rounded-lg border border-slate-700" />
                    <button
                      type="button"
                      onClick={() => setCustomerCnicFront('')}
                      className="absolute top-1 right-1 px-1.5 py-0.5 bg-rose-600 text-[10px] text-white rounded opacity-0 group-hover:opacity-100"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center h-24 border-2 border-dashed border-slate-700 hover:border-slate-500 rounded-lg cursor-pointer bg-slate-900/40">
                    <Shield className="w-5 h-5 text-slate-500 mb-1" />
                    <span className="text-[11px] text-slate-400">Upload Front</span>
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, setCustomerCnicFront)} />
                  </label>
                )}
              </div>

              <div className="p-3 bg-slate-800/60 border border-slate-700/60 rounded-xl space-y-2">
                <div className="flex items-center justify-between text-[11px] font-bold text-slate-300">
                  <span className="flex items-center gap-1.5"><CreditCard className="w-3.5 h-3.5 text-amber-400" /> CNIC Back</span>
                  {customerCnicBack && <span className="text-emerald-400 text-[10px]">Uploaded ✓</span>}
                </div>
                {customerCnicBack ? (
                  <div className="relative group">
                    <img src={customerCnicBack} alt="CNIC Back" className="h-24 w-full object-cover rounded-lg border border-slate-700" />
                    <button
                      type="button"
                      onClick={() => setCustomerCnicBack('')}
                      className="absolute top-1 right-1 px-1.5 py-0.5 bg-rose-600 text-[10px] text-white rounded opacity-0 group-hover:opacity-100"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center h-24 border-2 border-dashed border-slate-700 hover:border-slate-500 rounded-lg cursor-pointer bg-slate-900/40">
                    <CreditCard className="w-5 h-5 text-slate-500 mb-1" />
                    <span className="text-[11px] text-slate-400">Upload Back</span>
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, setCustomerCnicBack)} />
                  </label>
                )}
              </div>
            </div>
          </div>

          {/* Section 4: Guarantors (Zameen) for Installment / Credit */}
          {(saleType === 'Installment' || saleType === 'Credit') && (
            <div className="space-y-3 pt-3 border-t border-slate-800">
              <div className="text-xs font-bold text-indigo-300 uppercase tracking-wider flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5" />
                <span>4. Guarantor (ضامن / Zameen) Information</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 mb-1">Guarantor 1 Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Zafar Iqbal"
                    value={guarantor1Name}
                    onChange={(e) => setGuarantor1Name(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 mb-1">Guarantor 1 Phone</label>
                  <input
                    type="text"
                    placeholder="0301-7654321"
                    value={guarantor1Phone}
                    onChange={(e) => setGuarantor1Phone(formatPhoneInput(e.target.value))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 mb-1">Guarantor 1 CNIC</label>
                  <input
                    type="text"
                    placeholder="35201-1234567-1"
                    value={guarantor1Cnic}
                    onChange={(e) => setGuarantor1Cnic(formatCNICInput(e.target.value))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs font-mono text-slate-200"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition shadow-lg flex items-center gap-2"
            >
              <TrendingUp className="w-4 h-4" />
              <span>{isSubmitting ? 'Processing Transaction...' : 'Complete Sale & Issue Receipt'}</span>
            </button>
          </div>
        </form>
      )}

      {/* Sales Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative w-full sm:max-w-sm">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search sales by Receipt No, Bike ID, Engine, Customer..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-200"
          />
        </div>
        <div className="text-xs text-slate-400 flex items-center justify-between sm:justify-end">
          <span>Showing <b>{filteredSales.length}</b> completed sales</span>
        </div>
      </div>

      {/* Sales Register Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse min-w-[320px]">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/60 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-3 sm:px-4">Receipt / ID</th>
                <th className="py-3 px-3 sm:px-4 hidden sm:table-cell">Date & Time</th>
                <th className="py-3 px-3 sm:px-4">Customer</th>
                <th className="py-3 px-3 sm:px-4">Bike Details</th>
                <th className="py-3 px-3 sm:px-4 hidden lg:table-cell">Engine / Chassis</th>
                <th className="py-3 px-3 sm:px-4 text-right">Sale Price</th>
                <th className="py-3 px-3 sm:px-4 text-right hidden xl:table-cell">Actual Cost</th>
                <th className="py-3 px-3 sm:px-4 text-right hidden md:table-cell">Profit</th>
                <th className="py-3 px-3 sm:px-4 hidden sm:table-cell">Type</th>
                <th className="py-3 px-3 sm:px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-xs">
              {filteredSales.length > 0 ? (
                filteredSales.map((sale) => {
                  const cust = customerMap.get(sale.customerId);
                  return (
                    <tr key={sale.id} className="hover:bg-slate-800/40 transition">
                      
                      {/* Receipt & Sale ID */}
                      <td className="py-3 px-3 sm:px-4">
                        <div className="font-mono font-bold text-amber-400">{sale.receiptNo}</div>
                        <div className="text-[10px] font-mono text-slate-500">{sale.id}</div>
                        <div className="sm:hidden text-[10px] text-slate-400 mt-0.5">
                          {sale.saleDate}
                        </div>
                      </td>

                      {/* Date & Time */}
                      <td className="py-3 px-3 sm:px-4 text-slate-300 hidden sm:table-cell">
                        {formatPKDateTime(sale.saleDate, sale.saleTime)}
                      </td>

                      {/* Customer */}
                      <td className="py-3 px-3 sm:px-4">
                        <div className="font-bold text-slate-100">{cust?.name || 'Walk-in'}</div>
                        <div className="text-[11px] text-slate-400 font-mono">
                          {cust?.cnic || 'CNIC: —'}{cust?.phone ? ` · ${cust.phone}` : ''}
                        </div>
                      </td>

                      {/* Bike */}
                      <td className="py-3 px-3 sm:px-4">
                        <div className="font-semibold text-slate-200">{sale.make} {sale.model}</div>
                        <div className="text-[11px] text-slate-400">{sale.bikeId}</div>
                        <div className="lg:hidden text-[10px] text-amber-400/90 font-mono mt-0.5">
                          Eng: {sale.engineNumber}
                        </div>
                        <div className="sm:hidden mt-1">
                          <span
                            className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full border ${
                              sale.saleType === 'Cash'
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                                : sale.saleType === 'Installment'
                                ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30'
                                : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                            }`}
                          >
                            {sale.saleType}
                          </span>
                        </div>
                      </td>

                      {/* Engine / Chassis (lg+) */}
                      <td className="py-3 px-3 sm:px-4 font-mono text-[11px] hidden lg:table-cell">
                        <div className="text-amber-300">Eng: {sale.engineNumber}</div>
                        <div className="text-slate-400">Chas: {sale.chassisNumber}</div>
                      </td>

                      {/* Sale Price */}
                      <td className="py-3 px-3 sm:px-4 text-right font-mono font-bold text-emerald-400">
                        {formatPKR(sale.salePrice)}
                        <div className="md:hidden text-[10px] text-emerald-400/80 font-normal">
                          P: +{formatPKR(sale.profit)}
                        </div>
                      </td>

                      {/* Actual Bike Cost (xl+) */}
                      <td className="py-3 px-3 sm:px-4 text-right font-mono text-slate-400 hidden xl:table-cell">
                        {formatPKR(sale.actualBikeCost)}
                      </td>

                      {/* Real Profit (md+) */}
                      <td className="py-3 px-3 sm:px-4 text-right hidden md:table-cell">
                        <span className={`font-mono font-black ${sale.profit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {formatPKR(sale.profit)}
                        </span>
                      </td>

                      {/* Sale Type (sm+) */}
                      <td className="py-3 px-3 sm:px-4 hidden sm:table-cell">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            sale.saleType === 'Cash'
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                              : sale.saleType === 'Installment'
                              ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30'
                              : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                          }`}
                        >
                          {sale.saleType}
                        </span>
                      </td>

                      {/* Actions: View, Edit, Receipt */}
                      <td className="py-3 px-3 sm:px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => setSelectedSale(sale)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-blue-400 transition"
                            title="View Full Sale Details"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          {onUpdateSale && (
                            <button
                              onClick={() => setEditingSale(sale)}
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-400 transition"
                              title="Edit Sale Record"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button
                            onClick={() => handleReceiptAction(sale)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-400 transition"
                            title="Print / View Pakistani Showroom Sale Receipt & Affidavit"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>

                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-slate-500">
                    No sales recorded yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* View Sale Modal */}
      {selectedSale && (
        <ViewSaleModal
          sale={selectedSale}
          customer={customerMap.get(selectedSale.customerId)}
          bike={bikes.find((b) => b.id === selectedSale.bikeId)}
          onClose={() => setSelectedSale(null)}
          onEdit={() => {
            const s = selectedSale;
            setSelectedSale(null);
            setEditingSale(s);
          }}
          onPrintReceipt={() => {
            handleReceiptAction(selectedSale);
          }}
        />
      )}

      {/* Edit Sale Modal */}
      {editingSale && onUpdateSale && (
        <EditSaleModal
          sale={editingSale}
          customer={customerMap.get(editingSale.customerId)}
          bike={bikes.find((b) => b.id === editingSale.bikeId)}
          onClose={() => setEditingSale(null)}
          onSave={async (updated) => {
            await onUpdateSale(updated);
            setEditingSale(null);
          }}
        />
      )}

    </div>
  );
};

// ==========================================
// VIEW SALE MODAL
// ==========================================
interface ViewSaleModalProps {
  sale: Sale;
  customer?: Customer;
  bike?: Bike;
  onClose: () => void;
  onEdit: () => void;
  onPrintReceipt: () => void;
}

const ViewSaleModal: React.FC<ViewSaleModalProps> = ({
  sale,
  customer,
  bike,
  onClose,
  onEdit,
  onPrintReceipt,
}) => {
  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl my-8">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-950/70 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Receipt className="w-5 h-5 text-amber-400" />
            <h2 className="text-base font-bold text-white">Sale Record Details</h2>
            <span className="text-xs font-mono font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30">
              {sale.receiptNo}
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white text-lg font-bold"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 text-xs">
          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-3">
              <span className="text-slate-400 text-[10px] uppercase font-bold block">Sale Price</span>
              <span className="text-base font-mono font-bold text-emerald-400">
                {formatPKR(sale.salePrice)}
              </span>
            </div>
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-3">
              <span className="text-slate-400 text-[10px] uppercase font-bold block">Actual Bike Cost</span>
              <span className="text-base font-mono font-bold text-slate-300">
                {formatPKR(sale.actualBikeCost)}
              </span>
            </div>
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-3">
              <span className="text-slate-400 text-[10px] uppercase font-bold block">Net Profit</span>
              <span className={`text-base font-mono font-black ${sale.profit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {formatPKR(sale.profit)}
              </span>
            </div>
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-3">
              <span className="text-slate-400 text-[10px] uppercase font-bold block">Remaining Due</span>
              <span className={`text-base font-mono font-bold ${Number(sale.remainingBalance || 0) > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                {formatPKR(sale.remainingBalance || 0)}
              </span>
            </div>
          </div>

          {/* Motorcycle & Customer details side-by-side */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Bike Info */}
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-2.5">
              <div className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-800 pb-2">
                <BikeIcon className="w-4 h-4" /> Motorcycle Information
              </div>
              <div className="space-y-1 text-slate-300">
                <div><span className="text-slate-500">Bike:</span> <b className="text-white">{sale.make} {sale.model}</b></div>
                <div><span className="text-slate-500">Bike ID:</span> <span className="font-mono text-slate-300">{sale.bikeId}</span></div>
                <div><span className="text-slate-500">Engine No:</span> <span className="font-mono text-amber-300">{sale.engineNumber}</span></div>
                <div><span className="text-slate-500">Chassis No:</span> <span className="font-mono text-slate-300">{sale.chassisNumber}</span></div>
                {sale.registrationNumber && (
                  <div><span className="text-slate-500">Reg No:</span> <span className="font-mono text-emerald-400">{sale.registrationNumber}</span></div>
                )}
                {bike?.color && (
                  <div><span className="text-slate-500">Color / Year:</span> <span>{bike.color} · {bike.year}</span></div>
                )}
              </div>
            </div>

            {/* Customer Info */}
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-2.5">
              <div className="text-xs font-bold text-blue-400 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-800 pb-2">
                <User className="w-4 h-4" /> Customer Information
              </div>
              <div className="space-y-1 text-slate-300">
                <div><span className="text-slate-500">Name:</span> <b className="text-white">{customer?.name || 'Walk-in'}</b></div>
                {customer?.fatherName && (
                  <div><span className="text-slate-500">Father's Name:</span> <span>{customer.fatherName}</span></div>
                )}
                <div><span className="text-slate-500">CNIC:</span> <span className="font-mono text-slate-300">{customer?.cnic || '—'}</span></div>
                <div><span className="text-slate-500">Phone:</span> <span className="font-mono text-slate-300">{customer?.phone || '—'}</span></div>
                {customer?.address && (
                  <div><span className="text-slate-500">Address:</span> <span>{customer.address}</span></div>
                )}
              </div>
            </div>
          </div>

          {/* Sale details & Payment metadata */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-2">
            <div className="text-xs font-bold text-slate-300 uppercase tracking-wider border-b border-slate-800 pb-2 flex items-center justify-between">
              <span className="flex items-center gap-1.5"><CreditCard className="w-4 h-4 text-emerald-400" /> Transaction Particulars</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border bg-emerald-500/10 text-emerald-400 border-emerald-500/30">
                {sale.saleType || 'Cash'} Sale
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2 text-slate-300">
              <div>
                <span className="text-slate-500 block text-[10px]">Date & Time</span>
                <span className="font-mono text-slate-200">{formatPKDateTime(sale.saleDate, sale.saleTime)}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">Amount Received</span>
                <span className="font-mono font-bold text-emerald-400">{formatPKR(sale.amountReceived)}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">Payment Mode</span>
                <span className="text-slate-200">{sale.paymentMethod || 'Cash'}</span>
              </div>
              {sale.broker && (
                <div>
                  <span className="text-slate-500 block text-[10px]">Broker / Agent</span>
                  <span className="text-slate-200">{sale.broker}</span>
                </div>
              )}
              {sale.notes && (
                <div className="col-span-2">
                  <span className="text-slate-500 block text-[10px]">Notes / Remarks</span>
                  <span className="text-slate-300">{sale.notes}</span>
                </div>
              )}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-800">
            <button
              onClick={onPrintReceipt}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-amber-400 flex items-center gap-1.5 transition"
            >
              <Printer className="w-4 h-4" /> Print Official Receipt
            </button>
            <div className="flex items-center gap-2">
              <button
                onClick={onEdit}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 flex items-center gap-1.5 transition"
              >
                <Edit2 className="w-3.5 h-3.5" /> Edit Record
              </button>
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// EDIT SALE MODAL
// ==========================================
interface EditSaleModalProps {
  sale: Sale;
  customer?: Customer;
  bike?: Bike;
  onClose: () => void;
  onSave: (updated: Sale) => Promise<void>;
}

const EditSaleModal: React.FC<EditSaleModalProps> = ({
  sale,
  customer,
  bike,
  onClose,
  onSave,
}) => {
  const [salePrice, setSalePrice] = useState(sale.salePrice || 0);
  const [amountReceived, setAmountReceived] = useState(sale.amountReceived || 0);
  const [saleDate, setSaleDate] = useState(sale.saleDate || getCurrentDate());
  const [saleTime, setSaleTime] = useState(sale.saleTime || getCurrentTime());
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(sale.paymentMethod || 'Cash');
  const [broker, setBroker] = useState(sale.broker || '');
  const [notes, setNotes] = useState(sale.notes || '');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Derived live calculations
  const actualCost = sale.actualBikeCost || 0;
  const recalculatedProfit = Number(salePrice) - actualCost;
  const recalculatedBalance = Math.max(0, Number(salePrice) - Number(amountReceived));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (salePrice <= 0) {
      setError('Sale price must be greater than 0 PKR');
      return;
    }
    if (amountReceived < 0) {
      setError('Amount received cannot be negative');
      return;
    }

    setIsSaving(true);
    setError(null);
    try {
      const updated: Sale = {
        ...sale,
        salePrice: Number(salePrice),
        actualBikeCost: actualCost,
        profit: recalculatedProfit,
        amountReceived: Number(amountReceived),
        remainingBalance: recalculatedBalance,
        saleDate,
        saleTime,
        paymentMethod,
        broker: broker.trim() || undefined,
        notes: notes.trim() || undefined,
      };

      await onSave(updated);
    } catch (err: any) {
      setError(err?.message || 'Failed to update sale');
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl my-8">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-950/70 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Edit2 className="w-5 h-5 text-amber-400" />
            <h2 className="text-base font-bold text-white">Edit Sale Record</h2>
            <span className="text-xs font-mono font-bold text-amber-400">({sale.receiptNo})</span>
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

          {/* Reference Info banner */}
          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-slate-400 block text-[10px]">Motorcycle</span>
              <span className="font-bold text-slate-200">{sale.make} {sale.model} ({sale.engineNumber})</span>
            </div>
            <div className="text-right">
              <span className="text-slate-400 block text-[10px]">Buyer</span>
              <span className="font-bold text-slate-200">{customer?.name || 'Customer'}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-400 font-semibold mb-1">
                Sale Price (PKR) <span className="text-rose-400">*</span>
              </label>
              <input
                type="number"
                required
                min={1}
                value={salePrice}
                onChange={(e) => setSalePrice(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 font-mono font-bold text-emerald-400 focus:border-amber-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-400 font-semibold mb-1">
                Amount Received (PKR) <span className="text-rose-400">*</span>
              </label>
              <input
                type="number"
                required
                min={0}
                value={amountReceived}
                onChange={(e) => setAmountReceived(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 font-mono font-bold text-slate-200 focus:border-amber-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-400 font-semibold mb-1">Payment Method</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:border-amber-500 focus:outline-none"
              >
                <option value="Cash">Cash (Showroom Drawer)</option>
                <option value="Bank Transfer">Bank Transfer (Showroom A/C)</option>
                <option value="Cheque">Cheque</option>
                <option value="Credit">Credit (Khata Balance)</option>
                <option value="Finance">Installments / Finance</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-400 font-semibold mb-1">Broker / Commission Agent</label>
              <input
                type="text"
                value={broker}
                onChange={(e) => setBroker(e.target.value)}
                placeholder="Optional broker name"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:border-amber-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-400 font-semibold mb-1">Sale Date</label>
              <input
                type="date"
                required
                value={saleDate}
                onChange={(e) => setSaleDate(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 font-mono text-slate-200 focus:border-amber-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-400 font-semibold mb-1">Sale Time</label>
              <input
                type="text"
                value={saleTime}
                onChange={(e) => setSaleTime(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 font-mono text-slate-200 focus:border-amber-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Real-time Calculation Summary */}
          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 grid grid-cols-2 gap-3 text-center">
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Recalculated Profit</span>
              <span className={`font-mono font-bold text-sm ${recalculatedProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {formatPKR(recalculatedProfit)}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Recalculated Balance</span>
              <span className={`font-mono font-bold text-sm ${recalculatedBalance > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                {formatPKR(recalculatedBalance)}
              </span>
            </div>
          </div>

          <div>
            <label className="block text-slate-400 font-semibold mb-1">Sale Notes / Remarks</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:border-amber-500 focus:outline-none"
              placeholder="e.g. Balance promised by end of month..."
            />
          </div>

          {/* Footer */}
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
