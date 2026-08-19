import 'dotenv/config'
import { db } from '../src/lib/db'

async function simulateBusinessDay() {
  console.log('\n======================================================')
  console.log('🚀 CHICKCHECK FULL BUSINESS DAY SIMULATION & AUDIT TEST')
  console.log('======================================================\n')

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  // ---------------------------------------------------------
  // STEP 1: SET DAILY FARM RATE
  // ---------------------------------------------------------
  console.log('📌 STEP 1: Setting Today\'s Farm Rate...')
  const farmRate = 300
  const supplierPremium = 4
  const supplyRate = farmRate + supplierPremium

  const dailyRate = await db.dailyRate.upsert({
    where: { date: today },
    update: { farmRate, supplierPremium, supplyRate },
    create: { date: today, farmRate, supplierPremium, supplyRate },
  })
  console.log(`✅ Farm Rate Set: Rs ${dailyRate.farmRate}/kg | Standard Supply Rate: Rs ${dailyRate.supplyRate}/kg`)

  // ---------------------------------------------------------
  // STEP 2: VERIFY/SEED PRODUCTS
  // ---------------------------------------------------------
  console.log('\n📌 STEP 2: Ensuring Products Catalog is Ready...')
  const productDefs = [
    { name: 'Chicken Meat (Safi Meat)', unit: 'kg', pricingType: 'MULTIPLIER', defaultMultiplier: 1.5, pricePerUnit: 0, isByproduct: false },
    { name: 'Boneless', unit: 'kg', pricingType: 'MULTIPLIER', defaultMultiplier: 2.0, pricePerUnit: 0, isByproduct: false },
    { name: 'Tikka Cut', unit: 'kg', pricingType: 'MULTIPLIER', defaultMultiplier: 1.6, pricePerUnit: 0, isByproduct: false },
    { name: 'Kalagi (Liver)', unit: 'kg', pricingType: 'FIXED', defaultMultiplier: null, pricePerUnit: 300, isByproduct: true },
    { name: 'Wings (Parr)', unit: 'kg', pricingType: 'FIXED', defaultMultiplier: null, pricePerUnit: 250, isByproduct: true },
  ]

  const products: Record<string, any> = {}
  for (const p of productDefs) {
    let prod = await db.product.findFirst({ where: { name: p.name } })
    if (!prod) {
      prod = await db.product.create({ data: p })
    }
    products[p.name] = prod
  }
  console.log(`✅ ${Object.keys(products).length} Products verified (Meat, Boneless, Tikka, Kaleji, Wings)`)

  // ---------------------------------------------------------
  // STEP 3: SUPPLIERS & MORNING LIVE HEN PURCHASES
  // ---------------------------------------------------------
  console.log('\n📌 STEP 3: Registering Suppliers & Recording Morning Live Hen Deliveries...')

  // Supplier A: Haji Shabeen (+Rs 4 markup)
  let sup1 = await db.supplier.findFirst({ where: { name: 'Haji Shabeen Broiler' } })
  if (!sup1) {
    sup1 = await db.supplier.create({
      data: { name: 'Haji Shabeen Broiler', phone: '0300-1122334', address: 'Chak 45 Mandi', ratePremium: 4 },
    })
  }

  // Supplier B: Faisal Farms (-Rs 8 discount relative to Farm Rate)
  let sup2 = await db.supplier.findFirst({ where: { name: 'Faisal Farms' } })
  if (!sup2) {
    sup2 = await db.supplier.create({
      data: { name: 'Faisal Farms', phone: '0321-9988776', address: 'Sheikhupura Road', ratePremium: -8 },
    })
  }

  // Record Purchases:
  // Delivery 1: Haji Shabeen: 250 kg @ (300 + 4) = Rs 304/kg -> Rs 76,000 (Paid Rs 50,000 cash, Rs 26,000 Udhaar)
  const p1Gross = 250
  const p1Rate = farmRate + (sup1.ratePremium ?? 4)
  const p1Amount = p1Gross * p1Rate
  const p1Cash = 50000

  const purchase1 = await db.supplierPurchase.create({
    data: {
      supplierId: sup1.id,
      supplierName: sup1.name,
      grossWeight: p1Gross,
      dudWeight: 0,
      netWeight: p1Gross,
      ratePerKg: p1Rate,
      totalAmount: p1Amount,
      cashPaid: p1Cash,
      purchaseDate: today,
    },
  })

  // Delivery 2: Faisal Farms: 150 kg @ (300 - 8) = Rs 292/kg -> Rs 43,800 (Paid Rs 0 cash, Rs 43,800 Udhaar)
  const p2Gross = 150
  const p2Rate = farmRate + (sup2.ratePremium ?? -8)
  const p2Amount = p2Gross * p2Rate
  const p2Cash = 0

  const purchase2 = await db.supplierPurchase.create({
    data: {
      supplierId: sup2.id,
      supplierName: sup2.name,
      grossWeight: p2Gross,
      dudWeight: 0,
      netWeight: p2Gross,
      ratePerKg: p2Rate,
      totalAmount: p2Amount,
      cashPaid: p2Cash,
      purchaseDate: today,
    },
  })

  // Update Supplier running balances
  await db.supplier.update({
    where: { id: sup1.id },
    data: { totalPayable: { increment: p1Amount - p1Cash } },
  })
  await db.supplier.update({
    where: { id: sup2.id },
    data: { totalPayable: { increment: p2Amount - p2Cash } },
  })

  // Initialize/Update Live Weight Pool
  const totalPurchasedKg = p1Gross + p2Gross // 400 kg
  const pool = await db.liveWeightPool.upsert({
    where: { date: today },
    update: {
      purchasesWeight: { increment: totalPurchasedKg },
    },
    create: {
      date: today,
      openingWeight: 0,
      purchasesWeight: totalPurchasedKg,
      soldWeight: 0,
    },
  })

  console.log(`✅ Delivery #1: ${sup1.name} — ${p1Gross} kg @ Rs ${p1Rate}/kg = Rs ${p1Amount.toLocaleString('en-PK')} (Paid: Rs ${p1Cash.toLocaleString('en-PK')})`)
  console.log(`✅ Delivery #2: ${sup2.name} — ${p2Gross} kg @ Rs ${p2Rate}/kg = Rs ${p2Amount.toLocaleString('en-PK')} (Paid: Rs ${p2Cash.toLocaleString('en-PK')})`)
  console.log(`📊 Total Live Hen Stock in Cage: ${totalPurchasedKg} kg | Total Purchases: Rs ${(p1Amount + p2Amount).toLocaleString('en-PK')}`)

  // ---------------------------------------------------------
  // STEP 4: CUSTOMERS & CUSTOM MULTIPLIERS
  // ---------------------------------------------------------
  console.log('\n📌 STEP 4: Setting up Customers & Custom Multipliers...')

  // Customer A: Restaurant "Khyber Shinwari Restaurant"
  let cust1 = await db.customer.findFirst({ where: { name: 'Khyber Shinwari Restaurant' } })
  if (!cust1) {
    cust1 = await db.customer.create({
      data: { name: 'Khyber Shinwari Restaurant', type: 'RESTAURANT', phone: '0333-5544332', address: 'Main Boulevard' },
    })
  }

  // Set custom Boneless multiplier 2.1x for Shinwari
  await db.customerMultiplier.upsert({
    where: {
      customerId_productId: { customerId: cust1.id, productId: products['Boneless'].id },
    },
    update: { multiplier: 2.1 },
    create: { customerId: cust1.id, productId: products['Boneless'].id, multiplier: 2.1 },
  })

  // Customer B: Retail Walk-in Customer "Asghar Ali"
  let cust2 = await db.customer.findFirst({ where: { name: 'Asghar Ali (Retail)' } })
  if (!cust2) {
    cust2 = await db.customer.create({
      data: { name: 'Asghar Ali (Retail)', type: 'RETAIL', phone: '0345-1234567' },
    })
  }

  console.log(`✅ Customer 1: ${cust1.name} (Restaurant — Custom Boneless Rate: 2.1× SupplyRate)`)
  console.log(`✅ Customer 2: ${cust2.name} (Retail — Standard Rates)`)

  // ---------------------------------------------------------
  // STEP 5: ORDERS & DELIVERIES (POS)
  // ---------------------------------------------------------
  console.log('\n📌 STEP 5: Processing Orders & Generating Invoices...')

  // Order 1: Khyber Shinwari -> 50 kg Boneless @ (304 * 2.1 = Rs 638/kg) -> Rs 31,900
  const shinwariBonelessRate = Math.round(supplyRate * 2.1) // 304 * 2.1 = 638.4 -> 638
  const shinwariQty = 50
  const order1Total = shinwariQty * shinwariBonelessRate // Rs 31,900

  const order1 = await db.order.create({
    data: {
      customerId: cust1.id,
      status: 'DELIVERED',
      totalAmount: order1Total,
      deliveredAt: today,
      orderDate: today,
      items: {
        create: [
          {
            productId: products['Boneless'].id,
            quantity: shinwariQty,
            unitPrice: shinwariBonelessRate,
            total: order1Total,
          },
        ],
      },
    },
  })

  // Create Invoice for Order 1
  const inv1 = await db.invoice.create({
    data: {
      orderId: order1.id,
      customerId: cust1.id,
      totalAmount: order1Total,
      paidAmount: 20000,
      status: 'PARTIAL',
    },
  })

  // Record Partial Payment of Rs 20,000 from Shinwari
  await db.payment.create({
    data: {
      invoiceId: inv1.id,
      customerId: cust1.id,
      amount: 20000,
      method: 'CASH',
      note: 'Partial delivery payment',
      paidAt: today,
    },
  })

  // Customer 1 Udhaar balance increases by Rs 11,900
  await db.customer.update({
    where: { id: cust1.id },
    data: { totalUdhaar: { increment: order1Total - 20000 } },
  })

  // Order 2: Walk-in Asghar -> 80 kg Chicken Meat @ (304 * 1.5 = Rs 456/kg) + 10 kg Kaleji @ Rs 300/kg
  const meatRate = Math.round(supplyRate * 1.5) // 456
  const meatQty = 80
  const meatTotal = meatQty * meatRate // 36,480

  const kalejiRate = 300 // fixed
  const kalejiQty = 10
  const kalejiTotal = kalejiQty * kalejiRate // 3,000

  const order2Total = meatTotal + kalejiTotal // 39,480

  const order2 = await db.order.create({
    data: {
      customerId: cust2.id,
      status: 'DELIVERED',
      totalAmount: order2Total,
      deliveredAt: today,
      orderDate: today,
      items: {
        create: [
          { productId: products['Chicken Meat (Safi Meat)'].id, quantity: meatQty, unitPrice: meatRate, total: meatTotal },
          { productId: products['Kalagi (Liver)'].id, quantity: kalejiQty, unitPrice: kalejiRate, total: kalejiTotal },
        ],
      },
    },
  })

  // Create Invoice for Order 2 (Paid in full)
  const inv2 = await db.invoice.create({
    data: {
      orderId: order2.id,
      customerId: cust2.id,
      totalAmount: order2Total,
      paidAmount: order2Total,
      status: 'PAID',
    },
  })

  await db.payment.create({
    data: {
      invoiceId: inv2.id,
      customerId: cust2.id,
      amount: order2Total,
      method: 'CASH',
      paidAt: today,
    },
  })

  // Deduct Live Pool Sold Weight: 50 kg (Boneless) + 80 kg (Chicken Meat) = 130 kg (Kaleji is byproduct, no live deduction)
  const livePoolSoldKg = shinwariQty + meatQty // 130 kg
  await db.liveWeightPool.update({
    where: { date: today },
    data: { soldWeight: { increment: livePoolSoldKg } },
  })

  console.log(`✅ Order 1 (Khyber Shinwari): 50 kg Boneless = Rs ${order1Total.toLocaleString('en-PK')} (Paid: Rs 20,000 | Udhaar: Rs ${(order1Total - 20000).toLocaleString('en-PK')})`)
  console.log(`✅ Order 2 (Asghar Ali): 80 kg Meat + 10 kg Kaleji = Rs ${order2Total.toLocaleString('en-PK')} (Paid in full)`)
  console.log(`📊 Total Day Sales: Rs ${(order1Total + order2Total).toLocaleString('en-PK')} | Live Weight Deducted: ${livePoolSoldKg} kg`)

  // ---------------------------------------------------------
  // STEP 6: EMERGENCY SHORTFALL PURCHASE
  // ---------------------------------------------------------
  console.log('\n📌 STEP 6: Recording Shortfall / Emergency Purchase...')
  const emergQty = 5
  const emergRate = 220
  const emergCost = emergQty * emergRate

  await db.emergencyPurchase.create({
    data: {
      isLiveHen: false,
      productId: products['Wings (Parr)'].id,
      supplierName: 'Kamran Chicken Corner',
      quantity: emergQty,
      costPerKg: emergRate,
      totalCost: emergCost,
      note: 'Urgent wings shortfall for evening orders',
      purchaseDate: today,
    },
  })
  console.log(`✅ Emergency Purchase: 5.0 kg Wings @ Rs ${emergRate}/kg = Rs ${emergCost.toLocaleString('en-PK')}`)

  // ---------------------------------------------------------
  // STEP 7: RECORD DAILY SHOP EXPENSES
  // ---------------------------------------------------------
  console.log('\n📌 STEP 7: Recording Daily Shop Expenses...')
  const expenses = [
    { category: 'PETROL', amount: 500, note: 'Delivery bike petrol' },
    { category: 'BAGS', amount: 1200, note: 'Poly bags 2 bundles' },
    { category: 'WAGES', amount: 1500, note: 'Daily helper mazdoori' },
  ] as const

  let totalExpenses = 0
  for (const exp of expenses) {
    await db.expense.create({
      data: {
        category: exp.category,
        amount: exp.amount,
        note: exp.note,
        date: today,
      },
    })
    totalExpenses += exp.amount
  }
  console.log(`✅ Recorded 3 Expenses totaling Rs ${totalExpenses.toLocaleString('en-PK')} (Petrol, Bags, Wages)`)

  // ---------------------------------------------------------
  // STEP 8: DAY CLOSING / END OF DAY AUDIT
  // ---------------------------------------------------------
  console.log('\n📌 STEP 8: Performing Day Closing (EOD Audit)...')

  // Live pool check: Opening (0) + Purchases (400) - Sold (130) = Expected 270 kg
  const expectedCageKg = 400 - 130 // 270 kg
  const physicalCageKg = 268.5 // 1.5 kg natural shrinkage
  const cageVariance = physicalCageKg - expectedCageKg // -1.5 kg

  await db.liveWeightPool.update({
    where: { date: today },
    data: {
      closingWeight: physicalCageKg,
      variance: cageVariance,
      note: 'Normal 1.5 kg day shrinkage observed',
    },
  })

  // Record Leftover Cuts in Freezer
  const freezerCuts = [
    { productId: products['Chicken Meat (Safi Meat)'].id, closingKg: 12.0 },
    { productId: products['Boneless'].id, closingKg: 4.5 },
    { productId: products['Kalagi (Liver)'].id, closingKg: 3.0 },
  ]

  for (const cut of freezerCuts) {
    await db.dailyStockAudit.create({
      data: {
        productId: cut.productId,
        auditDate: today,
        closingKg: cut.closingKg,
      },
    })
  }

  // Cash in Hand:
  // Spot Cash In = Rs 20,000 (Shinwari) + Rs 39,480 (Asghar) = Rs 59,480
  // Spot Cash Paid to Suppliers = Rs 50,000 (Haji Shabeen)
  // Expenses = Rs 3,200
  // Cash Drawer Net = 59,480 - 50,000 - 3,200 = Rs 6,280 in till
  const totalSales = order1Total + order2Total // 71,380
  const totalPurchases = p1Amount + p2Amount // 119,800
  const grossProfit = totalSales - totalPurchases - emergCost
  const netProfit = grossProfit - totalExpenses
  const retailCashDrawer = 6280

  const eodReport = await db.endOfDay.upsert({
    where: { reportDate: today },
    update: {
      farmRate,
      supplyRate,
      totalSales,
      totalPurchases,
      totalExpenses,
      grossProfit,
      netProfit,
      retailCashDrawer,
      discrepancy: cageVariance,
      note: 'Day closing completed smoothly with full audit logs',
    },
    create: {
      reportDate: today,
      farmRate,
      supplyRate,
      totalSales,
      totalPurchases,
      totalExpenses,
      grossProfit,
      netProfit,
      retailCashDrawer,
      discrepancy: cageVariance,
      note: 'Day closing completed smoothly with full audit logs',
    },
  })

  console.log(`✅ Live Cage Audit: Expected ${expectedCageKg} kg | Actual Count: ${physicalCageKg} kg (Variance: ${cageVariance} kg)`)
  console.log(`✅ Freezer Stock Audit: Meat: 12.0 kg, Boneless: 4.5 kg, Kaleji: 3.0 kg stored in database`)
  console.log(`✅ Day Closing Saved: Total Sales: Rs ${totalSales.toLocaleString('en-PK')} | Total Purchases: Rs ${totalPurchases.toLocaleString('en-PK')} | Expenses: Rs ${totalExpenses.toLocaleString('en-PK')}`)

  // ---------------------------------------------------------
  // FINAL VERIFICATION REPORT
  // ---------------------------------------------------------
  console.log('\n======================================================')
  console.log('🎉 SIMULATION TEST COMPLETE — BUSINESS AUDIT SUMMARY')
  console.log('======================================================')
  console.log(`📅 Date: ${today.toDateString()}`)
  console.log(`💵 Farm Rate: Rs ${dailyRate.farmRate}/kg | Supply Rate: Rs ${dailyRate.supplyRate}/kg`)
  console.log(`🐔 Total Live Hens Purchased: ${totalPurchasedKg} kg (Cost: Rs ${totalPurchases.toLocaleString('en-PK')})`)
  console.log(`🍗 Total Orders Delivered: 2 (Gross Revenue: Rs ${totalSales.toLocaleString('en-PK')})`)
  console.log(`💸 Customer Udhaar Created: Rs ${(order1Total - 20000).toLocaleString('en-PK')} (Khyber Shinwari)`)
  console.log(`📋 Supplier Udhaar Outstanding: Rs ${((p1Amount - p1Cash) + (p2Amount - p2Cash)).toLocaleString('en-PK')} (Shabeen: Rs 26k, Faisal: Rs 43.8k)`)
  console.log(`📉 Shop Expenses: Rs ${totalExpenses.toLocaleString('en-PK')} (Petrol, Bags, Mazdoori)`)
  console.log(`📦 Overnight Cage Inventory: ${physicalCageKg} kg live hens`)
  console.log(`❄️ Overnight Freezer Inventory: 19.5 kg ready cuts`)
  console.log(`💰 Retail Cash in Till: Rs ${retailCashDrawer.toLocaleString('en-PK')}`)
  console.log('======================================================\n')
}

simulateBusinessDay()
  .catch((e) => {
    console.error('❌ SIMULATION ERROR:', e)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })
