"use client";

import { useState } from "react";
import Link from "next/link";

type ScoringResult = {
  success: boolean;
  stdout: string;
  stderr: string;
  duration_ms: number;
};

export default function ScoringPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ScoringResult | null>(null);
  const [error, setError] = useState("");

  async function runScoring() {
    setLoading(true);
    setResult(null);
    setError("");

    try {
      const res = await fetch("/api/scoring/run", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Scoring failed");
      } else {
        setResult(data);
      }
    } catch {
      setError("Failed to connect to scoring API.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Run Scoring</h1>
      <p className="text-gray-600 mb-4">
        Click the button below to run the ML inference script. This will score
        unfulfilled orders and write predictions to the database.
      </p>

      <button
        onClick={runScoring}
        disabled={loading}
        className="bg-indigo-600 text-white px-6 py-2 rounded hover:bg-indigo-700 disabled:opacity-50"
      >
        {loading ? "Running..." : "Run Scoring"}
      </button>

      {loading && (
        <div className="mt-4 flex items-center gap-2 text-gray-600">
          <svg
            className="animate-spin h-5 w-5"
            viewBox="0 0 24 24"
            fill="none"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
          Scoring in progress...
        </div>
      )}

      {error && (
        <div className="mt-4 bg-red-50 border border-red-200 p-4 rounded text-red-700 text-sm">
          {error}
        </div>
      )}

      {result && (
        <div className="mt-4 space-y-3">
          <div
            className={`p-4 rounded border ${
              result.success
                ? "bg-green-50 border-green-200 text-green-700"
                : "bg-red-50 border-red-200 text-red-700"
            }`}
          >
            <p className="font-semibold">
              {result.success ? "Scoring completed successfully" : "Scoring failed"}
            </p>
            <p className="text-sm mt-1">
              Duration: {(result.duration_ms / 1000).toFixed(1)}s
            </p>
          </div>

          {result.stdout && (
            <div>
              <p className="text-sm font-medium mb-1">Output:</p>
              <pre className="bg-gray-900 text-green-400 p-3 rounded text-sm overflow-x-auto">
                {result.stdout}
              </pre>
            </div>
          )}

          {result.stderr && (
            <div>
              <p className="text-sm font-medium mb-1">Errors:</p>
              <pre className="bg-gray-900 text-red-400 p-3 rounded text-sm overflow-x-auto">
                {result.stderr}
              </pre>
            </div>
          )}

          <Link
            href="/warehouse/priority"
            className="inline-block text-indigo-600 hover:underline"
          >
            View Priority Queue &rarr;
          </Link>
        </div>
      )}
    </div>
  );
}
