import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import StudentBooking from "@/components/StudentBooking"
import { userRepository, availabilityRuleRepository, departmentRepository } from "@/lib/repositories/factory"

export default async function FacultyBookPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const role = (session.user as any).role
  if (!["FACULTY", "DEAN"].includes(role)) redirect("/login")

  const facultyUsers = await userRepository.listByRole("FACULTY")
  const deanUsers = await userRepository.listByRole("DEAN")
  const allFaculty = [...facultyUsers, ...deanUsers].filter((f) => !f.isDisabled)
  const departments = await departmentRepository.listAll()
  const deptMap = new Map(departments.map((d) => [d.id, d.name]))

  const facultyWithRules = await Promise.all(
    allFaculty.map(async (f) => {
      const rules = await availabilityRuleRepository.listByFaculty(f.id)
      return {
        id: f.id,
        name: f.name,
        email: f.email,
        hasLoggedInBefore: f.hasLoggedInBefore,
        department: f.departmentId ? deptMap.get(f.departmentId) || null : null,
        rules,
      }
    })
  )

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Book a Consultation</h1>
        <p className="text-sm text-slate-500 mt-1">Select faculty or deans and schedule your consultation time.</p>
      </div>
      <StudentBooking facultyWithRules={facultyWithRules as any} serverNow={new Date().toISOString()} />
    </div>
  )
}
