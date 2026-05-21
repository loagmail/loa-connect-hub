import {
  userRepository,
  departmentRepository,
  appointmentRepository,
  availabilityRuleRepository,
  meetingRepository,
} from "./prisma"

export { userRepository, departmentRepository, appointmentRepository, availabilityRuleRepository, meetingRepository }

export function getProviderName(): string {
  return process.env.DB_PROVIDER || "sqlite"
}
