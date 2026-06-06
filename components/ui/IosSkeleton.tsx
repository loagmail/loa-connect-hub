"use client"

interface IosSkeletonProps {
  className?: string
  count?: number
}

function ShimmerBlock({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-shimmer rounded-lg ${className}`}
      aria-hidden="true"
    />
  )
}

export function IosSkeletonText({ lines = 3, className = "" }: { lines?: number; className?: string }) {
  const widths = ["w-full", "w-3/4", "w-1/2"]
  return (
    <div className={`space-y-2.5 ${className}`} aria-hidden="true">
      {Array.from({ length: lines }).map((_, i) => (
        <ShimmerBlock key={i} className={`h-3.5 ${widths[i % widths.length]}`} />
      ))}
    </div>
  )
}

export function IosSkeletonAvatar({ className = "" }: { className?: string }) {
  return <ShimmerBlock className={`w-10 h-10 rounded-full shrink-0 ${className}`} />
}

export function IosSkeletonCard({ className = "" }: { className?: string }) {
  return (
    <div className={`ios-table-section ${className}`}>
      <div className="ios-table-row !cursor-default hover:!bg-surface">
        <IosSkeletonAvatar />
        <div className="flex-1 space-y-2">
          <ShimmerBlock className="h-3.5 w-1/3" />
          <ShimmerBlock className="h-3 w-1/2" />
        </div>
        <ShimmerBlock className="h-5 w-16 rounded-full" />
      </div>
      <div className="ios-table-row !cursor-default hover:!bg-surface">
        <IosSkeletonAvatar />
        <div className="flex-1 space-y-2">
          <ShimmerBlock className="h-3.5 w-2/5" />
          <ShimmerBlock className="h-3 w-3/5" />
        </div>
        <ShimmerBlock className="h-5 w-16 rounded-full" />
      </div>
      <div className="ios-table-row !cursor-default hover:!bg-surface">
        <IosSkeletonAvatar />
        <div className="flex-1 space-y-2">
          <ShimmerBlock className="h-3.5 w-1/3" />
          <ShimmerBlock className="h-3 w-1/2" />
        </div>
        <ShimmerBlock className="h-5 w-16 rounded-full" />
      </div>
    </div>
  )
}

export function IosSkeletonDetail() {
  return (
    <div className="space-y-6 p-4" aria-hidden="true">
      <div className="ios-table-section">
        <div className="ios-table-row !cursor-default hover:!bg-surface !min-h-[56px]">
          <div className="flex-1 space-y-2">
            <ShimmerBlock className="h-4 w-2/3" />
            <ShimmerBlock className="h-3 w-1/3" />
          </div>
        </div>
        <div className="ios-table-row !cursor-default hover:!bg-surface !min-h-[56px]">
          <div className="flex-1 space-y-2">
            <ShimmerBlock className="h-4 w-1/2" />
            <ShimmerBlock className="h-3 w-1/4" />
          </div>
        </div>
        <div className="ios-table-row !cursor-default hover:!bg-surface !min-h-[56px]">
          <div className="flex-1 space-y-2">
            <ShimmerBlock className="h-4 w-3/4" />
            <ShimmerBlock className="h-3 w-1/2" />
          </div>
        </div>
      </div>
      <div className="ios-table-section">
        <div className="ios-table-row !cursor-default hover:!bg-surface">
          <IosSkeletonAvatar />
          <div className="flex-1 space-y-1.5">
            <ShimmerBlock className="h-3.5 w-1/4" />
            <ShimmerBlock className="h-3 w-1/3" />
          </div>
        </div>
        <div className="ios-table-row !cursor-default hover:!bg-surface">
          <IosSkeletonAvatar />
          <div className="flex-1 space-y-1.5">
            <ShimmerBlock className="h-3.5 w-1/3" />
            <ShimmerBlock className="h-3 w-1/2" />
          </div>
        </div>
      </div>
      <div className="flex gap-3">
        <ShimmerBlock className="h-10 flex-1 rounded-xl" />
        <ShimmerBlock className="h-10 flex-1 rounded-xl" />
      </div>
    </div>
  )
}

export default function IosSkeleton({ className = "", count = 1 }: IosSkeletonProps) {
  return (
    <div className={`space-y-3 ${className}`} aria-hidden="true">
      {Array.from({ length: count }).map((_, i) => (
        <ShimmerBlock key={i} className="h-12 w-full rounded-xl" />
      ))}
    </div>
  )
}
