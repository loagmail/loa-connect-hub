import { supabase } from "@/lib/db"
import type { AvailabilityRuleData, IAvailabilityRuleRepository } from "@/lib/types"

export const availabilityRuleRepository: IAvailabilityRuleRepository = {
  async listByFaculty(facultyId) {
    const { data, error } = await supabase
      .from("faculty_availability_rules")
      .select("*")
      .eq("facultyId", facultyId)
      .order("dayOfWeek", { ascending: true })
    if (error) throw error
    return data as AvailabilityRuleData[]
  },
  async listByFaculties(facultyIds) {
    if (facultyIds.length === 0) return new Map()
    const { data, error } = await supabase
      .from("faculty_availability_rules")
      .select("*")
      .in("facultyId", facultyIds)
      .order("dayOfWeek", { ascending: true })
    if (error) throw error
    const map = new Map<string, AvailabilityRuleData[]>()
    for (const facultyId of facultyIds) map.set(facultyId, [])
    for (const rule of (data || []) as AvailabilityRuleData[]) {
      map.get(rule.facultyId)!.push(rule)
    }
    return map
  },
  async findByFacultyAndDay(facultyId, dayOfWeek, startDate) {
    if (!startDate) return null
    const { data, error } = await supabase
      .from("faculty_availability_rules")
      .select("*")
      .eq("facultyId", facultyId)
      .eq("dayOfWeek", dayOfWeek)
      .eq("startDate", startDate)
      .single()
    if (error) {
      if (error.code === "PGRST116") return null
      throw error
    }

    console.log("SAVED",data);
    return data as AvailabilityRuleData
  },
  async upsert(input) {
    const { facultyId, dayOfWeek, startDate } = input
    const existing = await this.findByFacultyAndDay(facultyId, dayOfWeek, startDate)
    if (existing) {
      const { data, error } = await supabase
        .from("faculty_availability_rules")
        .update({
          isBlocked: input.isBlocked,
          startTime: input.startTime ?? null,
          endTime: input.endTime ?? null,
          endDate: input.endDate ?? null,
        })
        .eq("id", existing.id)
        .select("*")
        .single()
      if (error) throw error
      return data as AvailabilityRuleData
    }
    const { data, error } = await supabase
      .from("faculty_availability_rules")
      .insert({
        facultyId,
        dayOfWeek,
        isBlocked: input.isBlocked,
        startTime: input.startTime ?? null,
        endTime: input.endTime ?? null,
        startDate,
        endDate: input.endDate ?? null,
      })
      .select("*")
      .single()
    if (error) throw error
    return data as AvailabilityRuleData
  },
  async delete(id) {
    const { error } = await supabase.from("faculty_availability_rules").delete().eq("id", id)
    if (error) throw error
  },
}
