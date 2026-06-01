import type {
  IUserRepository,
  IDepartmentRepository,
  IAppointmentRepository,
  IAvailabilityRuleRepository,
  IPasswordResetTokenRepository,
  IAuditLogRepository,
  IReportsRepository,
} from "./interfaces"

import { userRepository as supabaseUserRepo } from "./supabase/user"
import { departmentRepository as supabaseDeptRepo } from "./supabase/department"
import { appointmentRepository as supabaseApptRepo } from "./supabase/appointment"
import { availabilityRuleRepository as supabaseAvailRepo } from "./supabase/availability-rule"
import { passwordResetTokenRepository as supabaseTokenRepo } from "./supabase/password-reset-token"
import { auditLogRepository as supabaseAuditLogRepo } from "./supabase/audit-log"
import { reportsRepository as supabaseReportsRepo } from "./supabase/reports"

export const userRepository: IUserRepository = supabaseUserRepo
export const departmentRepository: IDepartmentRepository = supabaseDeptRepo
export const appointmentRepository: IAppointmentRepository = supabaseApptRepo
export const availabilityRuleRepository: IAvailabilityRuleRepository = supabaseAvailRepo
export const passwordResetTokenRepository: IPasswordResetTokenRepository = supabaseTokenRepo
export const auditLogRepository: IAuditLogRepository = supabaseAuditLogRepo
export const reportsRepository: IReportsRepository = supabaseReportsRepo
