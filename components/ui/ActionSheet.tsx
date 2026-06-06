"use client"

import { useEffect, useCallback } from "react"

export interface ActionSheetAction {
  label: string
  onClick: () => void
  role?: "default" | "cancel" | "destructive"
}

interface ActionSheetProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  message?: string
  actions: ActionSheetAction[]
}

export default function ActionSheet({
  isOpen,
  onClose,
  title,
  message,
  actions,
}: ActionSheetProps) {
  const handleEscape = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    },
    [onClose],
  )

  useEffect(() => {
    if (isOpen) {
      document.addEventListener("keydown", handleEscape)
      document.body.style.overflow = "hidden"
    }
    return () => {
      document.removeEventListener("keydown", handleEscape)
      document.body.style.overflow = ""
    }
  }, [isOpen, handleEscape])

  if (!isOpen) return null

  const cancelAction = actions.find((a) => a.role === "cancel")
  const otherActions = actions.filter((a) => a.role !== "cancel")

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div
        className="absolute inset-0 bg-black/40 ios-blur-light"
        onClick={onClose}
      />
      <div className="relative w-full sm:w-auto sm:min-w-[280px] sm:max-w-sm px-3 pb-[var(--safe-bottom,12px)] sm:p-0 animate-ios-slide-up sm:animate-fade-in">
        <div className="bg-surface rounded-2xl sm:rounded-2xl overflow-hidden shadow-ios-lg">
          {(title || message) && (
            <div className="px-5 pt-4 pb-3 text-center border-b border-default">
              {title && (
                <p className="text-sm font-semibold text-primary">{title}</p>
              )}
              {message && (
                <p className="text-xs text-tertiary mt-1">{message}</p>
              )}
            </div>
          )}
          <div className="divide-y divide-default">
            {otherActions.map((action, i) => (
              <button
                key={i}
                onClick={() => {
                  action.onClick()
                  onClose()
                }}
                className={`w-full px-5 py-4 text-sm font-semibold text-center transition-colors hover:bg-surface-hover active:bg-surface-tertiary min-h-[44px] ${
                  action.role === "destructive"
                    ? "text-red-600"
                    : "text-brand-600"
                }`}
              >
                {action.label}
              </button>
            ))}
          </div>
        </div>
        {cancelAction && (
          <div className="mt-2 sm:mt-3">
            <button
              onClick={() => {
                cancelAction.onClick()
                onClose()
              }}
              className="w-full bg-surface rounded-2xl px-5 py-4 text-sm font-semibold text-primary text-center transition-colors hover:bg-surface-hover active:bg-surface-tertiary shadow-ios-lg min-h-[44px]"
            >
              {cancelAction.label}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
