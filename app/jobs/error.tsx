// app/jobs/error.tsx
"use client"

import { useEffect } from "react"

export default function JobsError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("[JOBS_PAGE_ERROR]", error)
  }, [error])

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center text-center px-4">
      <div className="text-5xl mb-4">⚠️</div>
      <h2 className="text-xl font-semibold text-text mb-2">
        Couldn't load jobs
      </h2>
      <p className="text-sm text-text-muted mb-6 max-w-sm">
        There was a problem fetching job listings. This is usually temporary.
      </p>
      <button
        onClick={reset}
        className="bg-primary text-white text-sm font-medium px-6 py-2 rounded-xl transition-colors"
      >
        Try again
      </button>
    </div>
  )
}
