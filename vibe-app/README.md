# Order Management App

A student project built with **Next.js 14** (App Router), **Supabase** (PostgreSQL), and **Tailwind CSS**.

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

Copy the example env file and fill in your Supabase credentials:

```bash
cp .env.local.example .env.local
```

Edit `.env.local` with your Supabase project URL and anon key:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

### 3. Create Supabase SQL functions

Run the following SQL in the **Supabase SQL Editor**:

#### Schema debug function

```sql
CREATE OR REPLACE FUNCTION get_schema_info()
RETURNS TABLE(table_name text, column_name text, data_type text, is_nullable text)
LANGUAGE sql SECURITY DEFINER AS $$
  SELECT table_name::text, column_name::text, data_type::text, is_nullable::text
  FROM information_schema.columns
  WHERE table_schema = 'public'
  ORDER BY table_name, ordinal_position;
$$;
```

#### Priority queue function

```sql
CREATE OR REPLACE FUNCTION get_priority_queue()
RETURNS TABLE(
  order_id bigint,
  order_timestamp timestamptz,
  total_value numeric,
  fulfilled bigint,
  customer_id text,
  customer_name text,
  late_delivery_probability numeric,
  predicted_late_delivery bigint,
  prediction_timestamp timestamptz
)
LANGUAGE sql SECURITY DEFINER AS $$
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
$$;
```

### 4. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Deploy to Vercel

1. Push your code to a GitHub repository.
2. Go to [vercel.com](https://vercel.com), import the repo.
3. Add the two environment variables (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`) in the Vercel project settings.
4. Deploy.

> **Note:** The `/api/scoring/run` route spawns a Python process and may time out on Vercel Hobby (10s limit). It works best locally or on Vercel Pro.

## Manual QA Checklist

- [ ] Select a customer on `/select-customer`
- [ ] Verify the customer banner appears on all pages
- [ ] View the dashboard at `/dashboard` with order summary
- [ ] Place an order on `/place-order` — verify it appears in the orders table
- [ ] View order history at `/orders` and click into an order detail
- [ ] Run scoring at `/scoring` (locally with Python)
- [ ] View the priority queue at `/warehouse/priority` — new order should appear after scoring
- [ ] Verify `/debug/schema` shows your table structure
