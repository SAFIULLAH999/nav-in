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
    <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-10">
      <div className="max-w-5xl mx-auto px-4 py-4">

        {/* Search bar */}
        <div className="relative mb-3">
          <svg
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
            width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true"
          >
            <path d="M7 12A5 5 0 1 0 7 2a5 5 0 0 0 0 10ZM14 14l-3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          <input
            type="search"
            placeholder="Search by job title, company, or skill…"
            defaultValue={currentQuery}
            onChange={(e) => updateParams({ q: e.target.value || null })}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
          />
          {isPending && (
            <div className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
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
                    ? "bg-blue-600 text-white border-blue-600"
                    : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:border-blue-400"
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
              <div className={`w-9 h-5 rounded-full transition-colors ${currentRemote ? "bg-blue-600" : "bg-gray-200 dark:bg-gray-700"}`} />
              <div className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${currentRemote ? "translate-x-4" : ""}`} />
            </div>
            <span className="text-sm text-gray-600 dark:text-gray-400">Remote only</span>
          </label>

          {/* Result count */}
          <span className="text-xs text-gray-400 dark:text-gray-600 ml-2">
            {totalCount} {totalCount === 1 ? "job" : "jobs"}
          </span>

        </div>
      </div>
    </div>
  )
}
