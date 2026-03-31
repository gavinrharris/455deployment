"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY)!
);

type Product = {
  product_id: number;
  product_name: string;
  price: number;
};

type LineItem = {
  product_id: number;
  product_name: string;
  price: number;
  quantity: number;
};

export default function PlaceOrderPage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [lineItems, setLineItems] = useState<LineItem[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<number | "">("");
  const [quantity, setQuantity] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const customerId = Cookies.get("customer_id");

  useEffect(() => {
    if (!customerId) {
      router.push("/select-customer");
      return;
    }
    supabase
      .from("products")
      .select("product_id, product_name, price")
      .order("product_name")
      .then(({ data, error }) => {
        if (error) setError(error.message);
        else setProducts(data || []);
      });
  }, [customerId, router]);

  function addItem() {
    const errors: string[] = [];
    if (!selectedProduct) errors.push("Please select a product.");
    if (quantity < 1) errors.push("Quantity must be at least 1.");
    if (errors.length > 0) {
      setValidationErrors(errors);
      return;
    }
    setValidationErrors([]);

    const product = products.find((p) => p.product_id === Number(selectedProduct));
    if (!product) return;

    const existing = lineItems.find((li) => li.product_id === product.product_id);
    if (existing) {
      setLineItems(
        lineItems.map((li) =>
          li.product_id === product.product_id
            ? { ...li, quantity: li.quantity + quantity }
            : li
        )
      );
    } else {
      setLineItems([
        ...lineItems,
        {
          product_id: product.product_id,
          product_name: product.product_name,
          price: product.price,
          quantity,
        },
      ]);
    }
    setSelectedProduct("");
    setQuantity(1);
  }

  function removeItem(productId: number) {
    setLineItems(lineItems.filter((li) => li.product_id !== productId));
  }

  const orderTotal = lineItems.reduce(
    (sum, li) => sum + li.price * li.quantity,
    0
  );

  async function submitOrder() {
    if (lineItems.length === 0) {
      setValidationErrors(["Add at least one item to place an order."]);
      return;
    }
    setValidationErrors([]);
    setSubmitting(true);
    setError("");

    try {
      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert({
          customer_id: customerId,
          fulfilled: false,
          order_timestamp: new Date().toISOString(),
          total_value: orderTotal,
        })
        .select("order_id")
        .single();

      if (orderError) throw new Error(orderError.message);

      const items = lineItems.map((li) => ({
        order_id: order.order_id,
        product_id: li.product_id,
        quantity: li.quantity,
      }));

      const { error: itemsError } = await supabase
        .from("order_items")
        .insert(items);

      if (itemsError) throw new Error(itemsError.message);

      router.push("/orders?success=1");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to place order.");
    } finally {
      setSubmitting(false);
    }
  }

  if (!customerId) return null;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Place Order</h1>

      {error && (
        <div className="bg-red-50 border border-red-200 p-3 rounded mb-4 text-red-700 text-sm">
          {error}
        </div>
      )}
      {validationErrors.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 p-3 rounded mb-4 text-yellow-800 text-sm">
          <ul className="list-disc list-inside">
            {validationErrors.map((e, i) => (
              <li key={i}>{e}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex flex-wrap gap-2 items-end mb-4">
        <div>
          <label className="block text-sm font-medium mb-1">Product</label>
          <select
            value={selectedProduct}
            onChange={(e) => setSelectedProduct(Number(e.target.value) || "")}
            className="border rounded px-3 py-2"
          >
            <option value="">-- Select --</option>
            {products.map((p) => (
              <option key={p.product_id} value={p.product_id}>
                {p.product_name} (${Number(p.price).toFixed(2)})
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Quantity</label>
          <input
            type="number"
            min={1}
            value={quantity}
            onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
            className="border rounded px-3 py-2 w-20"
          />
        </div>
        <button
          onClick={addItem}
          className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
        >
          Add Item
        </button>
      </div>

      {lineItems.length > 0 && (
        <table className="w-full text-sm bg-white rounded shadow mb-4">
          <thead className="bg-gray-100">
            <tr>
              <th className="text-left p-3">Product</th>
              <th className="text-right p-3">Price</th>
              <th className="text-right p-3">Qty</th>
              <th className="text-right p-3">Subtotal</th>
              <th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {lineItems.map((li) => (
              <tr key={li.product_id} className="border-t">
                <td className="p-3">{li.product_name}</td>
                <td className="p-3 text-right">${li.price.toFixed(2)}</td>
                <td className="p-3 text-right">{li.quantity}</td>
                <td className="p-3 text-right">
                  ${(li.price * li.quantity).toFixed(2)}
                </td>
                <td className="p-3 text-right">
                  <button
                    onClick={() => removeItem(li.product_id)}
                    className="text-red-500 hover:underline text-xs"
                  >
                    Remove
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot className="border-t bg-gray-50">
            <tr>
              <td colSpan={3} className="p-3 font-semibold text-right">
                Total
              </td>
              <td className="p-3 text-right font-bold">
                ${orderTotal.toFixed(2)}
              </td>
              <td></td>
            </tr>
          </tfoot>
        </table>
      )}

      <button
        onClick={submitOrder}
        disabled={submitting || lineItems.length === 0}
        className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {submitting ? "Placing Order..." : "Place Order"}
      </button>
    </div>
  );
}
