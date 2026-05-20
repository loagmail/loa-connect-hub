import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { userRepository } from "@/lib/repositories/factory"
import { getAllAppointments } from "@/lib/controllers/appointments"

async function getUsers() {
  const users = await userRepository.listByRole("STUDENT")
  const faculty = await userRepository.listByRole("FACULTY")
  const admins = await userRepository.listByRole("ADMIN")
  return [...admins, ...faculty, ...users].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )
}

async function getAppointments() {
  return getAllAppointments()
}

export default async function AdminDashboard() {
  const session = await auth()
  if (!session?.user) redirect("/login")
  if ((session.user as any).role !== "ADMIN") redirect("/login")

  const users = await getUsers()
  const appointments = (await getAppointments()) as any[]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-600 mt-1">System overview and management</p>
      </div>

      <section>
        <h2 className="text-xl font-semibold text-gray-800 mb-4">All Users ({users.length})</h2>
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map((user) => (
                <tr key={user.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{user.email}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      user.role === "ADMIN" ? "bg-purple-100 text-purple-800" :
                      user.role === "FACULTY" ? "bg-blue-100 text-blue-800" :
                      "bg-green-100 text-green-800"
                    }`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-gray-800 mb-4">All Appointments ({appointments.length})</h2>
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Faculty</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date/Time</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {appointments.map((apt) => (
                <tr key={apt.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{apt.student?.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{apt.faculty?.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {apt.schedule?.date} {apt.schedule?.startTime}-{apt.schedule?.endTime}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      apt.status === "PENDING" ? "bg-yellow-100 text-yellow-800" :
                      apt.status === "APPROVED" ? "bg-green-100 text-green-800" :
                      apt.status === "REJECTED" ? "bg-red-100 text-red-800" :
                      "bg-blue-100 text-blue-800"
                    }`}>
                      {apt.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
