# Usman Trader and Autos - Motorcycle Showroom Management System

A comprehensive, offline-first management system designed for Pakistani motorcycle dealerships, featuring inventory tracking, installment financing (Kisht plan), double-entry cashbook, customer/seller ledgers, thermal invoice & Urdu stamp generation, and Google Drive cloud synchronization.

---

## 🚀 How to Run the App on Windows (Step-by-Step)

### ⚠️ IMPORTANT: Before You Start (Do Not Skip!)
If you downloaded the project as a `.zip` file:
1. **DO NOT double-click `run.bat` directly from inside the ZIP file.** (Windows will give `ENOENT: no such file or directory, open package.json` because Windows runs files from a temporary preview folder `AppData\Local\Temp`).
2. **Right-click** the downloaded `.zip` file.
3. Click **"Extract All..."** (or use WinRAR / 7-Zip).
4. Extract it to a standard folder, for example: `C:\BikeShop` or your `Desktop`.

---

### Option 1: One-Click Launch (Easiest)
1. Ensure **Node.js** (v18, v20, or newer) is installed on your computer. If not installed, download the LTS version from [https://nodejs.org](https://nodejs.org).
2. Inside the **extracted** folder, double-click:
   ```
   run.bat
   ```
3. The script will automatically:
   - Check your environment and directory
   - Install dependencies (`npm install`) on first launch
   - Start the local server
   - Open **http://localhost:3000** in your browser

---

### Option 2: Run via Command Prompt / Terminal
Open Command Prompt (`cmd`) or PowerShell inside the extracted folder:

```bash
# 1. Install dependencies
npm install

# 2. Run automated regression test suite (13/13 tests)
npm test

# 3. Start the local server
npm run dev

# 4. Build for production
npm run build
```

Once the terminal displays `Local: http://localhost:3000`, open that URL in Google Chrome, Microsoft Edge, or Firefox.

For the formal system certification and architectural audit, please see [PROJECT_READY.md](./PROJECT_READY.md).

---

## 🛠️ Troubleshooting Common Errors

### 1. `npm error enoent Could not read package.json: Error: ENOENT: ... Temp\...`
- **Cause:** You ran the script or command from inside the compressed `.zip` preview in Windows Explorer.
- **Fix:** Right-click the `.zip` file, select **"Extract All..."**, and run `run.bat` from inside the extracted folder.

### 2. `Rollup failed to resolve import "firebase/app"`
- **Cause:** `npm install` was not executed before running `npm run build` or `npm run dev`, so dependencies in `node_modules` were missing.
- **Fix:** Run `npm install` inside the project folder first, then run `npm run dev`.

### 3. `Error 400: origin_mismatch` (Google Drive OAuth)
- **Cause:** Google requires the exact web address where the app runs (e.g. `http://localhost:3000`) to be whitelisted under **Authorized JavaScript origins** in Google Cloud Console.
- **Fix:** 
  1. Open [Google Cloud Console Credentials](https://console.cloud.google.com/apis/credentials).
  2. Click your OAuth 2.0 Web Client ID.
  3. Under **Authorized JavaScript origins**, click **+ ADD URI** and add `http://localhost:3000`.
  4. Click **Save**.
- **Alternative (No Google Account needed):** You can use the built-in **Backup & Restore** tab to export and import complete showroom backups as JSON files with 100% offline capability and zero cloud setup!

---

## 📦 Features Included
- **Inventory Tracking:** Real-time motorbike stock, purchase cost vs. expense breakdown, Pakistani brands (Honda, Yamaha, Suzuki, Road Prince, United, etc.), photos, and full bike dossiers.
- **Acquisitions & Purchases:** Seller CNIC, phone, registration documents, and automatic cashbook expense posting.
- **Sales & Installment Financing:** Cash, Bank Transfer, or Installment (Down Payment, Monthly Kisht Schedule, Overdue alerts, and Ledger synchronization).
- **Cashbook & Accounts:** Real-time Cash in Hand & Bank account ledgers with double-entry journal logs.
- **Printing & Reports:** Full A4 sale affidavits with Urdu text, 80mm/58mm thermal receipts, gate passes, customer payment vouchers, and stock audit sheets.
- **Offline Storage & Cloud Sync:** Fast, secure local IndexedDB storage with one-click JSON backup/restore and Google Drive sync.
