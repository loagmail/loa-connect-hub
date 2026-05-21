export interface CsvRow {
  name: string
  email: string
  department: string | null
  isDean: boolean
}

export interface CsvParseResult {
  rows: CsvRow[]
  errors: { row: number; message: string }[]
}

const ALLOWED_DOMAIN = "@itmlyceumalabang.onmicrosoft.com"

export function parseCsv(text: string): CsvParseResult {
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0)
  const rows: CsvRow[] = []
  const errors: { row: number; message: string }[] = []

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const cols = line.split("|").map((c) => c.trim())

    if (cols.length < 2) {
      errors.push({ row: i + 1, message: `Expected at least 2 columns (Name, Email), got ${cols.length}` })
      continue
    }

    const name = cols[0]
    const email = cols[1].toLowerCase().trim()

    if (!email.endsWith(ALLOWED_DOMAIN)) {
      errors.push({ row: i + 1, message: `Email "${email}" must end with ${ALLOWED_DOMAIN}` })
      continue
    }

    if (name.length === 0) {
      errors.push({ row: i + 1, message: "Name is required" })
      continue
    }

    const department = cols[2]?.trim() || null
    const isDean = cols[3]?.trim().toLowerCase() === "true"

    rows.push({ name, email, department, isDean })
  }

  return { rows, errors }
}
