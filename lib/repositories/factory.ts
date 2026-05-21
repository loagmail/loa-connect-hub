import {
  userRepository,
  appointmentRepository,
  availabilityRuleRepository,
  meetingRepository,
} from "./prisma"

export { userRepository, appointmentRepository, availabilityRuleRepository, meetingRepository }

export function getProviderName(): string {
  return process.env.DB_PROVIDER || "sqlite"
}
