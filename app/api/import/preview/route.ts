import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { parseCsv } from "@/lib/services/csvParser"
import { userRepository } from "@/lib/repositories/factory"
import { hasRole } from "@/lib/utils/roles"

export async function POST(request: NextRequest) {
  const session = await auth()
  const role = (session?.user as Record<string, unknown> | undefined)?.role as string | undefined

  if (!session?.user || (!hasRole(role ?? "", "ADMIN") && !hasRole(role ?? "", "DEAN"))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const formData = await request.formData()
  const file = formData.get("file") as File | null
  const templateType = (formData.get("type") as string | null) === "students" ? "students" : "full"

  if (!file) {
    return NextResponse.json({ error: "CSV file is required" }, { status: 400 })
  }

  const text = await file.text()
  const parsed = parseCsv(text, templateType)

  if (parsed.headerError) {
    return NextResponse.json({ error: `Header mismatch: ${parsed.headerError}` }, { status: 400 })
  }

  if (parsed.errors.length > 0 && parsed.rows.length === 0) {
    return NextResponse.json({ error: "CSV parsing failed", details: parsed.errors }, { status: 400 })
  }

  const rows = await Promise.all(
    parsed.rows.map(async (row) => {
      const existing = await userRepository.findByEmail(row.email)
      return {
        ...row,
        emailExists: Boolean(existing),
        existingName: existing?.name ?? null,
      }
    }),
  )

  return NextResponse.json({ totalRows: rows.length, rows, errors: parsed.errors })
}
