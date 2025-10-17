import { Navbar } from '@/components/Navbar'

export default function NotificationsPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-surface rounded-lg border border-border p-8 text-center">
        <h1 className="text-2xl font-bold text-text mb-4">Notifications</h1>
        <p className="text-text-muted">
          Stay updated with your professional network activity and opportunities.
        </p>
        <div className="mt-6 text-left">
          <div className="space-y-4">
            <div className="p-4 bg-secondary rounded-lg">
              <p className="text-sm text-text-muted">No new notifications</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
