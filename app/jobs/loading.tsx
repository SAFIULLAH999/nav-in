// app/jobs/loading.tsx
export default function JobsLoading() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header skeleton */}
      <div className="bg-surface border-b border-border px-4 py-8">
        <div className="max-w-5xl mx-auto">
          <div className="h-8 w-64 bg-muted rounded-lg animate-pulse mb-2" />
          <div className="h-4 w-96 bg-muted rounded animate-pulse" />
          <div className="mt-4 flex gap-3">
            <div className="h-10 w-40 bg-muted rounded-xl animate-pulse" />
            <div className="h-10 w-32 bg-muted rounded-xl animate-pulse" />
            <div className="h-10 w-32 bg-muted rounded-xl animate-pulse" />
          </div>
        </div>
      </div>

      {/* Job card skeletons */}
      <div className="max-w-5xl mx-auto px-4 py-6 space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="bg-surface rounded-2xl border border-border p-5 animate-pulse"
          >
            <div className="flex items-start gap-4">
              {/* Logo placeholder */}
              <div className="w-12 h-12 rounded-xl bg-muted shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-5 w-2/3 bg-muted rounded" />
                <div className="h-4 w-1/3 bg-muted/60 rounded" />
                <div className="flex gap-2 mt-2">
                  <div className="h-5 w-20 bg-muted/60 rounded-full" />
                  <div className="h-5 w-16 bg-muted/60 rounded-full" />
                  <div className="h-5 w-24 bg-muted/60 rounded-full" />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
