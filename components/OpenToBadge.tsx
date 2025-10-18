'use client';

import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';

interface OpenToStatus {
  id: string;
  type: string;
  visibility: string;
  message?: string;
  expiresAt?: string;
  createdAt: string;
}

interface OpenToBadgeProps {
  userId: string;
  showMessage?: boolean;
  className?: string;
}

const STATUS_CONFIG = {
  WORK: { label: 'Open to Work', color: 'bg-green-100 text-green-800 hover:bg-green-200' },
  HIRING: { label: 'Hiring', color: 'bg-blue-100 text-blue-800 hover:bg-blue-200' },
  FREELANCE: { label: 'Open to Freelance', color: 'bg-purple-100 text-purple-800 hover:bg-purple-200' },
  MENTORSHIP: { label: 'Offering Mentorship', color: 'bg-orange-100 text-orange-800 hover:bg-orange-200' },
  COLLABORATION: { label: 'Open to Collaboration', color: 'bg-pink-100 text-pink-800 hover:bg-pink-200' },
  SPEAKING: { label: 'Available for Speaking', color: 'bg-indigo-100 text-indigo-800 hover:bg-indigo-200' },
  VOLUNTEERING: { label: 'Open to Volunteering', color: 'bg-teal-100 text-teal-800 hover:bg-teal-200' },
};

export function OpenToBadge({ userId, showMessage = false, className = '' }: OpenToBadgeProps) {
  const [statuses, setStatuses] = useState<OpenToStatus[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchStatuses();
  }, [userId]);

  const fetchStatuses = async () => {
    try {
      const response = await fetch(`/api/open-to/${userId}`);
      if (response.ok) {
        const data = await response.json();
        setStatuses(data);
      }
    } catch (error) {
      console.error('Error fetching open to statuses:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading || statuses.length === 0) {
    return null;
  }

  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {statuses.map((status) => {
        const config = STATUS_CONFIG[status.type as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.WORK;

        return (
          <div key={status.id} className="flex items-center space-x-2">
            <Badge className={`${config.color} transition-colors`}>
              {config.label}
            </Badge>
            {showMessage && status.message && (
              <span className="text-sm text-gray-600 italic">
                "{status.message}"
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}