export type Role = "STUDENT" | "FACULTY" | "ADMIN"
export type AppointmentStatus = "PENDING" | "APPROVED" | "REJECTED" | "COMPLETED"

export interface User {
  id: string
  name: string
  email: string
  role: Role
  createdAt: Date
}

export interface FacultySchedule {
  id: string
  facultyId: string
  date: string
  startTime: string
  endTime: string
  isAvailable: boolean
  faculty?: User
}

export interface Appointment {
  id: string
  studentId: string
  facultyId: string
  scheduleId: string
  status: AppointmentStatus
  teamsLink: string | null
  requestedAt: Date
  updatedAt: Date
  student?: User
  faculty?: User
  schedule?: FacultySchedule
}
