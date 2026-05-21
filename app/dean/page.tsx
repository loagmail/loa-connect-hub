import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import { listFacultyAppointments } from "@/lib/controllers/appointments"
import { userRepository, departmentRepository } from "@/lib/repositories/factory"

export default async function DeanDashboard() {
  const session = await auth()
  if (!session?.user) redirect("/login")
  if ((session.user as any).role !== "DEAN") redirect("/login")

  const deanId = (session.user as any).id
  const department = await departmentRepository.findByDeanId(deanId)

  const facultyUsers = department
    ? await userRepository.listByDepartment(department.id)
    : []

  const facultyMembers = facultyUsers.filter(u => u.role === "FACULTY" || u.role === "DEAN")

  let totalAppointments = 0
  let pendingAppointments = 0
  const facultyAppointmentCounts: { name: string; total: number; pending: number }[] = []

  for (const faculty of facultyMembers) {
    const appointments = await listFacultyAppointments(faculty.id)
    const pending = appointments.filter(a => a.status === "PENDING").length
    totalAppointments += appointments.length
    pendingAppointments += pending
    facultyAppointmentCounts.push({
      name: faculty.name,
      total: appointments.length,
      pending,
    })
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          Dean Dashboard
          {department && (
            <span className="ml-2 text-base font-normal text-slate-400">
              — {department.name}
            </span>
          )}
        </h1>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="card p-5 bg-white">
          <p className="text-3xl font-bold text-slate-900">{facultyMembers.length}</p>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-1">Faculty Members</p>
        </div>
        <div className="card p-5 bg-white">
          <p className="text-3xl font-bold text-slate-900">{totalAppointments}</p>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-1">Total Appointments</p>
        </div>
        <div className="card p-5 bg-white">
          <p className="text-3xl font-bold text-slate-900">{pendingAppointments}</p>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-1">Pending Across Faculty</p>
        </div>
      </div>

      {/* Faculty Overview */}
      <section className="space-y-4">
        <h2 className="text-lg font-bold text-slate-900">Faculty Overview</h2>
        {facultyAppointmentCounts.length === 0 ? (
          <div className="card p-12 text-center bg-white">
            <p className="text-slate-500 text-sm">No faculty members found in your department.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="pb-3 pr-4">Faculty</th>
                  <th className="pb-3 pr-4">Total Appointments</th>
                  <th className="pb-3 pr-4">Pending</th>
                  <th className="pb-3 pr-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {facultyAppointmentCounts.map((f) => (
                  <tr key={f.name} className="border-b border-slate-100">
                    <td className="py-3 pr-4 font-medium text-slate-800">{f.name}</td>
                    <td className="py-3 pr-4 text-slate-600">{f.total}</td>
                    <td className="py-3 pr-4">
                      <span className={`text-xs font-semibold ${f.pending > 0 ? "text-amber-600" : "text-slate-400"}`}>
                        {f.pending}
                      </span>
                    </td>
                    <td className="py-3 pr-4">
                      <Link
                        href="/faculty/availability"
                        className="text-indigo-600 hover:text-indigo-800 text-xs font-semibold"
                      >
                        View Details
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Quick Links */}
      <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link
          href="/faculty"
          className="card p-5 bg-white hover:shadow-md transition-shadow"
        >
          <p className="font-semibold text-slate-900">My Appointments</p>
          <p className="text-xs text-slate-500 mt-1">View and manage your own consultations</p>
        </Link>
        <Link
          href="/faculty/availability"
          className="card p-5 bg-white hover:shadow-md transition-shadow"
        >
          <p className="font-semibold text-slate-900">Availability Settings</p>
          <p className="text-xs text-slate-500 mt-1">Configure your consultation availability hours</p>
        </Link>
        <Link
          href="/faculty/meetings"
          className="card p-5 bg-white hover:shadow-md transition-shadow"
        >
          <p className="font-semibold text-slate-900">Faculty Meetings</p>
          <p className="text-xs text-slate-500 mt-1">Schedule and manage faculty-to-faculty meetings</p>
        </Link>
      </section>
    </div>
  )
}
