import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import { AppointmentCard } from "@/components/AppointmentCard"
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
  let upcomingAppointments = 0
  const allUpcoming: any[] = []
  const allRequests: any[] = []
  const facultyAppointmentCounts: { name: string; total: number; pending: number }[] = []

  const today = new Date().toISOString().slice(0, 10)

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

    for (const a of appointments) {
      if (a.date >= today && (a.status === "APPROVED" || a.status === "PENDING")) {
        allUpcoming.push({ ...a, facultyName: faculty.name })
      }
      if (a.status === "PENDING") {
        allRequests.push({ ...a, facultyName: faculty.name })
      }
    }
  }

  upcomingAppointments = allUpcoming.length

  allUpcoming.sort((a, b) => a.date.localeCompare(b.date))
  allRequests.sort((a, b) => a.date.localeCompare(b.date))

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
          <p className="text-3xl font-bold text-slate-900">{upcomingAppointments}</p>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-1">Upcoming Schedules</p>
        </div>
        <div className="card p-5 bg-white">
          <p className="text-3xl font-bold text-slate-900">{pendingAppointments}</p>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-1">Pending Requests</p>
        </div>
      </div>

      {/* Upcoming Consultation Schedules */}
      <section className="space-y-4">
        <h2 className="text-lg font-bold text-slate-900">Upcoming Consultation Schedules</h2>
        {allUpcoming.length === 0 ? (
          <div className="card p-12 text-center bg-white">
            <div className="w-12 h-12 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-center mx-auto mb-4 text-slate-400">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <p className="text-slate-700 font-semibold text-sm">No upcoming schedules</p>
            <p className="text-slate-400 text-xs mt-1">No upcoming appointments across your department.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {allUpcoming.slice(0, 10).map((appointment: any) => (
              <AppointmentCard key={appointment.id} appointment={appointment} role="FACULTY" />
            ))}
            {allUpcoming.length > 10 && (
              <p className="text-xs text-slate-500 text-center pt-2">
                Showing 10 of {allUpcoming.length} upcoming schedules
              </p>
            )}
          </div>
        )}
      </section>

      {/* Consultation Requests */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900">Consultation Requests</h2>
          {allRequests.length > 0 && (
            <span className="text-xs font-semibold bg-amber-500/20 text-amber-600 px-2.5 py-0.5 rounded-full">
              {allRequests.length} pending
            </span>
          )}
        </div>
        {allRequests.length === 0 ? (
          <div className="card p-12 text-center bg-white">
            <p className="text-slate-700 font-semibold text-sm">No pending requests</p>
            <p className="text-slate-400 text-xs mt-1">No pending consultation requests across your department.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {allRequests.slice(0, 10).map((appointment: any) => (
              <AppointmentCard key={appointment.id} appointment={appointment} role="FACULTY" />
            ))}
            {allRequests.length > 10 && (
              <p className="text-xs text-slate-500 text-center pt-2">
                Showing 10 of {allRequests.length} pending requests
              </p>
            )}
          </div>
        )}
      </section>

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
                        className="text-gold-600 hover:text-gold-800 text-xs font-semibold"
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
          <p className="font-semibold text-slate-900">Faculty Consultations</p>
          <p className="text-xs text-slate-500 mt-1">Schedule and manage faculty-to-faculty consultations</p>
        </Link>
      </section>
    </div>
  )
}
