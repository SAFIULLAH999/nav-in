'use client';

import Navbar from '@/components/Navbar';
import { GroupsBrowser } from '@/components/GroupsBrowser';

export const dynamic = 'force-dynamic';

export default function GroupsPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-6xl mx-auto pt-20 px-4 py-8">
        <GroupsBrowser />
      </div>
    </div>
  );
}
