import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { AvailabilityForm } from "@/components/AvailabilityForm"
import { AppointmentCard } from "@/components/AppointmentCard"
import { listFacultySchedules } from "@/lib/controllers/schedules"
import { listFacultyAppointments } from "@/lib/controllers/appointments"

export default async function FacultyDashboard() {
  const session = await auth()
  if (!session?.user) redirect("/login")
  if ((session.user as any).role !== "FACULTY") redirect("/login")

  const facultyId = (session.user as any).id
  const schedules = await listFacultySchedules(facultyId)
  const appointments = await listFacultyAppointments(facultyId)

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Faculty Dashboard</h1>
        <p className="text-gray-600 mt-1">Welcome, {session.user.name}</p>
      </div>

      <section>
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Create Availability</h2>
        <div className="bg-white rounded-lg shadow p-6">
          <AvailabilityForm />
        </div>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-gray-800 mb-4">My Schedules</h2>
        {schedules.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-6 text-center text-gray-500">
            You have not created any availability slots yet.
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {schedules.map((schedule: any) => (
                  <tr key={schedule.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{schedule.date}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{schedule.startTime} - {schedule.endTime}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${schedule.isAvailable ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}`}>
                        {schedule.isAvailable ? "Available" : "Booked"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section>
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Appointment Requests</h2>
        {appointments.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-6 text-center text-gray-500">
            No appointment requests yet.
          </div>
        ) : (
          <div className="space-y-4">
            {appointments.map((appointment: any) => (
              <AppointmentCard key={appointment.id} appointment={appointment} role="FACULTY" />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
