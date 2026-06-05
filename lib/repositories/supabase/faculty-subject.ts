import { supabase } from "@/lib/supabase"
import type { FacultySubjectData, IFacultySubjectRepository } from "@/lib/types"

export const facultySubjectRepository: IFacultySubjectRepository = {
  async list(filters) {
    let q = supabase.from("faculty_subjects").select("*")
    if (filters?.facultyId) q = q.eq("facultyId", filters.facultyId)
    if (filters?.sectionId) q = q.eq("sectionId", filters.sectionId)
    const { data, error } = await q
    if (error) throw error
    return data as FacultySubjectData[]
  },

  async replaceBySection(sectionId, items) {
    const { error: delErr } = await supabase.from("faculty_subjects").delete().eq("sectionId", sectionId)
    if (delErr) throw delErr
    if (items.length === 0) return
    const rows = items.map((i) => ({ ...i, sectionId }))
    const { error: insErr } = await supabase.from("faculty_subjects").insert(rows)
    if (insErr) throw insErr
  },

  async findBySubjectAndSection(subjectId, sectionId) {
    const { data, error } = await supabase
      .from("faculty_subjects")
      .select("*")
      .eq("subjectId", subjectId)
      .eq("sectionId", sectionId)
      .single()
    if (error) {
      if (error.code === "PGRST116") return null
      throw error
    }
    return data as FacultySubjectData
  },
}
