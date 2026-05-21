import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  if ((session.user as any).role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const pendingCount = await prisma.appointment.count({
    where: { status: "APPROVED", teamsSyncStatus: "UNWRITTEN" },
  })

  const failedCount = await prisma.appointment.count({
    where: { status: "APPROVED", teamsSyncStatus: "FAILED" },
  })

  const writtenCount = await prisma.appointment.count({
    where: { status: "APPROVED", teamsSyncStatus: "WRITTEN" },
  })

  const failedAppointments = await prisma.appointment.findMany({
    where: { teamsSyncStatus: "FAILED" },
    select: {
      id: true,
      teamsSyncError: true,
      teamsSyncRetries: true,
      teamsSyncLastAttempt: true,
      student: { select: { name: true } },
      faculty: { select: { name: true } },
      schedule: { select: { date: true, startTime: true, endTime: true } },
    },
    orderBy: { updatedAt: "desc" },
    take: 20,
  })

  // Find the most recent sync attempt across all appointments
  const lastAttempt = await prisma.appointment.findFirst({
    where: { teamsSyncLastAttempt: { not: null } },
    orderBy: { teamsSyncLastAttempt: "desc" },
    select: { teamsSyncLastAttempt: true },
  })

  return NextResponse.json({
    pendingCount,
    failedCount,
    writtenCount,
    lastSync: lastAttempt?.teamsSyncLastAttempt || null,
    failedAppointments,
  })
}
