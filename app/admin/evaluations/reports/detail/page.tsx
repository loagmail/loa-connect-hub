import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { hasRole } from "@/lib/utils/roles"
import { getAdminEvalReportData } from "@/features/evaluations/evaluation-report.service"
import EvaluationReportContent from "@/features/evaluations/components/EvaluationReportContent"

export default async function AdminEvalReportDetailPage() {
  const session = await auth()
  if (!session?.user || !hasRole((session.user as Record<string, unknown>).role as string, "ADMIN"))
    redirect("/login")

  const data = await getAdminEvalReportData()

  return (
    <EvaluationReportContent
      role="admin"
      semesterId={data.semesterId}
      initialData={data}
    />
  )
}
