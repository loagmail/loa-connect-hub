import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { ScheduleCard } from "@/components/ScheduleCard"
import { AppointmentCard } from "@/components/AppointmentCard"
import { listAvailableSchedules } from "@/lib/controllers/schedules"
import { listStudentAppointments } from "@/lib/controllers/appointments"

export default async function StudentDashboard() {
  const session = await auth()
  if (!session?.user) redirect("/login")
  if ((session.user as any).role !== "STUDENT") redirect("/login")

  const schedules = await listAvailableSchedules()
  const appointments = await listStudentAppointments((session.user as any).id)

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Student Dashboard</h1>
        <p className="text-gray-600 mt-1">Welcome, {session.user.name}</p>
      </div>

      <section>
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Available Consultation Slots</h2>
        {schedules.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-6 text-center text-gray-500">
            No available consultation slots at this time.
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {schedules.map((schedule: any) => (
              <ScheduleCard key={schedule.id} schedule={schedule} />
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="text-xl font-semibold text-gray-800 mb-4">My Appointments</h2>
        {appointments.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-6 text-center text-gray-500">
            You have no appointments yet.
          </div>
        ) : (
          <div className="space-y-4">
            {appointments.map((appointment: any) => (
              <AppointmentCard key={appointment.id} appointment={appointment} role="STUDENT" />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
