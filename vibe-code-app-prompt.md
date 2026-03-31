# Claude Code Prompt — Vibe Code Web App (Next.js + Supabase + Vercel)

Paste this entire prompt into Claude Code. After each section generates, run `npm run dev`, verify behavior, then move to the next prompt.

---

## Prompt 0: Project Setup

```
You are generating a complete student project web app using Next.js 14 (App Router), Supabase (PostgreSQL), and Tailwind CSS. It will be deployed to Vercel.

Constraints:
- No authentication. Users select an existing customer to "act as."
- Use Supabase JS client (@supabase/supabase-js) for all DB access.
- The Supabase project already has these tables: customers, orders, order_items, products, order_predictions. Do NOT create or modify tables — only read/write to them.
- Use environment variables NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY (stored in .env.local).
- Keep UI simple and clean with Tailwind CSS.
- All data-fetching should use Supabase client in Server Components or Route Handlers (no raw SQL unless using supabase.rpc()).

Tasks:
1. Initialize a new Next.js app (App Router) with Tailwind CSS.
2. Create a lib/supabase.ts server-side helper that initializes the Supabase client using env vars.
3. Create a shared layout (app/layout.tsx) with navigation links:
   - Select Customer (/select-customer)
   - Dashboard (/dashboard)
   - Place Order (/place-order)
   - Order History (/orders)
   - Warehouse Priority Queue (/warehouse/priority)
   - Run Scoring (/scoring)
4. Add a .env.local.example with placeholder values for the two Supabase env vars.
5. Include a README.md with setup steps (npm install, env config, npm run dev) and Vercel deployment notes.

Deliver all files to create/modify and all commands to run.
```

---

## Prompt 0.5: Debug Schema Page

```
Add a developer-only page at /debug/schema that:
1. Uses Supabase to query information_schema.columns for all tables in the public schema.
2. Displays each table name and its columns (column_name, data_type, is_nullable).
3. Keep it simple and readable — just a page with tables listing the schema.

Purpose: I need to verify the real Supabase schema and adjust prompts if column names differ.
Use supabase.rpc() or a raw SQL call via supabase.from('information_schema.columns') — whichever works.
If neither works directly, create a Supabase SQL function (provide the SQL) that returns the schema info.
```

---

## Prompt 1: Select Customer Screen

```
Add a "Select Customer" page at /select-customer.

Requirements:
1. Query the customers table from Supabase for: customer_id, first_name, last_name, email.
2. Render a searchable list (filter by name as user types). When a customer is clicked, store customer_id in a cookie (using Next.js cookies or js-cookie).
3. Redirect to /dashboard after selection.
4. Add a persistent banner in the layout showing the currently selected customer name on every page (read from cookie + fetch customer name).
5. Include a "Switch Customer" link in the banner that goes back to /select-customer.

Deliver:
- New routes/components
- Supabase query code
- Cookie read/write logic
```

---

## Prompt 2: Customer Dashboard

```
Create a /dashboard page showing a summary for the selected customer.

Requirements:
1. If no customer cookie is set, redirect to /select-customer.
2. Show:
   - Customer name and email
   - Total number of orders
   - Total spend (sum of total_value from orders)
   - A table of the 5 most recent orders: order_id, order_timestamp, fulfilled (Yes/No), total_value
3. All data comes from Supabase (customers and orders tables).

Deliver:
- Supabase queries used
- Page UI
```

---

## Prompt 3: Place Order Page

```
Create a /place-order page for creating a new order.

Requirements:
1. If no customer selected (no cookie), redirect to /select-customer.
2. Fetch all products from Supabase (product_id, product_name, price) and display them.
3. Let the user add 1+ line items — each line item is a product + quantity.
4. Show a running order total as items are added.
5. On submit (via a Server Action or API Route):
   - Insert a row into orders: customer_id from cookie, fulfilled = false, order_timestamp = now(), total_value = computed sum of (price * quantity)
   - Insert corresponding rows into order_items with the new order_id
   - Use Supabase's insert chaining — if Supabase doesn't support multi-table transactions natively, insert orders first, get the returned order_id, then insert order_items.
6. After placing, redirect to /orders with a success toast or message.

Constraints:
- Validate that at least one line item exists and all quantities are >= 1.
- Handle errors gracefully (show error message, don't crash).

Deliver:
- Supabase insert logic
- Next.js Server Action or API route handler
- Client-side form components
```

---

## Prompt 4: Order History

```
Create an /orders page showing order history for the selected customer.

Requirements:
1. If no customer selected, redirect to /select-customer.
2. Render a table of all orders for this customer:
   - order_id, order_timestamp, fulfilled (Yes/No badge), total_value (formatted as currency)
3. Each row is clickable — navigates to /orders/[order_id].
4. The detail page /orders/[order_id] shows:
   - Order summary (timestamp, total, fulfilled status)
   - Line items table: product_name, quantity, unit price, line total
   - To get product_name, join order_items with products (use Supabase's select with foreign key syntax, e.g. order_items(*, products(product_name, price)))

Deliver:
- Both pages
- Supabase queries with any necessary joins
```

---

## Prompt 5: Warehouse Priority Queue

```
Create a /warehouse/priority page showing the "Late Delivery Priority Queue."

This page must execute the equivalent of this SQL query using Supabase:

SELECT
  o.order_id,
  o.order_timestamp,
  o.total_value,
  o.fulfilled,
  c.customer_id,
  c.first_name || ' ' || c.last_name AS customer_name,
  p.late_delivery_probability,
  p.predicted_late_delivery,
  p.prediction_timestamp
FROM orders o
JOIN customers c ON c.customer_id = o.customer_id
JOIN order_predictions p ON p.order_id = o.order_id
WHERE o.fulfilled = 0
ORDER BY p.late_delivery_probability DESC, o.order_timestamp ASC
LIMIT 50;

Implementation:
- Create a Supabase SQL function (provide the CREATE FUNCTION SQL I need to run in Supabase SQL Editor) called get_priority_queue() that returns this query's result set.
- Call it from the page using supabase.rpc('get_priority_queue').
- Render the results in a styled table with columns: Order ID, Customer, Order Date, Total Value, Late Probability (as percentage), Predicted Late (Yes/No), Prediction Date.
- Color-code rows: red/orange background for probability > 0.7, yellow for > 0.4, green for <= 0.4.
- Add a short paragraph at the top explaining that this queue helps the warehouse prioritize orders most likely to be delivered late.

Deliver:
- The CREATE FUNCTION SQL to run in Supabase
- The page code
```

---

## Prompt 6: Run Scoring

```
Add a /scoring page with a "Run Scoring" button.

Context: There is a Python inference script at jobs/run_inference.py that reads unfulfilled orders from the Supabase DB, runs an ML model, and writes predictions into the order_predictions table. The script uses the same Supabase credentials (SUPABASE_URL and SUPABASE_KEY env vars).

Behavior:
1. The page shows a "Run Scoring" button and a status area.
2. When clicked, call an API route (POST /api/scoring/run) that:
   - Spawns: python jobs/run_inference.py
   - Captures stdout and stderr
   - Returns JSON: { success: boolean, stdout: string, stderr: string, duration_ms: number }
   - Has a 60-second timeout — if exceeded, kill the process and return an error.
3. The UI shows:
   - A loading spinner while scoring runs
   - Success or failure status
   - stdout output (e.g., "Scored 42 orders")
   - Duration
   - A "View Priority Queue" link to /warehouse/priority
4. If Python is not installed or the script fails, show a clear error — don't crash.

Constraints:
- Use Node child_process.spawn (not exec) for safety.
- This is for local dev and Vercel preview — note in comments that Vercel serverless has a 10s timeout on Hobby plan, so this route works best locally or on Vercel Pro.

Deliver:
- API route handler
- Page UI with loading/success/error states
```

---

## Prompt 7: Polish + Vercel Deploy Prep

```
Polish the app and prepare for Vercel deployment.

Tasks:
1. Ensure the customer banner displays on all pages and shows "No customer selected" with a link if cookie is missing.
2. Add form validation on /place-order (at least 1 item, quantity >= 1, show inline errors).
3. Add graceful error states: if Supabase is unreachable, show a friendly error instead of crashing.
4. Add a home page (/) that briefly explains the app and links to /select-customer to get started.
5. Update README.md with:
   - Full setup instructions (clone, npm install, .env.local, Supabase setup)
   - The CREATE FUNCTION SQL that must be run in Supabase SQL Editor
   - How to deploy to Vercel (connect repo, add env vars)
   - Manual QA checklist:
     * Select a customer
     * Place an order (verify it appears in orders table)
     * View order history and order detail
     * Run scoring (locally)
     * View priority queue — new order should appear after scoring
6. Add a vercel.json if needed (likely not, but include one if any config is required).
7. Make sure all pages are responsive (mobile-friendly with Tailwind).

Deliver:
- Final code changes
- Updated README.md
```

---

## Notes for Running These Prompts

**Before starting:** Make sure your Supabase project has the tables already created (customers, orders, order_items, products, order_predictions) with data from your ML pipeline work.

**Order of operations:**
1. Paste Prompt 0 → run `npm run dev` → verify app loads
2. Paste Prompt 0.5 → verify schema page works → note any column name differences
3. Paste Prompts 1–6 in order, testing after each
4. Paste Prompt 7 last for polish
5. Deploy to Vercel: `vercel` or connect the GitHub repo in vercel.com

**If column names differ:** Tell Claude Code: "My table uses `X` instead of `Y` — update the queries accordingly."
