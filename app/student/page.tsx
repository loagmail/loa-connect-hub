import { Suspense } from "react"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { listStudentAppointments } from "@/features/appointments/appointments.service"
import { userRepository } from "@/lib/repositories/factory"
import { getActiveSemester } from "@/features/admin-data/semesters.service"
import { OnboardingWalkthrough } from "@/features/users/components/OnboardingWalkthrough"
import StudentDashboard from "@/features/users/components/StudentDashboard"
import { SkeletonCard } from "@/components/ui/Skeleton"


interface StudentAppointment {
  id: string
  title: string | null
  date: string
  startTime: string
  endTime: string
  status: string
  teamsLink: string | null
  faculty?: { name: string; email: string } | null
}

async function StudentOnboardingSection({ userId }: { userId: string }) {
  const dbUser = await userRepository.findById(userId)
  if (dbUser?.onboardingVersion === 0) {
    return <OnboardingWalkthrough role="STUDENT" userId={userId} />
  }
  return null
}

async function StudentMainSection({ userId }: { userId: string }) {
  const [dbUser, appointments, activeSemester] = await Promise.all([
    userRepository.findById(userId),
    listStudentAppointments(userId).then((r) => r.data as StudentAppointment[]),
    getActiveSemester(),
  ])

  return (
    <StudentDashboard
      studentName={dbUser?.name || "Student"}
      course={dbUser?.course || null}
      appointments={appointments}
      hasEvaluations={!!activeSemester}
    />
  )
}

export default async function StudentDashboardPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const userId = (session.user as Record<string, unknown>).id as string

  return (
    <>
      <Suspense fallback={null}>
        <StudentOnboardingSection userId={userId} />
      </Suspense>
      <Suspense fallback={<SkeletonCard count={3} />}>
        <StudentMainSection userId={userId} />
      </Suspense>
    </>
  )
}
