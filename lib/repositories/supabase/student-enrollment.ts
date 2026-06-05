import { supabase } from "@/lib/supabase"
import type { StudentEnrollmentData, IStudentEnrollmentRepository } from "@/lib/types"

export const studentEnrollmentRepository: IStudentEnrollmentRepository = {
  async list(filters) {
    let q = supabase.from("student_enrollments").select("*")
    if (filters?.studentId) q = q.eq("studentId", filters.studentId)
    if (filters?.sectionId) q = q.eq("sectionId", filters.sectionId)
    const { data, error } = await q
    if (error) throw error
    return data as StudentEnrollmentData[]
  },

  async replaceBySection(sectionId, items) {
    const { error: delErr } = await supabase.from("student_enrollments").delete().eq("sectionId", sectionId)
    if (delErr) throw delErr
    if (items.length === 0) return
    const rows = items.map((i) => ({ ...i, sectionId }))
    const { error: insErr } = await supabase.from("student_enrollments").insert(rows)
    if (insErr) throw insErr
  },

  async getDistinctFaculty(studentId) {
    const { data: enrollments, error: enrollErr } = await supabase
      .from("student_enrollments")
      .select("sectionId")
      .eq("studentId", studentId)
    if (enrollErr) throw enrollErr
    if (enrollments.length === 0) return []

    const sectionIds = enrollments.map((r) => r.sectionId)
    const { data: fs, error: fsErr } = await supabase
      .from("faculty_subjects")
      .select("facultyId")
      .in("sectionId", sectionIds)
    if (fsErr) throw fsErr

    return [...new Set(fs.map((r) => r.facultyId))]
  },
}
