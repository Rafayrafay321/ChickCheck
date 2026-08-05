# Dukaan POS — V1 Technical Specification
### Web-Based POS for Local Retail & Wholesale Chicken Business
**Version:** 1.0  
**Author:** Abdul Rafay  
**Last Updated:** July 2026

---

## 1. Project Overview

### What Is This
A web application for a chicken retail and wholesale business owner to manage inventory, restaurant orders, invoices, and udhaar (customer debt). Uses a Next.js full-stack architecture with SQLite for local development and future PostgreSQL for production cloud deployment.

### Why It Exists
The owner currently tracks everything in Excel. This system replaces that with a fast, visual, offline-first desktop app that requires no internet to operate and no technical knowledge to use.

### Who Uses It
- **Primary User:** The owner (chachu) — manages everything on a laptop in the back office
- **Not for:** Counter workers — they continue working as before, no change to their workflow

### Business Model (For Future Scaling)
- **One-time setup fee:** Rs. 10,000–15,000 (installation + training)
- **Monthly subscription:** Rs. 2,500/month for cloud sync + mobile dashboard access
- **Free tier:** Desktop app works fully offline forever, no subscription required
- **Paid tier:** Cloud sync + mobile read-only dashboard for remote monitoring

---

## 2. Tech Stack

### Web App
| Layer | Technology | Reason |
|-------|-----------|--------|
| Framework | Next.js (App Router) | Full-stack React — API routes + frontend in one project |
| Frontend | React + TypeScript | Familiar stack, component-based UI |
| Styling | Tailwind CSS v4 | Fast, utility-first styling |
| Database | SQLite via Prisma ORM | Type-safe queries, easy local dev, swap to PG for prod |
| API | Next.js API Routes | RESTful endpoints replacing Electron IPC |
| PDF | jsPDF | Invoice PDF generation |
| Auth | localStorage + bcryptjs | Simple auth for Phase 1, upgrade to JWT later |

### Cloud Sync API
| Layer | Technology | Reason |
|-------|-----------|--------|
| Runtime | Node.js + Express | Already familiar |
| Database | PostgreSQL | Relational, handles business data correctly |
| ORM | Prisma | Type-safe queries |
| Auth | JWT | Simple token-based auth |
| Hosting | Railway | Free tier, easy deployment |

### Project Structure
```
dukaan-pos/
├── electron/                  # Electron main process
│   ├── main.ts                # App entry point
│   ├── preload.ts             # IPC bridge
│   └── database/
│       ├── db.ts              # SQLite connection
│       ├── migrations/        # SQLite schema migrations
│       └── queries/           # All SQLite query functions
│           ├── customers.ts
│           ├── products.ts
│           ├── stock.ts
│           ├── orders.ts
│           ├── invoices.ts
│           ├── payments.ts
│           └── sync.ts
├── src/                       # React renderer process
│   ├── main.tsx
│   ├── App.tsx
│   ├── pages/
│   │   ├── Dashboard.tsx
│   │   ├── Customers.tsx
│   │   ├── Products.tsx
│   │   ├── Stock.tsx
│   │   ├── Orders.tsx
│   │   ├── Invoices.tsx
│   │   ├── Udhaar.tsx
│   │   └── EndOfDay.tsx
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Sidebar.tsx
│   │   │   └── Header.tsx
│   │   ├── ui/
│   │   │   ├── Button.tsx
│   │   │   ├── Modal.tsx
│   │   │   ├── Badge.tsx
│   │   │   └── Table.tsx
│   │   ├── customers/
│   │   ├── orders/
│   │   ├── invoices/
│   │   └── stock/
│   ├── store/                 # Zustand stores
│   │   ├── useCustomerStore.ts
│   │   ├── useOrderStore.ts
│   │   └── useSyncStore.ts
│   ├── hooks/
│   │   ├── useIPC.ts          # Hook for Electron IPC calls
│   │   └── useSync.ts
│   └── utils/
│       ├── formatCurrency.ts
│       ├── formatDate.ts
│       └── pdfGenerator.ts
├── cloud-api/                 # Separate Express API for cloud sync
│   ├── src/
│   │   ├── index.ts
│   │   ├── routes/
│   │   │   ├── auth.ts
│   │   │   └── sync.ts
│   │   ├── middleware/
│   │   │   └── auth.ts
│   │   └── prisma/
│   │       └── schema.prisma
│   └── package.json
├── package.json
└── electron-builder.config.js
```

---

## 3. SQLite Database Schema (Local — Desktop)

This is the source of truth. All data lives here first.

```sql
-- ─── SYNC TRACKING ───────────────────────────────────────────────
-- Every table has synced_at to track what has been pushed to cloud

-- ─── OWNER / AUTH ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS owner (
  id          TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  name        TEXT NOT NULL,
  shop_name   TEXT NOT NULL,
  phone       TEXT,
  password    TEXT NOT NULL,   -- bcrypt hashed
  created_at  TEXT DEFAULT (datetime('now'))
);

-- ─── CUSTOMERS ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS customers (
  id          TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  name        TEXT NOT NULL,
  type        TEXT NOT NULL CHECK(type IN ('RESTAURANT', 'RETAIL')),
  phone       TEXT,
  address     TEXT,
  total_udhaar REAL DEFAULT 0,   -- running balance, updated on payment
  created_at  TEXT DEFAULT (datetime('now')),
  updated_at  TEXT DEFAULT (datetime('now')),
  synced_at   TEXT               -- null = not synced yet
);

-- ─── PRODUCTS ────────────────────────────────────────────────────
-- e.g. Whole Chicken, Boneless, Wings, Liver, Panja
CREATE TABLE IF NOT EXISTS products (
  id            TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  name          TEXT NOT NULL,
  name_urdu     TEXT,            -- Roman Urdu label e.g. "Poora Murgh"
  unit          TEXT NOT NULL CHECK(unit IN ('kg', 'piece')),
  price_per_unit REAL NOT NULL,
  is_active     INTEGER DEFAULT 1,
  created_at    TEXT DEFAULT (datetime('now')),
  updated_at    TEXT DEFAULT (datetime('now')),
  synced_at     TEXT
);

-- ─── STOCK ENTRIES ───────────────────────────────────────────────
-- Every stock movement is a new row — never update, only insert
-- Current stock = SUM(IN) - SUM(OUT) for each product
CREATE TABLE IF NOT EXISTS stock_entries (
  id          TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  product_id  TEXT NOT NULL REFERENCES products(id),
  type        TEXT NOT NULL CHECK(type IN ('IN', 'OUT')),
  quantity    REAL NOT NULL,
  note        TEXT,              -- e.g. "Morning delivery", "Order #123"
  entry_date  TEXT DEFAULT (datetime('now')),
  created_at  TEXT DEFAULT (datetime('now')),
  synced_at   TEXT
);

-- ─── ORDERS ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS orders (
  id            TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  customer_id   TEXT NOT NULL REFERENCES customers(id),
  status        TEXT NOT NULL DEFAULT 'PENDING'
                CHECK(status IN ('PENDING', 'DELIVERED', 'CANCELLED')),
  total_amount  REAL DEFAULT 0,
  note          TEXT,
  order_date    TEXT DEFAULT (datetime('now')),
  delivered_at  TEXT,
  created_at    TEXT DEFAULT (datetime('now')),
  updated_at    TEXT DEFAULT (datetime('now')),
  synced_at     TEXT
);

-- ─── ORDER ITEMS ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS order_items (
  id          TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  order_id    TEXT NOT NULL REFERENCES orders(id),
  product_id  TEXT NOT NULL REFERENCES products(id),
  quantity    REAL NOT NULL,
  unit_price  REAL NOT NULL,    -- price at time of order (not live price)
  total       REAL NOT NULL,    -- quantity * unit_price
  created_at  TEXT DEFAULT (datetime('now')),
  synced_at   TEXT
);

-- ─── INVOICES ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS invoices (
  id            TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  order_id      TEXT NOT NULL UNIQUE REFERENCES orders(id),
  customer_id   TEXT NOT NULL REFERENCES customers(id),
  total_amount  REAL NOT NULL,
  paid_amount   REAL DEFAULT 0,
  status        TEXT NOT NULL DEFAULT 'UNPAID'
                CHECK(status IN ('UNPAID', 'PARTIAL', 'PAID')),
  due_date      TEXT,
  created_at    TEXT DEFAULT (datetime('now')),
  updated_at    TEXT DEFAULT (datetime('now')),
  synced_at     TEXT
);

-- ─── PAYMENTS ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS payments (
  id          TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  invoice_id  TEXT NOT NULL REFERENCES invoices(id),
  customer_id TEXT NOT NULL REFERENCES customers(id),
  amount      REAL NOT NULL,
  method      TEXT DEFAULT 'CASH'
              CHECK(method IN ('CASH', 'JAZZCASH', 'EASYPAISA', 'BANK')),
  note        TEXT,
  paid_at     TEXT DEFAULT (datetime('now')),
  created_at  TEXT DEFAULT (datetime('now')),
  synced_at   TEXT
);

-- ─── END OF DAY ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS end_of_day (
  id                  TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  report_date         TEXT NOT NULL UNIQUE,   -- YYYY-MM-DD
  opening_stock_kg    REAL NOT NULL,
  closing_stock_kg    REAL NOT NULL,
  retail_cash_drawer  REAL NOT NULL,          -- physical cash counted
  restaurant_sales    REAL NOT NULL,          -- auto-calculated from orders
  retail_calculated   REAL NOT NULL,          -- auto-calculated from stock diff
  discrepancy         REAL NOT NULL,          -- cash_drawer vs calculated
  note                TEXT,
  created_at          TEXT DEFAULT (datetime('now')),
  synced_at           TEXT
);

-- ─── SYNC LOG ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sync_log (
  id          TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  synced_at   TEXT DEFAULT (datetime('now')),
  records_pushed INTEGER,
  status      TEXT CHECK(status IN ('SUCCESS', 'FAILED')),
  error       TEXT
);
```

---

## 4. PostgreSQL Cloud Schema (Prisma)

This mirrors the SQLite schema but adds `storeId` for multi-tenancy.

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Store {
  id          String      @id @default(cuid())
  name        String
  ownerName   String
  phone       String?
  customers   Customer[]
  products    Product[]
  orders      Order[]
  invoices    Invoice[]
  payments    Payment[]
  stockEntries StockEntry[]
  endOfDay    EndOfDay[]
  createdAt   DateTime    @default(now())
}

model Customer {
  id          String      @id
  storeId     String
  store       Store       @relation(fields: [storeId], references: [id])
  name        String
  type        CustomerType
  phone       String?
  address     String?
  totalUdhaar Float       @default(0)
  orders      Order[]
  invoices    Invoice[]
  payments    Payment[]
  createdAt   DateTime
  updatedAt   DateTime
}

enum CustomerType { RESTAURANT RETAIL }

model Product {
  id           String       @id
  storeId      String
  store        Store        @relation(fields: [storeId], references: [id])
  name         String
  nameUrdu     String?
  unit         String
  pricePerUnit Float
  isActive     Boolean      @default(true)
  orderItems   OrderItem[]
  stockEntries StockEntry[]
  createdAt    DateTime
  updatedAt    DateTime
}

model StockEntry {
  id         String    @id
  storeId    String
  store      Store     @relation(fields: [storeId], references: [id])
  productId  String
  product    Product   @relation(fields: [productId], references: [id])
  type       StockType
  quantity   Float
  note       String?
  entryDate  DateTime
  createdAt  DateTime
}

enum StockType { IN OUT }

model Order {
  id          String      @id
  storeId     String
  store       Store       @relation(fields: [storeId], references: [id])
  customerId  String
  customer    Customer    @relation(fields: [customerId], references: [id])
  status      OrderStatus @default(PENDING)
  totalAmount Float       @default(0)
  note        String?
  orderDate   DateTime
  deliveredAt DateTime?
  items       OrderItem[]
  invoice     Invoice?
  createdAt   DateTime
  updatedAt   DateTime
}

enum OrderStatus { PENDING DELIVERED CANCELLED }

model OrderItem {
  id        String   @id
  orderId   String
  order     Order    @relation(fields: [orderId], references: [id])
  productId String
  product   Product  @relation(fields: [productId], references: [id])
  quantity  Float
  unitPrice Float
  total     Float
  createdAt DateTime
}

model Invoice {
  id          String        @id
  storeId     String
  store       Store         @relation(fields: [storeId], references: [id])
  orderId     String        @unique
  order       Order         @relation(fields: [orderId], references: [id])
  customerId  String
  customer    Customer      @relation(fields: [customerId], references: [id])
  totalAmount Float
  paidAmount  Float         @default(0)
  status      InvoiceStatus @default(UNPAID)
  dueDate     DateTime?
  payments    Payment[]
  createdAt   DateTime
  updatedAt   DateTime
}

enum InvoiceStatus { UNPAID PARTIAL PAID }

model Payment {
  id         String        @id
  storeId    String
  store      Store         @relation(fields: [storeId], references: [id])
  invoiceId  String
  invoice    Invoice       @relation(fields: [invoiceId], references: [id])
  customerId String
  customer   Customer      @relation(fields: [customerId], references: [id])
  amount     Float
  method     PaymentMethod @default(CASH)
  note       String?
  paidAt     DateTime
  createdAt  DateTime
}

enum PaymentMethod { CASH JAZZCASH EASYPAISA BANK }

model EndOfDay {
  id                String   @id
  storeId           String
  store             Store    @relation(fields: [storeId], references: [id])
  reportDate        DateTime
  openingStockKg    Float
  closingStockKg    Float
  retailCashDrawer  Float
  restaurantSales   Float
  retailCalculated  Float
  discrepancy       Float
  note              String?
  createdAt         DateTime
}
```

---

## 5. Electron IPC Architecture

The renderer (React) cannot touch SQLite directly. It must go through Electron's IPC.

```
React (Renderer Process)
       |
       | window.electronAPI.xxx()   ← defined in preload.ts
       |
Preload Script (Bridge)
       |
       | ipcRenderer.invoke('channel-name', payload)
       |
Main Process (main.ts)
       |
       | ipcMain.handle('channel-name', handler)
       |
Prisma ORM → SQLite
```

### IPC Channels — Complete List

```typescript
// preload.ts exposes these to React:
contextBridge.exposeInMainWorld('electronAPI', {
  // Auth
  login: (password) => ipcRenderer.invoke('auth:login', password),

  // Customers
  getCustomers: () => ipcRenderer.invoke('customers:getAll'),
  createCustomer: (data) => ipcRenderer.invoke('customers:create', data),
  updateCustomer: (id, data) => ipcRenderer.invoke('customers:update', id, data),
  deleteCustomer: (id) => ipcRenderer.invoke('customers:delete', id),
  getCustomerUdhaar: (id) => ipcRenderer.invoke('customers:udhaar', id),

  // Products
  getProducts: () => ipcRenderer.invoke('products:getAll'),
  createProduct: (data) => ipcRenderer.invoke('products:create', data),
  updateProduct: (id, data) => ipcRenderer.invoke('products:update', id, data),

  // Stock
  getStockSummary: () => ipcRenderer.invoke('stock:summary'),
  addStockEntry: (data) => ipcRenderer.invoke('stock:add', data),
  getStockHistory: (productId) => ipcRenderer.invoke('stock:history', productId),

  // Orders
  getOrders: (filters) => ipcRenderer.invoke('orders:getAll', filters),
  createOrder: (data) => ipcRenderer.invoke('orders:create', data),
  updateOrderStatus: (id, status) => ipcRenderer.invoke('orders:updateStatus', id, status),
  cancelOrder: (id) => ipcRenderer.invoke('orders:cancel', id),

  // Invoices
  getInvoices: (filters) => ipcRenderer.invoke('invoices:getAll', filters),
  getInvoiceById: (id) => ipcRenderer.invoke('invoices:getById', id),
  generatePDF: (invoiceId) => ipcRenderer.invoke('invoices:generatePDF', invoiceId),

  // Payments
  recordPayment: (data) => ipcRenderer.invoke('payments:record', data),
  getPaymentHistory: (customerId) => ipcRenderer.invoke('payments:history', customerId),

  // End of Day
  submitEndOfDay: (data) => ipcRenderer.invoke('eod:submit', data),
  getEndOfDayHistory: () => ipcRenderer.invoke('eod:history'),

  // Sync
  syncToCloud: () => ipcRenderer.invoke('sync:push'),
  getSyncStatus: () => ipcRenderer.invoke('sync:status'),

  // Dashboard
  getDashboardStats: () => ipcRenderer.invoke('dashboard:stats'),
})
```

---

## 6. Feature Specifications — V1

### 6.1 Auth — Login Screen
- Single password login — no username needed
- Password stored as bcrypt hash in SQLite
- On correct password → navigate to Dashboard
- On wrong password → show error in Roman Urdu: "Galat Password"
- Auto logout after 8 hours of inactivity

---

### 6.2 Dashboard
**Stats Cards (top row):**
- Aaj ki Bikri (Today's Sales) — total from delivered orders today
- Udhaar Baqi (Total Pending Debt) — sum of all unpaid invoices
- Stock Alert — number of products below minimum threshold
- Pending Orders — count of PENDING status orders

**Quick Actions:**
- Naya Order (New Order) button — opens order creation modal
- Stock Daalo (Add Stock) button — opens stock entry modal

**Recent Activity:**
- Last 5 orders with customer name, amount, status badge
- Last 5 payments received

---

### 6.3 Customer Management

**List View:**
- Table with: Name, Type (RESTAURANT/RETAIL), Phone, Udhaar Balance, Actions
- Color coded udhaar: Red if balance > 0, Green if 0
- Filter by type — Restaurant or Retail
- Search by name

**Create/Edit Customer:**
- Fields: Name, Type, Phone, Address
- Validation: Name required, Phone optional

**Customer Detail Page:**
- Full order history
- Full payment history
- Current outstanding balance
- "Payment Lo" (Take Payment) button

---

### 6.4 Product Management

**Product List:**
- Name (Urdu + English), Unit (kg/piece), Price per unit, Current Stock, Status

**Create/Edit Product:**
- Fields: Name, Urdu Name, Unit (kg or piece), Price Per Unit
- Examples: "Whole Chicken / Poora Murgh", "Boneless / Bے Haddi", "Wings / Parr"

**Stock Calculation (derived, not stored):**
```
currentStock = 
  SUM(stock_entries WHERE type='IN' AND product_id=X)
  - SUM(stock_entries WHERE type='OUT' AND product_id=X)
```

---

### 6.5 Stock Management

**Current Stock View:**
- Product name, Unit, Current quantity in stock
- Color: Red if below 10kg/10 pieces, Green if okay

**Add Stock (Morning Entry):**
- Select product from dropdown
- Enter quantity received
- Optional note (e.g., "Subah ki delivery")
- Saves as type='IN' stock entry

**Stock History:**
- Table of all IN and OUT entries per product
- Filterable by date range

---

### 6.6 Order Management

**Order List:**
- Filter by: Status (PENDING/DELIVERED/CANCELLED), Customer, Date
- Table: Order ID, Customer, Total Amount, Status badge, Date, Actions

**Status Badge Colors:**
- PENDING → Yellow
- DELIVERED → Green
- CANCELLED → Red/Grey

**Create New Order:**

Step 1 — Select Customer from list  
Step 2 — Add items:
- Select product from dropdown
- Enter quantity
- Price auto-fills from product price
- Total auto-calculates
- Can add multiple items

Step 3 — Review totals  
Step 4 — Confirm → Order created, Invoice auto-generated

**Order Actions:**
- Mark as Delivered → status changes to DELIVERED, stock auto-deducted (OUT entry)
- Cancel Order → status CANCELLED, no stock deducted
- View Invoice
- Print Invoice

---

### 6.7 Invoice Management

**Invoice List:**
- Filter by: Status (UNPAID/PARTIAL/PAID), Customer, Date
- Table: Invoice ID, Customer, Total, Paid, Balance, Status, Actions

**Invoice Detail View:**
- Customer info
- Order items table (Product, Qty, Unit Price, Total)
- Payment summary (Total, Paid, Remaining)
- Payment history for this invoice
- "Payment Lo" button
- "PDF Banao" (Generate PDF) button

**Invoice PDF Layout:**
```
┌─────────────────────────────────┐
│         DUKAAN NAME             │
│         Phone Number            │
│─────────────────────────────────│
│  Invoice #    Date:             │
│  Customer:                      │
│─────────────────────────────────│
│  Item     Qty    Rate    Total  │
│  ----     ---    ----    -----  │
│  ...                            │
│─────────────────────────────────│
│              Total: Rs. X,XXX   │
│         Paid Amount: Rs. X,XXX  │
│            Baqi Hay: Rs. X,XXX  │
│─────────────────────────────────│
│  Shukriya! Dobara Tahrif Lao   │
└─────────────────────────────────┘
```

---

### 6.8 Udhaar (Debt) Tracking

**Udhaar Overview Page:**
- List of all customers with outstanding balance > 0
- Sorted by highest balance first
- Each row: Customer name, Phone, Total owed, Last payment date
- "Payment Lo" button per row

**Record Payment:**
- Modal with: Customer (pre-filled), Amount, Payment method (Cash/JazzCash/Easypaisa/Bank), Note
- On save:
  1. Create payment record
  2. Update invoice paid_amount and status
  3. Update customer total_udhaar
  4. If paid_amount >= total_amount → status = PAID
  5. If paid_amount > 0 but < total → status = PARTIAL

---

### 6.9 End of Day Reconciliation

**Form fields:**
- Kal ka Stock (Opening Stock) — auto-filled from yesterday's closing
- Aaj ka Baqiya (Closing Stock) — owner manually enters remaining kg
- Drawer mein Cash (Cash in Drawer) — owner counts and enters

**Auto-calculated by system:**
- Restaurant Sales = SUM of all delivered orders today
- Retail Calculated = Opening Stock - Closing Stock - Restaurant Orders delivered today (in kg)
- Retail Cash Expected = Retail Calculated × average retail price per kg
- Discrepancy = Cash in Drawer − (Retail Cash Expected + Restaurant Cash received today)

**Display:**
- Green if discrepancy within ±Rs. 500 → "Theek Hay!"
- Yellow if ±Rs. 500–2000 → "Thora Farq Hay"
- Red if > ±Rs. 2000 → "Check Karo!"

---

### 6.10 Cloud Sync

**Sync Button in Header:**
- Shows last sync time
- Shows count of unsynced records
- "Sync Karo" button — triggers batch push

**Sync Flow:**
```
1. Collect all rows WHERE synced_at IS NULL from all tables
2. POST /api/sync with JWT token and payload
3. Cloud API upserts all records into PostgreSQL
4. On success: UPDATE all rows SET synced_at = datetime('now')
5. Insert into sync_log with status='SUCCESS' and record count
6. On failure: Insert into sync_log with status='FAILED' and error
```

**Sync Payload Structure:**
```typescript
{
  storeId: string,
  syncedAt: string,
  customers: Customer[],
  products: Product[],
  stockEntries: StockEntry[],
  orders: Order[],
  orderItems: OrderItem[],
  invoices: Invoice[],
  payments: Payment[],
  endOfDay: EndOfDay[]
}
```

**Cloud API Route:**
```
POST /api/sync
Authorization: Bearer <JWT>
Body: SyncPayload

→ Upsert all records using their local IDs as primary keys
→ Return { success: true, recordsReceived: N }
```

---

## 7. UI/UX Design Rules

### Color System
```
Background:     #F9FAFB  (light grey — easy on eyes)
Sidebar:        #111827  (dark)
Primary:        #16A34A  (green — for positive actions)
Danger:         #DC2626  (red — for debt/cancel)
Warning:        #D97706  (yellow — for pending)
Text Primary:   #111827
Text Secondary: #6B7280
Border:         #E5E7EB
```

### Status Badge Colors
| Status | Color | Background |
|--------|-------|------------|
| PAID / DELIVERED | Green | #DCFCE7 |
| PARTIAL / PENDING | Yellow | #FEF9C3 |
| UNPAID / CANCELLED | Red | #FEE2E2 |

### Typography Rules
- All labels: Roman Urdu where possible (Udhaar, Baqaya, Bikri)
- Numbers: Always in English (Rs. 2,500)
- Button text: Short and action-oriented (Daalo, Banao, Lo, Karo)
- No paragraphs of text — only labels and numbers

### Layout Rules
- Sidebar navigation — always visible
- Large clickable targets — minimum 44px height for all buttons
- Tables must be sortable by date and amount
- All modals close on Escape key
- All forms submit on Enter key where applicable

### Sidebar Navigation
```
🏠  Dashboard
👥  Customers (Grahak)
🐔  Products (Maal)
📦  Stock (Maal Baqi)
📋  Orders (Orders)
🧾  Invoices (Bill)
📒  Udhaar (Khata)
📊  End of Day (Din Khatam)
☁️  Sync
```

---

## 8. Cloud Sync API — Endpoints

```
POST   /api/auth/login          → returns JWT token for desktop app
POST   /api/sync                → receives batch sync payload, upserts all
GET    /api/dashboard/:storeId  → returns summary stats (for future mobile app)
GET    /api/udhaar/:storeId     → returns all outstanding debts
GET    /api/sales/:storeId      → returns sales by date range
```

---

## 9. V1 Build Order — Phase By Phase

Follow this exact order. Do not skip phases. Each phase produces something working.

### Phase 1 — Project Setup (Day 1-2)
- [x] Initialize Next.js + React + TypeScript project
- [x] Set up Tailwind CSS v4 with PostCSS
- [x] Create sidebar layout with navigation
- [x] Set up SQLite connection with Prisma ORM
- [ ] Run Prisma migration (create tables)
- [x] Set up API routes (replaces Electron IPC)
- [x] Create typed API client (replaces preload bridge)
- [x] Create login screen and auth flow

**Deliverable:** Web app opens at localhost:3000, you can log in, see empty sidebar

---

### Phase 2 — Customers + Products (Day 3-5)
- [ ] Customer list page with table
- [ ] Create/Edit customer modal
- [ ] Product list page
- [ ] Create/Edit product modal
- [ ] All IPC handlers wired up
- [ ] SQLite queries for CRUD

**Deliverable:** Can add customers and products, see them in lists

---

### Phase 3 — Stock Management (Day 6-7)
- [ ] Stock summary page — current stock per product
- [ ] Add stock entry form (IN)
- [ ] Stock history table
- [ ] Low stock highlighting

**Deliverable:** Can log morning stock delivery, see current stock levels

---

### Phase 4 — Orders (Day 8-11)
- [ ] Order list with filters and status badges
- [ ] Create order flow — select customer → add items → confirm
- [ ] Auto-calculate totals on item add
- [ ] Mark as delivered — auto-deduct stock (OUT entry)
- [ ] Cancel order flow

**Deliverable:** Can create and manage restaurant orders end to end

---

### Phase 5 — Invoices + Payments (Day 12-15)
- [ ] Invoice list with status filters
- [ ] Invoice detail page
- [ ] Record payment modal
- [ ] Update invoice status on payment (PARTIAL/PAID)
- [ ] Update customer udhaar balance on payment
- [ ] PDF generation for invoices

**Deliverable:** Can generate invoices, record payments, print PDF bills

---

### Phase 6 — Udhaar Page + End of Day (Day 16-18)
- [ ] Udhaar overview — all customers with outstanding balance
- [ ] Quick payment from udhaar page
- [ ] End of day form
- [ ] Auto-calculations for reconciliation
- [ ] Discrepancy display

**Deliverable:** Chachu can check who owes money and close the day

---

### Phase 7 — Dashboard (Day 19-20)
- [ ] Today's sales stat
- [ ] Total udhaar stat
- [ ] Pending orders count
- [ ] Low stock alerts
- [ ] Recent orders list
- [ ] Recent payments list

**Deliverable:** Meaningful dashboard on app open

---

### Phase 8 — Cloud Sync (Day 21-25)
- [ ] Set up Express + Prisma cloud API on Railway
- [ ] Implement sync POST endpoint with upsert logic
- [ ] Implement sync button in desktop app
- [ ] Collect unsynced rows, push to cloud
- [ ] Update synced_at on success
- [ ] Show sync status and last synced time

**Deliverable:** Full offline → sync → cloud pipeline working

---

### Phase 9 — Polish + Testing (Day 26-30)
- [ ] Error handling everywhere — no unhandled exceptions
- [ ] Loading states on all async operations
- [ ] Keyboard shortcuts (Enter to submit, Escape to close)
- [ ] Test with chachu for 1 week — collect real feedback
- [ ] Fix bugs from real usage
- [ ] Build .exe with electron-builder

**Deliverable:** Working .exe installed on chachu's laptop

---

## 10. Key Business Logic Rules

```
// Stock deduction — only when order is DELIVERED, not when PENDING
onDeliverOrder(orderId) {
  for each orderItem:
    insert stock_entry(type='OUT', quantity=item.quantity, note=`Order ${orderId}`)
}

// Invoice auto-creation — every order automatically gets one invoice
onCreateOrder(order) {
  insert invoice(order_id, total_amount=order.total, status='UNPAID')
}

// Payment recording
onRecordPayment(invoiceId, amount) {
  insert payment record
  update invoice.paid_amount += amount
  if invoice.paid_amount >= invoice.total_amount:
    update invoice.status = 'PAID'
  elif invoice.paid_amount > 0:
    update invoice.status = 'PARTIAL'
  update customer.total_udhaar = SUM(unpaid invoice amounts for customer)
}

// End of Day retail calculation
retailSoldKg = openingStockKg - closingStockKg - restaurantOrdersKg(today)
retailCashExpected = retailSoldKg * averageRetailPricePerKg
discrepancy = cashInDrawer - retailCashExpected
```

---

## 11. Sync Conflict Resolution

Since data only flows in one direction (desktop → cloud), conflicts are simple:

- Use the local SQLite ID as the primary key in PostgreSQL
- On sync: `INSERT ... ON CONFLICT (id) DO UPDATE SET ...`
- This means the desktop is always the source of truth
- Cloud is a backup and read layer only
- Never write to cloud directly — always go through desktop first

---

## 12. Error Handling Rules

- Every IPC handler must be wrapped in try/catch
- On SQLite error → return `{ success: false, error: message }`
- On sync failure → log to sync_log, show user "Sync nahi hua, baad mein koshish karo"
- On PDF generation failure → show error, allow retry
- Never crash the app silently — always show a message in Roman Urdu

---

## 13. What V1 Does NOT Include

Save these for V2:

- Mobile app (React Native dashboard for chachu's phone)
- Multi-tenant (multiple shops) — but storeId is in schema, ready for it
- Thermal printer integration
- SMS notifications to customers when invoice generated
- Expense tracking (fuel, salary, rent)
- Profit/loss reporting
- Automated price adjustment by market rate
- WhatsApp invoice sending

---

## 14. Resume Description (How To Present This)

**Project Name:** Dukaan POS — Offline-First Point of Sale System

**Tech Stack:** Electron, React, TypeScript, SQLite, Node.js, Express, PostgreSQL, Prisma

**Bullet Points:**
- Built a fully offline-capable desktop POS application using Electron and React with SQLite for local data persistence — deployed to a real business replacing manual Excel tracking
- Implemented inventory management with immutable stock ledger entries, enabling accurate stock calculation and discrepancy detection during end-of-day reconciliation
- Designed an end-to-end order-to-invoice-to-payment pipeline with automatic debt (udhaar) tracking per customer and partial payment support
- Engineered a batch cloud sync system that pushes unsynced local transactions to a PostgreSQL cloud database via a secure Express API, enabling remote monitoring through a mobile dashboard
- Designed the UI with low-literacy users in mind — color-coded statuses, Roman Urdu labels, and minimal text interfaces for non-technical shop owners

---

*End of V1 Specification*
