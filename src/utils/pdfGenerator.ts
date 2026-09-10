/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  Bike,
  BikeDocument,
  BikeExpense,
  Customer,
  FinanceAccount,
  Payment,
  Purchase,
  Sale,
  Seller,
  ShowroomSettings,
  FullBackupData,
} from '../types';
import { formatPKDateTime, formatPKR, formatShortDate, getCurrentDate } from './formatters';

interface ReportDataPayload {
  settings: ShowroomSettings;
  startDate?: string;
  endDate?: string;
  reportType: string;
  bikes: Bike[];
  purchases: Purchase[];
  sales: Sale[];
  expenses: BikeExpense[];
  documents: BikeDocument[];
  customers: Customer[];
  sellers: Seller[];
  financeAccounts: FinanceAccount[];
  payments: Payment[];
  summary: {
    totalBikes: number;
    availableBikes: number;
    soldBikes: number;
    totalPurchaseCost: number;
    totalExpenses: number;
    totalSales: number;
    totalProfit: number;
    customerOutstanding: number;
  };
}

export function openPrintReportWindow(data: ReportDataPayload, excludeSensitiveImages = false) {
  const printWin = window.open('', '_blank', 'width=1000,height=900');
  if (!printWin) {
    alert('Please allow popups in your browser to view and generate the PDF Report.');
    return;
  }

  const title = `Showroom Report — ${data.settings.shopName} (${getCurrentDate()})`;

  const styles = `
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
      @page {
        size: A4 portrait;
        margin: 12mm 10mm 15mm 10mm;
      }
      * { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      body {
        font-family: 'Plus Jakarta Sans', Arial, sans-serif;
        font-size: 11px;
        color: #1e293b;
        background: #fff;
        margin: 0;
        padding: 20px;
      }
      .header-box {
        border-bottom: 2px solid #0f172a;
        padding-bottom: 12px;
        margin-bottom: 16px;
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
      }
      .shop-name {
        font-size: 20px;
        font-weight: 800;
        color: #0f172a;
        letter-spacing: -0.5px;
      }
      .shop-meta {
        font-size: 11px;
        color: #475569;
        margin-top: 3px;
        line-height: 1.4;
      }
      .report-badge {
        background: #f1f5f9;
        border: 1px solid #cbd5e1;
        padding: 6px 12px;
        border-radius: 6px;
        text-align: right;
      }
      .report-title {
        font-size: 13px;
        font-weight: 700;
        color: #0f172a;
      }
      .report-date {
        font-size: 10px;
        color: #64748b;
      }
      .summary-grid {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 8px;
        margin-bottom: 18px;
      }
      .summary-card {
        border: 1px solid #e2e8f0;
        background: #f8fafc;
        border-radius: 6px;
        padding: 8px 10px;
      }
      .summary-card .label {
        font-size: 9px;
        font-weight: 700;
        color: #64748b;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
      .summary-card .value {
        font-size: 14px;
        font-weight: 800;
        color: #0f172a;
        margin-top: 2px;
      }
      .summary-card.profit .value { color: #15803d; }
      .summary-card.due .value { color: #b91c1c; }
      
      h2.section-title {
        font-size: 13px;
        font-weight: 700;
        color: #0f172a;
        border-bottom: 1px solid #cbd5e1;
        padding-bottom: 4px;
        margin: 18px 0 8px 0;
        page-break-after: avoid;
      }
      table {
        width: 100%;
        border-collapse: collapse;
        margin-bottom: 14px;
        page-break-inside: auto;
      }
      tr {
        page-break-inside: avoid;
        page-break-after: auto;
      }
      thead {
        display: table-header-group;
      }
      th {
        background: #f1f5f9;
        color: #334155;
        font-size: 9px;
        font-weight: 700;
        text-transform: uppercase;
        border: 1px solid #cbd5e1;
        padding: 5px 7px;
        text-align: left;
      }
      td {
        border: 1px solid #e2e8f0;
        padding: 5px 7px;
        font-size: 10px;
        vertical-align: middle;
      }
      td.num, th.num {
        text-align: right;
      }
      .badge {
        display: inline-block;
        padding: 2px 6px;
        font-size: 9px;
        font-weight: 700;
        border-radius: 4px;
      }
      .badge-avail { background: #dcfce7; color: #166534; border: 1px solid #86efac; }
      .badge-sold { background: #fee2e2; color: #991b1b; border: 1px solid #fca5a5; }
      .badge-open { background: #ecfdf5; color: #065f46; border: 1px solid #a7f3d0; }
      .badge-reg { background: #eff6ff; color: #1e40af; border: 1px solid #bfdbfe; }
      
      .notes-box {
        background: #fefce8;
        border: 1px solid #fef08a;
        padding: 6px 10px;
        border-radius: 4px;
        font-size: 10px;
        color: #854d0e;
        margin: 4px 0;
      }
      .footer {
        margin-top: 25px;
        padding-top: 10px;
        border-top: 1px solid #cbd5e1;
        font-size: 9px;
        color: #64748b;
        display: flex;
        justify-content: space-between;
      }
      .btn-bar {
        position: fixed;
        bottom: 16px;
        right: 16px;
        background: #0f172a;
        padding: 10px 18px;
        border-radius: 30px;
        box-shadow: 0 10px 25px -5px rgba(0,0,0,0.3);
        display: flex;
        gap: 10px;
        z-index: 999;
      }
      .btn-bar button {
        background: #2563eb;
        color: #fff;
        border: none;
        padding: 8px 16px;
        border-radius: 20px;
        font-weight: 700;
        font-size: 12px;
        cursor: pointer;
      }
      .btn-bar button:hover { background: #1d4ed8; }
      @media print {
        .btn-bar { display: none; }
        body { padding: 0; }
      }
    </style>
  `;

  const sellerMap = new Map(data.sellers.map((s) => [s.id, s]));
  const customerMap = new Map(data.customers.map((c) => [c.id, c]));
  const docMap = new Map(data.documents.map((d) => [d.bikeId, d]));

  let contentHtml = `
    <div class="header-box">
      <div>
        <div class="shop-name">${data.settings.shopName}</div>
        <div class="shop-meta">
          ${data.settings.address ? `${data.settings.address} · ` : ''}${data.settings.city || ''}<br>
          Phone: ${data.settings.phone || '—'} · NTN: ${data.settings.ntnNumber || '—'} · Proprietor: ${data.settings.ownerName || '—'}
        </div>
      </div>
      <div class="report-badge">
        <div class="report-title">${data.reportType.toUpperCase()} REPORT</div>
        <div class="report-date">Generated: ${formatPKDateTime(getCurrentDate())}</div>
      </div>
    </div>

    <!-- Executive Summary Dashboard -->
    <div class="summary-grid">
      <div class="summary-card">
        <div class="label">Total Stock / Bikes</div>
        <div class="value">${data.summary.totalBikes} (${data.summary.availableBikes} Avail · ${data.summary.soldBikes} Sold)</div>
      </div>
      <div class="summary-card">
        <div class="label">Total Purchase Cost</div>
        <div class="value">${formatPKR(data.summary.totalPurchaseCost)}</div>
      </div>
      <div class="summary-card">
        <div class="label">Total Bike Expenses</div>
        <div class="value">${formatPKR(data.summary.totalExpenses)}</div>
      </div>
      <div class="summary-card">
        <div class="label">Total Sales Volume</div>
        <div class="value">${formatPKR(data.summary.totalSales)}</div>
      </div>
      <div class="summary-card profit">
        <div class="label">Net Realized Profit</div>
        <div class="value">${formatPKR(data.summary.totalProfit)}</div>
      </div>
      <div class="summary-card due">
        <div class="label">Receivable Balances</div>
        <div class="value">${formatPKR(data.summary.customerOutstanding)}</div>
      </div>
    </div>
  `;

  // 1. Inventory & Documentation Section
  if (data.reportType === 'full' || data.reportType === 'inventory') {
    contentHtml += `
      <h2 class="section-title">1. Physical Motorcycle Inventory & Documentation Status</h2>
      <table>
        <thead>
          <tr>
            <th>Bike ID</th>
            <th>Make & Model</th>
            <th>Year & Color</th>
            <th>Engine Number</th>
            <th>Chassis Number</th>
            <th>Registration</th>
            <th>Papers Status</th>
            <th class="num">Purchase</th>
            <th class="num">Expenses</th>
            <th class="num">Total Cost</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          ${
            data.bikes.length
              ? data.bikes
                  .map((b) => {
                    const doc = docMap.get(b.id);
                    return `
              <tr>
                <td><b>${b.id}</b></td>
                <td><b>${b.make}</b> ${b.model}</td>
                <td>${b.year} · ${b.color}</td>
                <td><code>${b.engineNumber}</code></td>
                <td><code>${b.chassisNumber}</code></td>
                <td>${b.registrationNumber || '—'}</td>
                <td>
                  <span class="badge ${doc?.registrationStatus === 'Open' ? 'badge-open' : 'badge-reg'}">
                    ${doc?.registrationStatus || 'Open'}
                  </span>
                  ${doc?.originalFileAvailable ? ' · File Available' : ''}
                </td>
                <td class="num">${formatPKR(b.purchaseCost)}</td>
                <td class="num">${formatPKR(b.totalExpenses)}</td>
                <td class="num"><b>${formatPKR(b.totalCost)}</b></td>
                <td>
                  <span class="badge ${b.status === 'Available' ? 'badge-avail' : 'badge-sold'}">
                    ${b.status.toUpperCase()}
                  </span>
                </td>
              </tr>
              ${
                doc?.docNotes
                  ? `<tr><td colspan="11" class="notes-box"><b>Documentation Notes [${b.id}]:</b> ${doc.docNotes}</td></tr>`
                  : ''
              }
            `;
                  })
                  .join('')
              : '<tr><td colspan="11" style="text-align:center;">No bikes in inventory.</td></tr>'
          }
        </tbody>
      </table>
    `;
  }

  // 2. Purchases & Sellers Section
  if (data.reportType === 'full' || data.reportType === 'purchases') {
    contentHtml += `
      <h2 class="section-title">2. Motorcycle Purchases Register</h2>
      <table>
        <thead>
          <tr>
            <th>Purchase ID</th>
            <th>Date & Time</th>
            <th>Bike ID / Make & Model</th>
            <th>Seller Name</th>
            <th>Seller CNIC & Phone</th>
            <th>Engine No.</th>
            <th>Chassis No.</th>
            <th class="num">Purchase Cost</th>
          </tr>
        </thead>
        <tbody>
          ${
            data.purchases.length
              ? data.purchases
                  .map((p) => {
                    const seller = sellerMap.get(p.sellerId);
                    const bike = data.bikes.find((b) => b.id === p.bikeId);
                    return `
              <tr>
                <td><b>${p.id}</b></td>
                <td>${formatPKDateTime(p.purchaseDate, p.purchaseTime)}</td>
                <td><b>${p.bikeId}</b><br>${bike ? `${bike.make} ${bike.model}` : '—'}</td>
                <td><b>${seller?.name || 'Walk-in Seller'}</b></td>
                <td>${seller?.cnic || '—'}<br>${seller?.phone || '—'}</td>
                <td><code>${bike?.engineNumber || '—'}</code></td>
                <td><code>${bike?.chassisNumber || '—'}</code></td>
                <td class="num"><b>${formatPKR(p.purchaseCost)}</b></td>
              </tr>
            `;
                  })
                  .join('')
              : '<tr><td colspan="8" style="text-align:center;">No purchases recorded.</td></tr>'
          }
        </tbody>
      </table>
    `;
  }

  // 3. Sales & Realized Profit Section
  if (data.reportType === 'full' || data.reportType === 'sales' || data.reportType === 'profit') {
    contentHtml += `
      <h2 class="section-title">3. Showroom Sales & Profit Ledger</h2>
      <table>
        <thead>
          <tr>
            <th>Sale Receipt</th>
            <th>Date & Time</th>
            <th>Customer</th>
            <th>Bike & Specs</th>
            <th class="num">Actual Cost</th>
            <th class="num">Sale Price</th>
            <th class="num">Net Profit</th>
            <th>Payment</th>
            <th class="num">Received</th>
            <th class="num">Balance</th>
          </tr>
        </thead>
        <tbody>
          ${
            data.sales.length
              ? data.sales
                  .map((s) => {
                    const cust = customerMap.get(s.customerId);
                    return `
              <tr>
                <td><b>${s.receiptNo}</b></td>
                <td>${formatPKDateTime(s.saleDate, s.saleTime)}</td>
                <td><b>${cust?.name || 'Walk-in'}</b><br>${cust?.phone || ''}</td>
                <td>${s.make} ${s.model}<br><code>${s.engineNumber}</code></td>
                <td class="num">${formatPKR(s.actualBikeCost)}</td>
                <td class="num"><b>${formatPKR(s.salePrice)}</b></td>
                <td class="num" style="color:#15803d; font-weight:bold;">${formatPKR(s.profit)}</td>
                <td>${s.paymentMethod}</td>
                <td class="num">${formatPKR(s.amountReceived)}</td>
                <td class="num" style="color:${s.remainingBalance > 0 ? '#b91c1c' : '#475569'}; font-weight:bold;">
                  ${formatPKR(s.remainingBalance)}
                </td>
              </tr>
            `;
                  })
                  .join('')
              : '<tr><td colspan="10" style="text-align:center;">No sales recorded.</td></tr>'
          }
        </tbody>
      </table>
    `;
  }

  // 4. Linked Bike Expenses Section
  if (data.reportType === 'full' || data.reportType === 'expenses') {
    contentHtml += `
      <h2 class="section-title">4. Bike Preparation & Maintenance Expenses</h2>
      <table>
        <thead>
          <tr>
            <th>Expense ID</th>
            <th>Date & Time</th>
            <th>Bike ID</th>
            <th>Category</th>
            <th>Description</th>
            <th class="num">Amount</th>
          </tr>
        </thead>
        <tbody>
          ${
            data.expenses.length
              ? data.expenses
                  .map(
                    (e) => `
              <tr>
                <td><b>${e.id}</b></td>
                <td>${formatPKDateTime(e.date, e.time)}</td>
                <td><b>${e.bikeId || 'General'}</b></td>
                <td><b>${e.category}</b></td>
                <td>${e.description}</td>
                <td class="num"><b>${formatPKR(e.amount)}</b></td>
              </tr>
            `
                  )
                  .join('')
              : '<tr><td colspan="6" style="text-align:center;">No expenses recorded.</td></tr>'
          }
        </tbody>
      </table>
    `;
  }

  // 5. Installments & Customer Balances Section
  if (data.reportType === 'full' || data.reportType === 'finance') {
    contentHtml += `
      <h2 class="section-title">5. Installment Financing & Collections Register</h2>
      <table>
        <thead>
          <tr>
            <th>Finance No</th>
            <th>Customer</th>
            <th>Bike</th>
            <th class="num">Bike Price</th>
            <th class="num">Markup</th>
            <th class="num">Down Payment</th>
            <th class="num">Financed Amount</th>
            <th>Installments</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          ${
            data.financeAccounts.length
              ? data.financeAccounts
                  .map((f) => {
                    const cust = customerMap.get(f.customerId);
                    const paidCount = f.schedule.filter((x) => x.paid).length;
                    return `
              <tr>
                <td><b>${f.receiptNo}</b></td>
                <td><b>${cust?.name || 'Customer'}</b><br>${cust?.phone || ''}</td>
                <td>${f.brand} ${f.model}<br><code>${f.engineNumber}</code></td>
                <td class="num">${formatPKR(f.bikePrice)}</td>
                <td class="num">${formatPKR(f.markup)}</td>
                <td class="num">${formatPKR(f.downPayment)}</td>
                <td class="num"><b>${formatPKR(f.financedAmount)}</b></td>
                <td>${paidCount} / ${f.installmentCount} Paid</td>
                <td><b>${f.status}</b></td>
              </tr>
            `;
                  })
                  .join('')
              : '<tr><td colspan="9" style="text-align:center;">No financed bikes.</td></tr>'
          }
        </tbody>
      </table>
    `;
  }

  contentHtml += `
    <div class="footer">
      <div>Verified by Showroom Incharge: _______________________</div>
      <div>Official Ledger Record · ${data.settings.shopName} · Page 1 of 1</div>
    </div>

    <div class="btn-bar">
      <button onclick="window.print()">🖨️ Print / Save to PDF</button>
      <button onclick="window.close()" style="background:#475569;">Close Window</button>
    </div>
  `;

  printWin.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>${title}</title>
        ${styles}
      </head>
      <body>
        ${contentHtml}
      </body>
    </html>
  `);

  printWin.document.close();
  setTimeout(() => {
    printWin.focus();
  }, 400);
}

/**
 * Print standard Single Sale Receipt
 */
export function printSaleReceipt(sale: Sale, bike?: Bike | null, customer?: Customer | null, settings?: ShowroomSettings | null) {
  const win = window.open('', '_blank', 'width=750,height=800');
  if (!win) {
    alert('Please allow popups to print receipt.');
    return;
  }

  const s = settings || {
    shopName: 'Usman Shabir Trader and Autos',
    phone: '0300-7654321',
    address: 'Circular Road, Lahore',
    city: 'Lahore',
    receiptTerms: 'Bike sold in tested and verified condition. All physical documents checked.',
  };

  win.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Sale Receipt — ${sale.receiptNo}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&display=swap');
          * { box-sizing: border-box; }
          body { font-family: 'Plus Jakarta Sans', sans-serif; padding: 25px; color: #0f172a; max-width: 650px; margin: auto; }
          .head { text-align: center; border-bottom: 2px dashed #94a3b8; padding-bottom: 12px; margin-bottom: 16px; }
          .shop { font-size: 20px; font-weight: 800; }
          .meta { font-size: 11px; color: #64748b; margin-top: 4px; }
          .rec-badge { display: inline-block; background: #0f172a; color: #fff; padding: 4px 10px; font-weight: 700; font-size: 12px; border-radius: 4px; margin-top: 8px; }
          .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; font-size: 11px; margin-bottom: 15px; }
          .box { border: 1px solid #e2e8f0; padding: 10px; border-radius: 6px; background: #f8fafc; }
          .box b { color: #334155; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 15px; font-size: 12px; }
          th, td { border: 1px solid #cbd5e1; padding: 8px; text-align: left; }
          th { background: #f1f5f9; font-size: 10px; text-transform: uppercase; }
          .num { text-align: right; }
          .terms { font-size: 9px; color: #64748b; border: 1px solid #e2e8f0; padding: 8px; border-radius: 4px; margin-top: 15px; }
          .sig-row { display: flex; justify-content: space-between; margin-top: 35px; font-size: 11px; font-weight: 700; }
          @media print { .no-print { display: none; } }
        </style>
      </head>
      <body>
        <div class="head">
          <div class="shop">${s.shopName}</div>
          <div class="meta">${s.address || ''} · ${s.city || ''} · Phone: ${s.phone || ''}</div>
          <div class="rec-badge">OFFICIAL MOTORCYCLE SALE RECEIPT</div>
          <div style="font-size:11px; margin-top:6px; color:#475569;">Receipt No: <b>${sale.receiptNo}</b> · Date: <b>${formatPKDateTime(sale.saleDate, sale.saleTime)}</b></div>
        </div>

        <div class="grid">
          <div class="box">
            <b>CUSTOMER INFORMATION</b><br>
            ${customer?.photoBlob ? `<img src="${customer.photoBlob}" style="width:45px;height:45px;object-fit:cover;border-radius:4px;float:right;margin-left:6px;border:1px solid #cbd5e1;" />` : ''}
            Name: <b>${customer?.name || 'Walk-in Customer'}</b><br>
            Father/Husband: ${customer?.fatherName || '—'}<br>
            CNIC: <b>${customer?.cnic || '—'}</b><br>
            Phone: <b>${customer?.phone || '—'}</b><br>
            Address: ${customer?.address || '—'}
          </div>
          <div class="box">
            <b>VEHICLE DETAILS</b><br>
            ${bike?.photoBlob ? `<img src="${bike.photoBlob}" style="width:65px;height:45px;object-fit:cover;border-radius:4px;float:right;margin-left:6px;border:1px solid #cbd5e1;" />` : ''}
            Bike: <b>${sale.make} ${sale.model}</b><br>
            Color: ${bike?.color || '—'} · Year: ${bike?.year || '—'}<br>
            Engine No: <code>${sale.engineNumber}</code><br>
            Chassis No: <code>${sale.chassisNumber}</code><br>
            Registration: <b>${sale.registrationNumber || 'Open / Unregistered'}</b>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Description</th>
              <th class="num">Amount (PKR)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Motorcycle Sale: <b>${sale.make} ${sale.model}</b> (Eng: ${sale.engineNumber})</td>
              <td class="num"><b>${formatPKR(sale.salePrice)}</b></td>
            </tr>
            <tr>
              <td>Payment Method: <b>${sale.paymentMethod}</b></td>
              <td class="num">Received: <b>${formatPKR(sale.amountReceived)}</b></td>
            </tr>
            <tr style="background:#f8fafc;">
              <td><b>Remaining Balance</b></td>
              <td class="num" style="color:${sale.remainingBalance > 0 ? '#b91c1c' : '#15803d'}; font-size:13px; font-weight:800;">
                ${formatPKR(sale.remainingBalance)}
              </td>
            </tr>
          </tbody>
        </table>

        <div class="terms">
          <b>Terms & Conditions:</b> ${s.receiptTerms || 'Bike sold and delivered in verified condition. Please keep this receipt safe.'}
        </div>

        <div class="sig-row">
          <div>Customer Signature: ___________________</div>
          <div>Authorized Showroom Stamp: ___________________</div>
        </div>

        <div class="no-print" style="margin-top:25px; text-align:center;">
          <button onclick="window.print()" style="background:#2563eb; color:#fff; border:none; padding:10px 20px; font-weight:bold; border-radius:6px; cursor:pointer;">
            🖨️ Print Sale Receipt
          </button>
        </div>
      </body>
    </html>
  `);
  win.document.close();
  setTimeout(() => win.print(), 400);
}

export function generateSalesReportPDF(sales: Sale[], settings: ShowroomSettings, startDate?: string, endDate?: string) {
  const win = window.open('', '_blank', 'width=900,height=800');
  if (!win) {
    alert('Please allow popups to print report.');
    return;
  }
  const s = settings || { shopName: 'Showroom' };
  const totalSales = sales.reduce((acc, x) => acc + Number(x.salePrice || 0), 0);
  const totalCost = sales.reduce((acc, x) => acc + Number(x.actualBikeCost || 0), 0);
  const totalProfit = sales.reduce((acc, x) => acc + Number(x.profit || 0), 0);

  win.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Sales & Profit Report — ${s.shopName || (s as any).showroomName}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&display=swap');
          * { box-sizing: border-box; }
          body { font-family: 'Plus Jakarta Sans', sans-serif; padding: 25px; color: #0f172a; max-width: 900px; margin: auto; font-size: 11px; }
          .head { text-align: center; border-bottom: 2px solid #0f172a; padding-bottom: 12px; margin-bottom: 16px; }
          .shop { font-size: 20px; font-weight: 800; }
          table { width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 11px; }
          th, td { border: 1px solid #cbd5e1; padding: 6px 8px; text-align: left; }
          th { background: #f1f5f9; font-size: 10px; text-transform: uppercase; }
          .num { text-align: right; }
          @media print { .no-print { display: none; } }
        </style>
      </head>
      <body>
        <div class="head">
          <div class="shop">${s.shopName || (s as any).showroomName}</div>
          <div>Period: ${startDate || 'All Time'} to ${endDate || getCurrentDate()}</div>
          <h2 style="margin: 8px 0 0 0; font-size: 14px;">SALES & NET PROFIT STATEMENT</h2>
        </div>
        <table>
          <thead>
            <tr>
              <th>Receipt</th>
              <th>Date</th>
              <th>Bike</th>
              <th>Engine / Chassis</th>
              <th class="num">Actual Cost</th>
              <th class="num">Sale Price</th>
              <th class="num">Profit</th>
            </tr>
          </thead>
          <tbody>
            ${sales.map((item) => `
              <tr>
                <td><b>${item.receiptNo}</b></td>
                <td>${item.saleDate}</td>
                <td>${item.make} ${item.model}</td>
                <td>${item.engineNumber}</td>
                <td class="num">${formatPKR(item.actualBikeCost)}</td>
                <td class="num"><b>${formatPKR(item.salePrice)}</b></td>
                <td class="num" style="color:#15803d; font-weight:bold;">${formatPKR(item.profit)}</td>
              </tr>
            `).join('')}
            <tr style="background:#f8fafc; font-weight:bold;">
              <td colspan="4">TOTALS (${sales.length} Bikes Sold)</td>
              <td class="num">${formatPKR(totalCost)}</td>
              <td class="num">${formatPKR(totalSales)}</td>
              <td class="num" style="color:#15803d; font-size:12px;">${formatPKR(totalProfit)}</td>
            </tr>
          </tbody>
        </table>
        <div class="no-print" style="margin-top:25px; text-align:center;">
          <button onclick="window.print()" style="background:#2563eb; color:#fff; border:none; padding:8px 18px; font-weight:bold; border-radius:6px; cursor:pointer;">
            🖨️ Print Report
          </button>
        </div>
      </body>
    </html>
  `);
  win.document.close();
  setTimeout(() => win.print(), 400);
}

export function generateInventoryReportPDF(bikes: Bike[], expenses: BikeExpense[], settings: ShowroomSettings) {
  const win = window.open('', '_blank', 'width=900,height=800');
  if (!win) {
    alert('Please allow popups to print report.');
    return;
  }
  const s = settings || { shopName: 'Showroom' };
  const totalValuation = bikes.reduce((acc, b) => {
    const bExp = expenses.filter((e) => e.bikeId === b.id).reduce((sum, e) => sum + Number(e.amount || 0), 0);
    return acc + (b.purchaseCost + bExp);
  }, 0);

  win.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Inventory Stock Report — ${s.shopName || (s as any).showroomName}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&display=swap');
          * { box-sizing: border-box; }
          body { font-family: 'Plus Jakarta Sans', sans-serif; padding: 25px; color: #0f172a; max-width: 900px; margin: auto; font-size: 11px; }
          .head { text-align: center; border-bottom: 2px solid #0f172a; padding-bottom: 12px; margin-bottom: 16px; }
          .shop { font-size: 20px; font-weight: 800; }
          table { width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 11px; }
          th, td { border: 1px solid #cbd5e1; padding: 6px 8px; text-align: left; }
          th { background: #f1f5f9; font-size: 10px; text-transform: uppercase; }
          .num { text-align: right; }
          @media print { .no-print { display: none; } }
        </style>
      </head>
      <body>
        <div class="head">
          <div class="shop">${s.shopName || (s as any).showroomName}</div>
          <div>Date: ${getCurrentDate()}</div>
          <h2 style="margin: 8px 0 0 0; font-size: 14px;">INVENTORY STOCK & VALUATION AUDIT</h2>
        </div>
        <table>
          <thead>
            <tr>
              <th>Bike ID</th>
              <th>Make & Model</th>
              <th>Year</th>
              <th>Engine No.</th>
              <th>Chassis No.</th>
              <th>Status</th>
              <th class="num">Purchase</th>
              <th class="num">Expenses</th>
              <th class="num">Total Cost</th>
            </tr>
          </thead>
          <tbody>
            ${bikes.map((b) => {
              const bExp = expenses.filter((e) => e.bikeId === b.id).reduce((sum, e) => sum + Number(e.amount || 0), 0);
              return `
                <tr>
                  <td><b>${b.id}</b></td>
                  <td>${b.make} ${b.model}</td>
                  <td>${b.year}</td>
                  <td>${b.engineNumber}</td>
                  <td>${b.chassisNumber}</td>
                  <td>${b.status}</td>
                  <td class="num">${formatPKR(b.purchaseCost)}</td>
                  <td class="num">${formatPKR(bExp)}</td>
                  <td class="num"><b>${formatPKR(b.purchaseCost + bExp)}</b></td>
                </tr>
              `;
            }).join('')}
            <tr style="background:#f8fafc; font-weight:bold;">
              <td colspan="8">TOTAL STOCK VALUATION (${bikes.length} Bikes)</td>
              <td class="num" style="color:#0f172a; font-size:12px;">${formatPKR(totalValuation)}</td>
            </tr>
          </tbody>
        </table>
        <div class="no-print" style="margin-top:25px; text-align:center;">
          <button onclick="window.print()" style="background:#2563eb; color:#fff; border:none; padding:8px 18px; font-weight:bold; border-radius:6px; cursor:pointer;">
            🖨️ Print Report
          </button>
        </div>
      </body>
    </html>
  `);
  win.document.close();
  setTimeout(() => win.print(), 400);
}

export function generateExpensesReportPDF(expenses: BikeExpense[], settings: ShowroomSettings, startDate?: string, endDate?: string) {
  const win = window.open('', '_blank', 'width=900,height=800');
  if (!win) {
    alert('Please allow popups to print report.');
    return;
  }
  const s = settings || { shopName: 'Showroom' };
  const totalExp = expenses.reduce((acc, x) => acc + Number(x.amount || 0), 0);

  win.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Maintenance Expenses Ledger — ${s.shopName || (s as any).showroomName}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&display=swap');
          * { box-sizing: border-box; }
          body { font-family: 'Plus Jakarta Sans', sans-serif; padding: 25px; color: #0f172a; max-width: 900px; margin: auto; font-size: 11px; }
          .head { text-align: center; border-bottom: 2px solid #0f172a; padding-bottom: 12px; margin-bottom: 16px; }
          .shop { font-size: 20px; font-weight: 800; }
          table { width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 11px; }
          th, td { border: 1px solid #cbd5e1; padding: 6px 8px; text-align: left; }
          th { background: #f1f5f9; font-size: 10px; text-transform: uppercase; }
          .num { text-align: right; }
          @media print { .no-print { display: none; } }
        </style>
      </head>
      <body>
        <div class="head">
          <div class="shop">${s.shopName || (s as any).showroomName}</div>
          <div>Period: ${startDate || 'All Time'} to ${endDate || getCurrentDate()}</div>
          <h2 style="margin: 8px 0 0 0; font-size: 14px;">BIKE PREPARATION & MAINTENANCE EXPENSE LEDGER</h2>
        </div>
        <table>
          <thead>
            <tr>
              <th>Expense ID</th>
              <th>Date</th>
              <th>Bike ID</th>
              <th>Category</th>
              <th>Description</th>
              <th class="num">Amount (PKR)</th>
            </tr>
          </thead>
          <tbody>
            ${expenses.map((e) => `
              <tr>
                <td><b>${e.id}</b></td>
                <td>${e.date}</td>
                <td>${e.bikeId}</td>
                <td><b>${e.category}</b></td>
                <td>${e.description}</td>
                <td class="num"><b>${formatPKR(e.amount)}</b></td>
              </tr>
            `).join('')}
            <tr style="background:#f8fafc; font-weight:bold;">
              <td colspan="5">TOTAL MAINTENANCE EXPENSES (${expenses.length} Records)</td>
              <td class="num" style="color:#c2410c; font-size:12px;">${formatPKR(totalExp)}</td>
            </tr>
          </tbody>
        </table>
        <div class="no-print" style="margin-top:25px; text-align:center;">
          <button onclick="window.print()" style="background:#2563eb; color:#fff; border:none; padding:8px 18px; font-weight:bold; border-radius:6px; cursor:pointer;">
            🖨️ Print Report
          </button>
        </div>
      </body>
    </html>
  `);
  win.document.close();
  setTimeout(() => win.print(), 400);
}

/**
 * Generate Complete Showroom Database Backup PDF
 * Contains all inventory with pictures, purchases, sales, profits, expenses, customer ledger, and finance records
 */
export function generateFullBackupPDF(backup: FullBackupData) {
  const win = window.open('', '_blank', 'width=1000,height=900');
  if (!win) {
    alert('Please allow popups to view and generate the PDF Backup.');
    return;
  }

  const s = backup.data.settings || { shopName: 'Usman Trader and Autos', city: 'Lahore', address: '', phone: '' };
  const d = backup.data;
  const counts = backup.counts;

  const totalStockValuation = d.bikes.reduce((acc, b) => acc + (b.totalCost || b.purchaseCost), 0);
  const totalSalesValuation = d.sales.reduce((acc, s) => acc + (s.salePrice || 0), 0);
  const totalProfitSum = d.sales.reduce((acc, s) => acc + (s.profit || 0), 0);
  const totalExpensesSum = d.expenses.reduce((acc, e) => acc + (e.amount || 0), 0);

  const docMap = new Map<string, BikeDocument>(d.documents.map((doc) => [doc.bikeId, doc]));
  const customerMap = new Map<string, Customer>(d.customers.map((c) => [c.id, c]));
  const sellerMap = new Map<string, Seller>(d.sellers.map((sel) => [sel.id, sel]));

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Full Backup Archive — ${s.shopName || backup.shopName} (${getCurrentDate()})</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
          @page {
            size: A4 portrait;
            margin: 10mm 10mm 12mm 10mm;
          }
          * { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          body {
            font-family: 'Plus Jakarta Sans', Arial, sans-serif;
            font-size: 10px;
            color: #0f172a;
            background: #fff;
            margin: 0;
            padding: 16px;
          }
          .header {
            border-bottom: 2px solid #0f172a;
            padding-bottom: 10px;
            margin-bottom: 12px;
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
          }
          .shop-title {
            font-size: 18px;
            font-weight: 800;
            color: #0f172a;
          }
          .shop-sub {
            font-size: 10px;
            color: #475569;
            margin-top: 2px;
          }
          .badge {
            background: #0f172a;
            color: #fff;
            padding: 4px 10px;
            border-radius: 4px;
            font-weight: 700;
            font-size: 11px;
            text-align: right;
          }
          .metrics-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 6px;
            margin-bottom: 14px;
          }
          .metric-card {
            border: 1px solid #e2e8f0;
            background: #f8fafc;
            border-radius: 4px;
            padding: 6px 8px;
          }
          .metric-card .lbl { font-size: 8px; font-weight: 700; color: #64748b; text-transform: uppercase; }
          .metric-card .val { font-size: 13px; font-weight: 800; color: #0f172a; margin-top: 2px; }
          
          h2.sec-head {
            font-size: 11px;
            font-weight: 800;
            color: #0f172a;
            border-bottom: 1px solid #cbd5e1;
            padding-bottom: 3px;
            margin: 14px 0 6px 0;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            page-break-after: avoid;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 10px;
            font-size: 9.5px;
            page-break-inside: auto;
          }
          tr { page-break-inside: avoid; page-break-after: auto; }
          th, td {
            border: 1px solid #cbd5e1;
            padding: 4px 6px;
            text-align: left;
            vertical-align: middle;
          }
          th {
            background: #f1f5f9;
            font-size: 8.5px;
            font-weight: 700;
            color: #334155;
            text-transform: uppercase;
          }
          .num { text-align: right; font-family: monospace; }
          .thumb {
            width: 38px;
            height: 28px;
            object-fit: cover;
            border-radius: 3px;
            border: 1px solid #cbd5e1;
            display: block;
          }
          .no-img {
            width: 38px;
            height: 28px;
            background: #e2e8f0;
            border-radius: 3px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 7px;
            color: #64748b;
            font-weight: bold;
          }
          .footer-sign {
            margin-top: 25px;
            display: flex;
            justify-content: space-between;
            font-size: 10px;
            font-weight: 700;
            border-top: 1px solid #cbd5e1;
            padding-top: 10px;
          }
          @media print {
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="shop-title">${s.shopName || backup.shopName}</div>
            <div class="shop-sub">${s.address || ''} · ${s.city || 'Pakistan'} · Phone: ${s.phone || ''}</div>
            <div class="shop-sub" style="margin-top:3px; color:#0f172a; font-weight:600;">
              Exported At: <b>${formatPKDateTime(backup.exportedAt)}</b> · Database V${backup.version}
            </div>
          </div>
          <div class="badge">
            OFFICIAL DATABASE BACKUP ARCHIVE
            <div style="font-size:9px; font-weight:normal; opacity:0.85; margin-top:2px;">
              ${counts.bikes} Bikes · ${counts.sales} Sales · ${counts.customers} Customers
            </div>
          </div>
        </div>

        <div class="metrics-grid">
          <div class="metric-card">
            <div class="lbl">Total Inventory Stock</div>
            <div class="val">${counts.bikes} Units (${formatPKR(totalStockValuation)})</div>
          </div>
          <div class="metric-card">
            <div class="lbl">Total Realized Sales</div>
            <div class="val">${counts.sales} Units (${formatPKR(totalSalesValuation)})</div>
          </div>
          <div class="metric-card">
            <div class="lbl">Net Realized Profit</div>
            <div class="val" style="color:#15803d;">${formatPKR(totalProfitSum)}</div>
          </div>
          <div class="metric-card">
            <div class="lbl">Maintenance Expenses</div>
            <div class="val" style="color:#c2410c;">${formatPKR(totalExpensesSum)}</div>
          </div>
        </div>

        <!-- Section 1: Physical Stock & Inventory -->
        <h2 class="sec-head">1. Showroom Motorcycle Stock (${d.bikes.length} Units)</h2>
        <table>
          <thead>
            <tr>
              <th style="width:42px;">Picture</th>
              <th>Bike ID</th>
              <th>Make & Model</th>
              <th>Year/Color</th>
              <th>Engine Number</th>
              <th>Chassis Number</th>
              <th>Reg / Doc Status</th>
              <th class="num">Purchase</th>
              <th class="num">Expense</th>
              <th class="num">Total Cost</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${
              d.bikes.length
                ? d.bikes
                    .map((b) => {
                      const doc = docMap.get(b.id);
                      return `
                <tr>
                  <td>
                    ${b.photoBlob ? `<img src="${b.photoBlob}" class="thumb" />` : `<div class="no-img">NO PIC</div>`}
                  </td>
                  <td><b>${b.id}</b></td>
                  <td><b>${b.make} ${b.model}</b><br><span style="font-size:8px;color:#64748b;">${b.condition}</span></td>
                  <td>${b.year} · ${b.color}</td>
                  <td><code>${b.engineNumber}</code></td>
                  <td><code>${b.chassisNumber}</code></td>
                  <td>
                    <b>${b.registrationNumber || 'Open'}</b><br>
                    <span style="font-size:8px;color:${doc?.originalFileAvailable ? '#0f766e' : '#64748b'}">
                      ${doc?.originalFileAvailable ? 'File In Hand' : doc?.registrationStatus || 'Open'}
                    </span>
                  </td>
                  <td class="num">${formatPKR(b.purchaseCost)}</td>
                  <td class="num">${formatPKR(b.totalExpenses || 0)}</td>
                  <td class="num"><b>${formatPKR(b.totalCost || b.purchaseCost)}</b></td>
                  <td><b>${b.status}</b></td>
                </tr>
              `;
                    })
                    .join('')
                : '<tr><td colspan="11" style="text-align:center;">No bikes in inventory.</td></tr>'
            }
          </tbody>
        </table>

        <!-- Section 2: Purchase & Seller Contracts -->
        <h2 class="sec-head">2. Purchase & Acquisition Ledger (${d.purchases.length} Records)</h2>
        <table>
          <thead>
            <tr>
              <th>Purchase ID</th>
              <th>Date</th>
              <th>Seller Name</th>
              <th>CNIC / Phone</th>
              <th>Bike ID</th>
              <th>Condition</th>
              <th class="num">Purchase Cost</th>
              <th>Supplier / Notes</th>
            </tr>
          </thead>
          <tbody>
            ${
              d.purchases.length
                ? d.purchases
                    .map((p) => {
                      const sel = sellerMap.get(p.sellerId);
                      return `
                <tr>
                  <td><b>${p.id}</b></td>
                  <td>${p.purchaseDate}</td>
                  <td>
                    <b>${sel?.name || 'Seller'}</b>
                    ${sel?.photoBlob ? `<span style="font-size:8px;color:#2563eb;"> (Photo ✓)</span>` : ''}
                  </td>
                  <td>${sel?.cnic || '—'}<br>${sel?.phone || '—'}</td>
                  <td><b>${p.bikeId}</b></td>
                  <td>${p.condition}</td>
                  <td class="num"><b>${formatPKR(p.purchaseCost)}</b></td>
                  <td>${p.supplier || p.notes || '—'}</td>
                </tr>
              `;
                    })
                    .join('')
                : '<tr><td colspan="8" style="text-align:center;">No purchases recorded.</td></tr>'
            }
          </tbody>
        </table>

        <!-- Section 3: Sales History -->
        <h2 class="sec-head">3. Sales & Realized Profit Records (${d.sales.length} Records)</h2>
        <table>
          <thead>
            <tr>
              <th>Receipt</th>
              <th>Date</th>
              <th>Customer</th>
              <th>Bike Sold</th>
              <th>Engine Number</th>
              <th class="num">Actual Cost</th>
              <th class="num">Sale Price</th>
              <th class="num">Profit</th>
              <th class="num">Balance</th>
            </tr>
          </thead>
          <tbody>
            ${
              d.sales.length
                ? d.sales
                    .map((s) => {
                      const cust = customerMap.get(s.customerId);
                      return `
                <tr>
                  <td><b>${s.receiptNo}</b></td>
                  <td>${s.saleDate}</td>
                  <td><b>${cust?.name || 'Customer'}</b><br><span style="font-size:8px;color:#64748b;">${cust?.phone || ''}</span></td>
                  <td>${s.make} ${s.model}</td>
                  <td><code>${s.engineNumber}</code></td>
                  <td class="num">${formatPKR(s.actualBikeCost)}</td>
                  <td class="num"><b>${formatPKR(s.salePrice)}</b></td>
                  <td class="num" style="color:#15803d;font-weight:bold;">${formatPKR(s.profit)}</td>
                  <td class="num" style="color:${s.remainingBalance > 0 ? '#b91c1c' : '#475569'};">${formatPKR(s.remainingBalance)}</td>
                </tr>
              `;
                    })
                    .join('')
                : '<tr><td colspan="9" style="text-align:center;">No sales recorded.</td></tr>'
            }
          </tbody>
        </table>

        <!-- Section 4: Maintenance Expenses -->
        <h2 class="sec-head">4. Preparation & Maintenance Expenses (${d.expenses.length} Records)</h2>
        <table>
          <thead>
            <tr>
              <th>Expense ID</th>
              <th>Date</th>
              <th>Bike ID</th>
              <th>Category</th>
              <th>Description</th>
              <th class="num">Amount (PKR)</th>
            </tr>
          </thead>
          <tbody>
            ${
              d.expenses.length
                ? d.expenses
                    .map(
                      (e) => `
                <tr>
                  <td><b>${e.id}</b></td>
                  <td>${e.date}</td>
                  <td><b>${e.bikeId}</b></td>
                  <td><b>${e.category}</b></td>
                  <td>${e.description}</td>
                  <td class="num"><b>${formatPKR(e.amount)}</b></td>
                </tr>
              `
                    )
                    .join('')
                : '<tr><td colspan="6" style="text-align:center;">No expenses recorded.</td></tr>'
            }
          </tbody>
        </table>

        <!-- Section 5: Customers & Financing -->
        <h2 class="sec-head">5. Customer Ledger & Installment Finance Accounts (${d.financeAccounts.length} Financed)</h2>
        <table>
          <thead>
            <tr>
              <th>Finance ID</th>
              <th>Customer</th>
              <th>Bike</th>
              <th class="num">Price</th>
              <th class="num">Down Payment</th>
              <th class="num">Financed</th>
              <th>Schedule</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${
              d.financeAccounts.length
                ? d.financeAccounts
                    .map((f) => {
                      const cust = customerMap.get(f.customerId);
                      const paid = f.schedule.filter((x) => x.paid).length;
                      return `
                <tr>
                  <td><b>${f.receiptNo}</b></td>
                  <td><b>${cust?.name || 'Customer'}</b> (${cust?.phone || ''})</td>
                  <td>${f.brand} ${f.model}</td>
                  <td class="num">${formatPKR(f.bikePrice)}</td>
                  <td class="num">${formatPKR(f.downPayment)}</td>
                  <td class="num"><b>${formatPKR(f.financedAmount)}</b></td>
                  <td>${paid}/${f.installmentCount} Paid</td>
                  <td><b>${f.status}</b></td>
                </tr>
              `;
                    })
                    .join('')
                : '<tr><td colspan="8" style="text-align:center;">No active finance accounts.</td></tr>'
            }
          </tbody>
        </table>

        <div class="footer-sign">
          <div>Verified & Audited by Showroom Manager: ______________________</div>
          <div>Official Stamp & Signature: ______________________</div>
        </div>

        <div class="no-print" style="margin-top:25px; text-align:center;">
          <button onclick="window.print()" style="background:#059669; color:#fff; border:none; padding:10px 24px; font-size:13px; font-weight:bold; border-radius:6px; cursor:pointer; box-shadow:0 4px 6px rgba(0,0,0,0.1);">
            🖨️ Print / Save Complete Backup as PDF
          </button>
          <button onclick="window.close()" style="background:#475569; color:#fff; border:none; padding:10px 18px; font-size:13px; font-weight:bold; border-radius:6px; margin-left:8px; cursor:pointer;">
            Close Window
          </button>
        </div>
      </body>
    </html>
  `;

  win.document.write(html);
  win.document.close();
  setTimeout(() => win.print(), 400);
}

/**
 * Generate Visual Motorcycle Catalog PDF with Photos
 */
export function generateInventoryPhotoCatalogPDF(bikes: Bike[], documents: BikeDocument[], settings: ShowroomSettings) {
  const win = window.open('', '_blank', 'width=950,height=850');
  if (!win) {
    alert('Please allow popups to print visual catalog.');
    return;
  }
  const s = settings || { shopName: 'Usman Trader and Autos', city: 'Lahore', address: '', phone: '' };
  const docMap = new Map<string, BikeDocument>(documents.map((d) => [d.bikeId, d]));

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Visual Motorcycle Stock Catalog — ${s.shopName}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&display=swap');
          @page { size: A4 portrait; margin: 10mm; }
          * { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          body { font-family: 'Plus Jakarta Sans', Arial, sans-serif; color: #0f172a; padding: 15px; margin: 0; font-size: 11px; }
          .head { text-align: center; border-bottom: 2px solid #0f172a; padding-bottom: 10px; margin-bottom: 16px; }
          .shop { font-size: 22px; font-weight: 800; color: #0f172a; }
          .grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 14px; }
          .card { border: 1px solid #cbd5e1; border-radius: 8px; overflow: hidden; page-break-inside: avoid; background: #fff; }
          .img-box { width: 100%; height: 160px; background: #f1f5f9; display: flex; align-items: center; justify-content: center; overflow: hidden; border-bottom: 1px solid #e2e8f0; }
          .img-box img { width: 100%; height: 100%; object-fit: cover; }
          .no-img { font-size: 12px; color: #64748b; font-weight: bold; }
          .info { padding: 10px 12px; }
          .title { font-size: 14px; font-weight: 800; color: #0f172a; display: flex; justify-content: space-between; }
          .price { color: #059669; font-weight: 800; font-size: 14px; }
          .specs { font-size: 10px; color: #475569; margin-top: 4px; }
          .mono { font-family: monospace; font-size: 9.5px; background: #f8fafc; padding: 4px 6px; border-radius: 4px; margin-top: 6px; border: 1px solid #e2e8f0; }
          @media print { .no-print { display: none; } }
        </style>
      </head>
      <body>
        <div class="head">
          <div class="shop">${s.shopName}</div>
          <div style="font-size:11px; color:#475569; margin-top:2px;">${s.address || ''} · Phone: ${s.phone || ''}</div>
          <h2 style="font-size:13px; font-weight:800; margin:6px 0 0 0; text-transform:uppercase; color:#059669;">
            Motorcycle Inventory Photo Catalog (${bikes.length} Bikes)
          </h2>
        </div>

        <div class="grid">
          ${bikes
            .map((b) => {
              const doc = docMap.get(b.id);
              return `
            <div class="card">
              <div class="img-box">
                ${b.photoBlob ? `<img src="${b.photoBlob}" />` : `<div class="no-img">NO PHOTO ATTACHED</div>`}
              </div>
              <div class="info">
                <div class="title">
                  <span>${b.make} ${b.model}</span>
                  <span class="price">${formatPKR(b.totalCost || b.purchaseCost)}</span>
                </div>
                <div class="specs">
                  Year: <b>${b.year}</b> · Color: <b>${b.color}</b> · Condition: <b>${b.condition}</b> · Status: <b style="color:${b.status === 'Available' ? '#059669' : '#e11d48'}">${b.status}</b>
                </div>
                <div class="mono">
                  Engine: <b>${b.engineNumber}</b> | Chassis: <b>${b.chassisNumber}</b><br>
                  Reg: <b>${b.registrationNumber || 'Open Letter'}</b> | Doc: <b>${doc?.originalFileAvailable ? 'Original File Available' : doc?.registrationStatus || 'Open'}</b>
                </div>
              </div>
            </div>
          `;
            })
            .join('')}
        </div>

        <div class="no-print" style="margin-top:25px; text-align:center;">
          <button onclick="window.print()" style="background:#2563eb; color:#fff; border:none; padding:10px 20px; font-weight:bold; border-radius:6px; cursor:pointer;">
            🖨️ Print Catalog / Save PDF
          </button>
        </div>
      </body>
    </html>
  `;

  win.document.write(html);
  win.document.close();
  setTimeout(() => win.print(), 400);
}

