'use client';

import { Navbar } from '@/components/Navbar';
import { SkillsQuiz } from '@/components/SkillsQuiz';

export default function SkillsPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-6xl mx-auto pt-20 px-4 py-8">
        <SkillsQuiz />
      </div>
    </div>
  );
}