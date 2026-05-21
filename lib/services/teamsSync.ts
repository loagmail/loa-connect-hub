import { appointmentRepository } from "@/lib/repositories/factory"
import { createOnlineMeeting } from "@/lib/services/graph"
import { prisma } from "@/lib/prisma"

export interface SyncResult {
  processed: number
  succeeded: number
  failed: number
  skipped: number
  errors: string[]
}

/**
 * Orchestration: Poll for UNWRITTEN appointments and sync them to MS Teams.
 * Called manually via API or cron. Never blocks — best-effort per appointment.
 */
export async function syncPendingAppointments(): Promise<SyncResult> {
  const result: SyncResult = { processed: 0, succeeded: 0, failed: 0, skipped: 0, errors: [] }

  if (process.env.FEATURE_CREATE_TEAMS_MEETING !== "true") {
    result.skipped = 0
    result.errors.push("Teams sync is disabled (FEATURE_CREATE_TEAMS_MEETING !== true)")
    return result
  }

  const pending = await appointmentRepository.listPendingSync()
  result.processed = pending.length

  for (const appointment of pending as any[]) {
    const now = new Date()

    try {
      // Find the faculty's Microsoft access token
      const account = await prisma.account.findFirst({
        where: {
          userId: appointment.facultyId,
          provider: "azure-ad",
        },
      })

      if (!account?.access_token) {
        // No Microsoft token — skip silently, will retry next cycle
        result.skipped++
        continue
      }

      const studentName = appointment.student?.name || "Student"
      const facultyName = appointment.faculty?.name || "Faculty"
      const date = appointment.date || "Unknown date"
      const startTime = appointment.startTime || "00:00"
      const endTime = appointment.endTime || "01:00"

      const joinUrl = await createOnlineMeeting(account.access_token, {
        subject: `Consultation: ${studentName} & ${facultyName}`,
        startDateTime: `${date}T${startTime}:00`,
        endDateTime: `${date}T${endTime}:00`,
      })

      await appointmentRepository.update(appointment.id, {
        teamsLink: joinUrl,
        teamsSyncStatus: "WRITTEN",
        teamsSyncLastAttempt: now,
      })

      result.succeeded++
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error"
      const current = appointment as any

      // Increment retries
      const newRetries = (current.teamsSyncRetries || 0) + 1
      const newStatus = newRetries >= 5 ? "FAILED" : "UNWRITTEN" as any

      await appointmentRepository.update(appointment.id, {
        teamsSyncRetries: newRetries,
        teamsSyncError: errorMessage,
        teamsSyncStatus: newStatus,
        teamsSyncLastAttempt: now,
      } as any)

      if (newStatus === "FAILED") {
        result.errors.push(`Appointment ${appointment.id}: ${errorMessage} (max retries reached)`)
      } else {
        result.errors.push(`Appointment ${appointment.id}: ${errorMessage} (retry ${newRetries}/5)`)
      }
      result.failed++
    }
  }

  return result
}
