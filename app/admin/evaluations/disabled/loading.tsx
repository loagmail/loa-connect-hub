export default function Loading() {
  return (
    <div className="w-full space-y-6 pb-12 px-4 sm:px-0">
      <div>
        <div className="h-7 w-48 bg-surface-dim rounded animate-pulse-soft" />
        <div className="h-4 w-64 bg-surface-dim rounded animate-pulse-soft mt-1" />
      </div>
      <div className="card p-4 sm:p-6 bg-surface space-y-3">
        <div className="h-9 bg-surface-dim rounded-lg animate-pulse-soft" />
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-10 bg-surface-dim rounded animate-pulse-soft" />
          ))}
        </div>
      </div>
    </div>
  )
}
