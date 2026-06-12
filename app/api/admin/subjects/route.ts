import { NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import { requireAdmin } from "@/lib/route-guard"

export async function POST(request: NextRequest) {
  const authErr = await requireAdmin(request)
  if (authErr) return authErr

  try {
    const { code, name } = await request.json()
    if (!code || !name) {
      return NextResponse.json({ error: "Code and Name are required" }, { status: 400 })
    }

    const { data, error } = await supabase
      .from("subjects")
      .insert({ code: code.toUpperCase(), name, isDisabled: false })
      .select("*")
      .single()

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json({ error: "Subject code already exists" }, { status: 409 })
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data, { status: 201 })
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
  }
}
