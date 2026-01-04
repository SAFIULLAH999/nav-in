'use client';


import { SkillsQuiz } from '@/components/SkillsQuiz';

export const dynamic = 'force-dynamic';

export default function SkillsPage() {
  return (
    <div className="min-h-screen bg-background">

      <div className="max-w-6xl mx-auto pt-20 px-4 py-8">
        <SkillsQuiz />
      </div>
    </div>
  );
}
