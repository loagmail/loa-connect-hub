import { availabilityRuleRepository } from "@/lib/repositories/factory"
import type { UpsertAvailabilityRuleInput } from "@/lib/types"

export async function listAvailabilityRules(facultyId: string) {
  return availabilityRuleRepository.listByFaculty(facultyId)
}

export async function upsertAvailabilityRule(input: UpsertAvailabilityRuleInput) {
  return availabilityRuleRepository.upsert(input)
}

export async function deleteAvailabilityRule(id: string) {
  await availabilityRuleRepository.delete(id)
}

/**
 * Find the active rule for a faculty on a specific date.
 * Checks all rules matching that faculty + dayOfWeek,
 * filters by date range (startDate <= date <= endDate OR no endDate),
 * and returns the one with the latest startDate if multiple match.
 */
export async function findActiveRule(facultyId: string, date: string) {
  const dayOfWeek = new Date(date + "T00:00:00").getDay()
  // Convert Sunday=0 → Monday=0, ..., Saturday=6 → Sunday=6
  const adjustedDay = dayOfWeek === 0 ? 6 : dayOfWeek - 1

  const allRules = await availabilityRuleRepository.listByFaculty(facultyId)
  const matchingRules = allRules.filter(
    (r) =>
      r.dayOfWeek === adjustedDay &&
      r.startDate <= date &&
      (r.endDate === null || r.endDate >= date)
  )

  if (matchingRules.length === 0) return null

  // Return the one with the latest startDate (most recently effective)
  matchingRules.sort((a, b) => b.startDate.localeCompare(a.startDate))
  return matchingRules[0]
}

/**
 * Get the effective available hours for a faculty on a given date.
 * Returns null if the day is blocked, or { startTime, endTime } if available.
 * If no active rule exists, returns isBlocked: true.
 */
export async function getEffectiveHours(facultyId: string, date: string) {
  const rule = await findActiveRule(facultyId, date)

  if (!rule) {
    // No active rule = blocked (faculty hasn't set availability for this period)
    return { isBlocked: true, startTime: null, endTime: null }
  }

  if (rule.isBlocked) {
    return { isBlocked: true, startTime: null, endTime: null }
  }

  return { isBlocked: false, startTime: rule.startTime, endTime: rule.endTime }
}

/**
 * Check if a given time slot falls within a faculty's active availability rules.
 */
export async function isSlotAllowed(
  facultyId: string,
  date: string,
  startTime: string,
  endTime: string
): Promise<boolean> {
  const effective = await getEffectiveHours(facultyId, date)

  if (effective.isBlocked) return false

  // If no time window restriction, allow
  if (!effective.startTime || !effective.endTime) return true

  // Check if the slot falls within the allowed window
  return startTime >= effective.startTime && endTime <= effective.endTime
}
