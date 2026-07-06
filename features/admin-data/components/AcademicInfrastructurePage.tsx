"use client"

import { useState, useEffect } from "react"
import { SegmentedControl } from "@/features/admin-data/components/shared"
import { SemestersTab } from "@/features/admin-data/components/SemestersTab"
import { DepartmentsCoursesTab } from "@/features/admin-data/components/DepartmentsCoursesTab"
import { SubjectsSectionsTab } from "@/features/admin-data/components/SubjectsSectionsTab"
import { FacultyLoadingTab } from "@/features/admin-data/components/FacultyLoadingTab"
import type { MainTab } from "@/features/admin-data/components/types"

const allTabs: { key: MainTab; label: string }[] = [
  { key: "semesters", label: "Semesters" },
  { key: "departments", label: "Departments & Courses" },
  { key: "subjects", label: "Subjects & Sections" },
  { key: "faculty_enroll", label: "Faculty Loading & Enrollments" },
]

export default function AcademicInfrastructurePage() {
  const [mainTab, setMainTab] = useState<MainTab>("semesters")
  const [semesterLocked, setSemesterLocked] = useState(false)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    Promise.resolve().then(async () => {
      try {
        const res = await fetch("/api/semesters/count-active")
        const { count } = await res.json()
        setSemesterLocked(count !== 1)
      } catch {
        setSemesterLocked(false)
      }
      setChecking(false)
    })
  }, [])

  const tabs = semesterLocked
    ? allTabs.map((t) => ({ ...t, disabled: t.key !== "semesters" }))
    : allTabs

  return (
    <div className="w-full space-y-6 pb-12 px-4 sm:px-0 animate-ios-slide-in">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-primary">Academic Configurations</h1>
        <p className="text-xs sm:text-sm text-tertiary mt-0.5 sm:mt-1">
          Manage departments, courses, subjects, sections, faculty mappings, student enrollments, and semesters.
        </p>
        {!checking && semesterLocked && (
          <p className="text-xs text-red-600 dark:text-red-400 mt-2 font-semibold">
            No active semester or multiple active semesters detected. Please set exactly one semester as active before accessing other modules.
          </p>
        )}
        <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
          Note: This module is intended for administrative configuration purposes only and is not meant to replace any internal application used by the institution.
        </p>
      </div>

      <SegmentedControl
        options={tabs}
        selected={mainTab}
        onSelect={(key) => setMainTab(key)}
      />

      {mainTab === "semesters" && <SemestersTab />}
      {mainTab === "departments" && <DepartmentsCoursesTab />}
      {mainTab === "subjects" && <SubjectsSectionsTab />}
      {mainTab === "faculty_enroll" && <FacultyLoadingTab />}
    </div>
  )
}
