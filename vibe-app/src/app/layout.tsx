import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { CustomerBanner } from "@/components/CustomerBanner";
import Link from "next/link";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Order Management App",
  description: "Student project — Next.js + Supabase order management",
};

const navLinks = [
  { href: "/select-customer", label: "Select Customer" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/place-order", label: "Place Order" },
  { href: "/orders", label: "Order History" },
  { href: "/warehouse/priority", label: "Priority Queue" },
  { href: "/scoring", label: "Run Scoring" },
];

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-gray-50 text-gray-900">
        <nav className="bg-indigo-700 text-white shadow">
          <div className="max-w-7xl mx-auto px-4 py-3 flex flex-wrap items-center gap-4">
            <Link href="/" className="font-bold text-lg mr-4">
              OrderApp
            </Link>
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-indigo-100 hover:text-white text-sm"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </nav>

        <CustomerBanner />

        <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-6">
          {children}
        </main>
      </body>
    </html>
  );
}
