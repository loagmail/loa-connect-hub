import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"

export default async function FacultyReportPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")
  if ((session.user as any).role !== "DEAN") redirect("/login")

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Faculty Report</h1>
        <p className="text-sm text-slate-500 mt-1">
          This page is reserved for Dean-level reporting. The report content will be added here soon.
        </p>
      </div>

      <div className="card p-8 bg-white border border-slate-200 shadow-sm">
        <p className="text-sm text-slate-600">
          Placeholder content: Dean-only faculty reporting tools and analytics will appear here.
        </p>
      </div>
    </div>
  )
}
