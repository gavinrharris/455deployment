import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const customerId = cookieStore.get("customer_id")?.value;
  if (!customerId) redirect("/select-customer");

  const [customerRes, ordersRes] = await Promise.all([
    supabase
      .from("customers")
      .select("full_name, email")
      .eq("customer_id", customerId)
      .single(),
    supabase
      .from("orders")
      .select("order_id, order_datetime, fulfilled, order_total")
      .eq("customer_id", customerId)
      .order("order_datetime", { ascending: false }),
  ]);

  if (customerRes.error || !customerRes.data) {
    return (
      <div className="bg-red-50 p-4 rounded border border-red-200 text-red-700">
        Could not load customer data. Please{" "}
        <Link href="/select-customer" className="underline">
          select a customer
        </Link>
        .
      </div>
    );
  }

  const customer = customerRes.data;
  const orders = ordersRes.data || [];
  const totalOrders = orders.length;
  const totalSpend = orders.reduce(
    (sum, o) => sum + (Number(o.order_total) || 0),
    0
  );
  const recentOrders = orders.slice(0, 5);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Dashboard</h1>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-4 rounded shadow">
          <p className="text-sm text-gray-500">Customer</p>
          <p className="font-semibold">{customer.full_name}</p>
          <p className="text-sm text-gray-500">{customer.email}</p>
        </div>
        <div className="bg-white p-4 rounded shadow">
          <p className="text-sm text-gray-500">Total Orders</p>
          <p className="text-2xl font-bold">{totalOrders}</p>
        </div>
        <div className="bg-white p-4 rounded shadow">
          <p className="text-sm text-gray-500">Total Spend</p>
          <p className="text-2xl font-bold">${totalSpend.toFixed(2)}</p>
        </div>
      </div>

      <h2 className="text-lg font-semibold mb-2">Recent Orders</h2>
      {recentOrders.length === 0 ? (
        <p className="text-gray-500">No orders yet.</p>
      ) : (
        <table className="w-full text-sm bg-white rounded shadow">
          <thead className="bg-gray-100">
            <tr>
              <th className="text-left p-3">Order ID</th>
              <th className="text-left p-3">Date</th>
              <th className="text-left p-3">Fulfilled</th>
              <th className="text-right p-3">Total</th>
            </tr>
          </thead>
          <tbody>
            {recentOrders.map((o) => (
              <tr key={o.order_id} className="border-t">
                <td className="p-3">
                  <Link
                    href={`/orders/${o.order_id}`}
                    className="text-indigo-600 hover:underline"
                  >
                    {o.order_id}
                  </Link>
                </td>
                <td className="p-3">
                  {new Date(o.order_datetime).toLocaleDateString()}
                </td>
                <td className="p-3">
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium ${
                      o.fulfilled
                        ? "bg-green-100 text-green-700"
                        : "bg-yellow-100 text-yellow-700"
                    }`}
                  >
                    {o.fulfilled ? "Yes" : "No"}
                  </span>
                </td>
                <td className="p-3 text-right">
                  ${Number(o.order_total).toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
