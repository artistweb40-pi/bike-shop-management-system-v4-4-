/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  FileText,
  Search,
  CheckCircle2,
  FileCheck,
  Shield,
  Save,
  Edit3,
  Bike as BikeIcon,
  AlertCircle,
  FileSpreadsheet,
} from 'lucide-react';
import { Bike, BikeDocument, RegistrationStatus } from '../types';
import { REGISTRATION_STATUSES, formatShortDate } from '../utils/formatters';

interface DocumentationViewProps {
  bikes?: Bike[];
  documents?: BikeDocument[];
  onUpdateDocument: (doc: BikeDocument) => Promise<any>;
}

export const DocumentationView: React.FC<DocumentationViewProps> = ({
  bikes = [],
  documents = [],
  onUpdateDocument,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [selectedDoc, setSelectedDoc] = useState<BikeDocument | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Editable fields in modal/drawer
  const [regStatus, setRegStatus] = useState<RegistrationStatus>('Open');
  const [regNumber, setRegNumber] = useState('');
  const [regCity, setRegCity] = useState('');
  const [regProvince, setRegProvince] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [origFile, setOrigFile] = useState(true);
  const [smartCard, setSmartCard] = useState(false);
  const [tokenTax, setTokenTax] = useState('Lifetime Paid');
  const [transfer, setTransfer] = useState('Open');
  const [saleLetter, setSaleLetter] = useState(true);
  const [otherDocs, setOtherDocs] = useState('');
  const [docNotes, setDocNotes] = useState('');

  const bikeMap = new Map<string, Bike>(bikes.map((b) => [b.id, b]));
  const docMap = new Map<string, BikeDocument>(documents.map((d) => [d.bikeId, d]));

  const openEditor = (doc: BikeDocument) => {
    setSelectedDoc(doc);
    setRegStatus(doc.registrationStatus);
    setRegNumber(doc.registrationNumber || '');
    setRegCity(doc.registrationCity || '');
    setRegProvince(doc.registrationProvince || '');
    setOwnerName(doc.ownerName || '');
    setOrigFile(doc.originalFileAvailable);
    setSmartCard(doc.smartCardAvailable);
    setTokenTax(doc.tokenTaxStatus || 'Verified');
    setTransfer(doc.transferStatus || 'Open');
    setSaleLetter(doc.saleLetterAvailable);
    setOtherDocs(doc.otherDocuments || '');
    setDocNotes(doc.docNotes || '');
    setSaveSuccess(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDoc) return;

    setIsSaving(true);
    try {
      const updated: BikeDocument = {
        ...selectedDoc,
        registrationStatus: regStatus,
        registrationNumber: regNumber.trim().toUpperCase(),
        registrationCity: regCity.trim(),
        registrationProvince: regProvince.trim(),
        ownerName: ownerName.trim(),
        originalFileAvailable: origFile,
        smartCardAvailable: smartCard,
        tokenTaxStatus: tokenTax.trim(),
        transferStatus: transfer.trim(),
        saleLetterAvailable: saleLetter,
        otherDocuments: otherDocs.trim(),
        docNotes: docNotes.trim(),
        updatedAt: new Date().toISOString(),
      };
      await onUpdateDocument(updated);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
      setSelectedDoc(null);
    } catch {
      alert('Failed to update documentation notes.');
    } finally {
      setIsSaving(false);
    }
  };

  const filteredDocs = documents
    .filter((doc) => {
      if (filterStatus !== 'ALL' && doc.registrationStatus !== filterStatus) return false;
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      const bike = bikeMap.get(doc.bikeId);
      return (
        doc.bikeId.toLowerCase().includes(q) ||
        doc.engineNumber.toLowerCase().includes(q) ||
        doc.chassisNumber.toLowerCase().includes(q) ||
        (doc.registrationNumber?.toLowerCase() || '').includes(q) ||
        doc.docNotes.toLowerCase().includes(q) ||
        (doc.ownerName?.toLowerCase() || '').includes(q) ||
        (bike?.make.toLowerCase() || '').includes(q) ||
        (bike?.model.toLowerCase() || '').includes(q)
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
            <FileText className="w-6 h-6 text-teal-400" />
            <span>Motorcycle Documentation & File Register</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Track Open vs Registered status, Smart Cards, Token Tax, Sale Letters, and permanent Documentation Notes per bike.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold text-xs rounded-xl">
            {documents.filter((d) => d.registrationStatus === 'Open').length} OPEN
          </span>
          <span className="px-3 py-1 bg-blue-500/10 border border-blue-500/30 text-blue-400 font-bold text-xs rounded-xl">
            {documents.filter((d) => d.registrationStatus === 'Registered').length} REGISTERED
          </span>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900 border border-slate-800 p-3 rounded-2xl shadow-md">
        
        {/* Status Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {[
            { id: 'ALL', label: 'All Files' },
            { id: 'Open', label: 'OPEN (Unregistered)' },
            { id: 'Registered', label: 'REGISTERED' },
            { id: 'Transfer Pending', label: 'Transfer Pending' },
            { id: 'File Available', label: 'File Available' },
            { id: 'File Missing', label: 'File Missing' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterStatus(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                filterStatus === tab.id
                  ? 'bg-teal-500 text-slate-950 shadow-md'
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
            placeholder="Search notes, registration, engine, owner..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-4 py-1.5 text-xs text-slate-200 placeholder-slate-500"
          />
        </div>

      </div>

      {/* Documentation Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/60 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-4">Bike ID</th>
                <th className="py-3 px-4">Make & Model</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Registration No.</th>
                <th className="py-3 px-4">Original File</th>
                <th className="py-3 px-4">Smart Card</th>
                <th className="py-3 px-4">Token Tax</th>
                <th className="py-3 px-4">Documentation Notes</th>
                <th className="py-3 px-4 text-center">Edit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-xs">
              {filteredDocs.length > 0 ? (
                filteredDocs.map((doc) => {
                  const bike = bikeMap.get(doc.bikeId);
                  const isOpen = doc.registrationStatus === 'Open';
                  return (
                    <tr key={doc.id} className="hover:bg-slate-800/40 transition">
                      <td className="py-3 px-4 font-mono font-bold text-amber-400">
                        {doc.bikeId}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-100">{bike?.make} {bike?.model}</div>
                        <div className="text-[11px] font-mono text-slate-400">Eng: {doc.engineNumber}</div>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`text-xs font-black px-2.5 py-1 rounded-md border tracking-wider uppercase ${
                            isOpen
                              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                              : 'bg-blue-500/20 text-blue-300 border-blue-500/40'
                          }`}
                        >
                          {isOpen ? 'OPEN' : 'REGISTERED'}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-200">
                        {doc.registrationNumber || <span className="text-slate-500 italic">Open Letter</span>}
                      </td>
                      <td className="py-3 px-4">
                        {doc.originalFileAvailable ? (
                          <span className="text-emerald-400 font-bold flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Available
                          </span>
                        ) : (
                          <span className="text-rose-400 font-bold">Missing</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {doc.smartCardAvailable ? (
                          <span className="text-emerald-400 font-bold flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Yes
                          </span>
                        ) : (
                          <span className="text-slate-500">No</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-300">
                        {doc.tokenTaxStatus || 'Verified'}
                      </td>
                      <td className="py-3 px-4 max-w-xs">
                        <div className="p-2 bg-slate-800/70 border border-slate-700/60 rounded-lg text-[11px] text-amber-200/90 line-clamp-2">
                          {doc.docNotes || 'No notes added.'}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => openEditor(doc)}
                          className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-teal-300 rounded-lg text-xs font-bold border border-slate-700 flex items-center gap-1 mx-auto"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Edit</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-500">
                    No documentation records match your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Documentation Notes Modal */}
      {selectedDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <form
            onSubmit={handleSave}
            className="relative max-w-2xl w-full bg-slate-900 border border-slate-700 rounded-2xl overflow-hidden shadow-2xl p-6 space-y-4"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-teal-400" />
                <h2 className="text-base font-black text-white">
                  Edit Documentation: {selectedDoc.bikeId}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setSelectedDoc(null)}
                className="text-slate-400 hover:text-white text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              
              {/* Registration Status */}
              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">Registration Status *</label>
                <select
                  value={regStatus}
                  onChange={(e) => setRegStatus(e.target.value as RegistrationStatus)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 font-bold"
                >
                  {REGISTRATION_STATUSES.map((st) => (
                    <option key={st.value} value={st.value}>{st.label}</option>
                  ))}
                </select>
              </div>

              {/* Registration Number */}
              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">Registration Number</label>
                <input
                  type="text"
                  placeholder="e.g. LEB-24-9988"
                  value={regNumber}
                  onChange={(e) => setRegNumber(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200"
                />
              </div>

              {/* Owner Name */}
              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">Book / File Owner Name</label>
                <input
                  type="text"
                  placeholder="Owner name on papers"
                  value={ownerName}
                  onChange={(e) => setOwnerName(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200"
                />
              </div>

              {/* Token Tax */}
              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">Token Tax Status</label>
                <input
                  type="text"
                  placeholder="e.g. Lifetime Paid / Up to June 2026"
                  value={tokenTax}
                  onChange={(e) => setTokenTax(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200"
                />
              </div>

              {/* Checkbox row */}
              <div className="sm:col-span-2 flex items-center gap-6 p-3 bg-slate-800/60 rounded-xl border border-slate-700/60">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={origFile}
                    onChange={(e) => setOrigFile(e.target.checked)}
                    className="w-4 h-4 rounded text-teal-600 bg-slate-800 border-slate-700"
                  />
                  <span className="text-slate-200 font-bold">Original File Available</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={smartCard}
                    onChange={(e) => setSmartCard(e.target.checked)}
                    className="w-4 h-4 rounded text-teal-600 bg-slate-800 border-slate-700"
                  />
                  <span className="text-slate-200 font-bold">Smart Card Present</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={saleLetter}
                    onChange={(e) => setSaleLetter(e.target.checked)}
                    className="w-4 h-4 rounded text-teal-600 bg-slate-800 border-slate-700"
                  />
                  <span className="text-slate-200 font-bold">Sale Letter / Invoice</span>
                </label>
              </div>

              {/* Large Documentation Notes */}
              <div className="sm:col-span-2">
                <label className="block text-[11px] font-bold text-amber-400 mb-1 uppercase tracking-wider">
                  Documentation Notes (Permanent Saved in IndexedDB) *
                </label>
                <textarea
                  rows={4}
                  required
                  value={docNotes}
                  onChange={(e) => setDocNotes(e.target.value)}
                  placeholder="e.g. Bike is open. Original file available. Transfer pending. Seller CNIC verified. Smart card missing. Token tax pending. Engine number verified. Chassis number verified."
                  className="w-full bg-slate-800 border border-amber-500/50 rounded-xl p-3 text-xs text-amber-200 focus:ring-2 focus:ring-amber-500/50 font-medium"
                />
              </div>

            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setSelectedDoc(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="px-6 py-2.5 rounded-xl text-xs font-bold bg-teal-600 hover:bg-teal-500 text-white shadow-lg flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                <span>{isSaving ? 'Saving Notes...' : 'Save Documentation'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
};
