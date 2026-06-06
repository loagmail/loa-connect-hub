"use client"

import { useRef, useState, useCallback } from "react"

export interface SwipeAction {
  label: string
  onClick: () => void
  bgColor?: string
}

interface SwipeableRowProps {
  children: React.ReactNode
  actions: SwipeAction[]
  threshold?: number
}

export default function SwipeableRow({
  children,
  actions,
  threshold = 80,
}: SwipeableRowProps) {
  const [translateX, setTranslateX] = useState(0)
  const [isOpen, setIsOpen] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const startX = useRef(0)
  const currentTranslate = useRef(0)
  const actionsRef = useRef<HTMLDivElement>(null)

  const actionWidth = actions.length * 80

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX
    currentTranslate.current = isOpen ? -actionWidth : 0
    setIsDragging(true)
  }, [isOpen, actionWidth])

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDragging) return
    const delta = e.touches[0].clientX - startX.current

    if (isOpen) {
      const newTranslate = Math.min(0, Math.max(-actionWidth, currentTranslate.current + delta))
      setTranslateX(newTranslate)
    } else {
      const newTranslate = Math.min(0, Math.max(-actionWidth, delta))
      setTranslateX(newTranslate)
    }
  }, [isDragging, isOpen, actionWidth])

  const handleTouchEnd = useCallback(() => {
    setIsDragging(false)

    if (isOpen) {
      const actualDelta = translateX - currentTranslate.current

      if (actualDelta > threshold / 3) {
        setTranslateX(0)
        setIsOpen(false)
      } else {
        setTranslateX(-actionWidth)
      }
    } else {
      if (translateX < -threshold) {
        setTranslateX(-actionWidth)
        setIsOpen(true)
      } else {
        setTranslateX(0)
      }
    }
  }, [isOpen, translateX, threshold, actionWidth])

  const close = useCallback(() => {
    setTranslateX(0)
    setIsOpen(false)
  }, [])

  return (
    <div className="overflow-hidden relative">
      <div
        ref={actionsRef}
        className="absolute right-0 top-0 bottom-0 flex"
        style={{ width: actionWidth }}
      >
        {actions.map((action, i) => (
          <button
            key={i}
            onClick={() => { action.onClick(); close() }}
            className={`flex-1 flex items-center justify-center text-xs font-semibold text-white min-w-[80px] transition-colors active:opacity-80 ${action.bgColor || "bg-slate-500"}`}
          >
            {action.label}
          </button>
        ))}
      </div>
      <div
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className={`relative bg-surface ${isDragging ? "" : "transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]"}`}
        style={{ transform: `translateX(${translateX}px)` }}
      >
        {children}
      </div>
    </div>
  )
}
