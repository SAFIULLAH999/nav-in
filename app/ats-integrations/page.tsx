'use client';

import { AtsIntegrations } from '@/components/AtsIntegrations';

export const dynamic = 'force-dynamic';

export default function AtsIntegrationsPage() {
  return (
      <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto pt-6 px-4 py-8">
        <AtsIntegrations />
      </div>
    </div>
  );
}
