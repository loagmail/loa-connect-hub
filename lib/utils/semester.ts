/**
 * Academic semester utilities
 *
 * Calendar: 1st Semester = August–January, 2nd Semester = February–July
 */

export interface SemesterInfo {
  /** Display label e.g. "1st Sem AY 2025-2026" */
  label: string
  /** ISO start date e.g. "2025-08-01" */
  startDate: string
  /** ISO end date e.g. "2026-01-31" */
  endDate: string
  /** 1 or 2 */
  semester: 1 | 2
  /** e.g. "2025-2026" */
  academicYear: string
}

/** Get semester info for a given date string (YYYY-MM-DD). */
export function getSemester(dateStr: string): SemesterInfo {
  const d = new Date(dateStr + "T00:00:00")
  const month = d.getMonth() + 1 // 1-indexed
  const year = d.getFullYear()

  if (month >= 8) {
    // Aug–Dec → 1st Sem AY year-(year+1)
    return {
      label: `1st Sem AY ${year}-${year + 1}`,
      startDate: `${year}-08-01`,
      endDate: `${year + 1}-01-31`,
      semester: 1,
      academicYear: `${year}-${year + 1}`,
    }
  } else if (month >= 2) {
    // Feb–Jul → 2nd Sem AY (year-1)-year
    return {
      label: `2nd Sem AY ${year - 1}-${year}`,
      startDate: `${year}-02-01`,
      endDate: `${year}-07-31`,
      semester: 2,
      academicYear: `${year - 1}-${year}`,
    }
  } else {
    // January → 1st Sem AY (year-1)-year
    return {
      label: `1st Sem AY ${year - 1}-${year}`,
      startDate: `${year - 1}-08-01`,
      endDate: `${year}-01-31`,
      semester: 1,
      academicYear: `${year - 1}-${year}`,
    }
  }
}

/** Generate the N most recent semesters as presets (including current). */
export function getRecentSemesters(count = 4): SemesterInfo[] {
  const seen = new Set<string>()
  const result: SemesterInfo[] = []
  const now = new Date()
  // Walk backwards from today up to ~3 years to collect enough semesters
  for (let i = 0; i < 36; i++) {
    const d = new Date(now)
    d.setMonth(d.getMonth() - i)
    const dateStr = d.toISOString().slice(0, 10)
    const sem = getSemester(dateStr)
    if (!seen.has(sem.label)) {
      seen.add(sem.label)
      result.push(sem)
    }
    if (result.length >= count) break
  }
  return result
}

/** Compute semester label from a month (1-indexed) and year. */
export function monthYearToSemester(month: number, year: number): SemesterInfo {
  const monthStr = String(month).padStart(2, "0")
  return getSemester(`${year}-${monthStr}-15`)
}
