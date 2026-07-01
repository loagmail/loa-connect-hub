/**
 * Strip leading/trailing whitespace and escape characters from a CSV cell value.
 * Handles Excel's "'" prefix that prevents auto-formatting (e.g. `'41E1` → `41E1`).
 */
export function cleanCell(s: string): string {
  return s.trim().replace(/^['"]+|['"]+$/g, "")
}

/**
 * Parse a raw CSV text into rows of string arrays.
 * Removes empty lines and returns each row as an array of cleaned cell values.
 */
export function parseCsvLines(text: string): { headers: string[]; rows: string[][] } {
  const lines = text.split(/\r?\n/).filter((l) => l.trim())
  if (lines.length < 2) return { headers: [], rows: [] }

  const headers = lines[0].split(",").map((h) => cleanCell(h).toLowerCase())
  const rows = lines.slice(1).map((line) => line.split(",").map((c) => cleanCell(c)))

  return { headers, rows }
}
