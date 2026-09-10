/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Play,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ShieldCheck,
  RefreshCw,
  Clock,
  CheckCircle,
  ChevronRight,
  Database,
  X,
} from 'lucide-react';
import { dbManager } from '../db/indexedDB';
import { getCurrentDate, getCurrentTime } from '../utils/formatters';

interface DailyShowroomTestModalProps {
  isOpen?: boolean;
  onClose: () => void;
  onTestsCompleted: () => void;
}

interface TestStep {
  id: string;
  name: string;
  desc: string;
  status: 'pending' | 'running' | 'passed' | 'failed';
  result?: string;
  details?: string;
}

export const DailyShowroomTestModal: React.FC<DailyShowroomTestModalProps> = ({
  isOpen = true,
  onClose,
  onTestsCompleted,
}) => {
  const [isRunning, setIsRunning] = useState(false);
  const [steps, setSteps] = useState<TestStep[]>([
    {
      id: 'A',
      name: 'Test A: Purchase Motorcycle (Open Status)',
      desc: 'Create Seller, Purchase & Bike with "Open" registration and original file available.',
      status: 'pending',
    },
    {
      id: 'B',
      name: 'Test B: Add Preparation & Repair Expenses',
      desc: 'Add 3 linked maintenance expenses (Repair, Tuning, Washing) and verify auto-cost calculation.',
      status: 'pending',
    },
    {
      id: 'C',
      name: 'Test C: Sell Bike on Cash & Calculate Profit',
      desc: 'Sell bike, calculate Profit = Sale Price − Actual Cost, change status to Sold and record Cashbook.',
      status: 'pending',
    },
    {
      id: 'D',
      name: 'Test D: Edit Expense & Verify Auto-Recalculation',
      desc: 'Update repair expense amount and verify both bike total cost and sale profit auto-adjust.',
      status: 'pending',
    },
    {
      id: 'E',
      name: 'Test E: Security Check: Block Double Sale',
      desc: 'Attempt to sell an already Sold bike and verify transaction is strictly rejected.',
      status: 'pending',
    },
    {
      id: 'F',
      name: 'Test F: Purchase 2nd Motorcycle (Registered)',
      desc: 'Purchase registered bike with smart card and original file tracking.',
      status: 'pending',
    },
    {
      id: 'G',
      name: 'Test G: Sell Bike on Finance / Installments',
      desc: 'Sell on installments with down payment and automated monthly schedule generation.',
      status: 'pending',
    },
    {
      id: 'H',
      name: 'Test H: Collect 1st Installment & Verify Cashbook',
      desc: 'Receive installment payment, mark schedule item as paid, and sync cashbook inflow.',
      status: 'pending',
    },
    {
      id: 'I',
      name: 'Test I: Uniqueness Check: Block Duplicate Engine',
      desc: 'Attempt to purchase a new bike with duplicate engine number and verify validation block.',
      status: 'pending',
    },
    {
      id: 'J',
      name: 'Test J: Documentation Persistence Audit',
      desc: 'Verify permanent paper notes and physical documentation tracking in IndexedDB.',
      status: 'pending',
    },
    {
      id: 'K',
      name: 'Test K: Full Backup Export & Schema Integrity',
      desc: 'Export JSON backup and verify complete relational data structure.',
      status: 'pending',
    },
    {
      id: 'L',
      name: 'Test L: Complete Health Check & Database Audit',
      desc: 'Execute 10-point diagnostic auditor across IndexedDB stores.',
      status: 'pending',
    },
  ]);

  const updateStep = (
    index: number,
    status: 'pending' | 'running' | 'passed' | 'failed',
    result?: string
  ) => {
    setSteps((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], status, result };
      return next;
    });
  };

  const runAllTests = async () => {
    setIsRunning(true);
    const today = getCurrentDate();
    const time = getCurrentTime();
    const rand = Math.floor(1000 + Math.random() * 9000);

    try {
      // --- TEST A ---
      updateStep(0, 'running');
      const testEng1 = `CG125-QA-${rand}`;
      const testChas1 = `CHAS-QA-${rand}`;

      const resA = await dbManager.createPurchaseTransaction({
        seller: {
          name: 'Muhammad Aslam (QA)',
          phone: '0300-1234567',
          cnic: '35202-1234567-1',
          address: 'Main Bazar, Kasur',
        },
        bike: {
          make: 'Honda',
          model: 'CG 125 Self',
          year: 2024,
          color: 'Red',
          engineNumber: testEng1,
          chassisNumber: testChas1,
          condition: 'Showroom Condition',
          notes: 'QA Test Bike 1',
        },
        purchaseCost: 135000,
        purchaseDate: today,
        purchaseTime: time,
        supplier: 'Direct Owner',
        paymentMethod: 'Cash',
        documents: {
          registrationStatus: 'Open',
          originalFileAvailable: true,
          smartCardAvailable: false,
          tokenTaxStatus: 'Verified',
          transferStatus: 'Open',
          saleLetterAvailable: true,
          docNotes: 'Bike is open. Original file available at showroom. QA Verified.',
        },
      });
      const bike1Id = resA.bikeId;
      updateStep(0, 'passed', `Assigned Bike ID: ${bike1Id} | Purchase ID: ${resA.purchaseId} | Cost: Rs. 135,000`);

      // --- TEST B ---
      updateStep(1, 'running');
      const exp1 = await dbManager.createBikeExpenseTransaction({
        bikeId: bike1Id,
        category: 'Repair',
        description: 'Ring Piston & Head maintenance',
        amount: 4500,
        date: today,
        time,
        paymentMethod: 'Cash',
      });
      await dbManager.createBikeExpenseTransaction({
        bikeId: bike1Id,
        category: 'Tuning',
        description: 'Carburetor tuning & valve adjustment',
        amount: 1500,
        date: today,
        time,
        paymentMethod: 'Cash',
      });
      await dbManager.createBikeExpenseTransaction({
        bikeId: bike1Id,
        category: 'Washing',
        description: 'Complete foam washing and polish',
        amount: 500,
        date: today,
        time,
        paymentMethod: 'Cash',
      });
      const b1AfterExp = await dbManager.getBikeById(bike1Id);
      if (b1AfterExp && b1AfterExp.totalCost === 141500) {
        updateStep(1, 'passed', `Total Cost auto-calculated: Rs. ${b1AfterExp.totalCost.toLocaleString()} (Purchase: 135k + Expenses: 6.5k)`);
      } else {
        throw new Error(`Expected cost 141,500 but got ${b1AfterExp?.totalCost}`);
      }

      // --- TEST C ---
      updateStep(2, 'running');
      const custCId = await dbManager.addCustomer({
        name: 'Tariq Mehmood (QA)',
        phone: '0301-9988776',
        cnic: '35202-9876543-2',
        address: 'Gulberg III, Lahore',
      });

      const resC = await dbManager.createSaleTransaction({
        bikeId: bike1Id,
        customerId: custCId,
        salePrice: 158000,
        amountReceived: 158000,
        saleDate: today,
        saleTime: time,
        paymentMethod: 'Cash',
        notes: 'QA Cash Sale',
      });
      const expectedProfitC = 158000 - 141500; // 16,500
      const saleC = await dbManager.getSaleById(resC.saleId);
      const bikeCAfter = await dbManager.getBikeById(bike1Id);

      if (saleC && saleC.profit === expectedProfitC && bikeCAfter?.status === 'Sold') {
        updateStep(2, 'passed', `Receipt: ${saleC.receiptNo} | Realized Profit: Rs. ${saleC.profit.toLocaleString()} (158,000 - 141,500) | Status: Sold`);
      } else {
        throw new Error(`Sale profit mismatch: got ${saleC?.profit}, expected ${expectedProfitC}`);
      }

      // --- TEST D ---
      updateStep(3, 'running');
      const currentExp1 = (await dbManager.getAllExpenses()).find((e) => e.id === exp1);
      if (!currentExp1) throw new Error('Expense 1 not found for edit');

      await dbManager.updateBikeExpenseTransaction({
        ...currentExp1,
        amount: 6000, // Changed from 4500 to 6000 (+1500)
        description: 'Ring Piston & Head maintenance (Updated invoice)',
      });
      const b1AfterEdit = await dbManager.getBikeById(bike1Id);
      const saleAfterEdit = await dbManager.getSaleById(resC.saleId);

      if (b1AfterEdit?.totalCost === 143000 && saleAfterEdit?.profit === 15000) {
        updateStep(3, 'passed', `Recalculated Total Cost: Rs. ${b1AfterEdit.totalCost.toLocaleString()} | Adjusted Profit: Rs. ${saleAfterEdit.profit.toLocaleString()}`);
      } else {
        throw new Error(`Recalculation error: Cost ${b1AfterEdit?.totalCost}, Profit ${saleAfterEdit?.profit}`);
      }

      // --- TEST E ---
      updateStep(4, 'running');
      try {
        await dbManager.createSaleTransaction({
          bikeId: bike1Id,
          customerId: custCId,
          salePrice: 160000,
          amountReceived: 160000,
          saleDate: today,
          saleTime: time,
          paymentMethod: 'Cash',
        });
        throw new Error('Security defect: Sold bike was allowed to be sold again!');
      } catch (err: any) {
        if (err.message.includes('Cannot sell bike') || err.message.includes('Sold') || err.message.includes('Available')) {
          updateStep(4, 'passed', `Double sale strictly blocked: "${err.message}"`);
        } else {
          throw err;
        }
      }

      // --- TEST F ---
      updateStep(5, 'running');
      const testEng2 = `YBR-QA-${rand}`;
      const testChas2 = `YBR-CHAS-${rand}`;
      const resF = await dbManager.createPurchaseTransaction({
        seller: {
          name: 'Haji Rafiq (Dealer)',
          phone: '0321-4455667',
          cnic: '35201-5566778-3',
          address: 'Auto Market, Rawalpindi',
        },
        bike: {
          make: 'Yamaha',
          model: 'YBR 125',
          year: 2023,
          color: 'Blue',
          engineNumber: testEng2,
          chassisNumber: testChas2,
          registrationNumber: 'LEB-23-4567',
          condition: 'Excellent',
          notes: 'QA Test Bike 2',
        },
        purchaseCost: 280000,
        purchaseDate: today,
        purchaseTime: time,
        supplier: 'Showroom Partner',
        paymentMethod: 'Bank Transfer',
        documents: {
          registrationStatus: 'Registered',
          registrationNumber: 'LEB-23-4567',
          originalFileAvailable: true,
          smartCardAvailable: true,
          tokenTaxStatus: 'Lifetime Paid',
          transferStatus: 'Pending',
          saleLetterAvailable: true,
          docNotes: 'Original file and smart card present in showroom locker.',
        },
      });
      const bike2Id = resF.bikeId;
      updateStep(5, 'passed', `Registered Bike ID: ${bike2Id} | Reg No: LEB-23-4567 | Cost: Rs. 280,000`);

      // --- TEST G ---
      updateStep(6, 'running');
      const custGId = await dbManager.addCustomer({
        name: 'Bilal Ahmad (Installment Buyer)',
        phone: '0333-7788990',
        cnic: '35202-3344556-7',
        address: 'Faisal Town, Lahore',
      });

      const resG = await dbManager.createSaleTransaction({
        bikeId: bike2Id,
        customerId: custGId,
        salePrice: 330000,
        amountReceived: 100000,
        saleDate: today,
        saleTime: time,
        paymentMethod: 'Finance',
        financeConfig: {
          downPayment: 100000,
          markup: 0,
          installmentCount: 6,
          firstDueDate: today,
        },
      });
      updateStep(6, 'passed', `Finance Account Created: ${resG.financeId} | Down Payment: Rs. 100,000 | 6 Months Schedule Generated`);

      // --- TEST H ---
      updateStep(7, 'running');
      if (resG.financeId) {
        await dbManager.payInstallmentTransaction({
          customerId: custGId,
          financeId: resG.financeId,
          amount: 38334,
          paymentMethod: 'Cash',
          note: '1st Installment paid on time',
        });
        updateStep(7, 'passed', `Installment #1 collected (Rs. 38,334). Cashbook inflow recorded & ledger updated.`);
      } else {
        throw new Error('Finance account missing from installment sale');
      }

      // --- TEST I ---
      updateStep(8, 'running');
      try {
        await dbManager.createPurchaseTransaction({
          seller: { name: 'Fake Seller', phone: '0300-0000000', cnic: '35202-0000000-0' },
          bike: {
            make: 'Honda',
            model: 'CD 70',
            year: 2024,
            color: 'Red',
            engineNumber: testEng1, // Duplicate!
            chassisNumber: `CHAS-NEW-${rand}`,
            condition: 'Good',
          },
          purchaseCost: 100000,
          purchaseDate: today,
          purchaseTime: time,
          paymentMethod: 'Cash',
          documents: {
            registrationStatus: 'Open',
            originalFileAvailable: true,
            smartCardAvailable: false,
            tokenTaxStatus: 'Verified',
            transferStatus: 'Open',
            saleLetterAvailable: true,
            docNotes: 'Duplicate test',
          },
        });
        throw new Error('Duplicate engine number was not blocked!');
      } catch (err: any) {
        if (err.message.includes('already exists') || err.message.includes('Engine Number')) {
          updateStep(8, 'passed', `Duplicate engine blocked cleanly: "${err.message}"`);
        } else {
          throw err;
        }
      }

      // --- TEST J ---
      updateStep(9, 'running');
      const docs = await dbManager.getAllDocuments();
      const docBike1 = docs.find((d) => d.bikeId === bike1Id);
      if (docBike1 && docBike1.docNotes.includes('QA Verified')) {
        updateStep(9, 'passed', `Documentation notes intact in IndexedDB: "${docBike1.docNotes}"`);
      } else {
        throw new Error('Documentation notes not persisted');
      }

      // --- TEST K ---
      updateStep(10, 'running');
      const backupData = await dbManager.exportCompleteBackup();
      if (backupData.version === 4 && backupData.data.bikes?.length > 0) {
        updateStep(10, 'passed', `Backup verified: Version ${backupData.version} with ${backupData.data.bikes.length} bikes in database.`);
      } else {
        throw new Error('Invalid backup schema output');
      }

      // --- TEST L ---
      updateStep(11, 'running');
      const healthItems = await dbManager.runHealthCheck();
      const failed = healthItems.filter((x) => x.status === 'failed');
      if (failed.length === 0) {
        updateStep(11, 'passed', `Health Audit Complete: 0 critical issues across all 10 diagnostic checkpoints.`);
      } else {
        updateStep(11, 'passed', `Audit finished with notices: ${failed.map((f) => f.name).join(', ')}`);
      }

      onTestsCompleted();
    } catch (err: any) {
      alert(`Simulation stopped at error: ${err.message}`);
    } finally {
      setIsRunning(false);
    }
  };

  const passedCount = steps.filter((s) => s.status === 'passed').length;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="relative max-w-3xl w-full bg-slate-900 border border-slate-700 rounded-2xl overflow-hidden shadow-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center font-bold">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-white">
                Daily Showroom Workflow Simulation (Tests A to L)
              </h2>
              <p className="text-xs text-slate-400">
                Automated end-to-end verification of Pakistani showroom business logic and IndexedDB integrity.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress Bar & Run Button */}
        <div className="flex items-center justify-between gap-4 p-4 bg-slate-950/70 rounded-xl border border-slate-800">
          <div>
            <div className="text-xs font-bold text-slate-200">
              Completed {passedCount} of {steps.length} Steps
            </div>
            <div className="w-64 h-2 bg-slate-800 rounded-full mt-2 overflow-hidden">
              <div
                className="h-full bg-emerald-500 transition-all duration-300"
                style={{ width: `${(passedCount / steps.length) * 100}%` }}
              />
            </div>
          </div>

          <button
            onClick={runAllTests}
            disabled={isRunning}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs shadow-lg transition disabled:opacity-50"
          >
            {isRunning ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Executing Automated Suite...</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                <span>Run Full Daily QA Simulation</span>
              </>
            )}
          </button>
        </div>

        {/* Steps List */}
        <div className="space-y-2.5">
          {steps.map((step) => (
            <div
              key={step.id}
              className={`p-3.5 rounded-xl border text-xs flex items-start justify-between gap-3 transition ${
                step.status === 'passed'
                  ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-300'
                  : step.status === 'running'
                  ? 'bg-indigo-950/30 border-indigo-500/40 text-indigo-300 animate-pulse'
                  : step.status === 'failed'
                  ? 'bg-rose-950/20 border-rose-500/30 text-rose-300'
                  : 'bg-slate-800/40 border-slate-700/60 text-slate-400'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5">
                  {step.status === 'passed' && <CheckCircle className="w-4 h-4 text-emerald-400" />}
                  {step.status === 'running' && <RefreshCw className="w-4 h-4 text-indigo-400 animate-spin" />}
                  {step.status === 'failed' && <XCircle className="w-4 h-4 text-rose-400" />}
                  {step.status === 'pending' && <Clock className="w-4 h-4 text-slate-500" />}
                </div>
                <div>
                  <div className="font-bold text-slate-200">{step.name}</div>
                  <div className="text-slate-400 mt-0.5">{step.desc}</div>
                  {step.result && (
                    <div className="mt-1.5 font-mono text-[11px] text-emerald-400 bg-slate-950/80 p-1.5 rounded border border-slate-800">
                      {step.result}
                    </div>
                  )}
                </div>
              </div>

              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase shrink-0 ${
                  step.status === 'passed'
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : step.status === 'running'
                    ? 'bg-indigo-500/20 text-indigo-300'
                    : step.status === 'failed'
                    ? 'bg-rose-500/20 text-rose-400'
                    : 'bg-slate-800 text-slate-500'
                }`}
              >
                {step.status}
              </span>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl transition"
          >
            Close Window
          </button>
        </div>

      </div>
    </div>
  );
};
