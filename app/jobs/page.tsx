// app/jobs/page.tsx
import { Suspense } from "react"
import { fetchJobs } from "@/lib/adzuna"
import { JobFilters } from "@/components/jobs/JobFilters"
import { JobsGrid } from "@/components/jobs/JobsGrid"
import JobsLoading from "./loading"

// Revalidate this page every hour — works with Vercel ISR
export const revalidate = 3600

interface JobsPageProps {
  searchParams: {
    q?:      string
    type?:   string
    remote?: string
    page?:   string
  }
}

export async function generateMetadata({ searchParams }: JobsPageProps) {
  const q = searchParams.q
  return {
    title: q ? `"${q}" jobs — NavIN` : "Find Jobs — NavIN",
    description: "Discover thousands of job opportunities matched to your skills on NavIN.",
  }
}

export default async function JobsPage({ searchParams }: JobsPageProps) {
  const query  = searchParams.q      ?? ""
  const type   = searchParams.type   ?? "all"
  const remote = searchParams.remote === "true"
  const page   = parseInt(searchParams.page ?? "1", 10)

  // Fetch jobs server-side — always returns data (falls back to mock on error)
  const { jobs, total } = await fetchJobs({ query, type, remote, page })

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">

      {/* Page header */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-4 pt-8 pb-0">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Find your dream job
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Discover opportunities that match your skills and career goals
          </p>
        </div>
      </div>

      {/* Sticky filters — client component */}
      <Suspense fallback={null}>
        <JobFilters totalCount={total} />
      </Suspense>

      {/* Job listings */}
      <main className="max-w-5xl mx-auto px-4 py-6">
        <Suspense fallback={<JobsLoading />}>
          <JobsGrid jobs={jobs} query={query} />
        </Suspense>

        {/* Pagination — simple prev/next */}
        {total > 20 && (
          <div className="flex items-center justify-center gap-4 mt-8 pb-8">
            {page > 1 && (
              <a
                href={`/jobs?${new URLSearchParams({
                  ...(query ? { q: query } : {}),
                  ...(type !== "all" ? { type } : {}),
                  ...(remote ? { remote: "true" } : {}),
                  page: String(page - 1),
                })}`}
                className="px-5 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                ← Previous
              </a>
            )}
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Page {page} of {Math.ceil(total / 20)}
            </span>
            {page < Math.ceil(total / 20) && (
              <a
                href={`/jobs?${new URLSearchParams({
                  ...(query ? { q: query } : {}),
                  ...(type !== "all" ? { type } : {}),
                  ...(remote ? { remote: "true" } : {}),
                  page: String(page + 1),
                })}`}
                className="px-5 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                Next →
              </a>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
