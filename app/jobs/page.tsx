// app/jobs/page.tsx
import { Suspense } from "react"
import { fetchJobs } from "@/lib/adzuna"
import { JobFilters } from "@/components/jobs/JobFilters"
import { JobsGrid } from "@/components/jobs/JobsGrid"
import JobsLoading from "./loading"

// Revalidate this page every hour — works with Vercel ISR
export const revalidate = 3600

interface JobsPageProps {
  searchParams: Promise<{
    q?:      string
    type?:   string
    remote?: string
    page?:   string
  }>
}

export async function generateMetadata({ searchParams }: JobsPageProps) {
  const params = await searchParams
  const q = params.q
  return {
    title: q ? `"${q}" jobs — NavIN` : "Find Jobs — NavIN",
    description: "Discover thousands of job opportunities matched to your skills on NavIN.",
  }
}

export default async function JobsPage({ searchParams }: JobsPageProps) {
  const params = await searchParams
  const query  = params.q      ?? ""
  const type   = params.type   ?? "all"
  const remote = params.remote === "true"
  const page   = parseInt(params.page ?? "1", 10)

  // Fetch jobs server-side — always returns data (falls back to mock on error)
  const { jobs, total } = await fetchJobs({ query, type, remote, page })

  return (
    <div className="min-h-screen bg-background">

      {/* Page header */}
      <div className="bg-surface border-b border-border px-4 pt-8 pb-0">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-2xl font-bold text-text">Find your dream job</h1>
          <p className="text-sm text-text-muted mt-1">
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
                className="px-5 py-2 rounded-xl border border-border text-sm font-medium text-text hover:bg-muted transition-colors"
              >
                ← Previous
              </a>
            )}
            <span className="text-sm text-text-muted">
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
                className="px-5 py-2 rounded-xl border border-border text-sm font-medium text-text hover:bg-muted transition-colors"
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
