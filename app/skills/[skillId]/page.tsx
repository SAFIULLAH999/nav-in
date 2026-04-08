'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, Trophy, Users, ArrowLeft } from 'lucide-react';
import { SkillLeaderboard } from '@/components/SkillLeaderboard';
import { Button } from '@/components/ui/button';
import toast from 'react-hot-toast';

interface Skill {
  id: string;
  name: string;
  category?: string;
  createdAt: string;
}

interface Quiz {
  id: string;
  title: string;
  description: string;
  difficulty: string;
  timeLimit: number;
  passingScore: number;
}

interface SkillPageData {
  skill: Skill;
  leaderboard: any[];
  quizzes: Quiz[];
  endorsementCount: number;
}

export default function SkillPage() {
  const params = useParams();
  const router = useRouter();
  const skillId = params.skillId as string;

  const [skillData, setSkillData] = useState<SkillPageData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState<'leaderboard' | 'quizzes'>('leaderboard');

  useEffect(() => {
    const fetchSkillData = async () => {
      try {
        const token =
          localStorage.getItem('accessToken') ||
          sessionStorage.getItem('accessToken');

        const response = await fetch(`/api/v1/skills/${skillId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await response.json();
        if (data.success) {
          setSkillData(data.data);
        } else {
          throw new Error(data.error?.message || 'Failed to fetch skill');
        }
      } catch (error) {
        console.error('Error fetching skill:', error);
        toast.error(
          error instanceof Error ? error.message : 'Failed to load skill'
        );
        router.push('/skills');
      } finally {
        setIsLoading(false);
      }
    };

    if (skillId) {
      fetchSkillData();
    }
  }, [skillId, router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!skillData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Skill not found</p>
          <Button onClick={() => router.push('/skills')}>Back to Skills</Button>
        </div>
      </div>
    );
  }

  const { skill, leaderboard, quizzes, endorsementCount } = skillData;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white border-b border-gray-200 sticky top-0 z-40"
      >
        <div className="max-w-6xl mx-auto px-4 py-6">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-600 hover:text-primary transition-colors mb-4"
          >
            <ArrowLeft size={20} />
            Back
          </button>

          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Trophy className="text-blue-600" size={28} />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{skill.name}</h1>
              {skill.category && (
                <p className="text-gray-600 mt-1">Category: {skill.category}</p>
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mt-6">
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200"
            >
              <div className="flex items-center gap-3">
                <Users size={24} className="text-blue-600" />
                <div>
                  <p className="text-sm text-gray-600">Endorsed by</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {endorsementCount}
                  </p>
                </div>
              </div>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.05 }}
              className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-lg border border-purple-200"
            >
              <div className="flex items-center gap-3">
                <BookOpen size={24} className="text-purple-600" />
                <div>
                  <p className="text-sm text-gray-600">Quizzes</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {quizzes.length}
                  </p>
                </div>
              </div>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.05 }}
              className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg border border-green-200"
            >
              <div className="flex items-center gap-3">
                <Trophy size={24} className="text-green-600" />
                <div>
                  <p className="text-sm text-gray-600">Top Experts</p>
                  <p className="text-2xl font-bold text-green-600">
                    {Math.min(leaderboard.length, 10)}
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Tabs */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="flex gap-4 mb-8 border-b border-gray-200"
        >
          <button
            onClick={() => setSelectedTab('leaderboard')}
            className={`px-4 py-3 font-medium border-b-2 transition-colors ${
              selectedTab === 'leaderboard'
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            <Trophy size={18} className="inline mr-2" />
            Leaderboard
          </button>
          <button
            onClick={() => setSelectedTab('quizzes')}
            className={`px-4 py-3 font-medium border-b-2 transition-colors ${
              selectedTab === 'quizzes'
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            <BookOpen size={18} className="inline mr-2" />
            Quizzes ({quizzes.length})
          </button>
        </motion.div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          {selectedTab === 'leaderboard' ? (
            <motion.div
              key="leaderboard"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <SkillLeaderboard skillId={skillId} skillName={skill.name} />
            </motion.div>
          ) : (
            <motion.div
              key="quizzes"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <div className="space-y-4">
                {quizzes.length > 0 ? (
                  quizzes.map((quiz, index) => (
                    <motion.div
                      key={quiz.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow border border-gray-200"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900 mb-2">
                            {quiz.title}
                          </h3>
                          {quiz.description && (
                            <p className="text-gray-600 mb-3">{quiz.description}</p>
                          )}

                          <div className="flex flex-wrap gap-4 text-sm">
                            <div>
                              <span className="text-gray-600">Difficulty:</span>
                              <span className="ml-2 font-medium text-gray-900">
                                {quiz.difficulty}
                              </span>
                            </div>
                            <div>
                              <span className="text-gray-600">Time Limit:</span>
                              <span className="ml-2 font-medium text-gray-900">
                                {quiz.timeLimit} min
                              </span>
                            </div>
                            <div>
                              <span className="text-gray-600">Pass Score:</span>
                              <span className="ml-2 font-medium text-gray-900">
                                {quiz.passingScore}%
                              </span>
                            </div>
                          </div>
                        </div>

                        <Button
                          onClick={() => router.push(`/quiz/${quiz.id}`)}
                          className="ml-4"
                        >
                          Take Quiz
                        </Button>
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
                    <BookOpen className="mx-auto text-gray-400 mb-4" size={32} />
                    <p className="text-gray-600">No quizzes available for this skill yet</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
