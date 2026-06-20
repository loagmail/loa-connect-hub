import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import StudentBooking from "@/features/appointments/components/StudentBooking"
import { userRepository, departmentRepository } from "@/lib/repositories/factory"
import { hasRole } from "@/lib/utils/roles"

export default async function FacultyBookPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const role = (session.user as Record<string, unknown>).role as string
  if (!hasRole(role, "FACULTY") && !hasRole(role, "DEAN")) redirect("/login")

  const currentUser = session.user as Record<string, unknown>
  const currentUserId = currentUser.id as string

  const facultyUsers = await userRepository.listByRole("FACULTY")
  const deanUsers = await userRepository.listByRole("DEAN")
  const allFaculty = [...facultyUsers, ...deanUsers].filter((f) => !f.isDisabled)
  const departments = await departmentRepository.listAll()
  const deptMap = new Map(departments.map((d) => [d.id, d.name]))

  const studentUsers = await userRepository.listByRole("STUDENT")
  const students = studentUsers.filter((s) => !s.isDisabled).map((s) => ({
    id: s.id,
    name: s.name,
    email: s.email,
    department: s.departmentId ? deptMap.get(s.departmentId) || null : null,
  }))

  const facultyList = allFaculty.map((f) => ({
    id: f.id,
    name: f.name,
    email: f.email,
    hasLoggedInBefore: !!f.hasLoggedInBefore,
    department: f.departmentId ? deptMap.get(f.departmentId) || null : null,
  }))

  return (
    <div className="w-full space-y-8 pb-12">
      <div>
        <h1 className="text-2xl font-bold text-primary">Schedule a Meeting</h1>
        <p className="text-sm text-tertiary mt-1">Schedule a meeting with optional attendees.</p>
      </div>
      <StudentBooking facultyList={facultyList} userRole={role as "STUDENT" | "FACULTY" | "DEAN"} students={students} serverNow={new Date().toISOString()} currentUserId={currentUserId} />
    </div>
  )
}
