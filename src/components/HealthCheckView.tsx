/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Activity,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Wrench,
  ShieldCheck,
  ShieldAlert,
  Database,
  FileCheck,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { dbManager } from '../db/indexedDB';
import { HealthCheckItem } from '../types';

interface HealthCheckViewProps {
  onDatabaseRepaired: () => void;
}

export const HealthCheckView: React.FC<HealthCheckViewProps> = ({
  onDatabaseRepaired,
}) => {
  const [isRunning, setIsRunning] = useState(false);
  const [isRepairing, setIsRepairing] = useState(false);
  const [items, setItems] = useState<HealthCheckItem[] | null>(null);
  const [repairResult, setRepairResult] = useState<string | null>(null);

  const runDiagnostics = async () => {
    setIsRunning(true);
    setRepairResult(null);
    try {
      const res = await dbManager.runHealthCheck();
      setItems(res);
    } catch (err: any) {
      alert(`Diagnostic failed: ${err.message}`);
    } finally {
      setIsRunning(false);
    }
  };

  const handleAutoRepair = async () => {
    if (!confirm('Run automatic database repair and recalculate all bike costs & profits?')) {
      return;
    }
    setIsRepairing(true);
    try {
      const res = await dbManager.autoRepairDatabase();
      setRepairResult(res);
      await runDiagnostics();
      onDatabaseRepaired();
    } catch (err: any) {
      alert(`Repair failed: ${err.message}`);
    } finally {
      setIsRepairing(false);
    }
  };

  const hasIssues = items?.some((item) => item.status === 'failed' || item.status === 'warning');

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-xl font-black text-white flex items-center gap-2.5">
            <Activity className="w-6 h-6 text-indigo-400" />
            <span>Database Integrity & Diagnostic Health Check</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Automated integrity auditor detecting duplicate engine/chassis numbers, orphaned expenses, calculation drifts & documentation gaps.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={runDiagnostics}
            disabled={isRunning}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white transition shadow-lg"
          >
            <RefreshCw className={`w-4 h-4 ${isRunning ? 'animate-spin' : ''}`} />
            <span>{isRunning ? 'Auditing Database...' : 'Run Integrity Audit'}</span>
          </button>
        </div>
      </div>

      {repairResult && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs text-emerald-400 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{repairResult}</span>
        </div>
      )}

      {/* Audit Report View */}
      {items ? (
        <div className="space-y-6">
          
          {/* Status Header Banner */}
          <div
            className={`p-5 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
              !hasIssues
                ? 'bg-emerald-950/20 border-emerald-500/40 text-emerald-400'
                : 'bg-amber-950/20 border-amber-500/40 text-amber-300'
            }`}
          >
            <div className="flex items-center gap-3">
              {!hasIssues ? (
                <ShieldCheck className="w-8 h-8 shrink-0 text-emerald-400" />
              ) : (
                <ShieldAlert className="w-8 h-8 shrink-0 text-amber-400" />
              )}
              <div>
                <h2 className="text-base font-black">
                  Database Health Status: {!hasIssues ? 'HEALTHY (100% Verified)' : 'NOTICES DETECTED'}
                </h2>
                <p className="text-xs text-slate-300 mt-0.5">
                  Audited {items.length} relational criteria in IndexedDB storage engine.
                </p>
              </div>
            </div>

            {hasIssues && (
              <button
                onClick={handleAutoRepair}
                disabled={isRepairing}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black rounded-xl shadow-lg flex items-center gap-2 self-start sm:self-auto"
              >
                <Wrench className="w-4 h-4" />
                <span>{isRepairing ? 'Repairing Database...' : 'Auto-Repair & Recalculate'}</span>
              </button>
            )}
          </div>

          {/* Diagnostic Items List */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2 mb-4">
              <Database className="w-4 h-4 text-indigo-400" />
              <span>Diagnostic Checklist Findings</span>
            </h3>

            <div className="space-y-2.5">
              {items.map((it) => (
                <div
                  key={it.id}
                  className={`p-3.5 rounded-xl border text-xs flex items-start justify-between gap-3 ${
                    it.status === 'passed'
                      ? 'bg-slate-950/40 border-slate-800/80 text-slate-300'
                      : it.status === 'warning'
                      ? 'bg-amber-950/20 border-amber-500/40 text-amber-200'
                      : 'bg-rose-950/20 border-rose-500/40 text-rose-300'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5">
                      {it.status === 'passed' && <CheckCircle className="w-4 h-4 text-emerald-400" />}
                      {it.status === 'warning' && <AlertTriangle className="w-4 h-4 text-amber-400" />}
                      {it.status === 'failed' && <XCircle className="w-4 h-4 text-rose-400" />}
                    </div>
                    <div>
                      <div className="font-bold text-slate-100 flex items-center gap-2">
                        <span>{it.name}</span>
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 border border-slate-700">
                          {it.category}
                        </span>
                      </div>
                      <div className="text-slate-300 mt-0.5">{it.message}</div>
                      {it.details && (
                        <div className="text-[11px] font-mono text-slate-400 mt-1 bg-slate-950/60 p-1.5 rounded border border-slate-800">
                          {it.details}
                        </div>
                      )}
                    </div>
                  </div>

                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase shrink-0 ${
                      it.status === 'passed'
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : it.status === 'warning'
                        ? 'bg-amber-500/20 text-amber-400'
                        : 'bg-rose-500/20 text-rose-400'
                    }`}
                  >
                    {it.status}
                  </span>
                </div>
              ))}
            </div>

          </div>

        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center space-y-4 shadow-xl">
          <Activity className="w-12 h-12 text-indigo-400 mx-auto animate-pulse" />
          <div>
            <h2 className="text-base font-bold text-white">Perform Showroom Database Audit</h2>
            <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
              Click the button below to inspect all IndexedDB stores, verify relational foreign keys, and audit mathematical formulas.
            </p>
          </div>
          <button
            onClick={runDiagnostics}
            disabled={isRunning}
            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg"
          >
            Start Diagnostic Audit Now
          </button>
        </div>
      )}

    </div>
  );
};
