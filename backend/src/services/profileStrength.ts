import { prisma } from '../utils/prisma';
import { logger } from '../utils/logger';

export interface ProfileStrengthScore {
  totalScore: number;
  maxScore: number;
  percentage: number;
  breakdown: {
    avatar: { current: number; max: number; label: string };
    headline: { current: number; max: number; label: string };
    bio: { current: number; max: number; label: string };
    skills: { current: number; max: number; label: string };
    experience: { current: number; max: number; label: string };
    education: { current: number; max: number; label: string };
    certifications: { current: number; max: number; label: string };
    recommendations: { current: number; max: number; label: string };
  };
  nextSteps: string[];
  milestones: {
    level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
    threshold: number;
    description: string;
  };
}

/**
 * Calculate profile strength score for a user
 */
export const calculateProfileStrength = async (
  userId: string
): Promise<ProfileStrengthScore> => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        userSkills: true,
        experiences: true,
        education: true,
        verificationBadges: true,
        givenRecommendations: true,
        receivedRecommendations: true,
        profileMedia: true,
      },
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Score components (max 100 points total)
    const scores = {
      avatar: { current: user.avatar ? 10 : 0, max: 10, label: 'Profile Picture' },
      headline: {
        current: user.title && user.title.length > 0 ? 15 : 0,
        max: 15,
        label: 'Headline (Title)',
      },
      bio: {
        current: user.bio && user.bio.length > 20 ? 10 : 0,
        max: 10,
        label: 'Professional Summary',
      },
      skills: {
        current: Math.min(user.userSkills.length * 2, 20),
        max: 20,
        label: 'Skills',
      },
      experience: {
        current: Math.min(user.experiences.length * 10, 20),
        max: 20,
        label: 'Work Experience',
      },
      education: {
        current: Math.min(user.education.length * 10, 10),
        max: 10,
        label: 'Education',
      },
      certifications: {
        current: Math.min(user.verificationBadges.length * 5, 10),
        max: 10,
        label: 'Certifications & Badges',
      },
      recommendations: {
        current: Math.min(user.receivedRecommendations.length * 5, 5),
        max: 5,
        label: 'Recommendations',
      },
    };

    // Calculate totals
    const totalScore = Object.values(scores).reduce(
      (sum, score) => sum + score.current,
      0
    );
    const maxScore = 100;
    const percentage = Math.round((totalScore / maxScore) * 100);

    // Generate next steps
    const nextSteps: string[] = [];
    if (scores.avatar.current === 0) nextSteps.push('Add a professional profile picture');
    if (scores.headline.current === 0) nextSteps.push('Write a headline for your profile');
    if (scores.bio.current === 0) nextSteps.push('Write a professional summary');
    if (scores.skills.current < 10) nextSteps.push('Add more skills to your profile');
    if (scores.experience.current === 0) nextSteps.push('Add your work experience');
    if (scores.education.current === 0) nextSteps.push('Add your education background');
    if (scores.certifications.current === 0)
      nextSteps.push('Take skill assessment quizzes to earn badges');
    if (scores.recommendations.current === 0)
      nextSteps.push('Request recommendations from colleagues');

    // Determine level based on percentage
    let level: 'beginner' | 'intermediate' | 'advanced' | 'expert' = 'beginner';
    if (percentage >= 75) level = 'expert';
    else if (percentage >= 50) level = 'advanced';
    else if (percentage >= 25) level = 'intermediate';

    const milestones = {
      level,
      threshold: percentage,
      description:
        level === 'expert'
          ? 'Expert Profile - You have an exceptional profile!'
          : level === 'advanced'
            ? 'Advanced Profile - Great job! Keep going!'
            : level === 'intermediate'
              ? 'Intermediate Profile - Good start, add more details'
              : 'Beginner Profile - Get started with your profile',
    };

    return {
      totalScore,
      maxScore,
      percentage,
      breakdown: scores,
      nextSteps: nextSteps.slice(0, 3), // Show top 3 next steps
      milestones,
    };
  } catch (error) {
    logger.error('Error calculating profile strength:', error);
    throw error;
  }
};

/**
 * Get profile strength with caching
 */
export const getProfileStrengthCached = async (
  userId: string
): Promise<ProfileStrengthScore> => {
  // In production, would cache in Redis with 1-hour TTL
  // For now, calculate on demand
  return calculateProfileStrength(userId);
};

/**
 * Get profile completion suggestions
 */
export const getProfileSuggestions = (strength: ProfileStrengthScore): string[] => {
  const suggestions: string[] = [];

  // Check each category and provide suggestions
  if (strength.breakdown.avatar.current === 0) {
    suggestions.push(
      'Upload a professional headshot to make your profile more attractive'
    );
  }

  if (strength.breakdown.headline.current === 0) {
    suggestions.push(
      'Write a compelling headline that describes your role and value proposition'
    );
  }

  if (strength.breakdown.skills.current < strength.breakdown.skills.max) {
    const skillsNeeded = Math.ceil(
      (strength.breakdown.skills.max - strength.breakdown.skills.current) / 2
    );
    suggestions.push(`Add ${skillsNeeded} more skills to reach maximum skill points`);
  }

  if (strength.breakdown.experience.current === 0) {
    suggestions.push(
      'Add your work experience to showcase your professional background'
    );
  }

  if (strength.breakdown.certifications.current === 0) {
    suggestions.push('Start with skill assessments to earn verified skill badges');
  }

  return suggestions;
};

/**
 * Get similar users in profile strength
 */
export const getSimilarStrengthUsers = async (
  userId: string,
  limit: number = 5
): Promise<
  Array<{ id: string; name: string; percentage: number; avatar: string | null }>
> => {
  try {
    // Get current user's strength
    const userStrength = await calculateProfileStrength(userId);

    // Get all users (simplified - in production would use indexed query)
    const users = await prisma.user.findMany({
      where: {
        id: { not: userId },
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        avatar: true,
      },
      take: 100, // Sample of users
    });

    // Calculate strength for each and find similar
    const usersWithStrength = await Promise.all(
      users.map(async (user) => {
        const strength = await calculateProfileStrength(user.id);
        return {
          ...user,
          percentage: strength.percentage,
          diff: Math.abs(strength.percentage - userStrength.percentage),
        };
      })
    );

    // Sort by closest percentage and return top similar users
    return usersWithStrength
      .sort((a, b) => a.diff - b.diff)
      .slice(0, limit)
      .map(({ id, name, avatar, percentage }) => ({
        id,
        name,
        percentage,
        avatar,
      }));
  } catch (error) {
    logger.error('Error getting similar strength users:', error);
    return [];
  }
};
