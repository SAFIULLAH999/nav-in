'use client';

import PremiumHiringSection from '@/components/PremiumHiringSection';
import RecruiterDashboard from '@/components/RecruiterDashboard';

export default function HiringPage() {
  return (
      <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto pt-6 px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-text mb-2">Hiring Dashboard</h1>
          <p className="text-text-muted">Find and connect with top talent for your organization</p>
        </div>

        {/* Premium Hiring Section */}
        <div className="mb-8">
          <PremiumHiringSection />
        </div>

        {/* Recruiter Dashboard */}
        <RecruiterDashboard />
      </div>
    </div>
  );
}
