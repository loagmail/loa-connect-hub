"use client"

import { useState, useRef } from "react"
import SubmitButton from "@/components/SubmitButton"
import { STUDENT_DOMAIN, FACULTY_DOMAIN } from "@/lib/constants"
import type { ValidateRow } from "@/app/api/admin/etl-upload/validate/route"

type Tab = "student" | "faculty" | "eval-faculty" | "eval-student"

const STUDENT_CSV_EXAMPLE = [
  "name,email,course",
  "Juan Dela Cruz,juan.delacruz@itmlyceumalabang.onmicrosoft.com,BSIT",
  "Maria Santos,maria.santos@itmlyceumalabang.onmicrosoft.com,BSCS",
].join("\n")

const FACULTY_CSV_EXAMPLE = [
  "name,email,department,dean",
  "Prof Juan,juan.prof@lyceumalabang.edu.ph,CCS,false",
  "Dean Maria,maria.dean@lyceumalabang.edu.ph,CCS,true",
].join("\n")

const EVAL_FACULTY_CSV_EXAMPLE = [
  "name,microsoft email,subject",
  "Juan Dela Cruz,juan.delacruz@itmlyceumalabang.onmicrosoft.com,CCS 101",
  "Maria Santos,maria.santos@itmlyceumalabang.onmicrosoft.com,CCS 102",
].join("\n")

const EVAL_STUDENT_CSV_EXAMPLE = [
  "name,microsoft email,subject",
  "Juan Dela Cruz,juan.delacruz@itmlyceumalabang.onmicrosoft.com,CCS 101",
  "Maria Santos,maria.santos@itmlyceumalabang.onmicrosoft.com,CCS 102",
].join("\n")

export default function EtlUploadPage() {
  const [tab, setTab] = useState<Tab>("student")
  const [csvText, setCsvText] = useState("")
  const [rows, setRows] = useState<ValidateRow[]>([])
  const [validationDone, setValidationDone] = useState(false)
  const [validating, setValidating] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [result, setResult] = useState<{ created: number; failed: number } | null>(null)
  const [resultDetails, setResultDetails] = useState<{ name: string; email: string; role: string }[]>([])
  const [failedDetails, setFailedDetails] = useState<{ email: string; error: string }[]>([])
  const [evalUploading, setEvalUploading] = useState(false)
  const [evalResult, setEvalResult] = useState<{ matched: number; errors: { row: number; message: string }[]; subjectErrors: string[]; parseErrors: { row: number; message: string }[] } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFile = (text: string) => {
    setCsvText(text)
    setValidationDone(false)
    setRows([])
    setResult(null)
    setResultDetails([])
    setFailedDetails([])
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      handleFile((ev.target?.result as string) || "")
    }
    reader.readAsText(file)
  }

  const handlePaste = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    handleFile(e.target.value)
  }

  const handleValidate = async () => {
    if (!csvText.trim()) return
    setValidating(true)
    setValidationDone(false)
    setRows([])
    setResult(null)
    try {
      const res = await fetch("/api/admin/etl-upload/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: tab, csv: csvText }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Validation failed")
      setRows(data.rows || [])
      setValidationDone(true)
    } catch (err) {
      alert(err instanceof Error ? err.message : "Validation failed")
    } finally {
      setValidating(false)
    }
  }

  const handleUpdateEmail = (rowIndex: number, newEmail: string) => {
    setRows((prev) =>
      prev.map((r) => {
        if (r.rowIndex !== rowIndex) return r
        const errors: string[] = []
        if (!newEmail) errors.push("Email is required")
        if (newEmail) {
          const domain = tab === "student" ? STUDENT_DOMAIN : FACULTY_DOMAIN
          if (!newEmail.toLowerCase().trim().endsWith(domain)) {
            errors.push(`Email must end with ${domain}`)
          }
        }
        return {
          ...r,
          email: newEmail,
          errors,
          isValid: errors.length === 0,
        }
      })
    )
  }

  const handleRemoveRow = (rowIndex: number) => {
    setRows((prev) => prev.filter((r) => r.rowIndex !== rowIndex))
  }

  const handleConfirm = async () => {
    const validRows = rows.filter((r) => r.isValid)
    if (validRows.length === 0) return
    setConfirming(true)
    setResult(null)
    try {
      const res = await fetch("/api/admin/etl-upload/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: tab,
          rows: validRows.map((r) => ({
            name: r.name,
            email: r.email,
            department: r.department,
            course: r.course,
            isDean: r.isDean,
          })),
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Upload failed")
      setResult({ created: data.created?.length || 0, failed: data.failed?.length || 0 })
      setResultDetails(data.created || [])
      setFailedDetails(data.failed || [])
    } catch (err) {
      alert(err instanceof Error ? err.message : "Upload failed")
    } finally {
      setConfirming(false)
    }
  }

  const handleReset = () => {
    setCsvText("")
    setRows([])
    setValidationDone(false)
    setResult(null)
    setResultDetails([])
    setFailedDetails([])
    setEvalResult(null)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  const isEvalTab = tab === "eval-faculty" || tab === "eval-student"

  const handleEvalUpload = async (file: File) => {
    setEvalUploading(true)
    setEvalResult(null)
    try {
      const formData = new FormData()
      formData.append("file", file)
      const endpoint = tab === "eval-faculty" ? "/api/import/evaluation-faculty" : "/api/import/evaluation-student"
      const res = await fetch(endpoint, { method: "POST", body: formData })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Upload failed")
      setEvalResult(data)
    } catch (err) {
      alert(err instanceof Error ? err.message : "Upload failed")
    } finally {
      setEvalUploading(false)
    }
  }

  const validCount = rows.filter((r) => r.isValid).length
  const invalidCount = rows.length - validCount
  const hasAllValid = rows.length > 0 && invalidCount === 0

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold text-primary">ETL User Upload</h1>
        {validationDone && (
          <button onClick={handleReset} className="text-xs text-tertiary hover:text-secondary underline">
            Start Over
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-default overflow-x-auto">
        <button
          onClick={() => { setTab("student"); handleReset() }}
          className={`px-4 py-2 text-sm font-semibold border-b-2 transition-colors shrink-0 ${
            tab === "student"
              ? "border-blue-600 text-blue-700"
              : "border-transparent text-tertiary hover:text-secondary"
          }`}
        >
          Student Upload
        </button>
        <button
          onClick={() => { setTab("faculty"); handleReset() }}
          className={`px-4 py-2 text-sm font-semibold border-b-2 transition-colors shrink-0 ${
            tab === "faculty"
              ? "border-blue-600 text-blue-700"
              : "border-transparent text-tertiary hover:text-secondary"
          }`}
        >
          Faculty / Dean Upload
        </button>
        <button
          onClick={() => { setTab("eval-faculty"); handleReset() }}
          className={`px-4 py-2 text-sm font-semibold border-b-2 transition-colors shrink-0 ${
            tab === "eval-faculty"
              ? "border-blue-600 text-blue-700"
              : "border-transparent text-tertiary hover:text-secondary"
          }`}
        >
          Eval Faculty
        </button>
        <button
          onClick={() => { setTab("eval-student"); handleReset() }}
          className={`px-4 py-2 text-sm font-semibold border-b-2 transition-colors shrink-0 ${
            tab === "eval-student"
              ? "border-blue-600 text-blue-700"
              : "border-transparent text-tertiary hover:text-secondary"
          }`}
        >
          Eval Student
        </button>
      </div>

      {/* Upload Area */}
      {!validationDone && !result && !evalResult && !isEvalTab && (
        <div className="space-y-4">
          <div className="card p-6 bg-surface space-y-4">
            <h2 className="text-sm font-bold text-primary">CSV Format</h2>
            <p className="text-xs text-tertiary">
              Upload a CSV file with the following columns. Paste your CSV or upload a file.
            </p>

            <div className="bg-surface rounded-lg p-4 font-mono text-xs text-secondary whitespace-pre overflow-x-auto">
              {tab === "student" ? STUDENT_CSV_EXAMPLE : FACULTY_CSV_EXAMPLE}
            </div>

            <div className="flex items-center gap-4">
              <label className="btn-secondary text-sm cursor-pointer inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-default hover:bg-surface-hover">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                Upload CSV File
                <input ref={fileInputRef} type="file" accept=".csv,.txt" onChange={handleFileUpload} className="hidden" />
              </label>
              <span className="text-xs text-tertiary">or paste below</span>
            </div>

            <textarea
              value={csvText}
              onChange={handlePaste}
              placeholder="Paste your CSV content here..."
              rows={6}
              className="w-full border border-default rounded-lg p-3 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
            />

            <SubmitButton onClick={handleValidate} loading={validating} disabled={!csvText.trim()}>
              Validate Rows
            </SubmitButton>
          </div>
        </div>
      )}

      {/* Evaluation Upload Area */}
      {isEvalTab && !evalResult && (
        <div className="space-y-4">
          <div className="card p-6 bg-surface space-y-4">
            <h2 className="text-sm font-bold text-primary">
              {tab === "eval-faculty" ? "Faculty-Subject Mapping" : "Student Enrollment"} CSV Import
            </h2>
            <p className="text-xs text-tertiary">
              Upload a CSV file with columns: <code className="text-[10px] bg-surface-hover px-1 py-0.5 rounded">name, microsoft email, subject</code>.
              Multiple subjects per person can be added as additional columns.
            </p>

            <div className="bg-surface rounded-lg p-4 font-mono text-xs text-secondary whitespace-pre overflow-x-auto">
              {tab === "eval-faculty" ? EVAL_FACULTY_CSV_EXAMPLE : EVAL_STUDENT_CSV_EXAMPLE}
            </div>

            <label className="btn-secondary text-sm cursor-pointer inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-default hover:bg-surface-hover self-start">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              Upload CSV File
              <input
                type="file"
                accept=".csv,.txt"
                className="hidden"
                disabled={evalUploading}
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) handleEvalUpload(file)
                }}
              />
            </label>
            {evalUploading && <p className="text-xs text-tertiary">Uploading and processing...</p>}
          </div>
        </div>
      )}

      {/* Preview Table */}
      {validationDone && !result && rows.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h2 className="text-sm font-bold text-primary">
                Preview ({rows.length} rows)
              </h2>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                hasAllValid
                  ? "bg-emerald-50 text-emerald-700"
                  : "bg-amber-50 text-amber-700"
              }`}>
                {validCount} valid{invalidCount > 0 ? `, ${invalidCount} need attention` : ""}
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100 bg-surface rounded-xl border border-default">
              <thead>
                <tr className="bg-surface">
                  <th className="px-4 py-3 text-left text-[10px] font-bold text-tertiary uppercase tracking-wider">#</th>
                  <th className="px-4 py-3 text-left text-[10px] font-bold text-tertiary uppercase tracking-wider">Name</th>
                  <th className="px-4 py-3 text-left text-[10px] font-bold text-tertiary uppercase tracking-wider">Email</th>
                  {tab === "faculty" && (
                    <th className="px-4 py-3 text-left text-[10px] font-bold text-tertiary uppercase tracking-wider">Department</th>
                  )}
                  {tab === "student" && (
                    <th className="px-4 py-3 text-left text-[10px] font-bold text-tertiary uppercase tracking-wider">Course</th>
                  )}
                  {tab === "faculty" && (
                    <th className="px-4 py-3 text-left text-[10px] font-bold text-tertiary uppercase tracking-wider">Dean</th>
                  )}
                  <th className="px-4 py-3 text-left text-[10px] font-bold text-tertiary uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-right text-[10px] font-bold text-tertiary uppercase tracking-wider">Remove</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((row) => (
                  <tr key={row.rowIndex} className={`hover:bg-surface-hover transition-colors ${!row.isValid ? "bg-red-50/30" : ""}`}>
                    <td className="px-4 py-3 text-xs text-tertiary font-mono">{row.rowIndex}</td>
                    <td className="px-4 py-3 text-sm font-semibold text-primary">{row.name}</td>
                    <td className="px-4 py-3">
                      {row.isValid ? (
                        <span className="text-sm text-secondary">{row.email}</span>
                      ) : (
                        <input
                          type="text"
                          value={row.email}
                          onChange={(e) => handleUpdateEmail(row.rowIndex, e.target.value)}
                          className="w-full border border-red-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-400"
                        />
                      )}
                    </td>
                    {tab === "faculty" && (
                      <td className="px-4 py-3 text-sm text-secondary">{row.department || "\u2014"}</td>
                    )}
                    {tab === "student" && (
                      <td className="px-4 py-3 text-sm text-secondary">{row.course || "\u2014"}</td>
                    )}
                    {tab === "faculty" && (
                      <td className="px-4 py-3 text-sm text-secondary">{row.isDean ? "Yes" : "No"}</td>
                    )}
                    <td className="px-4 py-3">
                      {row.isValid ? (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600">
                          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                          Valid
                        </span>
                      ) : (
                        <div className="space-y-0.5">
                          {row.errors.map((err, ei) => (
                            <p key={ei} className="text-[10px] text-red-600 leading-tight">{err}</p>
                          ))}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleRemoveRow(row.rowIndex)}
                        className="text-slate-300 hover:text-red-500 transition-colors"
                        title="Remove row"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between">
            <p className="text-xs text-tertiary">
              {invalidCount > 0
                ? `Fix the highlighted rows or remove them before uploading.`
                : `All ${validCount} rows are ready for upload.`}
            </p>
            <div className="flex items-center gap-3">
              <button onClick={handleReset} className="btn-secondary text-sm px-4 py-2 rounded-lg border border-default hover:bg-surface-hover">
                Cancel
              </button>
              <SubmitButton
                onClick={handleConfirm}
                loading={confirming}
                disabled={validCount === 0}
                variant="success"
              >
                Upload {validCount} {validCount === 1 ? "User" : "Users"}
              </SubmitButton>
            </div>
          </div>
        </div>
      )}

      {/* Result Summary */}
      {result && (
        <div className="card p-6 bg-surface space-y-4">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
              result.failed === 0 ? "bg-emerald-100" : "bg-amber-100"
            }`}>
              <svg className={`w-5 h-5 ${result.failed === 0 ? "text-emerald-600" : "text-amber-600"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {result.failed === 0 ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                )}
              </svg>
            </div>
            <div>
              <p className="text-sm font-bold text-primary">
                {result.created} user{result.created !== 1 ? "s" : ""} created successfully
              </p>
              {result.failed > 0 && (
                <p className="text-xs text-amber-600">{result.failed} failed</p>
              )}
              <p className="text-xs text-tertiary mt-0.5">
                Activation emails sent (may take a few minutes to arrive).
              </p>
            </div>
          </div>

          {resultDetails.length > 0 && (
            <div className="bg-surface rounded-lg p-4 max-h-48 overflow-y-auto">
              <p className="text-xs font-semibold text-secondary mb-2">Created Users</p>
              <div className="space-y-1.5">
                {resultDetails.map((u, i) => (
                  <div key={i} className="text-xs text-tertiary flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                    <span className="font-medium text-secondary">{u.name}</span>
                    <span className="text-tertiary">{u.email}</span>
                    <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-slate-200 text-tertiary">{u.role}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {failedDetails.length > 0 && (
            <div className="bg-amber-50 rounded-lg p-4 max-h-48 overflow-y-auto">
              <p className="text-xs font-semibold text-amber-700 mb-2">Failed</p>
              <div className="space-y-1.5">
                {failedDetails.map((f, i) => (
                  <div key={i} className="text-xs text-amber-700 flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0 mt-1" />
                    <div>
                      <div className="font-medium text-amber-800">{f.email}</div>
                      <div className="text-amber-700 text-[12px]">{f.error}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <SubmitButton onClick={handleReset} variant="primary">
              Upload Another Batch
            </SubmitButton>
          </div>
        </div>
      )}

      {/* Eval Result Summary */}
      {evalResult && (
        <div className="card p-6 bg-surface space-y-4">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
              evalResult.errors.length === 0 && evalResult.parseErrors.length === 0 ? "bg-emerald-100" : "bg-amber-100"
            }`}>
              <svg className={`w-5 h-5 ${evalResult.errors.length === 0 && evalResult.parseErrors.length === 0 ? "text-emerald-600" : "text-amber-600"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {evalResult.errors.length === 0 && evalResult.parseErrors.length === 0 ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                )}
              </svg>
            </div>
            <div>
              <p className="text-sm font-bold text-primary">
                {evalResult.matched} {tab === "eval-faculty" ? "faculty-subject" : "student-enrollment"} record{evalResult.matched !== 1 ? "s" : ""} matched
              </p>
              {(evalResult.errors.length > 0 || evalResult.parseErrors.length > 0) && (
                <p className="text-xs text-amber-600">
                  {evalResult.errors.length + evalResult.parseErrors.length} error{(evalResult.errors.length + evalResult.parseErrors.length) !== 1 ? "s" : ""}
                </p>
              )}
            </div>
          </div>

          {evalResult.parseErrors.length > 0 && (
            <div className="bg-amber-50 rounded-lg p-4 max-h-48 overflow-y-auto">
              <p className="text-xs font-semibold text-amber-700 mb-2">Parse Errors</p>
              <div className="space-y-1">
                {evalResult.parseErrors.map((e, i) => (
                  <p key={i} className="text-xs text-amber-700">
                    Row {e.row}: {e.message}
                  </p>
                ))}
              </div>
            </div>
          )}

          {evalResult.errors.length > 0 && (
            <div className="bg-amber-50 rounded-lg p-4 max-h-48 overflow-y-auto">
              <p className="text-xs font-semibold text-amber-700 mb-2">Import Errors</p>
              <div className="space-y-1">
                {evalResult.errors.map((e, i) => (
                  <p key={i} className="text-xs text-amber-700">
                    Row {e.row}: {e.message}
                  </p>
                ))}
              </div>
            </div>
          )}

          {evalResult.subjectErrors && evalResult.subjectErrors.length > 0 && (
            <div className="bg-amber-50 rounded-lg p-4 max-h-48 overflow-y-auto">
              <p className="text-xs font-semibold text-amber-700 mb-2">Subject Errors</p>
              <div className="space-y-1">
                {evalResult.subjectErrors.map((e, i) => (
                  <p key={i} className="text-xs text-amber-700">{e}</p>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <SubmitButton onClick={handleReset} variant="primary">
              Upload Another
            </SubmitButton>
          </div>
        </div>
      )}

      {/* Empty state after validation with no rows */}
      {!isEvalTab && validationDone && rows.length === 0 && !result && (
        <div className="card p-8 bg-surface text-center">
          <p className="text-sm text-tertiary">No rows found in the CSV.</p>
          <button onClick={handleReset} className="btn-primary text-sm mt-4 px-4 py-2 rounded-lg">
            Try Again
          </button>
        </div>
      )}
    </div>
  )
}
