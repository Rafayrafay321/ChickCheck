# ChickCheck POS — Master Technical Specification & Architecture Memory

**Project Name:** ChickCheck POS  
**Target User:** Chachu (Chicken Wholesale & Retail Business Owner)  
**Business Domain:** Live Hen Purchasing, Yield & Multiplier Meat Distribution, Retail & Wholesale POS, Udhaar Ledger, EOD Net Profit Audit  
**Last Updated:** August 2026  

---

## 1. Project Purpose & Core Business Logic

### Business Model (Chachu's Excel Logic — 3+ Years Operational Model)
This application replaces Chachu's 3-year operational Excel sheet (`AL MAUSAF CHICKEN CENTRE`) with a fast, offline-first local desktop/web POS.

1. **Daily Purchasing (Live Hen / Zinda Murgi)**:
   - **Farm Rate**: Universal daily base rate (e.g., Rs 300/kg).
   - **Supplier Premium**: Default `+4 PKR` (or deal-specific override).
   - **Supply Rate**: `Farm Rate + Supplier Premium` (e.g., 300 + 4 = 304 PKR/kg).
   - **Net Weight Calculation**: `Net Weight = Gross Weight - Dud Weight` (where Dud = mortality/deduction/dead birds in kg).
   - **Live Stock Entry**: Live purchasing automatically inserts an `IN` stock entry for Live Hen.

2. **Dynamic Multiplier Selling Rates**:
   Products do not have static hardcoded prices; their prices resolve dynamically based on today's `Supply Rate`:
   - **Live Hen**: `1.0x` Supply Rate
   - **Chicken Meat (Safi)**: `1.5x` Supply Rate
   - **Boneless**: `2.0x` (or custom 2.3x) Supply Rate
   - **Tikka Cut**: `1.6x` Supply Rate
   - **Customer-Specific Overrides**: Wholesale clients can have custom multipliers (e.g., Meat `1.45x` for Customer X) stored in `CustomerMultiplier` table.
   - **Fixed Price Items**: Special parts (Kalagi/Liver, Poota/Gizzard, Neck, Wings) use daily fixed prices.

3. **Daily Expenses Tracking**:
   Categorized daily operational expenses: `PETROL`, `BAGS` (Poly bags), `BIKE` (Repair), `PUNCHER`, `POLICE`, `LUNCH`, `WAGES`, `OTHER`.

4. **End of Day (EOD) Physical Audit & Net Profit**:
   - Physical count at night for 6 core items: *Live, Safi Meat, Boneless, Kalagi, Poota, Neck*.
   - **Financial Reconciliation Formula**:  
     $$\text{Gross Profit} = \text{Total Sales} - \text{Total Live Purchases}$$  
     $$\text{Net Profit} = \text{Gross Profit} - \text{Total Daily Expenses}$$

---

## 2. Technology Stack & Architectural Principles

### Core Stack
- **Framework:** Next.js (App Router, React 19)
- **Language:** TypeScript (Strict mode, zero compile warnings)
- **Styling:** Pure **Tailwind CSS v4** `@import "tailwindcss";` & `@theme` design tokens (No inline styles)
- **Database:** SQLite local database via **Prisma ORM v7** using `@prisma/adapter-libsql` & `@libsql/client`
- **API Architecture:** Next.js REST Route Handlers (`src/app/api/.../route.ts`)
- **State & Data Access:** Custom React Hooks (`useDailyRate`, `useSupplierPurchases`)

### Clean Architecture Principles (4-Layer Pattern)
1. **Data Access Layer:** Custom React Hooks (`src/hooks/`) for API fetching, loading, error handling.
2. **Reusable UI Shells:** Atomic components (`src/components/ui/Modal.tsx`, `FormField.tsx`, `Table.tsx`, `Badge.tsx`).
3. **Specialized Form Components:** Independent form components (`DailyRateForm.tsx`, `SupplierPurchaseForm.tsx`).
4. **Presentational Layout Components:** Page & Layout components (`DailyRateBanner.tsx`, `Sidebar.tsx`, `AppLayout.tsx`).

---

## 3. Database Schema Overview (`ChickCheck/prisma/schema.prisma`)

| Model | Table Name | Purpose |
|:---|:---|:---|
| `Owner` | `owner` | Admin credentials & shop info |
| `DailyRate` | `daily_rates` | Daily `farmRate`, `supplierPremium` (+4), `supplyRate` |
| `SupplierPurchase` | `supplier_purchases` | Live Hen purchases (`grossWeight`, `dudWeight`, `netWeight`, `ratePerKg`, `totalAmount`) |
| `Customer` | `customers` | Wholesale & Retail customer profiles, `totalUdhaar` balance |
| `Product` | `products` | Seeded 8 core products, `pricingType` (MULTIPLIER / FIXED), `defaultMultiplier` |
| `CustomerMultiplier` | `customer_multipliers` | Join table for customer-specific multiplier overrides (e.g. 1.45x Meat) |
| `Expense` | `expenses` | Operational expenses logger with preset categories |
| `DailyStockAudit` | `daily_stock_audits` | Physical closing counts per product |
| `StockEntry` | `stock_entries` | Immutable stock ledger (`IN` / `OUT`) |
| `Order` | `orders` | Sales orders created via POS |
| `OrderItem` | `order_items` | Individual line items with calculated unit price |
| `Invoice` | `invoices` | Billing & payment tracking |
| `Payment` | `payments` | Customer payment history |
| `EndOfDay` | `end_of_day` | Daily financial & audit summary |

---

## 4. API Endpoints Map

- `GET / POST /api/daily-rate` — Read/Write today's Farm Rate & Supply Rate
- `GET / POST /api/purchases` — Read/Write Live Hen supplier purchases
- `GET / POST /api/customer-multipliers` — Read/Write customer discount multipliers
- `GET / POST /api/expenses` — Read/Write daily operational expenses
- `GET / POST /api/products` — Product catalog management
- `GET / POST /api/orders` — Atomic order creation with dynamic multiplier price resolution & invoice generation
- `GET / POST /api/eod` — Physical stock audit submission & Net Profit calculation

---

## 5. File & Directory Structure

```
ChickCheck/
├── prisma/
│   ├── schema.prisma               ← Primary SQLite schema (Prisma 7)
│   ├── seed.ts                     ← Product seeding script (8 core items)
│   └── dev.db                      ← Local SQLite database
├── src/
│   ├── app/
│   │   ├── (dashboard)/            ← Dashboard pages (dashboard, customers, products, stock, orders, invoices, udhaar, end-of-day)
│   │   │   └── layout.tsx          ← Dashboard layout with DailyRateBanner
│   │   ├── api/                    ← Next.js REST API routes
│   │   ├── globals.css             ← Tailwind v4 theme & global styles
│   │   └── layout.tsx              ← Root HTML layout
│   ├── components/
│   │   ├── ui/                     ← Modal.tsx, FormField.tsx, Badge.tsx
│   │   ├── layout/                 ← Sidebar.tsx, DailyRateBanner.tsx
│   │   ├── daily-rate/             ← DailyRateForm.tsx
│   │   ├── stock/                  ← SupplierPurchaseForm.tsx, SupplierPurchaseModal.tsx
│   │   └── orders/                 ← CreateOrderModal.tsx
│   ├── hooks/                      ← useDailyRate.ts, useSupplierPurchases.ts
│   ├── lib/
│   │   └── db.ts                   ← Prisma Client v7 singleton with LibSql driver
│   └── shared/
│       └── types.ts                ← TypeScript interfaces & DTOs
```
