"use client"

import { useState, useRef } from "react"
import SubmitButton from "@/components/SubmitButton"

type ImportType = "faculty-subject" | "student-enrollment"

interface ImportResult {
  matched: number
  errors: { row: number; email?: string; message: string }[]
  parseErrors: { row: number; message: string }[]
  createdSubjects?: number
  createdSections?: number
}

const ENDPOINTS: Record<ImportType, string> = {
  "faculty-subject": "/api/import/evaluation-faculty",
  "student-enrollment": "/api/import/evaluation-student",
}

const CARD_INFO: Record<ImportType, { title: string; description: string; headers: string }> = {
  "faculty-subject": {
    title: "Import Faculty-Subject Mappings",
    description: "Upload a CSV linking faculty members to the subjects and sections they teach.",
    headers: "faculty email, subject code, section",
  },
  "student-enrollment": {
    title: "Import Student Enrollments",
    description: "Upload a CSV listing which students belong to which sections.",
    headers: "student email, section",
  },
}

function UploadCard({ importType }: { importType: ImportType }) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [result, setResult] = useState<ImportResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const info = CARD_INFO[importType]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (loading) return
    setError("")
    setResult(null)

    const file = fileRef.current?.files?.[0]
    if (!file) { setError("Please select a CSV file"); return }

    const formData = new FormData()
    formData.append("file", file)

    setLoading(true)
    try {
      const res = await fetch(ENDPOINTS[importType], { method: "POST", body: formData })
      const data = await res.json()
      if (!res.ok) { setError(data.error || "Upload failed"); return }
      setResult(data)
    } catch {
      setError("Network error")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6">
      <h3 className="text-lg font-semibold text-primary">{info.title}</h3>
      <p className="text-sm text-tertiary mt-1">{info.description}</p>

      <form onSubmit={handleSubmit} className="mt-4 space-y-3">
        <div>
          <p className="text-xs text-slate-500 mb-1">Expected CSV headers:</p>
          <code className="text-xs bg-slate-100 px-2 py-1 rounded text-slate-700">{info.headers}</code>
        </div>

        <input
          ref={fileRef}
          type="file"
          accept=".csv"
          className="block w-full text-sm text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-gold-50 file:text-gold-700 hover:file:bg-gold-100"
        />

        {error && <p className="text-sm text-red-600">{error}</p>}

        <SubmitButton loading={loading}>
          {loading ? "Importing..." : "Upload & Import"}
        </SubmitButton>
      </form>

      {result && (
        <div className="mt-4 p-3 bg-slate-50 rounded-lg text-sm space-y-1">
          <p className="font-medium text-primary">Result</p>
          <p className="text-green-700">{result.matched} rows matched</p>
          {result.createdSubjects !== undefined && (
            <p className="text-blue-700">{result.createdSubjects} subjects created</p>
          )}
          {result.createdSections !== undefined && (
            <p className="text-blue-700">{result.createdSections} sections created</p>
          )}
          {result.errors.length > 0 && (
            <p className="text-red-600">{result.errors.length} errors</p>
          )}
          {result.parseErrors && result.parseErrors.length > 0 && (
            <p className="text-amber-600">{result.parseErrors.length} parse warnings</p>
          )}
          {(result.errors.length > 0 || (result.parseErrors?.length ?? 0) > 0) && (
            <details className="mt-2">
              <summary className="text-xs text-slate-500 cursor-pointer hover:text-slate-700">Show details</summary>
              <pre className="mt-1 text-xs text-slate-600 max-h-40 overflow-y-auto whitespace-pre-wrap">
                {[...result.errors, ...(result.parseErrors ?? [])].map((e, i) => (
                  <div key={i}>Row {e.row}: {e.message}</div>
                ))}
              </pre>
            </details>
          )}
        </div>
      )}
    </div>
  )
}

export default function EtlHubPage() {
  return (
    <div className="max-w-3xl mx-auto py-8 px-4 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-primary">ETL Hub</h1>
        <p className="text-sm text-tertiary mt-1">
          Upload CSV files to import evaluation data into the system.
        </p>
      </div>

      <UploadCard importType="faculty-subject" />
      <UploadCard importType="student-enrollment" />
    </div>
  )
}
