import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export default async function DebugSchemaPage() {
  // Try using rpc first — requires creating the function in Supabase SQL Editor:
  // CREATE OR REPLACE FUNCTION get_schema_info()
  // RETURNS TABLE(table_name text, column_name text, data_type text, is_nullable text)
  // LANGUAGE sql SECURITY DEFINER AS $$
  //   SELECT table_name::text, column_name::text, data_type::text, is_nullable::text
  //   FROM information_schema.columns
  //   WHERE table_schema = 'public'
  //   ORDER BY table_name, ordinal_position;
  // $$;

  const { data, error } = await supabase.rpc("get_schema_info");

  if (error) {
    return (
      <div>
        <h1 className="text-2xl font-bold mb-4">Debug: Schema</h1>
        <div className="bg-red-50 border border-red-200 p-4 rounded">
          <p className="font-semibold text-red-700">Error loading schema</p>
          <p className="text-sm text-red-600 mt-1">{error.message}</p>
          <p className="text-sm text-gray-600 mt-2">
            You may need to create the <code>get_schema_info</code> function in
            Supabase SQL Editor. See the source code comment for the SQL.
          </p>
        </div>
      </div>
    );
  }

  // Group columns by table
  const tables: Record<
    string,
    { column_name: string; data_type: string; is_nullable: string }[]
  > = {};
  for (const row of data || []) {
    if (!tables[row.table_name]) tables[row.table_name] = [];
    tables[row.table_name].push(row);
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Debug: Schema</h1>
      {Object.entries(tables).map(([tableName, columns]) => (
        <div key={tableName} className="mb-6">
          <h2 className="text-lg font-semibold mb-2 text-indigo-700">
            {tableName}
          </h2>
          <table className="w-full text-sm border">
            <thead className="bg-gray-100">
              <tr>
                <th className="text-left p-2 border">Column</th>
                <th className="text-left p-2 border">Type</th>
                <th className="text-left p-2 border">Nullable</th>
              </tr>
            </thead>
            <tbody>
              {columns.map((col) => (
                <tr key={col.column_name}>
                  <td className="p-2 border font-mono">{col.column_name}</td>
                  <td className="p-2 border">{col.data_type}</td>
                  <td className="p-2 border">{col.is_nullable}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
}
