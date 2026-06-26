// components/jobs/JobFilters.tsx
"use client"

import { useRouter, useSearchParams, usePathname } from "next/navigation"
import { useCallback, useTransition } from "react"

const JOB_TYPES = [
  { label: "All types", value: "all"       },
  { label: "Full-time", value: "full-time" },
  { label: "Part-time", value: "part-time" },
  { label: "Contract",  value: "contract"  },
  { label: "Internship",value: "internship"},
]

export function JobFilters({ totalCount }: { totalCount: number }) {
  const router      = useRouter()
  const pathname    = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  const currentQuery  = searchParams.get("q")      ?? ""
  const currentType   = searchParams.get("type")   ?? "all"
  const currentRemote = searchParams.get("remote")  === "true"

  const updateParams = useCallback(
    (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString())
      Object.entries(updates).forEach(([k, v]) => {
        if (v === null || v === "" || v === "all" || v === "false") {
          params.delete(k)
        } else {
          params.set(k, v)
        }
      })
      startTransition(() => {
        router.push(`${pathname}?${params.toString()}`, { scroll: false })
      })
    },
    [searchParams, pathname, router]
  )

  return (
    <div className="bg-surface border-b border-border sticky top-0 z-10">
      <div className="max-w-5xl mx-auto px-4 py-4">

        {/* Search bar */}
        <div className="relative mb-3">
          <svg
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted"
            width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true"
          >
            <path d="M7 12A5 5 0 1 0 7 2a5 5 0 0 0 0 10ZM14 14l-3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          <input
            type="search"
            placeholder="Search by job title, company, or skill…"
            defaultValue={currentQuery}
            onChange={(e) => updateParams({ q: e.target.value || null })}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-surface text-sm text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition"
          />
          {isPending && (
            <div className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          )}
        </div>

        {/* Filter row */}
        <div className="flex items-center gap-2 flex-wrap">

          {/* Job type pills */}
          <div className="flex gap-1.5 flex-wrap">
            {JOB_TYPES.map((t) => (
              <button
                key={t.value}
                onClick={() => updateParams({ type: t.value })}
                className={`text-xs font-medium px-3 py-1.5 rounded-full border transition-colors ${
                  currentType === t.value
                    ? "bg-primary text-white border-primary"
                    : "bg-surface text-text-muted border-border hover:border-primary"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Remote toggle */}
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <div className="relative">
              <input
                type="checkbox"
                className="sr-only"
                checked={currentRemote}
                onChange={(e) => updateParams({ remote: e.target.checked ? "true" : null })}
              />
              <div className={`w-9 h-5 rounded-full transition-colors ${currentRemote ? "bg-primary" : "bg-muted"}`} />
              <div className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${currentRemote ? "translate-x-4" : ""}`} />
            </div>
            <span className="text-sm text-text-muted">Remote only</span>
          </label>

          {/* Result count */}
          <span className="text-xs text-text-muted ml-2">
            {totalCount} {totalCount === 1 ? "job" : "jobs"}
          </span>

        </div>
      </div>
    </div>
  )
}
