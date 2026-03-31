"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Cookies from "js-cookie";

export function CustomerBanner() {
  const [customerName, setCustomerName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const customerId = Cookies.get("customer_id");
    if (!customerId) {
      setLoading(false);
      return;
    }

    fetch(`/api/customer?id=${customerId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.name) setCustomerName(data.name);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return null;

  return (
    <div className="bg-indigo-50 border-b border-indigo-200 px-4 py-2 text-sm">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {customerName ? (
          <>
            <span>
              Acting as: <strong>{customerName}</strong>
            </span>
            <Link
              href="/select-customer"
              className="text-indigo-600 hover:underline"
            >
              Switch Customer
            </Link>
          </>
        ) : (
          <span>
            No customer selected.{" "}
            <Link
              href="/select-customer"
              className="text-indigo-600 hover:underline"
            >
              Select one
            </Link>
          </span>
        )}
      </div>
    </div>
  );
}
