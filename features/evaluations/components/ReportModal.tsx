"use client"

import { useState, useCallback } from "react"
import { getRemark, getRemarkColor } from "./EvaluationDashboard"

interface Result {
  id: string
  semesterId: string
  facultyId: string
  departmentId: string | null
  totalRespondents: number
  generalRating: number | null
  remarks: string | null
  professionalManner: number | null
  communicationWithStudent: number | null
  studentEngagement: number | null
  learningMaterials: number | null
  timeManagement: number | null
  experientialLearning: number | null
  respectUniqueness: number | null
  assessmentAndFeedback: number | null
}

interface StudentRow {
  id: string
  professionalManner: number | null
  communicationWithStudent: number | null
  studentEngagement: number | null
  learningMaterials: number | null
  timeManagement: number | null
  experientialLearning: number | null
  respectUniqueness: number | null
  assessmentAndFeedback: number | null
  generalRating: number | null
  comment: string | null
  sentimentLabel: string | null
  sentimentScore: number | null
}

type CategoryKey = "professionalManner" | "communicationWithStudent" | "studentEngagement" | "learningMaterials" | "timeManagement" | "experientialLearning" | "respectUniqueness" | "assessmentAndFeedback"

const CATEGORIES_FULL: { key: CategoryKey; label: string }[] = [
  { key: "professionalManner", label: "Professional Manner" },
  { key: "communicationWithStudent", label: "Communication with Students" },
  { key: "studentEngagement", label: "Student Engagement" },
  { key: "learningMaterials", label: "Learning Materials" },
  { key: "timeManagement", label: "Time Management" },
  { key: "experientialLearning", label: "Experiential Learning" },
  { key: "respectUniqueness", label: "Respect and Fairness" },
  { key: "assessmentAndFeedback", label: "Assessment and Feedback" },
]

interface ReportModalProps {
  isOpen: boolean
  onClose: () => void
  departmentName: string
  periodName: string
  results: Result[]
  facultyNames: Record<string, string>
  facultyStudentData: Record<string, StudentRow[]>
}

function DepartmentView({
  departmentName,
  periodName,
  results,
  facultyNames,
}: {
  departmentName: string
  periodName: string
  results: Result[]
  facultyNames: Record<string, string>
}) {
  const deptAvg = results.length > 0
    ? results.reduce((s, r) => s + (r.generalRating ?? 0), 0) / results.length
    : 0
  const totalResp = results.reduce((s, r) => s + r.totalRespondents, 0)

  return (
    <div className="space-y-6">
      <div className="text-center border-b border-default pb-4">
        <h2 className="text-lg font-bold text-primary">DEPARTMENT EVALUATION REPORT</h2>
        <p className="text-sm text-tertiary mt-1">{periodName}</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-surface-muted rounded-xl p-4">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-tertiary">Department</p>
          <p className="text-base font-bold text-primary mt-1">{departmentName || "All Departments"}</p>
        </div>
        <div className="bg-surface-muted rounded-xl p-4">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-tertiary">Faculties Evaluated</p>
          <p className="text-base font-bold text-primary mt-1">{results.length}</p>
        </div>
        <div className="bg-surface-muted rounded-xl p-4">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-tertiary">Department Average</p>
          <p className="text-base font-bold text-primary mt-1">{deptAvg.toFixed(2)}</p>
        </div>
        <div className="bg-surface-muted rounded-xl p-4">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-tertiary">Total Respondents</p>
          <p className="text-base font-bold text-primary mt-1">{totalResp.toLocaleString()}</p>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-default">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-surface-muted">
              <th className="text-left px-4 py-2.5 font-semibold text-primary text-xs uppercase tracking-wider">Faculty</th>
              <th className="text-center px-4 py-2.5 font-semibold text-primary text-xs uppercase tracking-wider">General Rating</th>
              <th className="text-center px-4 py-2.5 font-semibold text-primary text-xs uppercase tracking-wider">Respondents</th>
              <th className="text-center px-4 py-2.5 font-semibold text-primary text-xs uppercase tracking-wider">Remark</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-default">
            {results.map((r) => {
              const name = facultyNames[r.facultyId] || r.facultyId
              return (
                <tr key={r.id} className="hover:bg-surface-muted/50">
                  <td className="px-4 py-2.5 font-medium text-primary">{name}</td>
                  <td className="text-center px-4 py-2.5 font-bold text-primary">{r.generalRating?.toFixed(2) ?? "—"}</td>
                  <td className="text-center px-4 py-2.5 text-secondary">{r.totalRespondents}</td>
                  <td className="text-center px-4 py-2.5">
                    {r.remarks && (
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${getRemarkColor(r.remarks)}`}>
                        {r.remarks}
                      </span>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default function ReportModal({
  isOpen,
  onClose,
  departmentName,
  periodName,
  results,
  facultyNames,
  facultyStudentData,
}: ReportModalProps) {
  const [tab, setTab] = useState<"department" | "individual">("department")
  const [selectedId, setSelectedId] = useState(results[0]?.facultyId ?? "")

  const handlePrint = useCallback(async () => {
    const selected = results.find((r) => r.facultyId === selectedId)
    if (!selected) return

    const { jsPDF } = await import("jspdf")
    const { default: autoTable } = await import("jspdf-autotable")
    const students = facultyStudentData[selected.facultyId] || []
    const doc = new jsPDF("portrait")
    const pageW = doc.internal.pageSize.getWidth()
    const name = facultyNames[selected.facultyId] || selected.facultyId
    const overall = selected.generalRating ?? 0
    const remarkLabel = getRemark(overall) ?? ""

    doc.setFontSize(14)
    doc.text("INDIVIDUAL FACULTY EVALUATION REPORT", pageW / 2, 15, { align: "center" })
    doc.setFontSize(8)
    doc.text(`Period: ${periodName}  |  Generated: ${new Date().toLocaleDateString()}`, pageW / 2, 22, { align: "center" })
    doc.setFontSize(13)
    doc.text(name, pageW / 2, 32, { align: "center" })

    const tableBody: (string | number)[][] = [["0", "OVERALL EVALUATION RESULT", overall.toFixed(2)]]
    CATEGORIES_FULL.forEach((c, i) => {
      tableBody.push([String(i + 1), c.label, selected[c.key] !== null ? selected[c.key]!.toFixed(2) : "—"])
    })

    autoTable(doc, {
      startY: 40,
      head: [["#", "Category", "Rating"]],
      body: tableBody,
      theme: "grid",
      styles: { fontSize: 9, cellPadding: 2.5, halign: "center" },
      headStyles: { fillColor: [59, 130, 246], fontStyle: "bold" },
      columnStyles: { 1: { halign: "left", fontStyle: "bold" } },
      tableWidth: "auto",
      margin: { left: 20, right: 20 },
    })
    let y = doc.lastAutoTable.finalY + 8

    doc.setFontSize(11)
    doc.text("Overall Rating", pageW / 2, y, { align: "center" })
    y += 6
    doc.setFontSize(13)
    doc.text(`${overall.toFixed(2)} / 5.00 – ${remarkLabel}`, pageW / 2, y, { align: "center" })
    y += 10

    const comments = students.filter((s) => s.comment?.trim())
    if (comments.length > 0) {
      doc.setFontSize(10)
      doc.text("Student Comment", pageW / 2, y, { align: "center" })
      y += 5
      doc.setFontSize(9)
      for (let i = 0; i < Math.min(comments.length, 30); i++) {
        if (y > 260) { doc.addPage(); y = 20 }
        const lines = doc.splitTextToSize(`"${comments[i].comment!.trim()}"`, pageW - 50)
        doc.text(lines, 25, y)
        y += lines.length * 4 + 3
      }
      y += 3
    }

    if (y > 240) { doc.addPage(); y = 20 }
    doc.setFontSize(10)
    doc.text("Interpretation", pageW / 2, y, { align: "center" })
    y += 5
    doc.setFontSize(9)

    const sentLabels = comments.map((c) => c.sentimentLabel).filter(Boolean)
    const posCount = sentLabels.filter((l) => l === "positive").length
    const negCount = sentLabels.filter((l) => l === "negative").length
    const neutralCount = sentLabels.filter((l) => l === "neutral").length

    let interp = `The instructor received an overall rating of ${overall.toFixed(2)}, indicating a ${remarkLabel.toLowerCase()} level of performance. `
    if (comments.length > 0 && posCount > negCount && posCount > 0) {
      interp += `Student feedback was predominantly positive (${Math.round((posCount / comments.length) * 100)}% of comments), with many students expressing appreciation for the instructor's teaching approach and classroom management. `
    } else if (comments.length > 0 && negCount > posCount && negCount > 0) {
      interp += `Some students provided critical feedback (${Math.round((negCount / comments.length) * 100)}% of comments), suggesting areas for improvement. `
    }
    if (comments.length > 0 && neutralCount > 0) {
      interp += `A portion of comments were neutral or mixed. `
    }
    interp += `The results reflect the collective assessment of ${selected.totalRespondents} student respondent(s).`

    doc.text(doc.splitTextToSize(interp, pageW - 50), 25, y)
    doc.autoPrint()
    doc.output("dataurlnewwindow")
  }, [results, selectedId, facultyNames, periodName, facultyStudentData])

  if (!isOpen) return null

  const selectedResult = results.find((r) => r.facultyId === selectedId)

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-10 pb-10 bg-black/50 overflow-y-auto" onClick={onClose}>
      <div
        className="w-full max-w-3xl mx-4 bg-surface rounded-2xl shadow-2xl border border-default overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-default">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setTab("department")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                tab === "department"
                  ? "bg-brand-500 text-white shadow-sm"
                  : "text-tertiary hover:text-secondary hover:bg-surface-muted"
              }`}
            >
              Department
            </button>
            <button
              type="button"
              onClick={() => setTab("individual")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                tab === "individual"
                  ? "bg-brand-500 text-white shadow-sm"
                  : "text-tertiary hover:text-secondary hover:bg-surface-muted"
              }`}
            >
              Individual
            </button>
          </div>
          <div className="flex items-center gap-2">
            {tab === "individual" && selectedResult && (
              <button
                type="button"
                onClick={handlePrint}
                className="px-3 py-1.5 rounded-lg bg-slate-700 text-white text-xs font-semibold hover:bg-slate-800 transition-all"
              >
                Print
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold text-tertiary hover:text-secondary hover:bg-surface-muted transition-all"
            >
              Close
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-5 max-h-[70vh] overflow-y-auto">
          {tab === "department" ? (
            <DepartmentView
              departmentName={departmentName}
              periodName={periodName}
              results={results}
              facultyNames={facultyNames}
            />
          ) : (
            <div className="space-y-5">
              {/* Faculty selector */}
              <div className="flex items-center gap-2">
                <label className="text-xs font-semibold text-tertiary whitespace-nowrap">Select Faculty:</label>
                <select
                  value={selectedId}
                  onChange={(e) => setSelectedId(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg text-sm text-secondary bg-surface border border-default focus:outline-none focus:ring-2 focus:ring-brand-500/40"
                >
                  {results.map((r) => (
                    <option key={r.facultyId} value={r.facultyId}>
                      {facultyNames[r.facultyId] || r.facultyId}
                    </option>
                  ))}
                </select>
              </div>

              {/* Report preview */}
              {selectedResult && (
                <IndividualPreview
                  result={selectedResult}
                  name={facultyNames[selectedResult.facultyId] || selectedResult.facultyId}
                  students={facultyStudentData[selectedResult.facultyId] || []}
                />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function IndividualPreview({
  result,
  name,
  students,
}: {
  result: Result
  name: string
  students: StudentRow[]
}) {
  const overall = result.generalRating ?? 0
  const remarkLabel = getRemark(overall) ?? ""
  const comments = students.filter((s) => s.comment?.trim())

  const sentLabels = comments.map((c) => c.sentimentLabel).filter(Boolean)
  const posCount = sentLabels.filter((l) => l === "positive").length
  const negCount = sentLabels.filter((l) => l === "negative").length
  const neutralCount = sentLabels.filter((l) => l === "neutral").length

  let interp = `The instructor received an overall rating of ${overall.toFixed(2)}, indicating a ${remarkLabel.toLowerCase()} level of performance. `
  if (comments.length > 0 && posCount > negCount && posCount > 0) {
    interp += `Student feedback was predominantly positive (${Math.round((posCount / comments.length) * 100)}% of comments), with many students expressing appreciation for the instructor's teaching approach and classroom management. `
  } else if (comments.length > 0 && negCount > posCount && negCount > 0) {
    interp += `Some students provided critical feedback (${Math.round((negCount / comments.length) * 100)}% of comments), suggesting areas for improvement in instructional delivery and student engagement. `
  }
  if (comments.length > 0 && neutralCount > 0) {
    interp += `A portion of comments were neutral or mixed, reflecting balanced perspectives on the instructor's overall effectiveness. `
  }
  interp += `The results reflect the collective assessment of ${result.totalRespondents} student respondent(s).`

  return (
    <div className="border border-default rounded-xl p-5 space-y-5 bg-surface">
      <div className="text-center border-b border-default pb-3">
        <p className="text-sm font-semibold text-secondary">{name}</p>
      </div>

      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="bg-brand-500 text-white">
            <th className="text-center px-3 py-2 text-xs font-semibold w-10">#</th>
            <th className="text-left px-3 py-2 text-xs font-semibold">Category</th>
            <th className="text-center px-3 py-2 text-xs font-semibold w-20">Rating</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-default">
          <tr className="font-bold bg-brand-50/50 dark:bg-brand-900/10">
            <td className="text-center px-3 py-2 text-primary">0</td>
            <td className="px-3 py-2 text-primary">OVERALL EVALUATION RESULT</td>
            <td className="text-center px-3 py-2 text-primary">{overall.toFixed(2)}</td>
          </tr>
          {CATEGORIES_FULL.map((c, i) => (
            <tr key={c.key}>
              <td className="text-center px-3 py-2 text-secondary">{i + 1}</td>
              <td className="px-3 py-2 text-primary">{c.label}</td>
              <td className="text-center px-3 py-2 text-primary">
                {result[c.key] !== null ? result[c.key]!.toFixed(2) : "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="text-center py-2">
        <p className="text-sm font-semibold text-primary">Overall Rating</p>
        <p className="text-lg font-bold text-primary">{overall.toFixed(2)} / 5.00 – {remarkLabel}</p>
      </div>

      {comments.length > 0 && (
        <div>
          <p className="text-sm font-semibold text-primary mb-2">Student Comment</p>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {comments.map((s) => (
              <p key={s.id} className="text-sm text-tertiary bg-surface-muted rounded-lg px-3 py-2 border border-default">
                &ldquo;{s.comment!.trim()}&rdquo;
              </p>
            ))}
          </div>
        </div>
      )}

      <div>
        <p className="text-sm font-semibold text-primary mb-1">Interpretation</p>
        <p className="text-sm text-tertiary leading-relaxed">{interp}</p>
      </div>
    </div>
  )
}
