import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

type PriorityRow = {
  order_id: number;
  order_timestamp: string;
  total_value: number;
  fulfilled: boolean | number;
  customer_id: string;
  customer_name: string;
  late_delivery_probability: number;
  predicted_late_delivery: boolean | number;
  prediction_timestamp: string;
};

// SQL to run in Supabase SQL Editor:
//
// CREATE OR REPLACE FUNCTION get_priority_queue()
// RETURNS TABLE(
//   order_id bigint,
//   order_timestamp timestamptz,
//   total_value numeric,
//   fulfilled bigint,
//   customer_id text,
//   customer_name text,
//   late_delivery_probability numeric,
//   predicted_late_delivery bigint,
//   prediction_timestamp timestamptz
// )
// LANGUAGE sql SECURITY DEFINER AS $$
//   SELECT
//     o.order_id,
//     o.order_timestamp,
//     o.total_value,
//     o.fulfilled,
//     c.customer_id,
//     c.first_name || ' ' || c.last_name AS customer_name,
//     p.late_delivery_probability,
//     p.predicted_late_delivery,
//     p.prediction_timestamp
//   FROM orders o
//   JOIN customers c ON c.customer_id = o.customer_id
//   JOIN order_predictions p ON p.order_id = o.order_id
//   WHERE o.fulfilled = 0
//   ORDER BY p.late_delivery_probability DESC, o.order_timestamp ASC
//   LIMIT 50;
// $$;

function getProbabilityColor(prob: number): string {
  if (prob > 0.7) return "bg-red-100";
  if (prob > 0.4) return "bg-yellow-100";
  return "bg-green-100";
}

export default async function PriorityQueuePage() {
  const { data, error } = await supabase.rpc("get_priority_queue");

  return (
    <div>
      <h1 className="text-2xl font-bold mb-2">Warehouse Priority Queue</h1>
      <p className="text-gray-600 mb-4">
        This queue helps the warehouse prioritize orders that are most likely to
        be delivered late. Orders are ranked by their predicted late delivery
        probability (highest first). Red rows indicate high risk (&gt;70%),
        yellow is moderate (&gt;40%), and green is low risk.
      </p>

      {error && (
        <div className="bg-red-50 border border-red-200 p-4 rounded text-red-700 text-sm">
          <p className="font-semibold">Error loading priority queue</p>
          <p className="mt-1">{error.message}</p>
          <p className="mt-2 text-gray-600">
            Make sure the <code>get_priority_queue</code> function exists in
            Supabase. See the README for the SQL.
          </p>
        </div>
      )}

      {data && data.length === 0 && (
        <p className="text-gray-500">
          No unfulfilled orders with predictions found.
        </p>
      )}

      {data && data.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm bg-white rounded shadow">
            <thead className="bg-gray-100">
              <tr>
                <th className="text-left p-3">Order ID</th>
                <th className="text-left p-3">Customer</th>
                <th className="text-left p-3">Order Date</th>
                <th className="text-right p-3">Total Value</th>
                <th className="text-right p-3">Late Probability</th>
                <th className="text-left p-3">Predicted Late</th>
                <th className="text-left p-3">Prediction Date</th>
              </tr>
            </thead>
            <tbody>
              {(data as PriorityRow[]).map((row) => (
                <tr
                  key={row.order_id}
                  className={`border-t ${getProbabilityColor(
                    Number(row.late_delivery_probability)
                  )}`}
                >
                  <td className="p-3 font-mono">{row.order_id}</td>
                  <td className="p-3">{row.customer_name}</td>
                  <td className="p-3">
                    {new Date(row.order_timestamp).toLocaleDateString()}
                  </td>
                  <td className="p-3 text-right">
                    ${Number(row.total_value).toFixed(2)}
                  </td>
                  <td className="p-3 text-right font-semibold">
                    {(Number(row.late_delivery_probability) * 100).toFixed(1)}%
                  </td>
                  <td className="p-3">
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        row.predicted_late_delivery
                          ? "bg-red-200 text-red-800"
                          : "bg-green-200 text-green-800"
                      }`}
                    >
                      {row.predicted_late_delivery ? "Yes" : "No"}
                    </span>
                  </td>
                  <td className="p-3">
                    {new Date(row.prediction_timestamp).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
