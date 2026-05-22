"use client"

import { useRef } from "react"

interface SubmitButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean
  variant?: "primary" | "secondary" | "success" | "danger"
}

const variantClasses = {
  primary: "btn-primary",
  secondary: "btn-secondary",
  success: "btn-success",
  danger: "btn-danger",
}

export default function SubmitButton({
  children,
  loading = false,
  disabled = false,
  variant = "primary",
  onClick,
  className = "",
  ...props
}: SubmitButtonProps) {
  const clicked = useRef(false)

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (clicked.current || loading || disabled) {
      e.preventDefault()
      return
    }
    clicked.current = true
    setTimeout(() => { clicked.current = false }, 500)
    onClick?.(e)
  }

  return (
    <button
      {...props}
      disabled={disabled || loading}
      onClick={handleClick}
      className={`${variantClasses[variant]} ${className}`}
    >
      {loading ? (
        <span className="flex items-center justify-center gap-2">
          <svg className="animate-spin w-3.5 h-3.5" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          {children}
        </span>
      ) : (
        children
      )}
    </button>
  )
}
