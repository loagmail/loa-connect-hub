import { NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import { auth } from "@/lib/auth"
import { requireAdmin } from "@/lib/route-guard"
import { logAuditEvent } from "@/lib/services/audit"

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authErr = await requireAdmin(request)
  if (authErr) return authErr

  const session = await auth()

  const { id } = await params

  const { data: enrollment, error: fetchErr } = await supabase
    .from("student_enrollments")
    .select("id, faculty_subject_id, student_id")
    .eq("id", id)
    .single()
  if (fetchErr || !enrollment) return NextResponse.json({ error: "Enrollment not found" }, { status: 404 })

  // Invalidate any evaluation for this faculty_subject + student
  if (enrollment.faculty_subject_id) {
    const adminName = (session!.user as Record<string, unknown>).name as string || "Unknown"
    const remarks = `Invalidated by user: ${adminName} - student removed from enrollment`
    await supabase
      .from("evaluations")
      .update({ status: "INVALID", remarks, isDisabled: true, updatedAt: new Date().toISOString() })
      .eq("facultySubjectId", enrollment.faculty_subject_id)
      .eq("evaluatorId", enrollment.student_id)
  }

  const { error } = await supabase.from("student_enrollments").delete().eq("id", id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const currentUserId = (session!.user as Record<string, unknown>).id as string
  await logAuditEvent({
    userId: currentUserId,
    action: "DELETE_ENROLLMENT",
    details: `Deleted enrollment ${id} (faculty_subject: ${enrollment.faculty_subject_id}, student: ${enrollment.student_id})`,
  })

  return NextResponse.json({ success: true })
}
