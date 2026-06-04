"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useRouter, useSearchParams } from "next/navigation"

interface SearchBarProps {
  query?: string
  placeholder?: string
  basePath?: string
  paramName?: string
  className?: string
}

export default function SearchBar({
  query = "",
  placeholder = "Search...",
  basePath = "",
  paramName = "q",
  className = "",
}: SearchBarProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [value, setValue] = useState(query)
  const [isFocused, setIsFocused] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const timer = setTimeout(() => {
      if (value !== query) {
        const params = new URLSearchParams(searchParams.toString())
        if (value.trim()) {
          params.set(paramName, value.trim())
        } else {
          params.delete(paramName)
        }
        router.push(`${basePath}?${params.toString()}`)
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [value, query, searchParams, router, paramName, basePath])

  const handleCancel = useCallback(() => {
    setValue("")
    setIsFocused(false)
    inputRef.current?.blur()
    const params = new URLSearchParams(searchParams.toString())
    params.delete(paramName)
    router.push(`${basePath}?${params.toString()}`)
  }, [router, searchParams, paramName, basePath])

  const handleClear = useCallback(() => {
    setValue("")
    inputRef.current?.focus()
    const params = new URLSearchParams(searchParams.toString())
    params.delete(paramName)
    router.push(`${basePath}?${params.toString()}`)
  }, [router, searchParams, paramName, basePath])

  return (
    <div className={`w-full ${className}`}>
      <div className="relative flex items-center">
        <div className="relative flex-1">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-tertiary pointer-events-none"
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => { if (!value) setIsFocused(false) }}
            placeholder={placeholder}
            className="w-full rounded-xl border border-default bg-surface pl-9 pr-9 py-2 text-sm text-secondary shadow-sm transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/15"
          />
          {value && (
            <button
              onClick={handleClear}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-tertiary hover:text-secondary transition-colors p-0.5"
              tabIndex={-1}
              type="button"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
        <button
          onClick={handleCancel}
          className={`ml-2 text-sm font-semibold text-brand-600 transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] whitespace-nowrap ${
            isFocused
              ? "max-w-20 opacity-100"
              : "max-w-0 opacity-0 pointer-events-none overflow-hidden p-0"
          }`}
        >
          Cancel
        </button>
      </div>
    </div>
  )
}
