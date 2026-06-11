import { NextRequest, NextResponse } from "next/server"
import { parseCsv } from "@/lib/services/csvParser"
import { userRepository } from "@/lib/repositories/factory"
import { requireRole } from "@/lib/route-guard"

export async function POST(request: NextRequest) {
  const authErr = await requireRole(request, ["ADMIN", "DEAN", "FACULTY"])
  if (authErr) return authErr

  const formData = await request.formData()
  const file = formData.get("file") as File | null
  const templateType = (formData.get("type") as string) || "full"

  if (!file) {
    return NextResponse.json({ error: "CSV file is required" }, { status: 400 })
  }

  if (templateType !== "full" && templateType !== "students") {
    return NextResponse.json({ error: "Invalid import type" }, { status: 400 })
  }

  const text = await file.text()
  const { rows, errors: parseErrors, headerError } = parseCsv(text, templateType)
  if (headerError) {
    return NextResponse.json({ error: `Header mismatch: ${headerError}` }, { status: 400 })
  }

  // Check each email against existing users
  const previewRows = await Promise.all(
    rows.map(async (row) => {
      const existingUser = row.email ? await userRepository.findByEmail(row.email) : null
      return {
        row: 0, // will be assigned client-side
        name: row.name,
        email: row.email,
        section: row.section || "",
        code: row.code || "",
        title: row.title || "",
        course: row.course || "",
        emailExists: !!existingUser,
        existingName: existingUser?.name || null,
      }
    })
  )

  return NextResponse.json({
    rows: previewRows,
    parseErrors,
    totalRows: rows.length,
  })
}
