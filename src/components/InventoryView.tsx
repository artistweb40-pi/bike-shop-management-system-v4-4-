/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Boxes,
  Search,
  Filter,
  Eye,
  PlusCircle,
  TrendingUp,
  Receipt,
  FileCheck,
  CheckCircle2,
  Bike as BikeIcon,
  Tag,
  Shield,
  Layers,
  Camera,
  Image as ImageIcon,
  LayoutGrid,
  List,
  Upload,
  Edit2,
  X,
} from 'lucide-react';
import { Bike, BikeDocument, BikeExpense, BikeStatus, Purchase, Seller } from '../types';
import { formatPKDateTime, formatPKR, formatShortDate, fileToDataURL, PAKISTANI_BIKE_BRANDS } from '../utils/formatters';
import { dbManager } from '../db/indexedDB';

interface InventoryViewProps {
  bikes?: Bike[];
  documents?: BikeDocument[];
  expenses?: BikeExpense[];
  purchases?: Purchase[];
  sellers?: Seller[];
  onOpenAddExpense?: (bikeId: string) => void;
  onInitiateSale?: (bikeId: string) => void;
  onViewImage?: (url: string, title: string) => void;
  onUpdateBikeStatus?: (bikeId: string, status: BikeStatus) => void;
  onUpdateBike?: (bike: Bike) => Promise<void>;
  onNavigateToTab?: (tab: any) => void;
  onRefreshData?: () => void;
}

export const InventoryView: React.FC<InventoryViewProps> = ({
  bikes = [],
  documents = [],
  expenses = [],
  purchases = [],
  sellers = [],
  onOpenAddExpense = (_bikeId: string) => {},
  onInitiateSale = (_bikeId: string) => {},
  onViewImage = (_url: string, _title: string) => {},
  onUpdateBikeStatus = (_bikeId: string, _status: BikeStatus) => {},
  onUpdateBike,
  onNavigateToTab,
  onRefreshData = () => {},
}) => {
  const [statusFilter, setStatusFilter] = useState<string>('Available');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [selectedBike, setSelectedBike] = useState<Bike | null>(null);
  const [editingBike, setEditingBike] = useState<Bike | null>(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  const handlePhotoUploadForBike = async (bikeId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingPhoto(true);
    try {
      const dataUrl = await fileToDataURL(file);
      await dbManager.updateBikePhoto(bikeId, dataUrl);
      if (selectedBike && selectedBike.id === bikeId) {
        setSelectedBike({ ...selectedBike, photoBlob: dataUrl });
      }
      onRefreshData();
    } catch (err: any) {
      alert('Failed to upload bike photo: ' + err.message);
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const docMap = new Map<string, BikeDocument>(documents.map((d) => [d.bikeId, d]));
  const purMap = new Map<string, Purchase>(purchases.map((p) => [p.bikeId, p]));
  const sellerMap = new Map<string, Seller>(sellers.map((s) => [s.id, s]));

  const filteredBikes = bikes
    .filter((b) => {
      if (statusFilter && statusFilter !== 'ALL' && b.status !== statusFilter) {
        return false;
      }
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      const doc = docMap.get(b.id);
      return (
        b.id.toLowerCase().includes(q) ||
        b.make.toLowerCase().includes(q) ||
        b.model.toLowerCase().includes(q) ||
        b.engineNumber.toLowerCase().includes(q) ||
        b.chassisNumber.toLowerCase().includes(q) ||
        (b.registrationNumber?.toLowerCase() || '').includes(q) ||
        (b.color.toLowerCase() || '').includes(q) ||
        (doc?.docNotes.toLowerCase() || '').includes(q)
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
            <Boxes className="w-6 h-6 text-amber-400" />
            <span>Showroom Physical Stock & Inventory</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real physical motorcycles in stock with engine/chassis verification, auto-calculated total cost & documentation.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">
            Total Inventory: <b className="text-slate-100">{bikes.length}</b> (
            <b className="text-emerald-400">{bikes.filter((b) => b.status === 'Available').length} Available</b>)
          </span>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900 border border-slate-800 p-3 rounded-2xl shadow-md">
        
        {/* Status Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {[
            { id: 'ALL', label: 'All Bikes' },
            { id: 'Available', label: 'Available (Stock)' },
            { id: 'Sold', label: 'Sold' },
            { id: 'Reserved', label: 'Reserved' },
            { id: 'Returned', label: 'Returned' },
            { id: 'Archived', label: 'Archived' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                statusFilter === tab.id
                  ? 'bg-amber-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search & View Mode */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by Bike ID, Engine, Chassis, Make..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-4 py-1.5 text-xs text-slate-200 placeholder-slate-500"
            />
          </div>

          <div className="flex items-center bg-slate-800 border border-slate-700 rounded-xl p-0.5">
            <button
              onClick={() => setViewMode('table')}
              title="Table View"
              className={`p-1.5 rounded-lg transition ${
                viewMode === 'table' ? 'bg-amber-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('cards')}
              title="Showroom Gallery Cards"
              className={`p-1.5 rounded-lg transition ${
                viewMode === 'cards' ? 'bg-amber-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>
        </div>

      </div>

      {/* View Mode 1: Table View */}
      {viewMode === 'table' ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse min-w-[320px]">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/60 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-2 sm:px-3">Photo</th>
                  <th className="py-3 px-3 sm:px-4">Bike ID</th>
                  <th className="py-3 px-3 sm:px-4">Make & Model</th>
                  <th className="py-3 px-3 sm:px-4 hidden md:table-cell">Specs & Color</th>
                  <th className="py-3 px-3 sm:px-4 hidden lg:table-cell">Engine Number</th>
                  <th className="py-3 px-3 sm:px-4 hidden xl:table-cell">Chassis Number</th>
                  <th className="py-3 px-3 sm:px-4 hidden lg:table-cell">Registration</th>
                  <th className="py-3 px-3 sm:px-4 hidden md:table-cell">Papers Status</th>
                  <th className="py-3 px-3 sm:px-4 text-right hidden lg:table-cell">Purchase</th>
                  <th className="py-3 px-3 sm:px-4 text-right hidden xl:table-cell">Expenses</th>
                  <th className="py-3 px-3 sm:px-4 text-right">Total Cost</th>
                  <th className="py-3 px-3 sm:px-4 hidden sm:table-cell">Status</th>
                  <th className="py-3 px-3 sm:px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-xs">
                {filteredBikes.length > 0 ? (
                  filteredBikes.map((bike) => {
                    const doc = docMap.get(bike.id);
                    const linkedExpenses = expenses.filter((e) => e.bikeId === bike.id);
                    const expTotal = linkedExpenses.reduce((s, e) => s + Number(e.amount || 0), 0);
                    const calculatedTotalCost = Number(bike.purchaseCost || 0) + expTotal;

                    return (
                      <tr key={bike.id} className="hover:bg-slate-800/40 transition">
                        
                        {/* Bike Photo Thumbnail */}
                        <td className="py-2.5 px-2 sm:px-3">
                          {bike.photoBlob ? (
                            <img
                              src={bike.photoBlob}
                              alt={`${bike.make} ${bike.model}`}
                              onClick={() => onViewImage(bike.photoBlob!, `${bike.make} ${bike.model} (${bike.id})`)}
                              className="w-10 h-8 sm:w-12 sm:h-10 object-cover rounded-lg border border-slate-700 cursor-pointer hover:scale-105 transition shadow"
                              title="Click to view full photo"
                            />
                          ) : (
                            <label
                              title="Click to attach photo"
                              className="w-10 h-8 sm:w-12 sm:h-10 rounded-lg border border-dashed border-slate-700 hover:border-amber-400/60 bg-slate-800/60 flex flex-col items-center justify-center cursor-pointer text-slate-500 hover:text-amber-400 transition"
                            >
                              <Camera className="w-3.5 h-3.5" />
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => handlePhotoUploadForBike(bike.id, e)}
                              />
                            </label>
                          )}
                        </td>

                        {/* Bike ID */}
                        <td className="py-3 px-3 sm:px-4">
                          <span className="font-mono font-bold text-amber-400">{bike.id}</span>
                          <div className="text-[10px] text-slate-500">{formatShortDate(bike.createdAt)}</div>
                        </td>

                        {/* Make & Model */}
                        <td className="py-3 px-3 sm:px-4">
                          <div className="font-extrabold text-slate-100">{bike.make} {bike.model}</div>
                          <div className="text-[11px] text-slate-400">{bike.condition}</div>
                          <div className="md:hidden text-[10px] text-slate-400">
                            {bike.year} · {bike.color}
                          </div>
                          <div className="lg:hidden text-[10px] text-amber-400/90 font-mono">
                            Eng: {bike.engineNumber}
                          </div>
                          <div className="sm:hidden mt-1">
                            <span
                              className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full border ${
                                bike.status === 'Available'
                                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                                  : bike.status === 'Sold'
                                  ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                                  : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                              }`}
                            >
                              {bike.status}
                            </span>
                          </div>
                        </td>

                        {/* Specs (md+) */}
                        <td className="py-3 px-3 sm:px-4 text-slate-300 hidden md:table-cell">
                          <div>{bike.year} · {bike.color}</div>
                        </td>

                        {/* Engine (lg+) */}
                        <td className="py-3 px-3 sm:px-4 font-mono text-[11px] text-amber-300 hidden lg:table-cell">
                          <code>{bike.engineNumber}</code>
                        </td>

                        {/* Chassis (xl+) */}
                        <td className="py-3 px-3 sm:px-4 font-mono text-[11px] text-slate-300 hidden xl:table-cell">
                          <code>{bike.chassisNumber}</code>
                        </td>

                        {/* Registration (lg+) */}
                        <td className="py-3 px-3 sm:px-4 hidden lg:table-cell">
                          {bike.registrationNumber ? (
                            <span className="font-bold text-slate-200">{bike.registrationNumber}</span>
                          ) : (
                            <span className="text-[11px] text-emerald-400 font-semibold">Open Letter</span>
                          )}
                        </td>

                        {/* Documentation Status (md+) */}
                        <td className="py-3 px-3 sm:px-4 hidden md:table-cell">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                              doc?.registrationStatus === 'Open'
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                                : 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                            }`}
                          >
                            {doc?.registrationStatus || 'Open'}
                          </span>
                          {doc?.originalFileAvailable && (
                            <div className="text-[10px] text-teal-400 mt-0.5 font-medium">File in Hand ✓</div>
                          )}
                        </td>

                        {/* Purchase Cost (lg+) */}
                        <td className="py-3 px-3 sm:px-4 text-right text-slate-300 font-mono hidden lg:table-cell">
                          {formatPKR(bike.purchaseCost)}
                        </td>

                        {/* Expenses (xl+) */}
                        <td className="py-3 px-3 sm:px-4 text-right hidden xl:table-cell">
                          <button
                            onClick={() => onOpenAddExpense(bike.id)}
                            className="font-mono text-orange-400 hover:underline font-bold"
                            title="Click to add/view expenses"
                          >
                            {formatPKR(expTotal)}
                          </button>
                        </td>

                        {/* Total Cost (Formula: Purchase + Expenses) */}
                        <td className="py-3 px-3 sm:px-4 text-right">
                          <span className="font-black text-emerald-400 font-mono text-xs sm:text-sm">
                            {formatPKR(calculatedTotalCost)}
                          </span>
                        </td>

                        {/* Status (sm+) */}
                        <td className="py-3 px-3 sm:px-4 hidden sm:table-cell">
                          <select
                            value={bike.status}
                            onChange={(e) => onUpdateBikeStatus(bike.id, e.target.value as BikeStatus)}
                            disabled={bike.status === 'Sold'}
                            className={`text-[11px] font-bold px-2 py-1 rounded-lg border bg-slate-800 transition ${
                              bike.status === 'Available'
                                ? 'text-emerald-400 border-emerald-500/40'
                                : bike.status === 'Sold'
                                ? 'text-rose-400 border-rose-500/40 cursor-not-allowed opacity-90'
                                : 'text-amber-400 border-amber-500/40'
                            }`}
                          >
                            <option value="Available">Available</option>
                            <option value="Reserved">Reserved</option>
                            <option value="Sold">Sold</option>
                            <option value="Returned">Returned</option>
                            <option value="Archived">Archived</option>
                          </select>
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-3 sm:px-4 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            {/* Details Modal */}
                            <button
                              onClick={() => setSelectedBike(bike)}
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                              title="View Full Bike Dossier"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>

                            {/* Edit Bike */}
                            <button
                              onClick={() => setEditingBike(bike)}
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-400 transition"
                              title="Edit Motorcycle Specs"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>

                            {/* Add Expense */}
                            <button
                              onClick={() => onOpenAddExpense(bike.id)}
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-orange-400 transition"
                              title="Add Bike Expense (Repair, Parts, Tuning)"
                            >
                              <Receipt className="w-3.5 h-3.5" />
                            </button>

                            {/* Sell Bike Button */}
                            {bike.status === 'Available' && (
                              <button
                                onClick={() => onInitiateSale(bike.id)}
                                className="px-2 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] transition shadow"
                                title="Sell this motorcycle"
                              >
                                Sell
                              </button>
                            )}
                          </div>
                        </td>

                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={13} className="py-10 text-center text-slate-500">
                      No motorcycles found matching current filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* View Mode 2: Showroom Gallery Cards */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filteredBikes.length > 0 ? (
            filteredBikes.map((bike) => {
              const doc = docMap.get(bike.id);
              const linkedExpenses = expenses.filter((e) => e.bikeId === bike.id);
              const expTotal = linkedExpenses.reduce((s, e) => s + Number(e.amount || 0), 0);
              const calculatedTotalCost = Number(bike.purchaseCost || 0) + expTotal;

              return (
                <div
                  key={bike.id}
                  className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl overflow-hidden shadow-xl flex flex-col justify-between transition group"
                >
                  {/* Card Image Banner */}
                  <div className="relative h-44 bg-slate-950 flex items-center justify-center overflow-hidden border-b border-slate-800">
                    {bike.photoBlob ? (
                      <img
                        src={bike.photoBlob}
                        alt={`${bike.make} ${bike.model}`}
                        onClick={() => onViewImage(bike.photoBlob!, `${bike.make} ${bike.model} (${bike.id})`)}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-300 cursor-pointer"
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center text-slate-600 space-y-2 p-4 text-center">
                        <BikeIcon className="w-12 h-12 stroke-[1.5]" />
                        <label className="text-[11px] font-bold text-amber-400/90 hover:text-amber-300 cursor-pointer flex items-center gap-1">
                          <Camera className="w-3.5 h-3.5" />
                          <span>Attach Photo</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => handlePhotoUploadForBike(bike.id, e)}
                          />
                        </label>
                      </div>
                    )}

                    {/* Status Badge */}
                    <div className="absolute top-2.5 right-2.5">
                      <span
                        className={`text-[10px] font-black px-2.5 py-1 rounded-lg border backdrop-blur-md shadow-md ${
                          bike.status === 'Available'
                            ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/50'
                            : bike.status === 'Sold'
                            ? 'bg-rose-950/80 text-rose-300 border-rose-500/50'
                            : 'bg-amber-950/80 text-amber-300 border-amber-500/50'
                        }`}
                      >
                        {bike.status}
                      </span>
                    </div>

                    {/* Bike ID Badge */}
                    <div className="absolute bottom-2 left-2 bg-slate-950/80 backdrop-blur-md px-2 py-0.5 rounded text-[10px] font-mono font-bold text-amber-400 border border-slate-800">
                      {bike.id}
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-extrabold text-white">{bike.make} {bike.model}</h3>
                        <span className="text-xs text-slate-400 font-semibold">{bike.year}</span>
                      </div>

                      <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-1">
                        <span>Color: <b className="text-slate-200">{bike.color}</b></span>
                        <span>•</span>
                        <span>{bike.registrationNumber || 'Open Letter'}</span>
                      </div>

                      <div className="mt-2.5 grid grid-cols-2 gap-1.5 text-[10px] font-mono bg-slate-950/60 p-2 rounded-xl border border-slate-800/80">
                        <div>
                          <span className="text-slate-500 block">ENG:</span>
                          <span className="text-amber-300 font-bold truncate block">{bike.engineNumber}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block">CHS:</span>
                          <span className="text-slate-300 font-bold truncate block">{bike.chassisNumber}</span>
                        </div>
                      </div>
                    </div>

                    {/* Financial Summary */}
                    <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-slate-400 block uppercase font-bold">Total Showroom Cost</span>
                        <span className="text-sm font-black text-emerald-400 font-mono">{formatPKR(calculatedTotalCost)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setSelectedBike(bike)}
                          className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                          title="View Dossier"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setEditingBike(bike)}
                          className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400 transition"
                          title="Edit Specs"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onOpenAddExpense(bike.id)}
                          className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-orange-400 transition"
                          title="Add Expense"
                        >
                          <Receipt className="w-4 h-4" />
                        </button>
                        {bike.status === 'Available' && (
                          <button
                            onClick={() => onInitiateSale(bike.id)}
                            className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black transition shadow"
                          >
                            Sell
                          </button>
                        )}
                      </div>
                    </div>

                  </div>
                </div>
              );
            })
          ) : (
            <div className="col-span-full py-12 text-center text-slate-500">
              No motorcycles found matching current filter.
            </div>
          )}
        </div>
      )}

      {/* Bike Dossier Modal */}
      {selectedBike && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="relative max-w-2xl w-full bg-slate-900 border border-slate-700 rounded-2xl overflow-hidden shadow-2xl p-6 space-y-5 max-h-[90vh] overflow-y-auto">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <div className="font-mono text-xs font-bold text-amber-400">{selectedBike.id}</div>
                <h2 className="text-lg font-black text-white">{selectedBike.make} {selectedBike.model}</h2>
              </div>
              <button
                onClick={() => setSelectedBike(null)}
                className="text-slate-400 hover:text-white text-lg font-bold"
              >
                ✕
              </button>
            </div>

            {/* Modal Bike Photo Section */}
            <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700/80 flex flex-col sm:flex-row items-center gap-4">
              <div className="relative w-full sm:w-48 h-32 bg-slate-950 rounded-lg overflow-hidden flex items-center justify-center border border-slate-700 shrink-0">
                {selectedBike.photoBlob ? (
                  <img
                    src={selectedBike.photoBlob}
                    alt={`${selectedBike.make} ${selectedBike.model}`}
                    onClick={() => onViewImage(selectedBike.photoBlob!, `${selectedBike.make} ${selectedBike.model} (${selectedBike.id})`)}
                    className="w-full h-full object-cover cursor-pointer hover:scale-105 transition"
                    title="Click to zoom picture"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center text-slate-500 text-xs">
                    <ImageIcon className="w-8 h-8 mb-1" />
                    <span>No Picture Attached</span>
                  </div>
                )}
              </div>
              
              <div className="space-y-2 text-xs flex-1">
                <div className="font-bold text-slate-200">Motorcycle Image Record</div>
                <p className="text-[11px] text-slate-400">
                  {selectedBike.photoBlob
                    ? 'Picture stored in offline IndexedDB. Used in Sale Receipts and Backup PDFs.'
                    : 'Attach a photo of this bike to show on stock cards, sales receipts, and PDF archives.'}
                </p>
                <label className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg font-bold text-xs cursor-pointer transition border border-slate-600">
                  <Camera className="w-3.5 h-3.5 text-amber-400" />
                  <span>{selectedBike.photoBlob ? 'Replace Bike Photo' : 'Upload Bike Photo'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    disabled={isUploadingPhoto}
                    onChange={(e) => handlePhotoUploadForBike(selectedBike.id, e)}
                  />
                </label>
              </div>
            </div>

            {/* Quick Specs Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-700/60">
                <span className="text-slate-400 block text-[10px] uppercase">Engine Number</span>
                <code className="font-bold text-amber-300">{selectedBike.engineNumber}</code>
              </div>
              <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-700/60">
                <span className="text-slate-400 block text-[10px] uppercase">Chassis Number</span>
                <code className="font-bold text-slate-200">{selectedBike.chassisNumber}</code>
              </div>
              <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-700/60">
                <span className="text-slate-400 block text-[10px] uppercase">Registration</span>
                <span className="font-bold text-slate-200">{selectedBike.registrationNumber || 'Open Letter'}</span>
              </div>
              <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-700/60">
                <span className="text-slate-400 block text-[10px] uppercase">Initial Purchase Cost</span>
                <span className="font-bold text-slate-200">{formatPKR(selectedBike.purchaseCost)}</span>
              </div>
              <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-700/60">
                <span className="text-slate-400 block text-[10px] uppercase">Linked Expenses</span>
                <span className="font-bold text-orange-400">{formatPKR(selectedBike.totalExpenses)}</span>
              </div>
              <div className="p-3 bg-slate-800/60 rounded-xl border border-emerald-500/40 bg-emerald-950/20">
                <span className="text-emerald-300 block text-[10px] uppercase font-bold">Total Showroom Cost</span>
                <span className="font-black text-emerald-400 text-sm">{formatPKR(selectedBike.totalCost)}</span>
              </div>
            </div>

            {/* Documentation Notes */}
            {(() => {
              const doc = docMap.get(selectedBike.id);
              return (
                <div className="p-4 bg-slate-800/80 rounded-xl border border-slate-700 space-y-2 text-xs">
                  <div className="font-bold text-slate-200 flex items-center justify-between">
                    <span className="flex items-center gap-1.5"><FileCheck className="w-4 h-4 text-teal-400" /> Documentation & File Status</span>
                    <span className="text-teal-300 font-bold">{doc?.registrationStatus || 'Open'}</span>
                  </div>
                  <div className="text-slate-300 text-xs">
                    <b>Documentation Notes:</b> {doc?.docNotes || 'No documentation notes recorded.'}
                  </div>
                  <div className="flex items-center gap-4 text-[11px] text-slate-400 pt-1">
                    <span>Original File: <b>{doc?.originalFileAvailable ? 'Yes ✓' : 'No ✗'}</b></span>
                    <span>Smart Card: <b>{doc?.smartCardAvailable ? 'Yes ✓' : 'No ✗'}</b></span>
                    <span>Sale Letter: <b>{doc?.saleLetterAvailable ? 'Yes ✓' : 'No ✗'}</b></span>
                  </div>
                </div>
              );
            })()}

            {/* Linked Expenses Breakdown */}
            {(() => {
              const linked = expenses.filter((e) => e.bikeId === selectedBike.id);
              return (
                <div className="space-y-2 text-xs">
                  <div className="font-bold text-slate-200 flex items-center justify-between">
                    <span className="flex items-center gap-1.5"><Receipt className="w-4 h-4 text-orange-400" /> Expense Breakdown ({linked.length})</span>
                    <button
                      onClick={() => {
                        setSelectedBike(null);
                        onOpenAddExpense(selectedBike.id);
                      }}
                      className="text-xs text-amber-400 hover:underline font-bold"
                    >
                      + Add Expense
                    </button>
                  </div>
                  {linked.length > 0 ? (
                    <div className="space-y-1.5 max-h-36 overflow-y-auto">
                      {linked.map((e) => (
                        <div key={e.id} className="p-2 bg-slate-800 rounded-lg flex items-center justify-between text-xs">
                          <div>
                            <span className="font-bold text-slate-200">{e.category}</span>
                            <span className="text-slate-400 ml-2">{e.description}</span>
                          </div>
                          <span className="font-bold text-orange-400 font-mono">{formatPKR(e.amount)}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-slate-500 text-center py-2">No expenses attached to this bike yet.</div>
                  )}
                </div>
              );
            })()}

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                onClick={() => {
                  const b = selectedBike;
                  setSelectedBike(null);
                  setEditingBike(b);
                }}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-amber-600/20 text-amber-300 border border-amber-500/30 hover:bg-amber-600/30 flex items-center gap-1.5 transition"
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>Edit Specs</span>
              </button>
              <button
                onClick={() => setSelectedBike(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200"
              >
                Close
              </button>
              {selectedBike.status === 'Available' && (
                <button
                  onClick={() => {
                    const bId = selectedBike.id;
                    setSelectedBike(null);
                    onInitiateSale(bId);
                  }}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg"
                >
                  Sell This Motorcycle
                </button>
              )}
            </div>

          </div>
        </div>
      )}

      {/* Edit Bike Modal */}
      {editingBike && (
        <EditBikeModal
          bike={editingBike}
          onClose={() => setEditingBike(null)}
          onSave={async (updated) => {
            if (onUpdateBike) {
              await onUpdateBike(updated);
            } else {
              await dbManager.updateBike(updated);
            }
            if (selectedBike && selectedBike.id === updated.id) {
              setSelectedBike(updated);
            }
            setEditingBike(null);
            onRefreshData();
          }}
        />
      )}

    </div>
  );
};

interface EditBikeModalProps {
  bike: Bike;
  onClose: () => void;
  onSave: (updated: Bike) => Promise<void>;
}

const EditBikeModal: React.FC<EditBikeModalProps> = ({ bike, onClose, onSave }) => {
  const [make, setMake] = useState(bike.make);
  const [model, setModel] = useState(bike.model);
  const [year, setYear] = useState(bike.year || new Date().getFullYear());
  const [color, setColor] = useState(bike.color);
  const [engineNumber, setEngineNumber] = useState(bike.engineNumber);
  const [chassisNumber, setChassisNumber] = useState(bike.chassisNumber);
  const [registrationNumber, setRegistrationNumber] = useState(bike.registrationNumber || '');
  const [condition, setCondition] = useState<Bike['condition']>(bike.condition);
  const [status, setStatus] = useState<BikeStatus>(bike.status);
  const [purchaseCost, setPurchaseCost] = useState(bike.purchaseCost);
  const [notes, setNotes] = useState(bike.notes || '');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const brandNames = Object.keys(PAKISTANI_BIKE_BRANDS);
  const availableModels = PAKISTANI_BIKE_BRANDS[make] || [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!make.trim() || !model.trim()) {
      setError('Make and Model are required.');
      return;
    }
    if (!engineNumber.trim() || !chassisNumber.trim()) {
      setError('Engine and Chassis numbers are required.');
      return;
    }
    if (Number(purchaseCost) < 0) {
      setError('Purchase cost cannot be negative.');
      return;
    }

    setIsSaving(true);
    setError(null);
    try {
      const updatedBike: Bike = {
        ...bike,
        make: make.trim(),
        model: model.trim(),
        year: Number(year),
        color: color.trim(),
        engineNumber: engineNumber.trim().toUpperCase(),
        chassisNumber: chassisNumber.trim().toUpperCase(),
        registrationNumber: registrationNumber.trim() || 'Open Letter',
        condition,
        status,
        purchaseCost: Number(purchaseCost),
        notes: notes.trim(),
        updatedAt: new Date().toISOString(),
      };
      await onSave(updatedBike);
    } catch (err: any) {
      setError(err.message || 'Failed to save bike changes.');
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden my-6">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <Edit2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-white">Edit Motorcycle Specs</h2>
              <p className="text-xs text-slate-400 font-mono">Bike ID: {bike.id}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {error && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-xs font-semibold">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Make / Brand */}
            <div>
              <label className="block font-bold text-slate-300 mb-1">Brand / Make *</label>
              <input
                type="text"
                list="brands-list"
                value={make}
                onChange={(e) => setMake(e.target.value)}
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-semibold focus:outline-none focus:border-amber-500"
                placeholder="e.g. Honda, Yamaha, Suzuki"
              />
              <datalist id="brands-list">
                {brandNames.map((b) => (
                  <option key={b} value={b} />
                ))}
              </datalist>
            </div>

            {/* Model */}
            <div>
              <label className="block font-bold text-slate-300 mb-1">Model *</label>
              <input
                type="text"
                list="models-list"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-semibold focus:outline-none focus:border-amber-500"
                placeholder="e.g. CG 125, CD 70, YBR 125G"
              />
              <datalist id="models-list">
                {availableModels.map((m) => (
                  <option key={m} value={m} />
                ))}
              </datalist>
            </div>

            {/* Year */}
            <div>
              <label className="block font-bold text-slate-300 mb-1">Model Year *</label>
              <input
                type="number"
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
                min={1980}
                max={2035}
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-semibold focus:outline-none focus:border-amber-500 font-mono"
              />
            </div>

            {/* Color */}
            <div>
              <label className="block font-bold text-slate-300 mb-1">Color *</label>
              <input
                type="text"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-semibold focus:outline-none focus:border-amber-500"
                placeholder="Red, Black, Blue, Grey..."
              />
            </div>

            {/* Engine Number */}
            <div>
              <label className="block font-bold text-slate-300 mb-1">Engine Number *</label>
              <input
                type="text"
                value={engineNumber}
                onChange={(e) => setEngineNumber(e.target.value.toUpperCase())}
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-amber-300 font-mono font-bold focus:outline-none focus:border-amber-500 uppercase"
              />
            </div>

            {/* Chassis Number */}
            <div>
              <label className="block font-bold text-slate-300 mb-1">Chassis Number *</label>
              <input
                type="text"
                value={chassisNumber}
                onChange={(e) => setChassisNumber(e.target.value.toUpperCase())}
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 font-mono font-bold focus:outline-none focus:border-amber-500 uppercase"
              />
            </div>

            {/* Registration Number */}
            <div>
              <label className="block font-bold text-slate-300 mb-1">Registration Plate</label>
              <input
                type="text"
                value={registrationNumber}
                onChange={(e) => setRegistrationNumber(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-amber-500"
                placeholder="e.g. LEK-1234 or Open Letter"
              />
            </div>

            {/* Condition */}
            <div>
              <label className="block font-bold text-slate-300 mb-1">Condition</label>
              <select
                value={condition}
                onChange={(e) => setCondition(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-semibold focus:outline-none focus:border-amber-500"
              >
                <option value="Brand New">Brand New</option>
                <option value="Used - Like New">Used - Like New</option>
                <option value="Used - Fair">Used - Fair</option>
                <option value="Used - Rough">Used - Rough</option>
                <option value="Accidental">Accidental</option>
              </select>
            </div>

            {/* Status */}
            <div>
              <label className="block font-bold text-slate-300 mb-1">Inventory Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-semibold focus:outline-none focus:border-amber-500"
              >
                <option value="Available">Available</option>
                <option value="Reserved">Reserved</option>
                <option value="Sold">Sold</option>
                <option value="Returned">Returned</option>
                <option value="Archived">Archived</option>
              </select>
            </div>

            {/* Purchase Cost */}
            <div>
              <label className="block font-bold text-slate-300 mb-1">Purchase Cost (PKR) *</label>
              <input
                type="number"
                value={purchaseCost}
                onChange={(e) => setPurchaseCost(Number(e.target.value))}
                min={0}
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-emerald-400 font-mono font-bold focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block font-bold text-slate-300 mb-1">Notes / Description</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500 resize-none"
              placeholder="Any additional details, modifications, or history..."
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-2 rounded-xl text-xs font-black bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-lg transition"
            >
              {isSaving ? 'Saving Changes...' : 'Save Specifications'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
