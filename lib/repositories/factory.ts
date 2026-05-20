import { userRepository, scheduleRepository, appointmentRepository } from "./prisma"

export { userRepository, scheduleRepository, appointmentRepository }

export function getProviderName(): string {
  return process.env.DB_PROVIDER || "sqlite"
}
