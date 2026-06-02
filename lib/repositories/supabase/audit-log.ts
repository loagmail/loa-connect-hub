import { supabase } from "@/lib/supabase"
import type { AuditLogData, IAuditLogRepository } from "@/lib/types"

export const auditLogRepository: IAuditLogRepository = {
  async create(data) {
    const { data: log, error } = await supabase
      .from("audit_logs")
      .insert(data)
      .select("*")
      .single()
    if (error) throw error
    return log as AuditLogData
  },
  async list(limit = 100) {
    const { data, error } = await supabase
      .from("audit_logs")
      .select("*")
      .order("createdAt", { ascending: false })
      .limit(limit)
    if (error) throw error
    return data as AuditLogData[]
  },
}
