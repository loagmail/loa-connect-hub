import { Suspense } from "react"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { listFacultyAppointments } from "@/features/appointments/appointments.service"
import { userRepository } from "@/lib/repositories/factory"
import { OnboardingWalkthrough } from "@/features/users/components/OnboardingWalkthrough"
import { hasRole } from "@/lib/utils/roles"
import FacultyDeanDashboard from "@/features/appointments/components/FacultyDeanDashboard"
import { SkeletonCard } from "@/components/ui/Skeleton"

async function FacultyOnboardingSection({ userId, role }: { userId: string; role: string }) {
  const dbUser = await userRepository.findById(userId)
  if (dbUser?.onboardingVersion === 0 && hasRole(role, "FACULTY")) {
    return <OnboardingWalkthrough role="FACULTY" userId={userId} />
  }
  return null
}

async function FacultyMainSection({ userId, role }: { userId: string; role: string }) {
  const [dbUser, { data: appointments }] = await Promise.all([
    userRepository.findById(userId),
    listFacultyAppointments(userId),
  ])

  return (
    <FacultyDeanDashboard
      userName={dbUser?.name || "Faculty"}
      role={hasRole(role, "DEAN") ? "DEAN" : "FACULTY"}
      appointments={appointments}
    />
  )
}

export default async function FacultyDashboard() {
  const session = await auth()
  if (!session?.user) redirect("/login")
  const role = (session.user as Record<string, unknown>).role as string
  const facultyId = (session.user as Record<string, unknown>).id as string

  return (
    <>
      <Suspense fallback={null}>
        <FacultyOnboardingSection userId={facultyId} role={role} />
      </Suspense>
      <Suspense fallback={<SkeletonCard count={3} />}>
        <FacultyMainSection userId={facultyId} role={role} />
      </Suspense>
    </>
  )
}
