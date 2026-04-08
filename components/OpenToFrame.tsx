import React from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';

interface OpenToFrameProps {
  type?: 'WORK' | 'HIRING' | 'FREELANCE' | 'MENTORSHIP' | 'COLLABORATION';
  message?: string;
  visibility?: 'PUBLIC' | 'CONNECTIONS_ONLY' | 'PRIVATE';
  onOpenSettings?: () => void;
  isOwnProfile?: boolean;
  expiresAt?: string;
}

const frameColors = {
  WORK: {
    border: 'border-blue-500',
    bg: 'bg-blue-50',
    badge: 'bg-blue-100 text-blue-700',
    icon: '💼',
    label: 'Open to Work',
  },
  HIRING: {
    border: 'border-green-500',
    bg: 'bg-green-50',
    badge: 'bg-green-100 text-green-700',
    icon: '🏢',
    label: 'Actively Hiring',
  },
  FREELANCE: {
    border: 'border-purple-500',
    bg: 'bg-purple-50',
    badge: 'bg-purple-100 text-purple-700',
    icon: '🎯',
    label: 'Open to Freelance',
  },
  MENTORSHIP: {
    border: 'border-indigo-500',
    bg: 'bg-indigo-50',
    badge: 'bg-indigo-100 text-indigo-700',
    icon: '📚',
    label: 'Mentoring',
  },
  COLLABORATION: {
    border: 'border-pink-500',
    bg: 'bg-pink-50',
    badge: 'bg-pink-100 text-pink-700',
    icon: '🤝',
    label: 'Open to Collaborate',
  },
};

export const OpenToFrame: React.FC<OpenToFrameProps> = ({
  type,
  message,
  visibility = 'PUBLIC',
  onOpenSettings,
  isOwnProfile = false,
  expiresAt,
}) => {
  if (!type) return null;

  const config = frameColors[type];
  const isExpired = expiresAt && new Date(expiresAt) < new Date();

  if (isExpired) return null;

  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.8, opacity: 0 }}
      className="absolute bottom-0 right-0 transform -translate-x-2 translate-y-2"
    >
      <div
        className={`
          ${config.bg} ${config.border} border-2 rounded-full
          px-4 py-2 shadow-lg flex items-center gap-2
          group hover:shadow-xl transition-shadow cursor-pointer
          relative max-w-xs
        `}
        onClick={onOpenSettings}
      >
        {/* Badge */}
        <span className="text-lg">{config.icon}</span>

        {/* Label and message */}
        <div className="min-w-0 flex-1">
          <div className={`${config.badge} px-2 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap`}>
            {config.label}
          </div>
          {message && (
            <div className="text-xs text-gray-600 truncate mt-0.5">
              {message}
            </div>
          )}
        </div>

        {/* Close button (show on own profile) */}
        {isOwnProfile && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              // Handled by parent component
            }}
            className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 hover:bg-white/50 rounded-full"
            title="Edit status"
          >
            <X size={12} className="text-gray-500" />
          </button>
        )}
      </div>

      {/* Tooltip on hover */}
      <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none bg-gray-900 text-white text-xs rounded px-2 py-1 whitespace-nowrap z-50">
        {visibility === 'PRIVATE' && 'Visible to you only'}
        {visibility === 'CONNECTIONS_ONLY' && 'Visible to connections'}
        {visibility === 'PUBLIC' && 'Visible to everyone'}
      </div>
    </motion.div>
  );
};

// Standalone circular badge component for profile pictures
export const ProfileFrameBadge: React.FC<{
  type?: 'WORK' | 'HIRING' | 'FREELANCE' | 'MENTORSHIP' | 'COLLABORATION';
  size?: 'sm' | 'md' | 'lg';
}> = ({ type, size = 'md' }) => {
  if (!type) return null;

  const config = frameColors[type];
  const sizeClasses = {
    sm: 'w-6 h-6 text-xs',
    md: 'w-8 h-8 text-sm',
    lg: 'w-10 h-10 text-base',
  };

  return (
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      className={`
        absolute bottom-0 right-0 ${sizeClasses[size]}
        ${config.border} border-2 ${config.bg}
        rounded-full flex items-center justify-center
        shadow-lg font-bold
      `}
      title={config.label}
    >
      {config.icon}
    </motion.div>
  );
};

export default OpenToFrame;
