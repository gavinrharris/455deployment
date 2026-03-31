import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

export const dynamic = "force-dynamic";

type Params = { id: string };

export default async function OrderDetailPage({ params }: { params: Promise<Params> }) {
  const { id } = await params;
  const cookieStore = await cookies();
  const customerId = cookieStore.get("customer_id")?.value;
  if (!customerId) redirect("/select-customer");

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .select("order_id, order_datetime, fulfilled, order_total, customer_id")
    .eq("order_id", id)
    .single();

  if (orderError || !order) {
    return (
      <div className="bg-red-50 p-4 rounded border border-red-200 text-red-700">
        Order not found.{" "}
        <Link href="/orders" className="underline">
          Back to orders
        </Link>
      </div>
    );
  }

  const { data: items } = await supabase
    .from("order_items")
    .select("quantity, unit_price, line_total, product_id, products(product_name, price)")
    .eq("order_id", id);

  return (
    <div>
      <Link href="/orders" className="text-indigo-600 hover:underline text-sm">
        &larr; Back to orders
      </Link>
      <h1 className="text-2xl font-bold mt-2 mb-4">Order #{order.order_id}</h1>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-4 rounded shadow">
          <p className="text-sm text-gray-500">Date</p>
          <p className="font-semibold">
            {new Date(order.order_datetime).toLocaleString()}
          </p>
        </div>
        <div className="bg-white p-4 rounded shadow">
          <p className="text-sm text-gray-500">Total</p>
          <p className="font-semibold">${Number(order.order_total).toFixed(2)}</p>
        </div>
        <div className="bg-white p-4 rounded shadow">
          <p className="text-sm text-gray-500">Fulfilled</p>
          <span
            className={`px-2 py-1 rounded text-xs font-medium ${
              order.fulfilled
                ? "bg-green-100 text-green-700"
                : "bg-yellow-100 text-yellow-700"
            }`}
          >
            {order.fulfilled ? "Yes" : "No"}
          </span>
        </div>
      </div>

      <h2 className="text-lg font-semibold mb-2">Line Items</h2>
      <table className="w-full text-sm bg-white rounded shadow">
        <thead className="bg-gray-100">
          <tr>
            <th className="text-left p-3">Product</th>
            <th className="text-right p-3">Unit Price</th>
            <th className="text-right p-3">Qty</th>
            <th className="text-right p-3">Line Total</th>
          </tr>
        </thead>
        <tbody>
          {(items || []).map((item: Record<string, unknown>, i: number) => {
            const product = item.products as { product_name: string; price: number } | null;
            const qty = Number(item.quantity);
            const unitPrice = Number(item.unit_price);
            const lineTotal = Number(item.line_total);
            return (
              <tr key={i} className="border-t">
                <td className="p-3">{product?.product_name || "Unknown"}</td>
                <td className="p-3 text-right">${unitPrice.toFixed(2)}</td>
                <td className="p-3 text-right">{qty}</td>
                <td className="p-3 text-right">${lineTotal.toFixed(2)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
