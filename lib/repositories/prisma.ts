import { prisma } from "@/lib/prisma"
import type {
  IUserRepository,
  IScheduleRepository,
  IAppointmentRepository,
  UserData,
  CreateUserInput,
  ScheduleData,
  CreateScheduleInput,
  AppointmentData,
  CreateAppointmentInput,
} from "./interfaces"

export const userRepository: IUserRepository = {
  async findByEmail(email) {
    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) return null
    return user as UserData
  },
  async findById(id) {
    const user = await prisma.user.findUnique({ where: { id } })
    if (!user) return null
    return user as UserData
  },
  async create(input) {
    const user = await prisma.user.create({ data: input })
    return user as UserData
  },
  async listByRole(role) {
    const users = await prisma.user.findMany({ where: { role: role as any } })
    return users as UserData[]
  },
}

export const scheduleRepository: IScheduleRepository = {
  async create(input) {
    const schedule = await prisma.facultySchedule.create({ data: input })
    return schedule as ScheduleData
  },
  async listAvailable() {
    const schedules = await prisma.facultySchedule.findMany({
      where: { isAvailable: true },
      include: { faculty: true },
    })
    return schedules as any
  },
  async listByFaculty(facultyId) {
    const schedules = await prisma.facultySchedule.findMany({
      where: { facultyId },
      orderBy: { date: "asc" },
    })
    return schedules as ScheduleData[]
  },
  async findById(id) {
    const schedule = await prisma.facultySchedule.findUnique({ where: { id } })
    if (!schedule) return null
    return schedule as ScheduleData
  },
  async update(id, data) {
    const schedule = await prisma.facultySchedule.update({ where: { id }, data })
    return schedule as ScheduleData
  },
  async delete(id) {
    await prisma.facultySchedule.delete({ where: { id } })
  },
}

export const appointmentRepository: IAppointmentRepository = {
  async create(input) {
    const appointment = await prisma.appointment.create({ data: input })
    return appointment as AppointmentData
  },
  async listByStudent(studentId) {
    const appointments = await prisma.appointment.findMany({
      where: { studentId },
      orderBy: { requestedAt: "desc" },
      include: { faculty: true, schedule: true },
    })
    return appointments as any
  },
  async listByFaculty(facultyId) {
    const appointments = await prisma.appointment.findMany({
      where: { facultyId },
      orderBy: { requestedAt: "desc" },
      include: { student: true, schedule: true },
    })
    return appointments as any
  },
  async listAll() {
    const appointments = await prisma.appointment.findMany({
      orderBy: { requestedAt: "desc" },
      include: { student: true, faculty: true, schedule: true },
    })
    return appointments as any
  },
  async findById(id) {
    const appointment = await prisma.appointment.findUnique({
      where: { id },
      include: { student: true, faculty: true, schedule: true },
    })
    if (!appointment) return null
    return appointment as any
  },
  async update(id, data) {
    const appointment = await prisma.appointment.update({
      where: { id },
      data: data as any,
      include: { student: true, faculty: true, schedule: true },
    })
    return appointment as any
  },
}
