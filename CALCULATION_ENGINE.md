# ChickCheck — Business Calculation Engine Specification
# Chachu's Excel Sheet Ke Anusar (AL MAUSAF CHICKEN CENTRE, Dec 2020 - Feb 2022)

---

## 1. DAILY RATE SETUP (Roz Ka Rate)

```
Farm Rate   = User enters manually every morning (e.g. 300 PKR/kg)
Supply Rate = Farm Rate + Supplier Premium  (e.g. 300 + 4 = 304 PKR/kg)
```

- **Farm Rate**: Ye woh rate hai jo Chachu ko market se pata chalta hai (Universal daily market price).
- **Supplier Premium**: Default +4 PKR (kabhi kabhi deal mein different, but mostly 4 PKR).
- **Supply Rate** = `Farm Rate + Supplier Premium` = Ye woh rate hai jis par Chachu MURGI KHAREEDTA hai aur jis par products BECHNE ki calculation hoti hai.

> ⚠️ IMPORTANT: Chachu SUPPLIER ko `Farm Rate` pay karta tha (without premium), aur `Supply Rate` apne costing ke liye use karta tha.

---

## 2. LIVE HEN PURCHASING (Zinda Murgi Kharidna)

```
Input:
  Gross Weight  = Total murgi ka wazan aaney par (e.g. 250 Kg)
  Dud Weight    = Dead / underweight murgiyan (e.g. 5 Kg)

Calculation:
  Net Weight    = Gross Weight - Dud Weight  (e.g. 250 - 5 = 245 Kg)
  Rate Per Kg   = Supply Rate  (e.g. 304 PKR/kg) ← Chachu apni cost pe base karta hai
  Total Amount  = Net Weight × Rate Per Kg  (e.g. 245 × 304 = 74,480 PKR)
```

- Net Weight automatically Live Hen stock mein `IN` entry ban'ta hai.
- 3 regular suppliers: Asim, Majid, Farhan (kabhi Danish bhi).

---

## 3. PRODUCT PRICING MULTIPLIERS (Selling Rates)

Chachu ne Excel mein har product ka rate `Supply Rate` se multiply karke nikala:

| Product          | Urdu Name   | Pricing Type | Multiplier     | Example (Supply=304) |
|:-----------------|:------------|:-------------|:---------------|:---------------------|
| Live Hen         | Zinda Murgi | MULTIPLIER   | 1.0x           | Rs 304/kg            |
| Chicken Meat     | Safi Murgi  | MULTIPLIER   | 1.5x           | Rs 456/kg            |
| Boneless         | Boneless    | MULTIPLIER   | 2.0x (or 2.3x) | Rs 608/kg (or 699)   |
| Tikka Cut        | Tikka       | MULTIPLIER   | 1.6x           | Rs 486/kg            |
| Kalagi (Liver)   | Kalagi      | FIXED        | —              | Daily fixed (e.g. 300)|
| Poota (Gizzard)  | Poota       | FIXED        | —              | Daily fixed (e.g. 250)|
| Neck             | Gardan      | FIXED        | —              | Daily fixed (e.g. 200)|
| Wings            | Parr        | FIXED        | —              | Daily fixed (e.g. 250)|

### Customer-Specific Multiplier Overrides
Certain wholesale customers get special rates:
- e.g. Customer X gets Chicken Meat at **1.45x** instead of 1.5x
- Stored in `CustomerMultiplier` table in database
- System checks customer overrides FIRST before using default multiplier

---

## 4. ORDER CALCULATION (POS Bill Banana)

```
For each item in an order:
  If Product.pricingType == 'MULTIPLIER':
    effectiveMultiplier = CustomerMultiplier ?? Product.defaultMultiplier ?? 1.0
    unitPrice = Supply Rate × effectiveMultiplier
    item_total = unitPrice × quantity_kg

  If Product.pricingType == 'FIXED':
    unitPrice = Product.pricePerUnit  (set daily in product catalog)
    item_total = unitPrice × quantity_kg

Order Total = sum(all item_total)
```

---

## 5. DAILY EXPENSES (Rozana Kharcha)

Preset categories (matching Chachu's Excel columns):

| Category | Description |
|:---------|:------------|
| PETROL   | Delivery bike ka petrol |
| BAGS     | Poly bags for packaging |
| BIKE     | Bike repair/maintenance |
| PUNCHER  | Tire puncture repair |
| POLICE   | Police/Chungi payments |
| LUNCH    | Staff lunch/food |
| WAGES    | Daily labor wages |
| OTHER    | Miscellaneous |

---

## 6. END OF DAY PROFIT RECONCILIATION (Din Khatam Ka Hisaab)

```
Total Sales       = Sum of all non-cancelled Order.totalAmount for today
Total Purchases   = Sum of all SupplierPurchase.totalAmount for today
Total Expenses    = Sum of all Expense.amount for today

Gross Profit      = Total Sales - Total Purchases
Net Profit        = Gross Profit - Total Expenses

Cash Drawer       = Actual physical cash counted by Chachu at night
```

### Physical Stock Audit (Raat Ko Maal Ginan)
Chachu manually counts remaining stock of each product category at EOD:
- Live Hen (Zinda)
- Safi Meat
- Boneless
- Kalagi
- Poota
- Neck

These physical counts are recorded in `DailyStockAudit` table for next day's opening balance reference.

---

## 7. UDHAAR (Credit Ledger)

- Customer ke `totalUdhaar` field directly on Customer model.
- When Invoice is `UNPAID` → amount added to udhaar.
- When Payment recorded → udhaar reduces.

---

## 8. CRITICAL DATA FLOW (Full Business Day)

```
Morning:
  1. Chachu enters Farm Rate → Supply Rate calculated automatically (+4 PKR)

Throughout Day:
  2. Live Hen arrives → Supplier Purchase entry (Gross - Dud = Net, stock IN)
  3. Customers buy → Orders created (prices auto-calculated via multipliers)
  4. Expenses incurred → Logged as they happen

Evening:
  5. Physical stock counted product-wise
  6. Cash drawer counted
  7. EOD submitted → Net Profit = (Sales - Purchases - Expenses) shown instantly
```
