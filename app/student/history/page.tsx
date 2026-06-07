import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { listStudentAppointments } from "@/features/appointments/appointments.service"
import { userRepository } from "@/lib/repositories/factory"
import ConsultationHistory from "@/components/ConsultationHistory"
import { hasRole } from "@/lib/utils/roles"

interface HistoryAppointment {
  id: string
  title: string | null
  description: string | null
  actionTaken: string | null
  date: string
  startTime: string
  endTime: string
  status: string
  faculty?: { name: string; email: string } | null
}

export default async function StudentHistoryPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")
  if (!hasRole((session.user as Record<string, unknown>).role as string, "STUDENT")) redirect("/login")

  const userId = (session.user as Record<string, unknown>).id as string
  const dbUser = await userRepository.findById(userId)
  const appointments = (await listStudentAppointments(userId)) as unknown as HistoryAppointment[]

  return (
    <ConsultationHistory
      studentName={dbUser?.name || "Student"}
      course={dbUser?.course || null}
      appointments={appointments}
    />
  )
}
