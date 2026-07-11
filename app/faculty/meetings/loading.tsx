import Skeleton from "@/components/ui/Skeleton"

export default function FacultyMeetingsLoading() {
  return (
    <div className="w-full space-y-8 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton variant="text" className="w-32 h-8" />
          <Skeleton variant="text" className="w-48 h-4" />
        </div>
        <Skeleton variant="badge" className="w-28 h-10 !rounded-lg" />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Skeleton variant="metric" />
        <Skeleton variant="metric" />
        <Skeleton variant="metric" />
      </div>

      {/* Filters card */}
      <div className="card p-4 bg-surface space-y-3">
        <Skeleton variant="badge" className="w-64 h-9 !rounded-xl" />
        <div className="flex items-center gap-3 justify-end">
          <Skeleton variant="badge" className="w-24 h-6" />
          <Skeleton variant="badge" className="w-32 h-6" />
        </div>
        <Skeleton variant="text" className="w-full h-10 !rounded-lg" />
        <div className="flex gap-2">
          <Skeleton variant="badge" className="w-16 h-8 !rounded-lg" />
          <Skeleton variant="badge" className="w-16 h-8 !rounded-lg" />
          <Skeleton variant="badge" className="w-16 h-8 !rounded-lg" />
          <Skeleton variant="badge" className="w-20 h-8 !rounded-lg" />
          <Skeleton variant="badge" className="w-20 h-8 !rounded-lg" />
        </div>
      </div>

      {/* Table rows */}
      <Skeleton variant="table-row" count={5} />
    </div>
  )
}
