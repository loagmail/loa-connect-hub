"use client"

import { useState, useEffect } from "react"

interface SyncStatus {
  pendingCount: number
  failedCount: number
  writtenCount: number
  lastSync: string | null
  failedAppointments: Array<{
    id: string
    teamsSyncError: string | null
    teamsSyncRetries: number
    teamsSyncLastAttempt: string | null
    student: { name: string } | null
    faculty: { name: string } | null
    schedule: { date: string; startTime: string; endTime: string } | null
  }>
}

export default function TeamsSyncPanel() {
  const [status, setStatus] = useState<SyncStatus | null>(null)
  const [syncing, setSyncing] = useState(false)
  const [syncResult, setSyncResult] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const fetchStatus = async () => {
    try {
      const res = await fetch("/api/admin/sync-teams/status")
      const data = await res.json()
      if (res.ok) setStatus(data)
    } catch {
      // silently fail
    }
  }

  useEffect(() => {
    fetchStatus()
  }, [])

  const handleSync = async () => {
    setSyncing(true)
    setSyncResult(null)
    setError(null)
    try {
      const res = await fetch("/api/admin/sync-teams", { method: "POST" })
      const data = await res.json()
      if (res.ok) {
        const r = data.result
        setSyncResult(`Processed: ${r.processed}, Synced: ${r.succeeded}, Failed: ${r.failed}, Skipped: ${r.skipped}`)
        if (r.errors?.length > 0) {
          setError(r.errors.slice(0, 5).join("\n"))
        }
        fetchStatus()
      } else {
        setError(data.error || "Sync failed")
      }
    } catch {
      setError("An error occurred during sync")
    } finally {
      setSyncing(false)
    }
  }

  const total = (status?.pendingCount || 0) + (status?.failedCount || 0) + (status?.writtenCount || 0)

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-slate-900">Teams Sync Orchestration</h2>
        {status?.lastSync && (
          <p className="text-xs text-slate-400">
            Last sync: {new Date(status.lastSync).toLocaleString()}
          </p>
        )}
      </div>

      {/* Metrics cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="card p-4 bg-white">
          <p className="text-2xl font-bold text-slate-900">{total}</p>
          <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mt-0.5">Total Approved</p>
        </div>
        <div className="card p-4 bg-white">
          <p className="text-2xl font-bold text-amber-600">{status?.pendingCount ?? 0}</p>
          <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mt-0.5">Pending Sync</p>
        </div>
        <div className="card p-4 bg-white">
          <p className="text-2xl font-bold text-emerald-600">{status?.writtenCount ?? 0}</p>
          <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mt-0.5">Written to Teams</p>
        </div>
        <div className="card p-4 bg-white">
          <p className="text-2xl font-bold text-red-600">{status?.failedCount ?? 0}</p>
          <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mt-0.5">Sync Failed</p>
        </div>
      </div>

      {/* Sync button */}
      <div className="flex items-center gap-4">
        <button
          onClick={handleSync}
          disabled={syncing}
          className="btn-primary text-sm font-semibold px-5 py-2.5 disabled:opacity-50"
        >
          {syncing ? "Syncing..." : "Sync Now"}
        </button>
        {syncResult && (
          <p className="text-sm text-emerald-700 font-medium">{syncResult}</p>
        )}
      </div>

      {/* Errors */}
      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-4">
          <p className="text-xs font-bold text-red-700 mb-1">Sync Errors</p>
          <pre className="text-xs text-red-600 whitespace-pre-wrap font-sans">{error}</pre>
        </div>
      )}

      {/* Failed appointments list */}
      {status?.failedAppointments && status.failedAppointments.length > 0 && (
        <div className="card overflow-x-auto bg-white">
          <p className="px-4 pt-4 text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
            Failed Appointments ({status.failedAppointments.length})
          </p>
          <table className="min-w-full divide-y divide-slate-100">
            <thead>
              <tr className="bg-slate-50">
                <th className="px-4 py-2.5 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider">Faculty</th>
                <th className="px-4 py-2.5 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider">Date/Time</th>
                <th className="px-4 py-2.5 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider">Retries</th>
                <th className="px-4 py-2.5 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider">Error</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {status.failedAppointments.map((apt: any) => (
                <tr key={apt.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 whitespace-nowrap text-xs font-semibold text-slate-800">
                    {apt.faculty?.name || "—"}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-xs text-slate-600">
                    {apt.schedule?.date} @ {apt.schedule?.startTime}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-xs text-slate-600">
                    {apt.teamsSyncRetries}/5
                  </td>
                  <td className="px-4 py-3 text-xs text-red-600 max-w-[200px] truncate" title={apt.teamsSyncError || ""}>
                    {apt.teamsSyncError || "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
