"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import { getClientSupabase } from "@/lib/supabase-client";

type Customer = {
  customer_id: number;
  full_name: string;
  email: string;
};

export default function SelectCustomerPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  useEffect(() => {
    getClientSupabase()
      .from("customers")
      .select("customer_id, full_name, email")
      .order("full_name")
      .then(({ data, error }) => {
        if (error) setError(error.message);
        else setCustomers(data || []);
      });
  }, []);

  const filtered = customers.filter((c) =>
    `${c.full_name} ${c.email}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  function selectCustomer(c: Customer) {
    Cookies.set("customer_id", String(c.customer_id), { expires: 7 });
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Select Customer</h1>
      {error && (
        <div className="bg-red-50 border border-red-200 p-3 rounded mb-4 text-red-700 text-sm">
          {error}
        </div>
      )}
      <input
        type="text"
        placeholder="Search by name or email..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full max-w-md border rounded px-3 py-2 mb-4"
      />
      <div className="grid gap-2 max-w-2xl">
        {filtered.map((c) => (
          <button
            key={c.customer_id}
            onClick={() => selectCustomer(c)}
            className="text-left p-3 bg-white border rounded hover:bg-indigo-50 transition"
          >
            <span className="font-medium">{c.full_name}</span>
            <span className="text-gray-500 ml-2 text-sm">{c.email}</span>
          </button>
        ))}
        {filtered.length === 0 && customers.length > 0 && (
          <p className="text-gray-500">No customers match your search.</p>
        )}
      </div>
    </div>
  );
}
