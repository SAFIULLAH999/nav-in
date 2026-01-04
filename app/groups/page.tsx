'use client';

import { GroupsBrowser } from '@/components/GroupsBrowser';

export const dynamic = 'force-dynamic';

export default function GroupsPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto pt-6 px-4 py-8">
        <GroupsBrowser />
      </div>
    </div>
  );
}
