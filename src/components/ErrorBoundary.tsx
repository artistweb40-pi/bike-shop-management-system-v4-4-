/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Trash2, Home } from 'lucide-react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Showroom Uncaught ErrorBoundary:', error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleGoHome = () => {
    window.location.href = '/';
  };

  private handleResetCache = () => {
    if (confirm('Clear temporary application caches and reload? Your motorcycle records in IndexedDB will be preserved.')) {
      try {
        sessionStorage.clear();
        localStorage.removeItem('pk_showroom_master_session');
      } catch {
        // ignore
      }
      window.location.reload();
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-5 text-center">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <AlertTriangle className="w-7 h-7" />
            </div>

            <div>
              <h1 className="text-lg font-black text-white tracking-tight">
                Showroom System Notice
              </h1>
              <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                An unexpected interface issue occurred. Your data is safely stored in local IndexedDB.
              </p>
            </div>

            {this.state.error && (
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-left font-mono text-[11px] text-rose-400 max-h-32 overflow-y-auto custom-scrollbar break-all">
                {this.state.error.message || 'Unknown runtime error'}
              </div>
            )}

            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={this.handleReload}
                className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition flex items-center justify-center gap-2 shadow-lg"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Reload Application</span>
              </button>

              <button
                type="button"
                onClick={this.handleGoHome}
                className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs transition flex items-center justify-center gap-2"
              >
                <Home className="w-4 h-4" />
                <span>Return to Showroom Home</span>
              </button>

              <button
                type="button"
                onClick={this.handleResetCache}
                className="w-full py-2 px-4 rounded-xl text-slate-500 hover:text-amber-400 text-[11px] transition flex items-center justify-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Reset Temp Cache & Re-open</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
