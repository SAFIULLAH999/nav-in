'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Award, Medal, Zap } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';

interface LeaderboardEntry {
  rank: number;
  userId: string;
  user: {
    id: string;
    name: string;
    avatar: string;
    title?: string;
    company?: string;
  };
  endorsementCount: number;
  verified: boolean;
  quizzesCompleted: number;
}

interface SkillLeaderboardProps {
  skillId: string;
  skillName: string;
  limit?: number;
}

const getRankIcon = (rank: number) => {
  if (rank === 1) return <Trophy className="text-yellow-500" size={20} />;
  if (rank === 2) return <Medal className="text-gray-400" size={20} />;
  if (rank === 3) return <Medal className="text-orange-600" size={20} />;
  return <span className="text-sm font-bold text-gray-600 w-5 h-5 flex items-center justify-center">{rank}</span>;
};

export const SkillLeaderboard: React.FC<SkillLeaderboardProps> = ({
  skillId,
  skillName,
  limit = 50,
}) => {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userRank, setUserRank] = useState<number | null>(null);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const token =
          localStorage.getItem('accessToken') ||
          sessionStorage.getItem('accessToken');

        const response = await fetch(
          `/api/v1/skills/${skillId}/leaderboard?limit=${limit}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = await response.json();
        if (data.success) {
          setLeaderboard(data.data.leaderboard);
        } else {
          throw new Error(data.error?.message || 'Failed to fetch leaderboard');
        }

        // Fetch user's rank
        const userRankResponse = await fetch(
          `/api/v1/skills/${skillId}/user-rank`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        const userRankData = await userRankResponse.json();
        if (userRankData.success) {
          setUserRank(userRankData.data.rank);
        }
      } catch (error) {
        console.error('Error fetching leaderboard:', error);
        toast.error(
          error instanceof Error ? error.message : 'Failed to fetch leaderboard'
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchLeaderboard();
  }, [skillId, limit]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2 mb-2">
          <Trophy className="text-yellow-500" size={28} />
          {skillName} Leaderboard
        </h2>
        <p className="text-gray-600">Top experts with verified endorsements</p>
      </div>

      {/* User's Rank Card */}
      {userRank && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 p-4 bg-muted rounded-lg border-2 border-border"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Your Rank</p>
              <p className="text-3xl font-bold text-blue-600">#{userRank}</p>
            </div>
            <Zap className="text-blue-500" size={32} />
          </div>
        </motion.div>
      )}

      {/* Leaderboard Table */}
      <div className="overflow-x-auto border rounded-lg">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b">
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Rank</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Profile</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Title</th>
              <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">
                Endorsements
              </th>
              <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">
                Verified
              </th>
              <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">
                Quizzes
              </th>
            </tr>
          </thead>
          <tbody>
            {leaderboard.map((entry, index) => (
              <motion.tr
                key={entry.userId}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.02 }}
                className="border-b hover:bg-gray-50 transition-colors"
              >
                {/* Rank */}
                <td className="px-4 py-4">
                  <div className="flex items-center justify-center w-6 h-6">
                    {getRankIcon(entry.rank)}
                  </div>
                </td>

                {/* Profile */}
                <td className="px-4 py-4">
                  <Link href={`/in/${entry.userId}`}>
                    <div className="flex items-center gap-3 hover:opacity-75 transition-opacity cursor-pointer">
                      <img
                        src={entry.user.avatar || '/default-avatar.png'}
                        alt={entry.user.name}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                      <span className="text-sm font-medium text-gray-900 hover:text-primary">
                        {entry.user.name}
                      </span>
                    </div>
                  </Link>
                </td>

                {/* Title/Company */}
                <td className="px-4 py-4">
                  <div className="text-sm text-gray-600">
                    {entry.user.title && <p>{entry.user.title}</p>}
                    {entry.user.company && (
                      <p className="text-xs text-gray-500">{entry.user.company}</p>
                    )}
                  </div>
                </td>

                {/* Endorsement Count */}
                <td className="px-4 py-4 text-center">
                  <span className="inline-flex items-center justify-center px-2 py-1 rounded-full bg-blue-100 text-blue-700 text-sm font-semibold">
                    {entry.endorsementCount}
                  </span>
                </td>

                {/* Verified Badge */}
                <td className="px-4 py-4 text-center">
                  {entry.verified ? (
                    <Award className="text-yellow-500 mx-auto" size={20} />
                  ) : (
                    <span className="text-gray-300">-</span>
                  )}
                </td>

                {/* Quizzes Completed */}
                <td className="px-4 py-4 text-center">
                  <span className="text-sm font-medium text-gray-700">
                    {entry.quizzesCompleted}
                  </span>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>

      {leaderboard.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-600">No one has endorsed this skill yet. Be the first!</p>
        </div>
      )}
    </div>
  );
};

export default SkillLeaderboard;
