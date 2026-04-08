'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Zap, Trophy, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';

interface StrengthScore {
  totalScore: number;
  maxScore: number;
  percentage: number;
  breakdown: Record<
    string,
    { current: number; max: number; label: string }
  >;
  nextSteps: string[];
  milestones: {
    level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
    threshold: number;
    description: string;
  };
}

interface ProfileStrengthWidgetProps {
  userId: string;
  isOwnProfile?: boolean;
}

const levelColors = {
  beginner: {
    bg: 'bg-red-50',
    border: 'border-red-200',
    text: 'text-red-700',
    icon: 'text-red-500',
    badge: 'bg-red-100 text-red-700',
  },
  intermediate: {
    bg: 'bg-yellow-50',
    border: 'border-yellow-200',
    text: 'text-yellow-700',
    icon: 'text-yellow-500',
    badge: 'bg-yellow-100 text-yellow-700',
  },
  advanced: {
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    text: 'text-blue-700',
    icon: 'text-blue-500',
    badge: 'bg-blue-100 text-blue-700',
  },
  expert: {
    bg: 'bg-green-50',
    border: 'border-green-200',
    text: 'text-green-700',
    icon: 'text-green-500',
    badge: 'bg-green-100 text-green-700',
  },
};

export const ProfileStrengthWidget: React.FC<ProfileStrengthWidgetProps> = ({
  userId,
  isOwnProfile = false,
}) => {
  const [strength, setStrength] = useState<StrengthScore | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    const fetchStrengthScore = async () => {
      try {
        const token =
          localStorage.getItem('accessToken') ||
          sessionStorage.getItem('accessToken');

        const response = await fetch(
          `/api/v1/users/strength-score/${userId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = await response.json();
        if (data.success) {
          setStrength(data.data.strength);
          setSuggestions(data.data.suggestions);
        } else {
          throw new Error(data.error?.message || 'Failed to fetch strength');
        }
      } catch (error) {
        console.error('Error fetching strength score:', error);
        toast.error('Failed to load profile strength');
      } finally {
        setIsLoading(false);
      }
    };

    if (userId) {
      fetchStrengthScore();
    }
  }, [userId]);

  if (isLoading || !strength) {
    return (
      <div className="animate-pulse bg-gray-200 h-32 rounded-lg"></div>
    );
  }

  const levelColor = levelColors[strength.milestones.level];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`${levelColor.bg} border ${levelColor.border} rounded-lg p-6`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Trophy className={`${levelColor.icon}`} size={28} />
          <div>
            <h3 className="font-semibold text-gray-900">Profile Strength</h3>
            <p className={`text-sm ${levelColor.text} font-medium`}>
              {strength.milestones.description}
            </p>
          </div>
        </div>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-gray-600 hover:text-gray-900"
        >
          <ChevronRight
            size={24}
            className={`transition-transform ${isExpanded ? 'rotate-90' : ''}`}
          />
        </button>
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700">
            {strength.totalScore}/{strength.maxScore}
          </span>
          <span
            className={`text-sm font-bold ${levelColor.text}`}
          >
            {strength.percentage}%
          </span>
        </div>
        <div className="w-full bg-gray-300 rounded-full h-3 overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${strength.percentage}%` }}
            transition={{ duration: 1, ease: 'easeOut' }}
            className={`h-full rounded-full ${levelColor.badge.split(' ')[0]}`}
          />
        </div>
      </div>

      {/* Next Steps (Collapsed) */}
      {!isExpanded && strength.nextSteps.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-700 mb-2">Next Steps:</p>
          {strength.nextSteps.slice(0, 2).map((step, index) => (
            <div key={index} className="flex items-start gap-2 text-sm text-gray-700">
              <Zap size={16} className="mt-0.5 flex-shrink-0" />
              <span>{step}</span>
            </div>
          ))}
        </div>
      )}

      {/* Expanded View */}
      {isExpanded && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="space-y-4 mt-4 pt-4 border-t border-current border-opacity-20"
        >
          {/* Breakdown */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-3">Profile Components</h4>
            <div className="space-y-2">
              {Object.entries(strength.breakdown).map(([key, value]) => (
                <div key={key} className="flex items-center gap-2">
                  <div className="flex-1">
                    <div className="flex justify-between mb-1">
                      <span className="text-sm text-gray-700">{value.label}</span>
                      <span className="text-xs text-gray-600">
                        {value.current}/{value.max}
                      </span>
                    </div>
                    <div className="w-full bg-gray-300 bg-opacity-50 rounded-full h-2 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{
                          width: `${(value.current / value.max) * 100}%`,
                        }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                        className="h-full bg-current bg-opacity-60 rounded-full"
                      />
                    </div>
                  </div>
                  {value.current === value.max && (
                    <CheckCircle2 size={16} className="text-green-500 flex-shrink-0" />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* All Next Steps */}
          {strength.nextSteps.length > 0 && (
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">Recommended Actions</h4>
              <ul className="space-y-2">
                {strength.nextSteps.map((step, index) => (
                  <li
                    key={index}
                    className="flex items-start gap-2 text-sm text-gray-700"
                  >
                    <span className="text-primary font-bold flex-shrink-0">
                      {index + 1}.
                    </span>
                    <span>{step}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Suggestions */}
          {suggestions.length > 0 && (
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">Tips to Improve</h4>
              <ul className="space-y-2">
                {suggestions.map((suggestion, index) => (
                  <li key={index} className="text-sm text-gray-700 flex gap-2">
                    <span className="text-primary">•</span>
                    <span>{suggestion}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Complete Profile Button */}
          {strength.percentage < 100 && isOwnProfile && (
            <Link
              href="/profile/edit"
              className="inline-block mt-4 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium"
            >
              Edit Profile →
            </Link>
          )}
        </motion.div>
      )}
    </motion.div>
  );
};

export default ProfileStrengthWidget;
