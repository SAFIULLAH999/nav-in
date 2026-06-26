// components/jobs/JobsGrid.tsx
import { JobCard } from "./JobCard"
import type { AdzunaJob } from "@/lib/adzuna"

export function JobsGrid({
  jobs,
  query,
}: {
  jobs: AdzunaJob[]
  query?: string
}) {
  if (jobs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center px-4">
        <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-3xl mb-4">
          🔍
        </div>
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-1">
          No jobs found
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs">
          {query
            ? `No results for "${query}". Try a different keyword or remove some filters.`
            : "No jobs match your current filters. Try broadening your search."}
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {jobs.map((job) => (
        <JobCard key={job.id} job={job} />
      ))}
    </div>
  )
}
