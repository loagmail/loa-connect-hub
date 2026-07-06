import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const { data, error } = await supabase.from("semesters").select("id").eq("isActive", true)
    if (error) {
      return NextResponse.json({ count: 1 }, { status: 200 })
    }
    return NextResponse.json({ count: data?.length ?? 0 }, { status: 200 })
  } catch {
    return NextResponse.json({ count: 1 }, { status: 200 })
  }
}
