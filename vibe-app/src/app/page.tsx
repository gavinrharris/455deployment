import Link from "next/link";

export default function HomePage() {
  return (
    <div className="max-w-2xl mx-auto text-center py-16">
      <h1 className="text-4xl font-bold mb-4">Order Management App</h1>
      <p className="text-gray-600 mb-8">
        A student project built with Next.js, Supabase, and Tailwind CSS.
        Select a customer, place orders, view order history, and manage
        warehouse priority using ML-powered late delivery predictions.
      </p>
      <Link
        href="/select-customer"
        className="inline-block bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition"
      >
        Get Started &rarr;
      </Link>
    </div>
  );
}
