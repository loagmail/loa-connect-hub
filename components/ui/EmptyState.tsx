"use client"

import Link from "next/link"

interface EmptyStateProps {
  icon?: React.ReactNode
  title: string
  description?: string
  action?: {
    label: string
    href?: string
    onClick?: () => void
  }
  className?: string
}

function DefaultIcon() {
  return (
    <svg className="w-16 h-16 text-tertiary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
    </svg>
  )
}

export default function EmptyState({ icon, title, description, action, className = "" }: EmptyStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center px-8 py-16 text-center ${className}`}>
      <div className="mb-4 opacity-60">
        {icon || <DefaultIcon />}
      </div>
      <h2 className="text-lg font-bold text-primary leading-tight">{title}</h2>
      {description && (
        <p className="text-base text-tertiary mt-1.5 max-w-xs leading-relaxed">{description}</p>
      )}
      {action && (
        <div className="mt-6">
          {action.href ? (
            <Link href={action.href} className="btn-ios-primary inline-flex items-center justify-center px-6 py-2.5 text-sm font-semibold">
              {action.label}
            </Link>
          ) : (
            <button onClick={action.onClick} className="btn-ios-primary inline-flex items-center justify-center px-6 py-2.5 text-sm font-semibold">
              {action.label}
            </button>
          )}
        </div>
      )}
    </div>
  )
}
