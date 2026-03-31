import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ name: null });

  const { data } = await supabase
    .from("customers")
    .select("full_name")
    .eq("customer_id", id)
    .single();

  if (!data) return NextResponse.json({ name: null });
  return NextResponse.json({ name: data.full_name });
}
