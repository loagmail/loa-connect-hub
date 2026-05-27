import type {
  IUserRepository,
  IDepartmentRepository,
  IAppointmentRepository,
  IAvailabilityRuleRepository,
  IPasswordResetTokenRepository,
  IAuditLogRepository,
  IReportsRepository,
} from "./interfaces"

import { userRepository as supabaseUserRepo, departmentRepository as supabaseDeptRepo, appointmentRepository as supabaseApptRepo, availabilityRuleRepository as supabaseAvailRepo, passwordResetTokenRepository as supabaseTokenRepo, auditLogRepository as supabaseAuditLogRepo, reportsRepository as supabaseReportsRepo } from "./supabase"

export const userRepository: IUserRepository = supabaseUserRepo
export const departmentRepository: IDepartmentRepository = supabaseDeptRepo
export const appointmentRepository: IAppointmentRepository = supabaseApptRepo
export const availabilityRuleRepository: IAvailabilityRuleRepository = supabaseAvailRepo
export const passwordResetTokenRepository: IPasswordResetTokenRepository = supabaseTokenRepo
export const auditLogRepository: IAuditLogRepository = supabaseAuditLogRepo
export const reportsRepository: IReportsRepository = supabaseReportsRepo
