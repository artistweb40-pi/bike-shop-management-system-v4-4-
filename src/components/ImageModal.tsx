/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { X, Download, ZoomIn } from 'lucide-react';

interface ImageModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  title: string;
}

export const ImageModal: React.FC<ImageModalProps> = ({
  isOpen,
  onClose,
  imageUrl,
  title,
}) => {
  if (!isOpen || !imageUrl) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="relative max-w-4xl w-full bg-slate-900 border border-slate-700 rounded-2xl overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800 bg-slate-950/60">
          <div className="font-bold text-sm text-slate-100 flex items-center gap-2">
            <ZoomIn className="w-4 h-4 text-amber-400" />
            <span>{title}</span>
          </div>
          <div className="flex items-center gap-2">
            <a
              href={imageUrl}
              download={`${title.toLowerCase().replace(/\s+/g, '_')}.jpg`}
              className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg border border-slate-700 transition"
            >
              <Download className="w-3.5 h-3.5" />
              Download
            </a>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Image Display */}
        <div className="p-4 flex items-center justify-center bg-slate-950 min-h-[300px] max-h-[75vh] overflow-auto">
          <img
            src={imageUrl}
            alt={title}
            className="max-h-[70vh] w-auto max-w-full rounded-lg object-contain border border-slate-800 shadow-lg"
          />
        </div>

        {/* Footer Note */}
        <div className="px-5 py-2.5 bg-slate-950/80 border-t border-slate-800 text-xs text-slate-400 text-center">
          Sensitive customer/seller identity document stored locally in IndexedDB storage.
        </div>
      </div>
    </div>
  );
};
