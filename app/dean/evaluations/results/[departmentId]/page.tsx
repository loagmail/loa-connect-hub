"use client"

import { useEffect, useState } from "react"
import { useParams, useSearchParams } from "next/navigation"
import Skeleton from "@/components/ui/Skeleton"
import DepartmentSubjectView from "@/features/evaluations/components/DepartmentSubjectView"

interface SubjectRow {
  facultySubjectId: string
  facultyId: string
  facultyName: string
  facultyEmail: string
  subjectId: string
  subjectCode: string
  subjectName: string
  totalRespondents: number
  avgRating: number | null
  remarks: string | null
  professionalManner: number | null
  communicationWithStudent: number | null
  studentEngagement: number | null
  learningMaterials: number | null
  timeManagement: number | null
  experientialLearning: number | null
  respectUniqueness: number | null
  assessmentAndFeedback: number | null
  highestRubrics: { key: string; label: string; score: number }[]
  lowestRubrics: { key: string; label: string; score: number }[]
  sentimentScore: number | null
}

interface DepartmentInfo {
  id: string
  name: string
  code: string
}

export default function DeanDepartmentDetailPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const departmentId = params.departmentId as string
  const semesterId = searchParams.get("semesterId") || ""

  const [department, setDepartment] = useState<DepartmentInfo | null>(null)
  const [subjects, setSubjects] = useState<SubjectRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [search, setSearch] = useState("")

  useEffect(() => {
    if (!semesterId) return
    setLoading(true)
    setError("")
    fetch(`/api/dean/evaluation-results/departments/${encodeURIComponent(departmentId)}?semesterId=${encodeURIComponent(semesterId)}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) throw new Error(data.error)
        setDepartment(data.department)
        setSubjects(data.subjects ?? [])
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [departmentId, semesterId])

  return (
    <div className="w-full space-y-6 pb-12">
      <div>
        <h1 className="text-2xl font-bold text-primary">
          {department?.name ?? "Department"} <span className="text-tertiary font-normal">{department?.code}</span>
        </h1>
        <p className="text-xs text-tertiary mt-1">
          Per-subject evaluation results. Click a row to view individual evaluation details.
        </p>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {loading && (
        <div className="space-y-4">
          <Skeleton variant="table-row" />
          <Skeleton variant="table-row" />
        </div>
      )}

      {!loading && subjects.length === 0 && (
        <p className="text-sm text-tertiary text-center py-8">No evaluation data found for this department.</p>
      )}

      {!loading && subjects.length > 0 && (
        <DepartmentSubjectView
          subjects={subjects}
          departmentId={departmentId}
          semesterId={semesterId}
          search={search}
          onSearchChange={setSearch}
          basePath="/dean/evaluations/results"
        />
      )}
    </div>
  )
}
