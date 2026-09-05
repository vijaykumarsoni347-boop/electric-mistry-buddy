# Electrical Shop Wholesale-Retail Management App

## Goal
Build a mobile-first web app for an electrical shop that sells house-wiring materials to retail customers while letting registered electricians/mistri earn a daily margin (retail price minus wholesale price). The app auto-tracks each electrician's running commission, supports partial payments before closing, and produces a one-tap daily settlement.

## Users & Roles
- **Shop Owner** — manages inventory, prices, electricians, billing, settlements, and sees reports.
- **Electrician** — views own ledger, running commission, makes partial payments, and sees daily settlement.

Both roles need profiles, so the plan includes a `profiles` table linked to auth.

## Core Features

### 1. Inventory Management
- Add/edit products: name, SKU/category, stock quantity, wholesale price, retail price.
- Stock alerts when quantity is low.
- Quick search while billing.

### 2. Billing / POS
- Create a sale for a customer or via an electrician.
- When an electrician is attached to a bill, items are charged at **retail price** to the customer, but the system records the **wholesale price** to compute the electrician's margin.
- Support cash/credit/UPI payment modes.
- Print/share simple bill (PDF or WhatsApp-style text).

### 3. Electrician Ledger
- Each electrician gets a running ledger.
- Auto-calculated outstanding = sum of (retail − wholesale) for all unsettled sales.
- Ledger shows per-transaction breakdown: bill amount, wholesale cost, margin earned, payment made, balance.

### 4. Payments & Settlement
- Electrician can make a partial payment any time (even before evening closing).
- Payment reduces outstanding balance; ledger stays at "zero balance" when fully paid.
- One-tap "Daily Settlement" generates a summary of all electricians with today's sales, payments, and remaining dues.

### 5. Dashboard & Reports
- Today's sales, total margin payable, stock alerts.
- Electrician-wise outstanding report.
- Daily/weekly sales summary.

## Technical Plan

### Backend
- Enable Lovable Cloud for database + authentication.
- Database tables:
  - `profiles` — linked to `auth.users`, stores name, phone, role (`owner` / `electrician`).
  - `products` — inventory with wholesale/retail prices and stock.
  - `electricians` — extra details for electricians (commission terms, contact).
  - `sales` — sale header: customer name, electrician_id (nullable), total_retail, total_wholesale, payment_mode, status.
  - `sale_items` — line items with retail_price, wholesale_price, quantity.
  - `electrician_payments` — partial or full payments against an electrician's running balance.
- Row Level Security (RLS):
  - Owners can read/write everything.
  - Electricians can read only their own ledger and payments.
- Server functions (`createServerFn`) for inventory CRUD, sale creation, payment recording, settlement reports.

### Frontend
- TanStack Start routes:
  - `/auth` — login/signup for owner & electrician.
  - `/_authenticated/dashboard` — owner home.
  - `/_authenticated/inventory` — product list & management.
  - `/_authenticated/billing` — POS billing screen.
  - `/_authenticated/electricians` — electrician directory.
  - `/_authenticated/ledger/$electricianId` — ledger & payments.
  - `/_authenticated/settlement` — daily settlement.
  - `/_authenticated/electrician/ledger` — electrician's own ledger view.
- Mobile-first responsive UI using Tailwind CSS + shadcn components.

### Design Direction
- Clean, professional Indian kirana/shop-style UI: high contrast, large touch targets, card-based lists, quick-action floating buttons.
- Primary accent in trustworthy blue/green, clear price labels, red for dues.

## Implementation Steps
1. Enable Lovable Cloud and configure auth.
2. Create database migrations (profiles, products, electricians, sales, sale_items, electrician_payments) with RLS.
3. Build auth pages and role-based routing.
4. Build inventory management.
5. Build billing/POS with electrician selection and auto margin calculation.
6. Build electrician ledger and payment recording.
7. Build daily settlement and dashboard reports.
8. Test flows end-to-end.

## Outcome
A ready-to-use shop app where every retail sale routed through an electrician automatically tracks the electrician's margin, allows partial payments anytime, and closes the day with a single settlement screen.
