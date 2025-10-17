import { JobSearch } from '@/components/JobSearch'
import { JobCard } from '@/components/JobCard'
import { mockJobs } from '@/data/mockData'

export default function JobsPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <JobSearch />
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Jobs for you</h2>
          <div className="text-sm text-gray-600">
            {mockJobs.length} results
          </div>
        </div>
        {mockJobs.map((job) => (
          <JobCard key={job.id} job={job} />
        ))}
      </div>
    </div>
  )
}
