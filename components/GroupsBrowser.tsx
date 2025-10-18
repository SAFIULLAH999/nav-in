'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Users, Plus, Search, Lock, Globe, UserCheck, UserPlus } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface Group {
  id: string;
  name: string;
  description?: string;
  slug: string;
  coverImage?: string;
  isPrivate: boolean;
  memberCount: number;
  createdAt: string;
  creator: {
    id: string;
    name?: string;
    username?: string;
    avatar?: string;
  };
  memberships: Array<{
    id: string;
    role: string;
  }>;
  count?: {
    id: string;
    posts: number;
    members: number;
    activeMembers: number;
  };
}

interface GroupMembership {
  id: string;
  role: string;
  status: string;
  joinedAt: string;
}

export function GroupsBrowser() {
  const { data: session } = useSession();
  const [groups, setGroups] = useState<Group[]>([]);
  const [userMemberships, setUserMemberships] = useState<Record<string, GroupMembership>>({});
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newGroup, setNewGroup] = useState({
    name: '',
    description: '',
    isPrivate: false,
  });

  useEffect(() => {
    if (session?.user?.id) {
      fetchGroups();
      fetchUserMemberships();
    }
  }, [session]);

  const fetchGroups = async () => {
    try {
      const params = new URLSearchParams();
      if (searchQuery) {
        params.append('query', searchQuery);
      }

      const response = await fetch(`/api/groups?${params}`);
      if (response.ok) {
        const data = await response.json();
        setGroups(data);
      }
    } catch (error) {
      console.error('Error fetching groups:', error);
      toast.error('Failed to load groups');
    } finally {
      setLoading(false);
    }
  };

  const fetchUserMemberships = async () => {
    try {
      const response = await fetch('/api/user/group-memberships');
      if (response.ok) {
        const data = await response.json();
        const membershipsMap: Record<string, GroupMembership> = {};
        data.forEach((membership: GroupMembership & { groupId: string }) => {
          membershipsMap[membership.groupId] = membership;
        });
        setUserMemberships(membershipsMap);
      }
    } catch (error) {
      console.error('Error fetching user memberships:', error);
    }
  };

  const handleJoinGroup = async (groupId: string) => {
    try {
      const response = await fetch(`/api/groups/${groupId}/join`, {
        method: 'POST',
      });

      if (response.ok) {
        const result = await response.json();
        toast.success(result.message);
        fetchGroups();
        fetchUserMemberships();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to join group');
      }
    } catch (error) {
      console.error('Error joining group:', error);
      toast.error('Failed to join group');
    }
  };

  const handleLeaveGroup = async (groupId: string) => {
    try {
      const response = await fetch(`/api/groups/${groupId}/join`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Left group successfully');
        fetchGroups();
        fetchUserMemberships();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to leave group');
      }
    } catch (error) {
      console.error('Error leaving group:', error);
      toast.error('Failed to leave group');
    }
  };

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroup.name.trim()) return;

    setCreating(true);
    try {
      const response = await fetch('/api/groups', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newGroup),
      });

      if (response.ok) {
        toast.success('Group created successfully!');
        setShowCreateForm(false);
        setNewGroup({ name: '', description: '', isPrivate: false });
        fetchGroups();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to create group');
      }
    } catch (error) {
      console.error('Error creating group:', error);
      toast.error('Failed to create group');
    } finally {
      setCreating(false);
    }
  };

  const handleSearch = () => {
    fetchGroups();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-text">Groups</h2>
          <p className="text-text-muted">Join communities and connect with like-minded professionals</p>
        </div>
        <Button onClick={() => setShowCreateForm(!showCreateForm)}>
          <Plus className="w-4 h-4 mr-2" />
          Create Group
        </Button>
      </div>

      {/* Search */}
      <div className="flex gap-2">
        <div className="flex-1 flex gap-2">
          <Input
            placeholder="Search groups..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          />
          <Button onClick={handleSearch} variant="outline">
            <Search className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Create Group Form */}
      {showCreateForm && (
        <Card>
          <CardHeader>
            <CardTitle>Create New Group</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateGroup} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text mb-2">
                  Group Name *
                </label>
                <Input
                  value={newGroup.name}
                  onChange={(e) => setNewGroup(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter group name"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text mb-2">
                  Description
                </label>
                <textarea
                  value={newGroup.description}
                  onChange={(e) => setNewGroup(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe your group..."
                  className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none resize-none"
                  rows={3}
                />
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isPrivate"
                  checked={newGroup.isPrivate}
                  onChange={(e) => setNewGroup(prev => ({ ...prev, isPrivate: e.target.checked }))}
                  className="rounded border-border"
                />
                <label htmlFor="isPrivate" className="text-sm text-text">
                  Private group (approval required to join)
                </label>
              </div>

              <div className="flex gap-2">
                <Button type="submit" disabled={creating}>
                  {creating ? 'Creating...' : 'Create Group'}
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowCreateForm(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Groups Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {groups.map((group) => {
          const membership = userMemberships[group.id];
          const isMember = !!membership && membership.status === 'ACTIVE';
          const isPending = !!membership && membership.status === 'PENDING';

          return (
            <Card key={group.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg mb-2 flex items-center gap-2">
                      {group.name}
                      {group.isPrivate ? (
                        <Lock className="w-4 h-4 text-gray-500" />
                      ) : (
                        <Globe className="w-4 h-4 text-gray-500" />
                      )}
                    </CardTitle>
                    <div className="flex items-center gap-2 text-sm text-text-muted">
                      <Users className="w-4 h-4" />
                      <span>{group.memberCount} members</span>
                    </div>
                  </div>
                </div>
              </CardHeader>

              <CardContent>
                {group.description && (
                  <p className="text-text-muted text-sm mb-4 line-clamp-2">
                    {group.description}
                  </p>
                )}

                <div className="flex items-center justify-between text-sm text-text-muted mb-4">
                  <span>Created by {group.creator.name || group.creator.username}</span>
                  {group.count && (
                    <span>{group.count.posts} posts</span>
                  )}
                </div>

                {isMember ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <UserCheck className="w-4 h-4 text-green-600" />
                      <span className="text-green-600">Member</span>
                      {membership.role === 'ADMIN' && (
                        <Badge variant="outline">Admin</Badge>
                      )}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleLeaveGroup(group.id)}
                      className="w-full"
                    >
                      Leave Group
                    </Button>
                  </div>
                ) : isPending ? (
                  <div className="flex items-center gap-2 text-sm text-yellow-600">
                    <UserPlus className="w-4 h-4" />
                    <span>Request Pending</span>
                  </div>
                ) : (
                  <Button
                    onClick={() => handleJoinGroup(group.id)}
                    className="w-full"
                  >
                    <UserPlus className="w-4 h-4 mr-2" />
                    Join Group
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {groups.length === 0 && (
        <div className="text-center py-12">
          <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-text mb-2">
            {searchQuery ? 'No groups found' : 'No groups yet'}
          </h3>
          <p className="text-text-muted">
            {searchQuery ? 'Try a different search term' : 'Be the first to create a group!'}
          </p>
        </div>
      )}
    </div>
  );
}