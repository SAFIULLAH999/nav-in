/**
 * Utilities for Open To Work frame styling and functionality
 */

export type OpenToType = 'WORK' | 'HIRING' | 'FREELANCE' | 'MENTORSHIP' | 'COLLABORATION';

export const OPEN_TO_TYPES = [
  {
    id: 'WORK',
    label: 'Open to Work',
    description: 'Looking for new job opportunities',
    icon: '💼',
    color: 'blue',
    borderColor: 'border-blue-500',
    bgColor: 'bg-blue-50',
    badgeColor: 'bg-blue-100 text-blue-700',
  },
  {
    id: 'HIRING',
    label: 'Actively Hiring',
    description: 'Currently hiring for positions',
    icon: '🏢',
    color: 'green',
    borderColor: 'border-green-500',
    bgColor: 'bg-green-50',
    badgeColor: 'bg-green-100 text-green-700',
  },
  {
    id: 'FREELANCE',
    label: 'Open to Freelance',
    description: 'Available for freelance work',
    icon: '🎯',
    color: 'purple',
    borderColor: 'border-purple-500',
    bgColor: 'bg-purple-50',
    badgeColor: 'bg-purple-100 text-purple-700',
  },
  {
    id: 'MENTORSHIP',
    label: 'Open to Mentoring',
    description: 'Available to mentor others',
    icon: '📚',
    color: 'indigo',
    borderColor: 'border-indigo-500',
    bgColor: 'bg-indigo-50',
    badgeColor: 'bg-indigo-100 text-indigo-700',
  },
  {
    id: 'COLLABORATION',
    label: 'Open to Collaborate',
    description: 'Looking for collaboration opportunities',
    icon: '🤝',
    color: 'pink',
    borderColor: 'border-pink-500',
    bgColor: 'bg-pink-50',
    badgeColor: 'bg-pink-100 text-pink-700',
  },
];

/**
 * Get Open To frame configuration by type
 */
export const getFrameConfig = (type: OpenToType) => {
  return OPEN_TO_TYPES.find((t) => t.id === type) || OPEN_TO_TYPES[0];
};

/**
 * Check if an Open To status is still active
 */
export const isOpenToActive = (expiresAt?: string | null): boolean => {
  if (!expiresAt) return true;
  return new Date(expiresAt) > new Date();
};

/**
 * Get time remaining until expiration
 */
export const getTimeRemaining = (expiresAt?: string | null): string | null => {
  if (!expiresAt) return null;

  const now = new Date();
  const expires = new Date(expiresAt);
  const diff = expires.getTime() - now.getTime();

  if (diff <= 0) return 'Expired';

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

  if (days > 0) return `${days}d remaining`;
  if (hours > 0) return `${hours}h remaining`;

  return 'Expires soon';
};

/**
 * Format Open To message with character limit
 */
export const formatOpenToMessage = (message: string, limit: number = 50): string => {
  if (message.length <= limit) return message;
  return message.substring(0, limit - 3) + '...';
};

/**
 * Get suggested Open To message based on role
 */
export const getSuggestedMessage = (
  type: OpenToType,
  role?: string,
  location?: string
): string => {
  const suggestions: Record<OpenToType, (role?: string, location?: string) => string> = {
    WORK: (role, location) =>
      `Looking for ${role || 'new'} roles${location ? ` in ${location}` : ''}`,
    HIRING: (role, location) =>
      `Hiring for ${role || 'open'} positions${location ? ` in ${location}` : ''}`,
    FREELANCE: (role, location) =>
      `Available for ${role || 'freelance'} work${location ? ` in ${location}` : ''}`,
    MENTORSHIP: (role, location) =>
      `Mentoring on ${role || 'various topics'}`,
    COLLABORATION: (role, location) =>
      `Open to collaborate${location ? ` in ${location}` : ''}`,
  };

  return suggestions[type](role, location);
};

/**
 * Export Open To duration options in days
 */
export const DURATION_OPTIONS = [
  { label: '30 days', value: 30 },
  { label: '60 days', value: 60 },
  { label: '90 days', value: 90 },
  { label: 'No expiration', value: null },
];

/**
 * Calculate expiration date from days
 */
export const calculateExpirationDate = (days: number | null): Date | null => {
  if (days === null) return null;
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date;
};
