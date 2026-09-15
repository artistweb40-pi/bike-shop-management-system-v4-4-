/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  ShoppingCart,
  PlusCircle,
  Camera,
  FileCheck,
  Search,
  Eye,
  CheckCircle2,
  AlertCircle,
  User,
  Shield,
  CreditCard,
  Building2,
  Bike as BikeIcon,
  Edit2,
  Calendar,
  Receipt,
  FileText,
} from 'lucide-react';
import { Bike, BikeDocument, Purchase, RegistrationStatus, Seller } from '../types';
import {
  BIKE_COLORS,
  BIKE_CONDITIONS,
  PAKISTANI_BIKE_BRANDS,
  REGISTRATION_STATUSES,
  fileToDataURL,
  formatCNICInput,
  formatPKDateTime,
  formatPKR,
  formatPhoneInput,
  getCurrentDate,
  getCurrentTime,
  isValidCNIC,
} from '../utils/formatters';

interface PurchasesViewProps {
  purchases?: Purchase[];
  bikes?: Bike[];
  sellers?: Seller[];
  documents?: BikeDocument[];
  onAddPurchase: (params: any) => Promise<any>;
  onUpdatePurchase?: (purchase: Purchase) => Promise<any>;
  onViewImage?: (url: string, title: string) => void;
  onNavigateToBike?: (bikeId: string) => void;
}

export const PurchasesView: React.FC<PurchasesViewProps> = ({
  purchases = [],
  bikes = [],
  sellers = [],
  documents = [],
  onAddPurchase,
  onUpdatePurchase,
  onViewImage = (_url: string, _title: string) => {},
  onNavigateToBike = (_bikeId: string) => {},
}) => {
  const [showForm, setShowForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPurchase, setSelectedPurchase] = useState<Purchase | null>(null);
  const [editingPurchase, setEditingPurchase] = useState<Purchase | null>(null);

  // Form State
  const [make, setMake] = useState('Honda');
  const [customMake, setCustomMake] = useState('');
  const [model, setModel] = useState('CD 70');
  const [customModel, setCustomModel] = useState('');
  const [year, setYear] = useState(new Date().getFullYear());
  const [color, setColor] = useState('Black');
  const [engineNumber, setEngineNumber] = useState('');
  const [chassisNumber, setChassisNumber] = useState('');
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [purchaseCost, setPurchaseCost] = useState<number | ''>('');
  const [condition, setCondition] = useState(BIKE_CONDITIONS[1]);
  const [purchaseDate, setPurchaseDate] = useState(getCurrentDate());
  const [purchaseTime, setPurchaseTime] = useState(getCurrentTime());
  const [supplier, setSupplier] = useState('');
  const [invoiceNo, setInvoiceNo] = useState('');
  const [purchaseNotes, setPurchaseNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Cash');

  // Seller Details
  const [bikePhoto, setBikePhoto] = useState('');
  const [sellerName, setSellerName] = useState('');
  const [sellerPhone, setSellerPhone] = useState('');
  const [sellerCnic, setSellerCnic] = useState('');
  const [sellerAddress, setSellerAddress] = useState('');
  const [sellerPhoto, setSellerPhoto] = useState('');
  const [cnicFront, setCnicFront] = useState('');
  const [cnicBack, setCnicBack] = useState('');

  // Documentation Details
  const [registrationStatus, setRegistrationStatus] = useState<RegistrationStatus>('Open');
  const [originalFileAvailable, setOriginalFileAvailable] = useState(true);
  const [smartCardAvailable, setSmartCardAvailable] = useState(false);
  const [tokenTaxStatus, setTokenTaxStatus] = useState('Verified');
  const [transferStatus, setTransferStatus] = useState('Open');
  const [saleLetterAvailable, setSaleLetterAvailable] = useState(true);
  const [docNotes, setDocNotes] = useState('Bike is open. Original file available at showroom.');

  const effectiveMake = make === 'Other' ? customMake.trim() || 'Other' : make;
  const modelsForMake = PAKISTANI_BIKE_BRANDS[make] || ['Custom Model'];
  const effectiveModel = model === 'Custom Model' ? customModel.trim() || 'Custom' : model;

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!effectiveMake || !effectiveModel) {
      setErrorMessage('Bike Make and Model are required.');
      return;
    }
    if (!engineNumber.trim()) {
      setErrorMessage('Engine Number is required.');
      return;
    }
    if (!chassisNumber.trim()) {
      setErrorMessage('Chassis Number is required.');
      return;
    }
    if (!purchaseCost || Number(purchaseCost) <= 0) {
      setErrorMessage('Valid Purchase Cost (Rs.) is required.');
      return;
    }
    if (!sellerName.trim()) {
      setErrorMessage('Seller Name is required.');
      return;
    }
    if (sellerCnic && !isValidCNIC(sellerCnic)) {
      setErrorMessage('CNIC format should be 13 digits: 35202-1234567-1');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await onAddPurchase({
        seller: {
          name: sellerName.trim(),
          phone: sellerPhone.trim(),
          cnic: sellerCnic.trim(),
          photoBlob: sellerPhoto,
          cnicFrontBlob: cnicFront,
          cnicBackBlob: cnicBack,
          address: sellerAddress.trim(),
        },
        bike: {
          make: effectiveMake,
          model: effectiveModel,
          year: Number(year),
          color,
          engineNumber: engineNumber.trim().toUpperCase(),
          chassisNumber: chassisNumber.trim().toUpperCase(),
          registrationNumber: registrationNumber.trim().toUpperCase(),
          condition,
          photoBlob: bikePhoto,
          notes: purchaseNotes.trim(),
        },
        purchaseCost: Number(purchaseCost),
        purchaseDate,
        purchaseTime,
        supplier: supplier.trim(),
        invoiceNo: invoiceNo.trim(),
        purchaseNotes: purchaseNotes.trim(),
        paymentMethod,
        documents: {
          registrationStatus,
          registrationNumber: registrationNumber.trim().toUpperCase(),
          originalFileAvailable,
          smartCardAvailable,
          tokenTaxStatus,
          transferStatus,
          saleLetterAvailable,
          docNotes: docNotes.trim(),
        },
      });

      setSuccessMessage(`Purchase recorded successfully! Assigned Bike ID: ${res.bikeId} & Purchase ID: ${res.purchaseId}`);
      // Reset Form
      setEngineNumber('');
      setChassisNumber('');
      setRegistrationNumber('');
      setPurchaseCost('');
      setSellerName('');
      setSellerPhone('');
      setSellerCnic('');
      setSellerAddress('');
      setSellerPhoto('');
      setCnicFront('');
      setCnicBack('');
      setBikePhoto('');
      setSupplier('');
      setInvoiceNo('');
      setPurchaseNotes('');
      setShowForm(false);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to save purchase.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const sellerMap = new Map<string, Seller>(sellers.map((s) => [s.id, s]));
  const bikeMap = new Map<string, Bike>(bikes.map((b) => [b.id, b]));

  const filteredPurchases = purchases
    .filter((p) => {
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      const bike = bikeMap.get(p.bikeId);
      const seller = sellerMap.get(p.sellerId);
      return (
        p.id.toLowerCase().includes(q) ||
        p.bikeId.toLowerCase().includes(q) ||
        (bike?.engineNumber.toLowerCase() || '').includes(q) ||
        (bike?.chassisNumber.toLowerCase() || '').includes(q) ||
        (bike?.make.toLowerCase() || '').includes(q) ||
        (bike?.model.toLowerCase() || '').includes(q) ||
        (seller?.name.toLowerCase() || '').includes(q) ||
        (seller?.cnic.toLowerCase() || '').includes(q) ||
        (seller?.phone.toLowerCase() || '').includes(q)
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
            <ShoppingCart className="w-6 h-6 text-emerald-400" />
            <span>Motorcycle Purchase Module</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Buy motorbikes from sellers/dealers with CNIC verification, timestamping & automatic inventory creation.
          </p>
        </div>
        <button
          id="btn-toggle-purchase-form"
          onClick={() => {
            setShowForm(!showForm);
            setErrorMessage('');
            setSuccessMessage('');
          }}
          className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition shadow-lg w-full sm:w-auto ${
            showForm
              ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
              : 'bg-emerald-600 hover:bg-emerald-500 text-white'
          }`}
        >
          {showForm ? '✕ Close Form' : '+ New Purchase Entry'}
        </button>
      </div>

      {/* Success / Error Messages */}
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

      {/* New Purchase Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h2 className="text-sm font-bold text-slate-100 uppercase tracking-wider flex items-center gap-2">
              <BikeIcon className="w-4 h-4 text-emerald-400" />
              <span>Enter Motorcycle & Seller Purchase Details</span>
            </h2>
            <span className="text-[11px] text-amber-400 font-mono">Date: {purchaseDate} · Time: {purchaseTime}</span>
          </div>

          {/* Section 1: Motorcycle Specifications */}
          <div className="space-y-3">
            <div className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <BikeIcon className="w-3.5 h-3.5 text-amber-400" />
              <span>1. Motorcycle Details</span>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Make */}
              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">Make / Brand *</label>
                <select
                  value={make}
                  onChange={(e) => {
                    setMake(e.target.value);
                    const defaultM = PAKISTANI_BIKE_BRANDS[e.target.value]?.[0] || 'Custom Model';
                    setModel(defaultM);
                  }}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:ring-2 focus:ring-emerald-500/50"
                >
                  {Object.keys(PAKISTANI_BIKE_BRANDS).map((b) => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
                {make === 'Other' && (
                  <input
                    type="text"
                    placeholder="Enter custom make"
                    value={customMake}
                    onChange={(e) => setCustomMake(e.target.value)}
                    className="mt-1.5 w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200"
                  />
                )}
              </div>

              {/* Model */}
              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">Model *</label>
                <select
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:ring-2 focus:ring-emerald-500/50"
                >
                  {modelsForMake.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                  <option value="Custom Model">Other / Custom Model...</option>
                </select>
                {model === 'Custom Model' && (
                  <input
                    type="text"
                    placeholder="Enter custom model"
                    value={customModel}
                    onChange={(e) => setCustomModel(e.target.value)}
                    className="mt-1.5 w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200"
                  />
                )}
              </div>

              {/* Year */}
              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">Manufacturing Year</label>
                <input
                  type="number"
                  min="1990"
                  max="2030"
                  value={year}
                  onChange={(e) => setYear(Number(e.target.value))}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200"
                />
              </div>

              {/* Color */}
              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">Color</label>
                <select
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200"
                >
                  {BIKE_COLORS.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              {/* Engine Number */}
              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">Engine Number * (Must be Unique)</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. CD70-9876543"
                  value={engineNumber}
                  onChange={(e) => setEngineNumber(e.target.value.toUpperCase())}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-amber-300 placeholder-slate-500 uppercase"
                />
              </div>

              {/* Chassis Number */}
              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">Chassis Number * (Must be Unique)</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. CD70-5432109"
                  value={chassisNumber}
                  onChange={(e) => setChassisNumber(e.target.value.toUpperCase())}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-amber-300 placeholder-slate-500 uppercase"
                />
              </div>

              {/* Registration Number */}
              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">Registration No. (if registered)</label>
                <input
                  type="text"
                  placeholder="e.g. LEB-24-1234 or leave blank for Open"
                  value={registrationNumber}
                  onChange={(e) => setRegistrationNumber(e.target.value.toUpperCase())}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 uppercase"
                />
              </div>

              {/* Condition */}
              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">Bike Condition</label>
                <select
                  value={condition}
                  onChange={(e) => setCondition(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200"
                >
                  {BIKE_CONDITIONS.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              {/* Bike Photo Upload */}
              <div className="sm:col-span-2 lg:col-span-4 p-3 bg-slate-800/60 border border-slate-700/60 rounded-xl space-y-2">
                <div className="flex items-center justify-between text-[11px] font-bold text-slate-300">
                  <span className="flex items-center gap-1.5"><Camera className="w-3.5 h-3.5 text-emerald-400" /> Motorcycle Photo / Picture</span>
                  {bikePhoto && <span className="text-emerald-400 text-[10px] font-bold">Picture Attached ✓</span>}
                </div>
                {bikePhoto ? (
                  <div className="relative group flex items-center gap-3">
                    <img src={bikePhoto} alt="Bike" className="h-24 w-40 object-cover rounded-lg border border-slate-700 shadow" />
                    <div className="space-y-1">
                      <div className="text-xs font-bold text-white">Bike Image Attached</div>
                      <div className="text-[10px] text-slate-400">This photo will appear in your Inventory, Sale Receipts, and PDF Backup catalogs.</div>
                      <button
                        type="button"
                        onClick={() => setBikePhoto('')}
                        className="px-2.5 py-1 bg-rose-600/90 hover:bg-rose-500 text-[10px] font-bold text-white rounded transition"
                      >
                        Remove Picture
                      </button>
                    </div>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center py-4 border-2 border-dashed border-slate-700 hover:border-emerald-500/50 rounded-lg cursor-pointer bg-slate-900/40 transition">
                    <Camera className="w-6 h-6 text-emerald-400/80 mb-1" />
                    <span className="text-xs font-bold text-slate-300">Click to Upload Bike Picture</span>
                    <span className="text-[10px] text-slate-500">Supports JPG, PNG, WEBP (Saved locally in IndexedDB)</span>
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, setBikePhoto)} />
                  </label>
                )}
              </div>

            </div>
          </div>

          {/* Section 2: Financial & Purchase Details */}
          <div className="space-y-3 pt-3 border-t border-slate-800">
            <div className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <CreditCard className="w-3.5 h-3.5 text-emerald-400" />
              <span>2. Purchase Financials</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">Purchase Cost (PKR) *</label>
                <input
                  type="number"
                  required
                  min="0"
                  step="100"
                  placeholder="e.g. 120000"
                  value={purchaseCost}
                  onChange={(e) => setPurchaseCost(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full bg-slate-800 border border-emerald-500/50 rounded-lg px-3 py-2 text-sm font-bold text-emerald-400"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">Purchase Date *</label>
                <input
                  type="date"
                  value={purchaseDate}
                  onChange={(e) => setPurchaseDate(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">Purchase Time *</label>
                <input
                  type="time"
                  value={purchaseTime}
                  onChange={(e) => setPurchaseTime(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">Payment Paid Via</label>
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

              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">Supplier / Dealer</label>
                <input
                  type="text"
                  placeholder="e.g. Direct Owner / City Autos"
                  value={supplier}
                  onChange={(e) => setSupplier(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">Invoice / GRN No.</label>
                <input
                  type="text"
                  placeholder="e.g. INV-9042"
                  value={invoiceNo}
                  onChange={(e) => setInvoiceNo(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[11px] font-bold text-slate-400 mb-1">Purchase Notes</label>
                <input
                  type="text"
                  placeholder="Remarks about condition, warranty, seller comments..."
                  value={purchaseNotes}
                  onChange={(e) => setPurchaseNotes(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Seller Details & Verified CNIC */}
          <div className="space-y-3 pt-3 border-t border-slate-800">
            <div className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-blue-400" />
              <span>3. Seller Identification & Photos</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">Seller Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Muhammad Aslam"
                  value={sellerName}
                  onChange={(e) => setSellerName(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">Seller Mobile Number</label>
                <input
                  type="text"
                  placeholder="0300-1234567"
                  value={sellerPhone}
                  onChange={(e) => setSellerPhone(formatPhoneInput(e.target.value))}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">Seller CNIC (13 Digits)</label>
                <input
                  type="text"
                  placeholder="35202-1234567-1"
                  value={sellerCnic}
                  onChange={(e) => setSellerCnic(formatCNICInput(e.target.value))}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-slate-200"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">Seller Address</label>
                <input
                  type="text"
                  placeholder="e.g. Street 4, Lahore"
                  value={sellerAddress}
                  onChange={(e) => setSellerAddress(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200"
                />
              </div>
            </div>

            {/* Photo Uploads for Seller */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              {/* Seller Photo */}
              <div className="p-3 bg-slate-800/60 border border-slate-700/60 rounded-xl space-y-2">
                <div className="flex items-center justify-between text-[11px] font-bold text-slate-300">
                  <span className="flex items-center gap-1.5"><Camera className="w-3.5 h-3.5 text-blue-400" /> Seller Picture</span>
                  {sellerPhoto && <span className="text-emerald-400 text-[10px]">Uploaded ✓</span>}
                </div>
                {sellerPhoto ? (
                  <div className="relative group">
                    <img src={sellerPhoto} alt="Seller" className="h-28 w-full object-cover rounded-lg border border-slate-700" />
                    <button
                      type="button"
                      onClick={() => setSellerPhoto('')}
                      className="absolute top-1 right-1 px-1.5 py-0.5 bg-rose-600/90 text-[10px] text-white rounded opacity-0 group-hover:opacity-100 transition"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center h-28 border-2 border-dashed border-slate-700 hover:border-slate-500 rounded-lg cursor-pointer bg-slate-900/40">
                    <Camera className="w-5 h-5 text-slate-500 mb-1" />
                    <span className="text-[11px] text-slate-400">Upload Seller Photo</span>
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, setSellerPhoto)} />
                  </label>
                )}
              </div>

              {/* CNIC Front */}
              <div className="p-3 bg-slate-800/60 border border-slate-700/60 rounded-xl space-y-2">
                <div className="flex items-center justify-between text-[11px] font-bold text-slate-300">
                  <span className="flex items-center gap-1.5"><Shield className="w-3.5 h-3.5 text-amber-400" /> CNIC Front Picture</span>
                  {cnicFront && <span className="text-emerald-400 text-[10px]">Uploaded ✓</span>}
                </div>
                {cnicFront ? (
                  <div className="relative group">
                    <img src={cnicFront} alt="CNIC Front" className="h-28 w-full object-cover rounded-lg border border-slate-700" />
                    <button
                      type="button"
                      onClick={() => setCnicFront('')}
                      className="absolute top-1 right-1 px-1.5 py-0.5 bg-rose-600/90 text-[10px] text-white rounded opacity-0 group-hover:opacity-100 transition"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center h-28 border-2 border-dashed border-slate-700 hover:border-slate-500 rounded-lg cursor-pointer bg-slate-900/40">
                    <Shield className="w-5 h-5 text-slate-500 mb-1" />
                    <span className="text-[11px] text-slate-400">Upload CNIC Front</span>
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, setCnicFront)} />
                  </label>
                )}
              </div>

              {/* CNIC Back */}
              <div className="p-3 bg-slate-800/60 border border-slate-700/60 rounded-xl space-y-2">
                <div className="flex items-center justify-between text-[11px] font-bold text-slate-300">
                  <span className="flex items-center gap-1.5"><Shield className="w-3.5 h-3.5 text-amber-400" /> CNIC Back Picture</span>
                  {cnicBack && <span className="text-emerald-400 text-[10px]">Uploaded ✓</span>}
                </div>
                {cnicBack ? (
                  <div className="relative group">
                    <img src={cnicBack} alt="CNIC Back" className="h-28 w-full object-cover rounded-lg border border-slate-700" />
                    <button
                      type="button"
                      onClick={() => setCnicBack('')}
                      className="absolute top-1 right-1 px-1.5 py-0.5 bg-rose-600/90 text-[10px] text-white rounded opacity-0 group-hover:opacity-100 transition"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center h-28 border-2 border-dashed border-slate-700 hover:border-slate-500 rounded-lg cursor-pointer bg-slate-900/40">
                    <Shield className="w-5 h-5 text-slate-500 mb-1" />
                    <span className="text-[11px] text-slate-400">Upload CNIC Back</span>
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, setCnicBack)} />
                  </label>
                )}
              </div>
            </div>
          </div>

          {/* Section 4: Initial Documents Status */}
          <div className="space-y-3 pt-3 border-t border-slate-800">
            <div className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <FileCheck className="w-3.5 h-3.5 text-teal-400" />
              <span>4. Documentation & Verification</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">Registration Status *</label>
                <select
                  value={registrationStatus}
                  onChange={(e) => setRegistrationStatus(e.target.value as RegistrationStatus)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200"
                >
                  {REGISTRATION_STATUSES.map((st) => (
                    <option key={st.value} value={st.value}>{st.label}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2 pt-6">
                <input
                  type="checkbox"
                  id="orig-file-check"
                  checked={originalFileAvailable}
                  onChange={(e) => setOriginalFileAvailable(e.target.checked)}
                  className="w-4 h-4 rounded text-emerald-600 bg-slate-800 border-slate-700 focus:ring-emerald-500"
                />
                <label htmlFor="orig-file-check" className="text-xs text-slate-200 font-medium cursor-pointer">
                  Original File Available
                </label>
              </div>

              <div className="flex items-center gap-2 pt-6">
                <input
                  type="checkbox"
                  id="smart-card-check"
                  checked={smartCardAvailable}
                  onChange={(e) => setSmartCardAvailable(e.target.checked)}
                  className="w-4 h-4 rounded text-emerald-600 bg-slate-800 border-slate-700 focus:ring-emerald-500"
                />
                <label htmlFor="smart-card-check" className="text-xs text-slate-200 font-medium cursor-pointer">
                  Smart Card Available
                </label>
              </div>

              <div className="flex items-center gap-2 pt-6">
                <input
                  type="checkbox"
                  id="sale-letter-check"
                  checked={saleLetterAvailable}
                  onChange={(e) => setSaleLetterAvailable(e.target.checked)}
                  className="w-4 h-4 rounded text-emerald-600 bg-slate-800 border-slate-700 focus:ring-emerald-500"
                />
                <label htmlFor="sale-letter-check" className="text-xs text-slate-200 font-medium cursor-pointer">
                  Sale Letter / Showroom Invoice
                </label>
              </div>

              <div className="sm:col-span-4">
                <label className="block text-[11px] font-bold text-slate-400 mb-1">
                  Documentation Notes (Permanent Record)
                </label>
                <textarea
                  rows={2}
                  value={docNotes}
                  onChange={(e) => setDocNotes(e.target.value)}
                  placeholder="e.g. Bike is open. Original file available. Seller CNIC verified. Smart card missing."
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200"
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition shadow-lg flex items-center gap-2 disabled:opacity-50"
            >
              {isSubmitting ? 'Saving to Database...' : 'Save Purchase & Add to Inventory'}
            </button>
          </div>
        </form>
      )}

      {/* Filter / Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative w-full sm:max-w-sm">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search purchases by Bike ID, Engine, Chassis, Seller..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-200 placeholder-slate-500"
          />
        </div>
        <div className="text-xs text-slate-400 flex items-center justify-between sm:justify-end">
          <span>Showing <b>{filteredPurchases.length}</b> purchases</span>
        </div>
      </div>

      {/* Purchases Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse min-w-[320px]">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/60 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-3 sm:px-4">Purchase / ID</th>
                <th className="py-3 px-3 sm:px-4 hidden sm:table-cell">Date & Time</th>
                <th className="py-3 px-3 sm:px-4">Bike Details</th>
                <th className="py-3 px-3 sm:px-4 hidden lg:table-cell">Engine / Chassis</th>
                <th className="py-3 px-3 sm:px-4 hidden md:table-cell">Seller & CNIC</th>
                <th className="py-3 px-3 sm:px-4 text-right">Cost</th>
                <th className="py-3 px-3 sm:px-4 hidden sm:table-cell">Status</th>
                <th className="py-3 px-3 sm:px-4 text-center hidden lg:table-cell">Images</th>
                <th className="py-3 px-3 sm:px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-xs">
              {filteredPurchases.length > 0 ? (
                filteredPurchases.map((purchase) => {
                  const bike = bikeMap.get(purchase.bikeId);
                  const seller = sellerMap.get(purchase.sellerId);
                  return (
                    <tr key={purchase.id} className="hover:bg-slate-800/40 transition">
                      
                      {/* Purchase ID & Bike ID */}
                      <td className="py-3 px-3 sm:px-4">
                        <div className="font-mono font-bold text-amber-400">{purchase.id}</div>
                        <button
                          onClick={() => onNavigateToBike(purchase.bikeId)}
                          className="text-[10px] text-emerald-400 hover:underline font-mono"
                        >
                          {purchase.bikeId}
                        </button>
                        <div className="sm:hidden text-[10px] text-slate-400 mt-0.5">
                          {purchase.purchaseDate}
                        </div>
                      </td>

                      {/* Date & Time (Desktop / Tablet) */}
                      <td className="py-3 px-3 sm:px-4 text-slate-300 hidden sm:table-cell">
                        {formatPKDateTime(purchase.purchaseDate, purchase.purchaseTime)}
                      </td>

                      {/* Bike Details */}
                      <td className="py-3 px-3 sm:px-4">
                        <div className="font-bold text-slate-100">{bike?.make} {bike?.model}</div>
                        <div className="text-[11px] text-slate-400">{bike?.year} · {bike?.color}</div>
                        {/* Mobile supplementary details when lg/md columns hidden */}
                        <div className="lg:hidden text-[10px] text-amber-400/90 font-mono mt-0.5">
                          Eng: {bike?.engineNumber || '—'}
                        </div>
                        <div className="md:hidden text-[10px] text-slate-400 truncate max-w-[140px]">
                          By: {seller?.name || 'Seller'}
                        </div>
                      </td>

                      {/* Engine & Chassis (lg+) */}
                      <td className="py-3 px-3 sm:px-4 font-mono text-[11px] hidden lg:table-cell">
                        <div className="text-slate-200">Eng: <code>{bike?.engineNumber}</code></div>
                        <div className="text-slate-400">Chas: <code>{bike?.chassisNumber}</code></div>
                      </td>

                      {/* Seller (md+) */}
                      <td className="py-3 px-3 sm:px-4 hidden md:table-cell">
                        <div className="font-semibold text-slate-200">{seller?.name || 'Seller'}</div>
                        <div className="text-[11px] text-slate-400 font-mono">
                          {seller?.cnic || 'CNIC: —'}{seller?.phone ? ` · ${seller.phone}` : ''}
                        </div>
                      </td>

                      {/* Cost */}
                      <td className="py-3 px-3 sm:px-4 text-right">
                        <div className="font-black text-emerald-400">{formatPKR(purchase.purchaseCost)}</div>
                        <div className="sm:hidden mt-0.5">
                          <span
                            className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full border ${
                              bike?.status === 'Available'
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                                : 'bg-slate-700/60 text-slate-300 border-slate-600'
                            }`}
                          >
                            {bike?.status || 'Stock'}
                          </span>
                        </div>
                      </td>

                      {/* Inventory Status (sm+) */}
                      <td className="py-3 px-3 sm:px-4 hidden sm:table-cell">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            bike?.status === 'Available'
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                              : 'bg-slate-700/60 text-slate-300 border-slate-600'
                          }`}
                        >
                          {bike?.status || 'Unknown'}
                        </span>
                      </td>

                      {/* Images (lg+) */}
                      <td className="py-3 px-3 sm:px-4 text-center hidden lg:table-cell">
                        <div className="flex items-center justify-center gap-1.5">
                          {seller?.photoBlob && (
                            <button
                              onClick={() => onViewImage(seller.photoBlob!, `Seller: ${seller.name}`)}
                              className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-blue-400"
                              title="View Seller Photo"
                            >
                              <User className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {seller?.cnicFrontBlob && (
                            <button
                              onClick={() => onViewImage(seller.cnicFrontBlob!, `CNIC Front: ${seller.name}`)}
                              className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-amber-400"
                              title="View CNIC Front"
                            >
                              <Shield className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {seller?.cnicBackBlob && (
                            <button
                              onClick={() => onViewImage(seller.cnicBackBlob!, `CNIC Back: ${seller.name}`)}
                              className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-amber-400"
                              title="View CNIC Back"
                            >
                              <CreditCard className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {!seller?.photoBlob && !seller?.cnicFrontBlob && !seller?.cnicBackBlob && (
                            <span className="text-[10px] text-slate-500">—</span>
                          )}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-3 sm:px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => setSelectedPurchase(purchase)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-blue-400"
                            title="View Complete Purchase Details"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          {onUpdatePurchase && (
                            <button
                              onClick={() => setEditingPurchase(purchase)}
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-400"
                              title="Edit Purchase Record"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>

                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-500">
                    No purchase records match your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* View Purchase Modal */}
      {selectedPurchase && (
        <ViewPurchaseModal
          purchase={selectedPurchase}
          bike={bikeMap.get(selectedPurchase.bikeId)}
          seller={sellerMap.get(selectedPurchase.sellerId)}
          onClose={() => setSelectedPurchase(null)}
          onEdit={() => {
            const p = selectedPurchase;
            setSelectedPurchase(null);
            setEditingPurchase(p);
          }}
          onViewImage={onViewImage}
        />
      )}

      {/* Edit Purchase Modal */}
      {editingPurchase && (
        <EditPurchaseModal
          purchase={editingPurchase}
          bike={bikeMap.get(editingPurchase.bikeId)}
          seller={sellerMap.get(editingPurchase.sellerId)}
          onClose={() => setEditingPurchase(null)}
          onSave={async (updated) => {
            if (onUpdatePurchase) {
              await onUpdatePurchase(updated);
            }
            setEditingPurchase(null);
          }}
        />
      )}

    </div>
  );
};

interface ViewPurchaseModalProps {
  purchase: Purchase;
  bike?: Bike;
  seller?: Seller;
  onClose: () => void;
  onEdit: () => void;
  onViewImage: (url: string, title: string) => void;
}

const ViewPurchaseModal: React.FC<ViewPurchaseModalProps> = ({
  purchase,
  bike,
  seller,
  onClose,
  onEdit,
  onViewImage,
}) => {
  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl my-8">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-950/70 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Receipt className="w-5 h-5 text-amber-400" />
            <h2 className="text-base font-bold text-white">Purchase Voucher & Record</h2>
            <span className="text-xs font-mono text-amber-400 font-bold">({purchase.id})</span>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white text-lg font-bold"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 text-xs">
          {/* Key Summary Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-700/60">
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Purchase Cost</span>
              <span className="font-mono font-black text-emerald-400 text-sm">{formatPKR(purchase.purchaseCost)}</span>
            </div>
            <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-700/60">
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Payment Method</span>
              <span className="font-bold text-slate-200">{purchase.paymentMethod}</span>
            </div>
            <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-700/60">
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Purchase Date</span>
              <span className="font-mono text-slate-200">{purchase.purchaseDate}</span>
            </div>
            <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-700/60">
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Stock Status</span>
              <span className="font-bold text-emerald-400">{bike?.status || 'Available'}</span>
            </div>
          </div>

          {/* Bike Info */}
          <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-200 flex items-center gap-1.5">
                <BikeIcon className="w-4 h-4 text-emerald-400" />
                Bike Details ({purchase.bikeId})
              </span>
              <span className="text-[11px] text-slate-400 font-mono">Invoice #{purchase.invoiceNumber || purchase.id}</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-slate-300">
              <div><span className="text-slate-500">Make & Model:</span> <b>{bike?.make} {bike?.model}</b></div>
              <div><span className="text-slate-500">Year / Color:</span> <b>{bike?.year} · {bike?.color}</b></div>
              <div><span className="text-slate-500">Condition:</span> <b>{bike?.condition}</b></div>
              <div className="font-mono"><span className="text-slate-500">Engine No:</span> <b className="text-slate-200">{bike?.engineNumber}</b></div>
              <div className="font-mono"><span className="text-slate-500">Chassis No:</span> <b className="text-slate-200">{bike?.chassisNumber}</b></div>
              <div className="font-mono"><span className="text-slate-500">Registration:</span> <b className="text-slate-200">{bike?.registrationNumber || 'Unregistered'}</b></div>
            </div>
          </div>

          {/* Seller Info */}
          <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800 space-y-2">
            <span className="font-bold text-slate-200 flex items-center gap-1.5">
              <User className="w-4 h-4 text-blue-400" />
              Seller Information
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-slate-300">
              <div><span className="text-slate-500">Name:</span> <b className="text-slate-100">{seller?.name || '—'}</b></div>
              <div className="font-mono"><span className="text-slate-500">Phone:</span> <b>{seller?.phone || '—'}</b></div>
              <div className="font-mono"><span className="text-slate-500">CNIC:</span> <b className="text-amber-300">{seller?.cnic || '—'}</b></div>
              <div className="col-span-2 sm:col-span-3"><span className="text-slate-500">Address:</span> {seller?.address || '—'}</div>
            </div>

            {/* Seller Documents */}
            {(seller?.photoBlob || seller?.cnicFrontBlob || seller?.cnicBackBlob) && (
              <div className="pt-2 flex items-center gap-2">
                <span className="text-[11px] text-slate-400">Attached Documents:</span>
                {seller.photoBlob && (
                  <button
                    onClick={() => onViewImage(seller.photoBlob!, `Seller: ${seller.name}`)}
                    className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-blue-400 flex items-center gap-1 text-[11px]"
                  >
                    <User className="w-3 h-3" /> Photo
                  </button>
                )}
                {seller.cnicFrontBlob && (
                  <button
                    onClick={() => onViewImage(seller.cnicFrontBlob!, `CNIC Front: ${seller.name}`)}
                    className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-amber-400 flex items-center gap-1 text-[11px]"
                  >
                    <Shield className="w-3 h-3" /> CNIC Front
                  </button>
                )}
                {seller.cnicBackBlob && (
                  <button
                    onClick={() => onViewImage(seller.cnicBackBlob!, `CNIC Back: ${seller.name}`)}
                    className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-amber-400 flex items-center gap-1 text-[11px]"
                  >
                    <CreditCard className="w-3 h-3" /> CNIC Back
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Notes */}
          {purchase.notes && (
            <div className="p-3 bg-slate-800/40 rounded-xl border border-slate-700/60">
              <span className="text-slate-400 block text-[10px] uppercase font-bold mb-1">Showroom Purchase Notes</span>
              <p className="text-slate-300 italic">{purchase.notes}</p>
            </div>
          )}

          {/* Footer Actions */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-800">
            <button
              onClick={onEdit}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 border border-amber-500/30 flex items-center gap-1.5"
            >
              <Edit2 className="w-3.5 h-3.5" />
              Edit Purchase
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

interface EditPurchaseModalProps {
  purchase: Purchase;
  bike?: Bike;
  seller?: Seller;
  onClose: () => void;
  onSave: (updated: Purchase) => Promise<void>;
}

const EditPurchaseModal: React.FC<EditPurchaseModalProps> = ({
  purchase,
  bike,
  seller,
  onClose,
  onSave,
}) => {
  const [purchaseCost, setPurchaseCost] = useState(purchase.purchaseCost || 0);
  const [paymentMethod, setPaymentMethod] = useState(purchase.paymentMethod || 'Cash');
  const [purchaseDate, setPurchaseDate] = useState(purchase.purchaseDate || getCurrentDate());
  const [purchaseTime, setPurchaseTime] = useState(purchase.purchaseTime || getCurrentTime());
  const [notes, setNotes] = useState(purchase.notes || '');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (purchaseCost <= 0) {
      setError('Purchase Cost must be greater than 0 PKR');
      return;
    }

    setIsSaving(true);
    setError(null);
    try {
      const updated: Purchase = {
        ...purchase,
        purchaseCost: Number(purchaseCost),
        paymentMethod: paymentMethod as any,
        purchaseDate,
        purchaseTime,
        notes: notes.trim() || undefined,
      };

      await onSave(updated);
    } catch (err: any) {
      setError(err?.message || 'Failed to update purchase');
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
            <h2 className="text-base font-bold text-white">Edit Purchase Record</h2>
            <span className="text-xs font-mono text-slate-400">({purchase.id})</span>
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
              <span className="text-slate-400 block text-[10px]">Bike</span>
              <span className="font-bold text-slate-200">{bike?.make} {bike?.model} ({purchase.bikeId})</span>
            </div>
            <div className="text-right">
              <span className="text-slate-400 block text-[10px]">Seller</span>
              <span className="font-bold text-slate-200">{seller?.name || 'Seller'}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-400 font-semibold mb-1">
                Purchase Cost (PKR) <span className="text-rose-400">*</span>
              </label>
              <input
                type="number"
                required
                min={1}
                value={purchaseCost}
                onChange={(e) => setPurchaseCost(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 font-mono font-bold text-emerald-400 focus:border-amber-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-400 font-semibold mb-1">Payment Method</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:border-amber-500 focus:outline-none"
              >
                <option value="Cash">Cash (Showroom Drawer)</option>
                <option value="Bank Transfer">Bank Transfer (Showroom A/C)</option>
                <option value="Cheque">Cheque</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-400 font-semibold mb-1">Purchase Date</label>
              <input
                type="date"
                required
                value={purchaseDate}
                onChange={(e) => setPurchaseDate(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 font-mono text-slate-200 focus:border-amber-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-400 font-semibold mb-1">Purchase Time</label>
              <input
                type="text"
                value={purchaseTime}
                onChange={(e) => setPurchaseTime(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 font-mono text-slate-200 focus:border-amber-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-400 font-semibold mb-1">Showroom Notes / Remarks</label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:border-amber-500 focus:outline-none"
              placeholder="e.g. Purchased with original book, duplicate key included..."
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
