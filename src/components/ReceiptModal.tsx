/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Printer, X, CheckCircle2, Shield, Bike as BikeIcon, Phone, MapPin, Calendar, FileText } from 'lucide-react';
import { Customer, Sale, ShowroomSettings } from '../types';
import { formatCNICDisplay, formatPKDateTime, formatPKR, formatPhoneDisplay } from '../utils/formatters';

interface ReceiptModalProps {
  isOpen: boolean;
  sale: Sale;
  customer?: Customer;
  settings: ShowroomSettings;
  onClose: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  isOpen,
  sale,
  customer,
  settings,
  onClose,
}) => {
  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in print:p-0 print:bg-white">
      <div className="relative max-w-2xl w-full bg-slate-900 border border-slate-700 rounded-2xl overflow-hidden shadow-2xl p-6 space-y-5 max-h-[95vh] overflow-y-auto print:max-w-none print:w-full print:border-none print:bg-white print:text-black print:p-8 print:shadow-none">
        
        {/* Action Controls - Hidden on Print */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 print:hidden">
          <div className="flex items-center gap-2 text-emerald-400">
            <CheckCircle2 className="w-5 h-5" />
            <span className="font-bold text-sm">Sale Transaction Confirmed</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition shadow-lg"
            >
              <Printer className="w-4 h-4" />
              <span>Print Showroom Receipt & Gate Pass</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Showroom Receipt */}
        <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 space-y-6 print:bg-white print:border-2 print:border-black print:p-6 print:text-black">
          
          {/* Header */}
          <div className="text-center space-y-1 pb-4 border-b border-slate-800 print:border-b-2 print:border-black">
            <h1 className="text-xl font-black uppercase tracking-wider text-white print:text-black">
              {settings.shopName || settings.showroomName || 'Pak Motor Showroom'}
            </h1>
            <p className="text-xs text-slate-400 print:text-gray-700">
              {settings.address || 'Main Circular Road'} · {settings.city || 'Lahore, Pakistan'}
            </p>
            <p className="text-xs font-mono text-slate-400 print:text-gray-700">
              Phone: {settings.phone || '0300-1234567'} {settings.ntnNumber && `· NTN: ${settings.ntnNumber}`}
            </p>
            <div className="pt-2">
              <span className="inline-block px-3 py-1 bg-amber-500/20 text-amber-300 print:bg-gray-200 print:text-black font-black text-xs uppercase tracking-widest rounded-lg border border-amber-500/30 print:border-black">
                Official Bike Sale Receipt & Gate Pass
              </span>
            </div>
          </div>

          {/* Meta Info */}
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-slate-400 print:text-gray-600">Receipt No: </span>
              <span className="font-mono font-black text-white print:text-black">{sale.receiptNo}</span>
            </div>
            <div className="text-right">
              <span className="text-slate-400 print:text-gray-600">Date & Time: </span>
              <span className="font-mono font-bold text-white print:text-black">{formatPKDateTime(sale.saleDate, sale.saleTime)}</span>
            </div>
          </div>

          {/* Customer Details */}
          <div className="p-3.5 bg-slate-900 rounded-xl border border-slate-800 space-y-1.5 print:bg-gray-50 print:border print:border-gray-400">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 print:text-gray-700">
              Customer / Buyer Information
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-slate-400 print:text-gray-600">Name: </span>
                <span className="font-bold text-white print:text-black">{customer?.name || 'Cash Customer'}</span>
              </div>
              <div>
                <span className="text-slate-400 print:text-gray-600">CNIC: </span>
                <span className="font-mono font-bold text-white print:text-black">{formatCNICDisplay(customer?.cnic || '') || 'N/A'}</span>
              </div>
              <div>
                <span className="text-slate-400 print:text-gray-600">Phone: </span>
                <span className="font-mono text-white print:text-black">{formatPhoneDisplay(customer?.phone || '') || 'N/A'}</span>
              </div>
              <div>
                <span className="text-slate-400 print:text-gray-600">Address: </span>
                <span className="text-white print:text-black">{customer?.address || 'Lahore'}</span>
              </div>
            </div>
          </div>

          {/* Vehicle Specifications */}
          <div className="p-3.5 bg-slate-900 rounded-xl border border-slate-800 space-y-2 print:bg-gray-50 print:border print:border-gray-400">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 print:text-gray-700 flex items-center justify-between">
              <span>Motorcycle Specifications</span>
              <span className="font-mono text-[10px] text-amber-400 print:text-black font-bold">ID: {sale.bikeId}</span>
            </div>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-slate-400 print:text-gray-600">Make & Model: </span>
                <span className="font-black text-white print:text-black">{sale.make} {sale.model}</span>
              </div>
              <div>
                <span className="text-slate-400 print:text-gray-600">Registration No: </span>
                <span className="font-mono font-bold text-white print:text-black">{sale.registrationNumber || 'Open / Unregistered'}</span>
              </div>
              <div>
                <span className="text-slate-400 print:text-gray-600">Engine Number: </span>
                <span className="font-mono font-black text-emerald-400 print:text-black">{sale.engineNumber}</span>
              </div>
              <div>
                <span className="text-slate-400 print:text-gray-600">Chassis Number: </span>
                <span className="font-mono font-black text-emerald-400 print:text-black">{sale.chassisNumber}</span>
              </div>
            </div>
          </div>

          {/* Financials */}
          <div className="border border-slate-800 rounded-xl overflow-hidden print:border-black">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-900 text-slate-400 print:bg-gray-200 print:text-black font-bold">
                <tr>
                  <th className="p-2.5">Description</th>
                  <th className="p-2.5 text-right">Amount (PKR)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 print:divide-black">
                <tr>
                  <td className="p-2.5 text-slate-300 print:text-black">Agreed Sale Price</td>
                  <td className="p-2.5 text-right font-black font-mono text-white print:text-black">{formatPKR(sale.salePrice)}</td>
                </tr>
                <tr>
                  <td className="p-2.5 text-slate-300 print:text-black">Amount Received ({sale.paymentMethod})</td>
                  <td className="p-2.5 text-right font-black font-mono text-emerald-400 print:text-black">{formatPKR(sale.amountReceived)}</td>
                </tr>
                <tr className="bg-slate-900/50 print:bg-gray-100">
                  <td className="p-2.5 font-bold text-slate-300 print:text-black">Remaining Balance Due</td>
                  <td className="p-2.5 text-right font-black font-mono text-amber-400 print:text-black">
                    {formatPKR(sale.remainingBalance || 0)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Terms */}
          <div className="text-[10px] text-slate-400 print:text-gray-700 leading-relaxed border-t border-slate-800 pt-3 print:border-black">
            <p className="font-bold text-slate-300 print:text-black mb-1">Terms & Conditions / اقرار نامہ:</p>
            <p>{settings.receiptTerms || 'Bike sold in verified condition. All documents verified. Purchaser is responsible for road tax & transfer after handover.'}</p>
          </div>

          {/* Signatures */}
          <div className="grid grid-cols-2 gap-8 pt-8 text-xs text-center border-t border-slate-800 print:border-black">
            <div>
              <div className="border-t border-slate-700 pt-1 font-bold text-slate-300 print:text-black print:border-black">
                Customer / Buyer Signature
              </div>
            </div>
            <div>
              <div className="border-t border-slate-700 pt-1 font-bold text-slate-300 print:text-black print:border-black">
                Showroom Owner / Authorized Stamp
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
