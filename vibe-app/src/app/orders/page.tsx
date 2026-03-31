"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Cookies from "js-cookie";
import { getClientSupabase } from "@/lib/supabase-client";

type Order = {
  order_id: number;
  order_datetime: string;
  fulfilled: number;
  order_total: number;
};

function OrdersContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [orders, setOrders] = useState<Order[]>([]);
  const [error, setError] = useState("");
  const success = searchParams.get("success");

  const customerId = Cookies.get("customer_id");

  useEffect(() => {
    if (!customerId) {
      router.push("/select-customer");
      return;
    }
    getClientSupabase()
      .from("orders")
      .select("order_id, order_datetime, fulfilled, order_total")
      .eq("customer_id", customerId)
      .order("order_datetime", { ascending: false })
      .then(({ data, error }) => {
        if (error) setError(error.message);
        else setOrders(data || []);
      });
  }, [customerId, router]);

  if (!customerId) return null;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Order History</h1>

      {success && (
        <div className="bg-green-50 border border-green-200 p-3 rounded mb-4 text-green-700 text-sm">
          Order placed successfully!
        </div>
      )}
      {error && (
        <div className="bg-red-50 border border-red-200 p-3 rounded mb-4 text-red-700 text-sm">
          {error}
        </div>
      )}

      {orders.length === 0 ? (
        <p className="text-gray-500">No orders found.</p>
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
            {orders.map((o) => (
              <tr
                key={o.order_id}
                className="border-t hover:bg-gray-50 cursor-pointer"
                onClick={() => router.push(`/orders/${o.order_id}`)}
              >
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

export default function OrdersPage() {
  return (
    <Suspense fallback={<div>Loading orders...</div>}>
      <OrdersContent />
    </Suspense>
  );
}
