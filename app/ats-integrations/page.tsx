'use client';

import { Navbar } from '@/components/Navbar';
import { AtsIntegrations } from '@/components/AtsIntegrations';

export const dynamic = 'force-dynamic';

export default function AtsIntegrationsPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-6xl mx-auto pt-20 px-4 py-8">
        <AtsIntegrations />
      </div>
    </div>
  );
}
