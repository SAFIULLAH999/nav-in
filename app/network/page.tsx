import { Navbar } from '@/components/Navbar'

export default function NetworkPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-surface rounded-lg border border-border p-8 text-center">
        <h1 className="text-2xl font-bold text-text mb-4">My Network</h1>
        <p className="text-text-muted">
          Manage your professional connections and discover new opportunities.
        </p>
        <div className="mt-6">
          <button className="btn-primary">
            Find Connections
          </button>
        </div>
      </div>
    </div>
  )
}
