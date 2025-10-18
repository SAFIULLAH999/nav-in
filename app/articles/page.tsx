'use client';

import { Navbar } from '@/components/Navbar';
import { ArticlesList } from '@/components/ArticlesList';

export default function ArticlesPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-6xl mx-auto pt-20 px-4 py-8">
        <ArticlesList />
      </div>
    </div>
  );
}