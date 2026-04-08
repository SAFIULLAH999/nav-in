'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell,
  ThumbsUp,
  Users,
  MessageSquare,
  Eye,
  Award,
  Trash2,
  Archive,
  X,
} from 'lucide-react';
import toast from 'react-hot-toast';
import Link from 'next/link';

interface Notification {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  data?: Record<string, any>;
  isRead: boolean;
  readAt?: string;
  createdAt: string;
}

interface NotificationHubProps {
  userId: string;
  onClose?: () => void;
}

type NotificationTab = 'all' | 'endorsements' | 'connections' | 'recommendations' | 'profile' | 'activity';

const notificationIcons: Record<string, React.ReactNode> = {
  ENDORSEMENT: <Award size={18} className="text-yellow-500" />,
  BADGE_EARNED: <Award size={18} className="text-green-500" />,
  CONNECTION_REQUEST: <Users size={18} className="text-blue-500" />,
  CONNECTION_ACCEPTED: <Users size={18} className="text-green-500" />,
  RECOMMENDATION_REQUEST: <MessageSquare size={18} className="text-purple-500" />,
  RECOMMENDATION_ACCEPTED: <MessageSquare size={18} className="text-green-500" />,
  PROFILE_VIEW: <Eye size={18} className="text-indigo-500" />,
  LIKE: <ThumbsUp size={18} className="text-red-500" />,
  COMMENT: <MessageSquare size={18} className="text-blue-500" />,
  SHARE: <Users size={18} className="text-orange-500" />,
};

const tabConfig = [
  { id: 'all', label: 'All', icon: Bell },
  { id: 'endorsements', label: 'Endorsements', icon: Award },
  { id: 'connections', label: 'Connections', icon: Users },
  { id: 'recommendations', label: 'Recommendations', icon: MessageSquare },
  { id: 'profile', label: 'Profile', icon: Eye },
  { id: 'activity', label: 'Activity', icon: ThumbsUp },
];

export const NotificationHub: React.FC<NotificationHubProps> = ({
  userId,
  onClose,
}) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [selectedTab, setSelectedTab] = useState<NotificationTab>('all');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, [userId]);

  const fetchNotifications = async () => {
    try {
      const token =
        localStorage.getItem('accessToken') ||
        sessionStorage.getItem('accessToken');

      const response = await fetch('/api/v1/notifications?limit=50', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (data.success) {
        setNotifications(data.data.notifications || []);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
      toast.error('Failed to load notifications');
    } finally {
      setIsLoading(false);
    }
  };

  const filterNotifications = (notifications: Notification[], tab: NotificationTab) => {
    if (tab === 'all') return notifications;

    const typeMap: Record<Exclude<NotificationTab, 'all'>, string[]> = {
      endorsements: ['ENDORSEMENT', 'BADGE_EARNED'],
      connections: ['CONNECTION_REQUEST', 'CONNECTION_ACCEPTED'],
      recommendations: ['RECOMMENDATION_REQUEST', 'RECOMMENDATION_ACCEPTED'],
      profile: ['PROFILE_VIEW'],
      activity: ['LIKE', 'COMMENT', 'SHARE'],
    };

    return notifications.filter((n) => typeMap[tab as Exclude<NotificationTab, 'all'>]?.includes(n.type));
  };

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      const token =
        localStorage.getItem('accessToken') ||
        sessionStorage.getItem('accessToken');

      await fetch(`/api/v1/notifications/${notificationId}/read`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setNotifications((prev) =>
        prev.map((n) =>
          n.id === notificationId ? { ...n, isRead: true } : n
        )
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleDelete = async (notificationId: string) => {
    try {
      const token =
        localStorage.getItem('accessToken') ||
        sessionStorage.getItem('accessToken');

      await fetch(`/api/v1/notifications/${notificationId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
      toast.success('Notification deleted');
    } catch (error) {
      console.error('Error deleting notification:', error);
      toast.error('Failed to delete notification');
    }
  };

  const filteredNotifications = filterNotifications(notifications, selectedTab);
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <motion.div
      initial={{ x: 400, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 400, opacity: 0 }}
      className="fixed right-0 top-0 h-screen w-full max-w-md bg-white shadow-2xl z-50 flex flex-col"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-gray-200">
        <div>
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Bell size={24} />
            Notifications
          </h2>
          {unreadCount > 0 && (
            <span className="text-sm text-gray-600">
              {unreadCount} unread
            </span>
          )}
        </div>
        <button
          onClick={onClose}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <X size={24} />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 p-4 border-b border-gray-200 overflow-x-auto">
        {tabConfig.map(({ id, label, icon: Icon }) => {
          const count = filterNotifications(notifications, id as NotificationTab).length;
          return (
            <button
              key={id}
              onClick={() => setSelectedTab(id as NotificationTab)}
              className={`flex items-center gap-1 px-3 py-2 rounded-lg whitespace-nowrap transition-colors ${
                selectedTab === id
                  ? 'bg-primary text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Icon size={16} />
              <span className="text-sm font-medium">{label}</span>
              {count > 0 && (
                <span className="ml-1 text-xs bg-white/20 px-2 py-0.5 rounded-full">
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Notifications List */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center h-96">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="flex items-center justify-center h-96 text-gray-600">
            <div className="text-center">
              <Bell size={32} className="mx-auto mb-2 text-gray-400" />
              <p>No notifications</p>
            </div>
          </div>
        ) : (
          <AnimatePresence>
            {filteredNotifications.map((notification, index) => (
              <motion.div
                key={notification.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: 100 }}
                transition={{ delay: index * 0.02 }}
                className={`border-b border-gray-100 p-4 hover:bg-gray-50 transition-colors ${
                  !notification.isRead ? 'bg-blue-50' : ''
                }`}
              >
                <div className="flex gap-3">
                  {/* Icon */}
                  <div className="flex-shrink-0 mt-1">
                    {notificationIcons[notification.type] || (
                      <Bell size={18} className="text-gray-400" />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 text-sm">
                      {notification.title}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      {notification.message}
                    </p>
                    <p className="text-xs text-gray-500 mt-2">
                      {new Date(notification.createdAt).toLocaleDateString()}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-1 flex-shrink-0">
                    {!notification.isRead && (
                      <button
                        onClick={() => handleMarkAsRead(notification.id)}
                        className="p-1 hover:bg-white rounded transition-colors"
                        title="Mark as read"
                      >
                        <Archive size={16} className="text-gray-400" />
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(notification.id)}
                      className="p-1 hover:bg-white rounded transition-colors"
                      title="Delete"
                    >
                      <Trash2 size={16} className="text-gray-400 hover:text-red-500" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>

      {/* Footer */}
      {notifications.length > 0 && (
        <div className="border-t border-gray-200 p-4 bg-gray-50">
          <Link
            href="/notifications"
            className="text-center block text-primary hover:text-primary/80 font-medium text-sm transition-colors"
            onClick={onClose}
          >
            View All Notifications →
          </Link>
        </div>
      )}
    </motion.div>
  );
};

export default NotificationHub;
