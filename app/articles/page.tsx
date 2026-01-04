'use client';

import { ArticlesList } from '@/components/ArticlesList';

export const dynamic = 'force-dynamic';

export default function ArticlesPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto pt-20 px-4 py-8">
        <ArticlesList />
      </div>
    </div>
  );
}
