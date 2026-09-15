/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Building2,
  Search,
  PlusCircle,
  User,
  Shield,
  CreditCard,
  Eye,
  CheckCircle2,
  Bike as BikeIcon,
  ShoppingCart,
  Phone,
  MapPin,
  Edit2,
  AlertCircle,
} from 'lucide-react';
import { Bike, Purchase, Seller } from '../types';
import {
  fileToDataURL,
  formatCNICInput,
  formatPKDateTime,
  formatPKR,
  formatPhoneInput,
  isValidCNIC,
} from '../utils/formatters';

interface SellersViewProps {
  sellers?: Seller[];
  purchases?: Purchase[];
  bikes?: Bike[];
  onAddSeller: (seller: any) => Promise<any>;
  onUpdateSeller?: (seller: Seller) => Promise<any>;
  onViewImage?: (url: string, title: string) => void;
}

export const SellersView: React.FC<SellersViewProps> = ({
  sellers = [],
  purchases = [],
  bikes = [],
  onAddSeller,
  onUpdateSeller,
  onViewImage = (_url: string, _title: string) => {},
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedSeller, setSelectedSeller] = useState<Seller | null>(null);
  const [editingSeller, setEditingSeller] = useState<Seller | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [cnic, setCnic] = useState('');
  const [address, setAddress] = useState('');
  const [photoBlob, setPhotoBlob] = useState('');
  const [cnicFront, setCnicFront] = useState('');
  const [cnicBack, setCnicBack] = useState('');

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

  const handleCreateSeller = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    if (cnic && !isValidCNIC(cnic)) {
      alert('CNIC format should be 13 digits (35202-1234567-1).');
      return;
    }

    setIsSubmitting(true);
    try {
      await onAddSeller({
        name: name.trim(),
        phone: phone.trim(),
        cnic: cnic.trim(),
        address: address.trim(),
        photoBlob,
        cnicFrontBlob: cnicFront,
        cnicBackBlob: cnicBack,
      });
      setMsg('Seller registered successfully in database!');
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
      alert(err.message || 'Failed to add seller.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const bikeMap = new Map<string, Bike>(bikes.map((b) => [b.id, b]));

  const filteredSellers = sellers
    .filter((s) => {
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return (
        s.name.toLowerCase().includes(q) ||
        (s.cnic?.toLowerCase() || '').includes(q) ||
        (s.phone?.toLowerCase() || '').includes(q) ||
        (s.address?.toLowerCase() || '').includes(q) ||
        s.id.toLowerCase().includes(q)
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
            <Building2 className="w-6 h-6 text-amber-400" />
            <span>Sellers & Suppliers Directory</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Registered bike owners & wholesale dealers with verified CNICs, contact info and supply history.
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 transition shadow-lg w-full sm:w-auto"
        >
          <PlusCircle className="w-4 h-4" />
          <span>+ Register Seller</span>
        </button>
      </div>

      {msg && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs text-emerald-400 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{msg}</span>
        </div>
      )}

      {/* Filter and Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative w-full sm:max-w-sm">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search sellers by name, CNIC, phone, address..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-200"
          />
        </div>
        <div className="text-xs text-slate-400 flex items-center justify-between sm:justify-end">
          <span>Total Sellers: <b>{sellers.length}</b></span>
        </div>
      </div>

      {/* Sellers Grid / Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse min-w-[320px]">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/60 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-3 sm:px-4">Seller & ID</th>
                <th className="py-3 px-3 sm:px-4">CNIC & Phone</th>
                <th className="py-3 px-3 sm:px-4 hidden md:table-cell">Address</th>
                <th className="py-3 px-3 sm:px-4 text-center hidden sm:table-cell">Bikes</th>
                <th className="py-3 px-3 sm:px-4 text-right">Purchased Value</th>
                <th className="py-3 px-3 sm:px-4 text-center hidden lg:table-cell">Verified ID</th>
                <th className="py-3 px-3 sm:px-4 text-center">History</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-xs">
              {filteredSellers.length > 0 ? (
                filteredSellers.map((seller) => {
                  const sellerPurchases = purchases.filter((p) => p.sellerId === seller.id);
                  const totalPurchasedValue = sellerPurchases.reduce((s, p) => s + Number(p.purchaseCost || 0), 0);

                  return (
                    <tr key={seller.id} className="hover:bg-slate-800/40 transition">
                      <td className="py-3 px-3 sm:px-4">
                        <div className="font-bold text-slate-100 flex items-center gap-2">
                          <User className="w-4 h-4 text-amber-400 shrink-0" />
                          <span className="truncate max-w-[120px] sm:max-w-none">{seller.name}</span>
                        </div>
                        <div className="text-[10px] font-mono text-slate-500">{seller.id}</div>
                      </td>

                      <td className="py-3 px-3 sm:px-4 font-mono">
                        <div className="text-amber-300">{seller.cnic || 'CNIC: —'}</div>
                        <div className="text-slate-400 text-[11px]">{seller.phone || 'No phone'}</div>
                      </td>

                      <td className="py-3 px-3 sm:px-4 text-slate-300 max-w-xs truncate hidden md:table-cell">
                        {seller.address || '—'}
                      </td>

                      <td className="py-3 px-3 sm:px-4 text-center hidden sm:table-cell">
                        <span className="font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-200">
                          {sellerPurchases.length}
                        </span>
                      </td>

                      <td className="py-3 px-3 sm:px-4 text-right font-mono font-bold text-emerald-400">
                        {formatPKR(totalPurchasedValue)}
                      </td>

                      <td className="py-3 px-3 sm:px-4 text-center hidden lg:table-cell">
                        <div className="flex items-center justify-center gap-1.5">
                          {seller.photoBlob && (
                            <button
                              onClick={() => onViewImage(seller.photoBlob!, `Seller: ${seller.name}`)}
                              className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-blue-400"
                              title="View Seller Photo"
                            >
                              <User className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {seller.cnicFrontBlob && (
                            <button
                              onClick={() => onViewImage(seller.cnicFrontBlob!, `CNIC Front: ${seller.name}`)}
                              className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-amber-400"
                              title="View CNIC Front"
                            >
                              <Shield className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {seller.cnicBackBlob && (
                            <button
                              onClick={() => onViewImage(seller.cnicBackBlob!, `CNIC Back: ${seller.name}`)}
                              className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-amber-400"
                              title="View CNIC Back"
                            >
                              <CreditCard className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {!seller.photoBlob && !seller.cnicFrontBlob && !seller.cnicBackBlob && (
                            <span className="text-[10px] text-slate-500">—</span>
                          )}
                        </div>
                      </td>

                      <td className="py-3 px-3 sm:px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => setSelectedSeller(seller)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-blue-400"
                            title="View Supply History & Details"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          {onUpdateSeller && (
                            <button
                              onClick={() => setEditingSeller(seller)}
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-400"
                              title="Edit Seller Details"
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
                  <td colSpan={7} className="py-8 text-center text-slate-500">
                    No seller records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Seller Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <form
            onSubmit={handleCreateSeller}
            className="relative max-w-2xl w-full bg-slate-900 border border-slate-700 rounded-2xl overflow-hidden shadow-2xl p-6 space-y-4"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h2 className="text-base font-black text-white flex items-center gap-2">
                <Building2 className="w-5 h-5 text-amber-400" />
                <span>Register Seller / Supplier</span>
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
                <label className="block text-[11px] font-bold text-slate-400 mb-1">Seller Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Haji Muhammad Rafiq"
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
                <label className="block text-[11px] font-bold text-slate-400 mb-1">Seller CNIC (13 Digits)</label>
                <input
                  type="text"
                  placeholder="35202-1234567-1"
                  value={cnic}
                  onChange={(e) => setCnic(formatCNICInput(e.target.value))}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-slate-200"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">Address / City</label>
                <input
                  type="text"
                  placeholder="Shop No. / City"
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
                <span className="text-[11px] text-slate-300 font-medium">Seller Photo</span>
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
                className="px-6 py-2.5 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-lg"
              >
                {isSubmitting ? 'Saving...' : 'Register Seller'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Seller History Modal */}
      {selectedSeller && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="relative max-w-2xl w-full bg-slate-900 border border-slate-700 rounded-2xl overflow-hidden shadow-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <div className="font-mono text-xs font-bold text-amber-400">{selectedSeller.id}</div>
                <h2 className="text-lg font-black text-white">{selectedSeller.name}</h2>
              </div>
              <button
                onClick={() => setSelectedSeller(null)}
                className="text-slate-400 hover:text-white text-lg font-bold"
              >
                ✕
              </button>
            </div>

            {/* Purchases from this seller */}
            {(() => {
              const sellerPurchases = purchases.filter((p) => p.sellerId === selectedSeller.id);
              return (
                <div className="space-y-2 text-xs">
                  <div className="font-bold text-slate-200 flex items-center justify-between">
                    <span className="flex items-center gap-1.5"><ShoppingCart className="w-4 h-4 text-amber-400" /> Bikes Purchased From This Seller ({sellerPurchases.length})</span>
                  </div>
                  {sellerPurchases.length > 0 ? (
                    <div className="space-y-2">
                      {sellerPurchases.map((p) => {
                        const bike = bikeMap.get(p.bikeId);
                        return (
                          <div key={p.id} className="p-3 bg-slate-800 rounded-xl flex items-center justify-between">
                            <div>
                              <div className="font-bold text-slate-100">{bike?.make} {bike?.model} ({p.bikeId})</div>
                              <div className="text-[11px] text-slate-400 font-mono">Eng: {bike?.engineNumber} · Chas: {bike?.chassisNumber} · Date: {p.purchaseDate}</div>
                            </div>
                            <div className="text-right">
                              <div className="font-bold text-emerald-400 font-mono">{formatPKR(p.purchaseCost)}</div>
                              <span className="text-[10px] px-2 py-0.5 rounded bg-slate-700 text-slate-300 font-bold">
                                {bike?.status || 'Stock'}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-slate-500 py-2">No purchase records found for this seller.</div>
                  )}
                </div>
              );
            })()}

            <div className="flex items-center justify-between pt-3 border-t border-slate-800">
              <div>
                {onUpdateSeller && (
                  <button
                    onClick={() => {
                      const s = selectedSeller;
                      setSelectedSeller(null);
                      setEditingSeller(s);
                    }}
                    className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 border border-amber-500/30 flex items-center gap-1.5"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    Edit Seller Profile
                  </button>
                )}
              </div>
              <button
                onClick={() => setSelectedSeller(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Seller Modal */}
      {editingSeller && (
        <EditSellerModal
          seller={editingSeller}
          onClose={() => setEditingSeller(null)}
          onSave={async (updated) => {
            if (onUpdateSeller) {
              await onUpdateSeller(updated);
            }
            setEditingSeller(null);
          }}
        />
      )}

    </div>
  );
};

interface EditSellerModalProps {
  seller: Seller;
  onClose: () => void;
  onSave: (seller: Seller) => Promise<void>;
}

const EditSellerModal: React.FC<EditSellerModalProps> = ({
  seller,
  onClose,
  onSave,
}) => {
  const [formData, setFormData] = useState({
    name: seller.name || '',
    phone: seller.phone || '',
    cnic: seller.cnic || '',
    address: seller.address || '',
    photoBlob: seller.photoBlob || '',
    cnicFrontBlob: seller.cnicFrontBlob || '',
    cnicBackBlob: seller.cnicBackBlob || '',
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
      setError('Seller Name is required');
      return;
    }

    if (formData.cnic && !isValidCNIC(formData.cnic)) {
      setError('Please enter a valid 13-digit Pakistani CNIC (e.g., 35201-1234567-1)');
      return;
    }

    setIsSaving(true);
    setError(null);
    try {
      const updatedSeller: Seller = {
        ...seller,
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        cnic: formData.cnic.trim(),
        address: formData.address.trim(),
        photoBlob: formData.photoBlob || undefined,
        cnicFrontBlob: formData.cnicFrontBlob || undefined,
        cnicBackBlob: formData.cnicBackBlob || undefined,
      };

      await onSave(updatedSeller);
    } catch (err: any) {
      setError(err?.message || 'Failed to update seller');
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
            <h2 className="text-base font-bold text-white">Edit Seller / Supplier</h2>
            <span className="text-xs font-mono text-slate-400">({seller.id})</span>
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
                Seller Full Name <span className="text-rose-400">*</span>
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

            <div>
              <label className="block text-slate-400 font-semibold mb-1">
                Address / Market Location
              </label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:border-amber-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Documents & Photo */}
          <div className="pt-2 border-t border-slate-800/80">
            <h4 className="font-bold text-slate-300 mb-2">Seller Identification & Photo</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Photo */}
              <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 space-y-2">
                <span className="text-[11px] font-bold text-slate-400 block">Photo</span>
                {formData.photoBlob ? (
                  <div className="relative group">
                    <img
                      src={formData.photoBlob}
                      alt="Seller"
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
