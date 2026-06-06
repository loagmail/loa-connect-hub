"use client"

import { useEffect, useCallback } from "react"

interface AlertProps {
  isOpen: boolean
  onClose: () => void
  title: string
  message?: string
  confirmLabel?: string
  cancelLabel?: string
  onConfirm?: () => void
  destructive?: boolean
}

export default function Alert({
  isOpen,
  onClose,
  title,
  message,
  confirmLabel = "OK",
  cancelLabel = "Cancel",
  onConfirm,
  destructive = false,
}: AlertProps) {
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-8">
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
      />
      <div className="relative w-full max-w-xs bg-surface rounded-2xl shadow-ios-xl animate-fade-in overflow-hidden">
        <div className="px-5 pt-5 pb-4 text-center">
          <p className="text-base font-semibold text-primary">{title}</p>
          {message && (
            <p className="text-xs text-tertiary mt-2 leading-relaxed">{message}</p>
          )}
        </div>
        <div className="flex border-t border-default">
          {onConfirm ? (
            <>
              <button
                onClick={onClose}
                className="flex-1 py-3.5 text-sm font-semibold text-tertiary text-center transition-colors hover:bg-surface-hover active:bg-surface-tertiary min-h-[44px] border-r border-default"
              >
                {cancelLabel}
              </button>
              <button
                onClick={() => {
                  onConfirm()
                  onClose()
                }}
                className={`flex-1 py-3.5 text-sm font-semibold text-center transition-colors hover:bg-surface-hover active:bg-surface-tertiary min-h-[44px] ${
                  destructive ? "text-red-600" : "text-brand-600"
                }`}
              >
                {confirmLabel}
              </button>
            </>
          ) : (
            <button
              onClick={onClose}
              className="flex-1 py-3.5 text-sm font-semibold text-brand-600 text-center transition-colors hover:bg-surface-hover active:bg-surface-tertiary min-h-[44px]"
            >
              {confirmLabel}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
