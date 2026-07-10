"use client"

import { useState } from "react"
import ReportBugForm from "@/components/ui/ReportBugForm"

export default function ReportBugButton() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-[10px] text-slate-400 dark:text-slate-600 hover:text-gold-500 dark:hover:text-gold-400 font-mono bg-white/70 dark:bg-slate-900/70 backdrop-blur-sm px-2 py-0.5 rounded-full border border-slate-200/50 dark:border-slate-700/50 transition-colors cursor-pointer"
      >
        Report a Bug
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        >
          <div
            className="bg-slate-900 border border-slate-700/50 rounded-xl shadow-2xl w-full max-w-lg mx-4 p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-primary">Report a Bug</h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-tertiary hover:text-primary transition-colors cursor-pointer"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <ReportBugForm onSubmitted={() => setOpen(false)} />
          </div>
        </div>
      )}
    </>
  )
}
