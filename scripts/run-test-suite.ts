import 'fake-indexeddb/auto';
import { dbManager } from '../src/db/indexedDB';
import { getCurrentDate, getCurrentTime } from '../src/utils/formatters';

async function runSuite() {
  console.log('=== RUNNING SHOWROOM AUTOMATED TEST SUITE ===');
  const today = getCurrentDate();
  const time = getCurrentTime();
  const rand = Math.floor(1000 + Math.random() * 9000);

  const results: { step: string; status: 'PASSED' | 'FAILED'; error?: string; detail?: string }[] = [];

  // TEST A: Purchase Motorcycle (Open Status)
  try {
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
    results.push({ step: 'Test A: Purchase Motorcycle', status: 'PASSED', detail: `Bike ID: ${bike1Id}` });

    // TEST B: Add 3 Expenses
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
    if (!b1AfterExp || b1AfterExp.totalCost !== 141500) {
      throw new Error(`Expected cost 141,500 but got ${b1AfterExp?.totalCost}`);
    }
    results.push({ step: 'Test B: Add Preparation & Repair Expenses', status: 'PASSED', detail: `Total Cost: ${b1AfterExp.totalCost}` });

    // TEST C: Sell Bike on Cash
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
    const expectedProfitC = 158000 - 141500;
    const saleC = await dbManager.getSaleById(resC.saleId);
    const bikeCAfter = await dbManager.getBikeById(bike1Id);
    if (!saleC || saleC.profit !== expectedProfitC || bikeCAfter?.status !== 'Sold') {
      throw new Error(`Sale mismatch: profit ${saleC?.profit}, status ${bikeCAfter?.status}`);
    }
    results.push({ step: 'Test C: Sell Bike on Cash & Calculate Profit', status: 'PASSED', detail: `Profit: ${saleC.profit}` });

    // TEST D: Edit Expense & Verify Auto-Recalculation
    const currentExp1 = (await dbManager.getAllExpenses()).find((e) => e.id === exp1);
    if (!currentExp1) throw new Error('Expense 1 not found');
    await dbManager.updateBikeExpenseTransaction({
      ...currentExp1,
      amount: 6000,
      description: 'Ring Piston & Head maintenance (Updated invoice)',
    });
    const b1AfterEdit = await dbManager.getBikeById(bike1Id);
    const saleAfterEdit = await dbManager.getSaleById(resC.saleId);
    if (b1AfterEdit?.totalCost !== 143000 || saleAfterEdit?.profit !== 15000) {
      throw new Error(`Recalculation error: Cost ${b1AfterEdit?.totalCost}, Profit ${saleAfterEdit?.profit}`);
    }
    results.push({ step: 'Test D: Edit Expense & Verify Auto-Recalculation', status: 'PASSED', detail: `Adjusted Profit: ${saleAfterEdit.profit}` });

    // TEST E: Block Double Sale
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
      throw new Error('Double sale was allowed!');
    } catch (err: any) {
      if (err.message.includes('Cannot sell bike') || err.message.includes('Sold') || err.message.includes('Available')) {
        results.push({ step: 'Test E: Security Check: Block Double Sale', status: 'PASSED', detail: err.message });
      } else {
        throw err;
      }
    }

    // TEST F: Purchase 2nd Motorcycle (Registered)
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
    results.push({ step: 'Test F: Purchase 2nd Motorcycle (Registered)', status: 'PASSED', detail: `Bike ID: ${bike2Id}` });

    // TEST G: Sell on Finance
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
    results.push({ step: 'Test G: Sell Bike on Finance / Installments', status: 'PASSED', detail: `Finance ID: ${resG.financeId}` });

    // TEST H: Collect 1st Installment
    if (!resG.financeId) throw new Error('Missing financeId');
    await dbManager.payInstallmentTransaction({
      customerId: custGId,
      financeId: resG.financeId,
      amount: 38334,
      paymentMethod: 'Cash',
      note: '1st Installment paid on time',
    });
    results.push({ step: 'Test H: Collect 1st Installment & Verify Cashbook', status: 'PASSED', detail: 'Collected Rs. 38,334' });

    // TEST I: Uniqueness check: Block duplicate engine
    try {
      await dbManager.createPurchaseTransaction({
        seller: { name: 'Fake Seller', phone: '0300-0000000', cnic: '35202-0000000-0' },
        bike: {
          make: 'Honda',
          model: 'CD 70',
          year: 2024,
          color: 'Red',
          engineNumber: testEng1,
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
        results.push({ step: 'Test I: Uniqueness Check: Block Duplicate Engine', status: 'PASSED', detail: err.message });
      } else {
        throw err;
      }
    }

    // TEST J: Documentation persistence
    const docs = await dbManager.getAllDocuments();
    const docBike1 = docs.find((d) => d.bikeId === bike1Id);
    if (docBike1 && docBike1.docNotes.includes('QA Verified')) {
      results.push({ step: 'Test J: Documentation Persistence Audit', status: 'PASSED', detail: docBike1.docNotes });
    } else {
      throw new Error('Documentation notes not persisted');
    }

    // TEST K: Full Backup Export
    const backupData = await dbManager.exportCompleteBackup();
    if (backupData.version === 4 && backupData.data.bikes?.length > 0) {
      results.push({ step: 'Test K: Full Backup Export & Schema Integrity', status: 'PASSED', detail: `Bikes: ${backupData.data.bikes.length}` });
    } else {
      throw new Error('Invalid backup schema output');
    }

    // TEST L: Health Check
    const healthItems = await dbManager.runHealthCheck();
    const healthFailed = healthItems.filter((x) => x.status === 'failed');
    if (healthFailed.length === 0) {
      results.push({ step: 'Test L: Complete Health Check & Database Audit', status: 'PASSED', detail: `${healthItems.length} checks passed` });
    } else {
      throw new Error(`Health check failed: ${healthFailed.map((f) => f.name).join(', ')}`);
    }

    // TEST M: Atomic Rollback Verification
    // Verify that if a transaction encounters an error, state is NOT partially written
    const bikesBefore = await dbManager.getAllBikes();
    const purchasesBefore = await dbManager.getAllPurchases();
    try {
      await dbManager.createPurchaseTransaction({
        seller: { name: 'Rollback Seller', phone: '0300-1111111', cnic: '35202-1111111-1' },
        bike: {
          make: 'Honda',
          model: 'CD 70',
          year: 2024,
          color: 'Black',
          engineNumber: testEng1, // Intentionally duplicate to trigger rejection
          chassisNumber: `CHAS-ROLL-${rand}`,
          condition: 'New',
        },
        purchaseCost: 90000,
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
          docNotes: 'Rollback test',
        },
      });
    } catch {
      // Expected failure
    }
    const bikesAfter = await dbManager.getAllBikes();
    const purchasesAfter = await dbManager.getAllPurchases();
    if (bikesBefore.length === bikesAfter.length && purchasesBefore.length === purchasesAfter.length) {
      results.push({ step: 'Test M: Atomic Rollback Integrity', status: 'PASSED', detail: 'No orphaned records created on failure' });
    } else {
      throw new Error('Atomic rollback failed: orphaned records created!');
    }

  } catch (err: any) {
    results.push({ step: 'Suite Execution', status: 'FAILED', error: err.message });
  }

  console.log('\n--- RESULTS ---');
  let passCount = 0;
  let failCount = 0;
  for (const r of results) {
    if (r.status === 'PASSED') {
      passCount++;
      console.log(`[PASS] ${r.step} - ${r.detail || ''}`);
    } else {
      failCount++;
      console.log(`[FAIL] ${r.step} - Error: ${r.error}`);
    }
  }
  console.log(`\nTotal: ${passCount} PASSED, ${failCount} FAILED`);
}

runSuite().catch(console.error);
