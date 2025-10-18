'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'react-hot-toast';

interface OpenToStatus {
  id: string;
  type: string;
  visibility: string;
  message?: string;
  expiresAt?: string;
  createdAt: string;
}

const OPEN_TO_TYPES = [
  { value: 'WORK', label: 'Open to Work', color: 'bg-green-100 text-green-800' },
  { value: 'HIRING', label: 'Hiring', color: 'bg-blue-100 text-blue-800' },
  { value: 'FREELANCE', label: 'Open to Freelance', color: 'bg-purple-100 text-purple-800' },
  { value: 'MENTORSHIP', label: 'Offering Mentorship', color: 'bg-orange-100 text-orange-800' },
  { value: 'COLLABORATION', label: 'Open to Collaboration', color: 'bg-pink-100 text-pink-800' },
  { value: 'SPEAKING', label: 'Available for Speaking', color: 'bg-indigo-100 text-indigo-800' },
  { value: 'VOLUNTEERING', label: 'Open to Volunteering', color: 'bg-teal-100 text-teal-800' },
];

const VISIBILITY_OPTIONS = [
  { value: 'PUBLIC', label: 'Public' },
  { value: 'CONNECTIONS_ONLY', label: 'Connections Only' },
  { value: 'PRIVATE', label: 'Private' },
];

export function OpenToStatus() {
  const { data: session } = useSession();
  const [statuses, setStatuses] = useState<OpenToStatus[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [selectedType, setSelectedType] = useState('');
  const [selectedVisibility, setSelectedVisibility] = useState('PUBLIC');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (session?.user?.id) {
      fetchStatuses();
    }
  }, [session]);

  const fetchStatuses = async () => {
    try {
      const response = await fetch('/api/open-to');
      if (response.ok) {
        const data = await response.json();
        setStatuses(data);
      }
    } catch (error) {
      console.error('Error fetching open to statuses:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedType) return;

    setIsLoading(true);
    try {
      const response = await fetch('/api/open-to', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: selectedType,
          visibility: selectedVisibility,
          message: message || undefined,
        }),
      });

      if (response.ok) {
        toast.success('Status updated successfully!');
        setShowForm(false);
        setSelectedType('');
        setMessage('');
        fetchStatuses();
      } else {
        toast.error('Failed to update status');
      }
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update status');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveStatus = async (type: string) => {
    try {
      const response = await fetch(`/api/open-to?type=${type}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Status removed');
        fetchStatuses();
      } else {
        toast.error('Failed to remove status');
      }
    } catch (error) {
      console.error('Error removing status:', error);
      toast.error('Failed to remove status');
    }
  };

  const getStatusInfo = (type: string) => {
    return OPEN_TO_TYPES.find(status => status.value === type) || OPEN_TO_TYPES[0];
  };

  if (!session?.user?.id) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Open To
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowForm(!showForm)}
          >
            {showForm ? 'Cancel' : 'Add Status'}
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Statuses */}
        {statuses.length > 0 && (
          <div className="space-y-2">
            {statuses.map((status) => {
              const statusInfo = getStatusInfo(status.type);
              return (
                <div
                  key={status.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <Badge className={statusInfo.color}>
                      {statusInfo.label}
                    </Badge>
                    {status.message && (
                      <span className="text-sm text-gray-600">
                        {status.message}
                      </span>
                    )}
                    <Badge variant="outline">
                      {VISIBILITY_OPTIONS.find(v => v.value === status.visibility)?.label}
                    </Badge>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveStatus(status.type)}
                  >
                    Remove
                  </Button>
                </div>
              );
            })}
          </div>
        )}

        {/* Add New Status Form */}
        {showForm && (
          <form onSubmit={handleSubmit} className="space-y-4 p-4 border rounded-lg">
            <div>
              <Label htmlFor="type">Status Type</Label>
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status type" />
                </SelectTrigger>
                <SelectContent>
                  {OPEN_TO_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="visibility">Visibility</Label>
              <Select value={selectedVisibility} onValueChange={setSelectedVisibility}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {VISIBILITY_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="message">Message (Optional)</Label>
              <Input
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Add a custom message..."
                maxLength={200}
              />
            </div>

            <Button type="submit" disabled={isLoading || !selectedType}>
              {isLoading ? 'Updating...' : 'Add Status'}
            </Button>
          </form>
        )}

        {statuses.length === 0 && !showForm && (
          <p className="text-gray-500 text-center py-4">
            No status set. Add one to let others know what opportunities you're open to.
          </p>
        )}
      </CardContent>
    </Card>
  );
}