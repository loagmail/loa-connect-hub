"use client"

import { useState, useRef } from "react"

interface ImportRow {
  name: string
  email: string
  role: string
  department: string | null
}

interface ImportResult {
  created: ImportRow[]
  skipped: { row: number; email: string; reason: string }[]
  errors: { row: number; email?: string; message: string }[]
  parseErrors: { row: number; message: string }[]
}

export default function FacultyUploadPage() {
  const fileRef = useRef<HTMLInputElement>(null)
  const [result, setResult] = useState<ImportResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setResult(null)

    const file = fileRef.current?.files?.[0]
    if (!file) { setError("Please select a CSV file"); return }

    const formData = new FormData()
    formData.append("file", file)

    setLoading(true)
    try {
      const res = await fetch("/api/import/students", { method: "POST", body: formData })
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
    <div className="max-w-3xl mx-auto space-y-8 pb-12">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Import Students</h1>
        <p className="text-sm text-slate-500 mt-1">Upload a CSV file to create student accounts.</p>
      </div>

      <div className="card p-6 bg-white space-y-4">
        <h2 className="text-sm font-semibold text-slate-700">CSV Format</h2>
        <div className="bg-slate-50 rounded-lg p-4 text-xs font-mono text-slate-600 leading-relaxed">
          Name | Microsoft Email<br />
          Alice Student | alice.student@itmlyceumalabang.onmicrosoft.com
        </div>
        <p className="text-xs text-slate-500">Only the Name and Email columns are needed. Department and Dean columns will be ignored.</p>
      </div>

      <form onSubmit={handleSubmit} className="card p-6 bg-white space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1.5">CSV File</label>
          <input
            ref={fileRef}
            type="file"
            accept=".csv,.txt"
            className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
          />
        </div>
        {error && <p className="text-xs font-medium text-red-600">{error}</p>}
        <button type="submit" disabled={loading} className="btn-primary text-xs font-semibold py-2.5">
          {loading ? "Uploading..." : "Upload & Import"}
        </button>
      </form>

      {result && (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="card p-4 bg-white text-center">
              <p className="text-2xl font-bold text-emerald-600">{result.created.length}</p>
              <p className="text-xs font-semibold text-slate-500">Created</p>
            </div>
            <div className="card p-4 bg-white text-center">
              <p className="text-2xl font-bold text-amber-600">{result.skipped.length}</p>
              <p className="text-xs font-semibold text-slate-500">Skipped</p>
            </div>
            <div className="card p-4 bg-white text-center">
              <p className="text-2xl font-bold text-red-600">{result.errors.length + result.parseErrors.length}</p>
              <p className="text-xs font-semibold text-slate-500">Errors</p>
            </div>
          </div>

          {result.created.length > 0 && (
            <section className="space-y-2">
              <h3 className="text-sm font-bold text-slate-700">Created Students</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      <th className="pb-2 pr-4">Name</th>
                      <th className="pb-2 pr-4">Email</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.created.map((u) => (
                      <tr key={u.email} className="border-b border-slate-100">
                        <td className="py-2 pr-4 text-slate-800">{u.name}</td>
                        <td className="py-2 pr-4 text-slate-600 text-xs">{u.email}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {result.skipped.length > 0 && (
            <section className="space-y-2">
              <h3 className="text-sm font-bold text-slate-700">Skipped</h3>
              <div className="text-xs text-slate-500 space-y-1">
                {result.skipped.map((s) => (
                  <p key={`skip-${s.row}`}>Row {s.row}: {s.email} — {s.reason}</p>
                ))}
              </div>
            </section>
          )}

          {(result.parseErrors.length > 0 || result.errors.length > 0) && (
            <section className="space-y-2">
              <h3 className="text-sm font-bold text-slate-700">Errors</h3>
              <div className="text-xs text-red-600 space-y-1">
                {result.parseErrors.map((e) => (
                  <p key={`parse-${e.row}`}>Row {e.row}: {e.message}</p>
                ))}
                {result.errors.map((e, idx) => (
                  <p key={`err-${idx}`}>Row {e.row}: {e.email ? `${e.email} — ` : ""}{e.message}</p>
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  )
}
