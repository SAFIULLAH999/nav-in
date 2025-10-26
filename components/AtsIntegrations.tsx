'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Settings, RefreshCw, CheckCircle, AlertCircle, Plus, ExternalLink } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface AtsIntegration {
  id: string;
  name: string;
  provider: string;
  status: string;
  lastSyncAt?: string;
  syncFrequency: number;
  isActive: boolean;
  createdAt: string;
  creator: {
    id: string;
    name?: string;
    username?: string;
  };
  _count: {
    syncLogs: number;
    jobMappings: number;
    candidateMappings: number;
  };
}

interface Company {
  id: string;
  name: string;
  atsIntegrations: AtsIntegration[];
}

const ATS_PROVIDERS = [
  { value: 'GREENHOUSE', label: 'Greenhouse', color: 'bg-green-100 text-green-800' },
  { value: 'LEVER', label: 'Lever', color: 'bg-blue-100 text-blue-800' },
  { value: 'WORKDAY', label: 'Workday', color: 'bg-purple-100 text-purple-800' },
  { value: 'BAMBOOHR', label: 'BambooHR', color: 'bg-orange-100 text-orange-800' },
  { value: 'ICIMS', label: 'iCIMS', color: 'bg-red-100 text-red-800' },
  { value: 'ADP', label: 'ADP', color: 'bg-indigo-100 text-indigo-800' },
  { value: 'PAYCOR', label: 'Paycor', color: 'bg-pink-100 text-pink-800' },
  { value: 'CUSTOM', label: 'Custom API', color: 'bg-gray-100 text-gray-800' },
];

const STATUS_CONFIG = {
  INACTIVE: { label: 'Inactive', color: 'bg-gray-100 text-gray-800' },
  ACTIVE: { label: 'Active', color: 'bg-green-100 text-green-800' },
  ERROR: { label: 'Error', color: 'bg-red-100 text-red-800' },
  SYNCING: { label: 'Syncing', color: 'bg-blue-100 text-blue-800' },
};

export function AtsIntegrations() {
  const { data: session, status } = useSession();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState('');
  const [creating, setCreating] = useState(false);
  const [newIntegration, setNewIntegration] = useState({
    name: '',
    provider: '',
    apiEndpoint: '',
    apiKey: '',
    accessToken: '',
    refreshToken: '',
    webhookSecret: '',
    syncFrequency: 3600,
  });

  useEffect(() => {
    if (status === 'authenticated' && session?.user?.id) {
      fetchIntegrations();
    } else if (status === 'unauthenticated') {
      setLoading(false);
    }
  }, [session, status]);

  const fetchIntegrations = async () => {
    try {
      const response = await fetch('/api/ats-integrations');
      if (response.ok) {
        const data = await response.json();
        setCompanies(data);
      }
    } catch (error) {
      console.error('Error fetching ATS integrations:', error);
      toast.error('Failed to load ATS integrations');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateIntegration = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newIntegration.name || !newIntegration.provider || !selectedCompany) return;

    setCreating(true);
    try {
      const response = await fetch('/api/ats-integrations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          companyId: selectedCompany,
          ...newIntegration,
        }),
      });

      if (response.ok) {
        toast.success('ATS integration created successfully!');
        setShowCreateForm(false);
        setNewIntegration({
          name: '',
          provider: '',
          apiEndpoint: '',
          apiKey: '',
          accessToken: '',
          refreshToken: '',
          webhookSecret: '',
          syncFrequency: 3600,
        });
        fetchIntegrations();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to create integration');
      }
    } catch (error) {
      console.error('Error creating integration:', error);
      toast.error('Failed to create integration');
    } finally {
      setCreating(false);
    }
  };

  const handleSync = async (integrationId: string) => {
    try {
      const response = await fetch(`/api/ats-integrations/${integrationId}/sync`, {
        method: 'POST',
      });

      if (response.ok) {
        toast.success('Sync started successfully!');
        fetchIntegrations();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to start sync');
      }
    } catch (error) {
      console.error('Error starting sync:', error);
      toast.error('Failed to start sync');
    }
  };

  const getProviderInfo = (provider: string) => {
    return ATS_PROVIDERS.find(p => p.value === provider) || ATS_PROVIDERS[0];
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
          <h2 className="text-2xl font-bold text-text">ATS Integrations</h2>
          <p className="text-text-muted">Connect your ATS to sync jobs and candidates</p>
        </div>
        <Button onClick={() => setShowCreateForm(!showCreateForm)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Integration
        </Button>
      </div>

      {/* Create Integration Form */}
      {showCreateForm && (
        <Card>
          <CardHeader>
            <CardTitle>Add ATS Integration</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateIntegration} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="company">Company</Label>
                  <Select value={selectedCompany} onValueChange={setSelectedCompany}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select company" />
                    </SelectTrigger>
                    <SelectContent>
                      {companies.map((company) => (
                        <SelectItem key={company.id} value={company.id}>
                          {company.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="name">Integration Name</Label>
                  <Input
                    id="name"
                    value={newIntegration.name}
                    onChange={(e) => setNewIntegration(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., Greenhouse Production"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="provider">ATS Provider</Label>
                  <Select value={newIntegration.provider} onValueChange={(value) => setNewIntegration(prev => ({ ...prev, provider: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select provider" />
                    </SelectTrigger>
                    <SelectContent>
                      {ATS_PROVIDERS.map((provider) => (
                        <SelectItem key={provider.value} value={provider.value}>
                          {provider.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="syncFrequency">Sync Frequency (seconds)</Label>
                  <Input
                    id="syncFrequency"
                    type="number"
                    value={newIntegration.syncFrequency}
                    onChange={(e) => setNewIntegration(prev => ({ ...prev, syncFrequency: parseInt(e.target.value) }))}
                    min="60"
                    max="86400"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="apiEndpoint">API Endpoint</Label>
                  <Input
                    id="apiEndpoint"
                    value={newIntegration.apiEndpoint}
                    onChange={(e) => setNewIntegration(prev => ({ ...prev, apiEndpoint: e.target.value }))}
                    placeholder="https://api.provider.com"
                  />
                </div>

                <div>
                  <Label htmlFor="apiKey">API Key</Label>
                  <Input
                    id="apiKey"
                    type="password"
                    value={newIntegration.apiKey}
                    onChange={(e) => setNewIntegration(prev => ({ ...prev, apiKey: e.target.value }))}
                    placeholder="Your API key"
                  />
                </div>

                <div>
                  <Label htmlFor="accessToken">Access Token</Label>
                  <Input
                    id="accessToken"
                    type="password"
                    value={newIntegration.accessToken}
                    onChange={(e) => setNewIntegration(prev => ({ ...prev, accessToken: e.target.value }))}
                    placeholder="Access token"
                  />
                </div>

                <div>
                  <Label htmlFor="webhookSecret">Webhook Secret</Label>
                  <Input
                    id="webhookSecret"
                    type="password"
                    value={newIntegration.webhookSecret}
                    onChange={(e) => setNewIntegration(prev => ({ ...prev, webhookSecret: e.target.value }))}
                    placeholder="Webhook secret for verification"
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <Button type="submit" disabled={creating}>
                  {creating ? 'Creating...' : 'Create Integration'}
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowCreateForm(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Integrations List */}
      <div className="space-y-4">
        {companies.map((company) => (
          <Card key={company.id}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{company.name}</span>
                <Badge variant="outline">
                  {company.atsIntegrations.length} integration{company.atsIntegrations.length !== 1 ? 's' : ''}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {company.atsIntegrations.length === 0 ? (
                <p className="text-text-muted text-center py-4">
                  No ATS integrations configured for this company.
                </p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {company.atsIntegrations.map((integration) => {
                    const providerInfo = getProviderInfo(integration.provider);
                    const statusInfo = STATUS_CONFIG[integration.status as keyof typeof STATUS_CONFIG];

                    return (
                      <Card key={integration.id} className="border">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <h4 className="font-semibold text-text">{integration.name}</h4>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge className={providerInfo.color}>
                                  {providerInfo.label}
                                </Badge>
                                <Badge className={statusInfo.color}>
                                  {statusInfo.label}
                                </Badge>
                              </div>
                            </div>
                            <Button variant="ghost" size="sm">
                              <Settings className="w-4 h-4" />
                            </Button>
                          </div>

                          <div className="space-y-2 text-sm text-text-muted">
                            <div className="flex items-center justify-between">
                              <span>Last Sync:</span>
                              <span>
                                {integration.lastSyncAt
                                  ? new Date(integration.lastSyncAt).toLocaleString()
                                  : 'Never'
                                }
                              </span>
                            </div>

                            <div className="flex items-center justify-between">
                              <span>Sync Frequency:</span>
                              <span>{Math.round(integration.syncFrequency / 60)} minutes</span>
                            </div>

                            <div className="flex items-center justify-between">
                              <span>Total Syncs:</span>
                              <span>{integration._count.syncLogs}</span>
                            </div>
                          </div>

                          <div className="flex gap-2 mt-4">
                            <Button
                              size="sm"
                              onClick={() => handleSync(integration.id)}
                              disabled={integration.status === 'SYNCING'}
                              className="flex-1"
                            >
                              {integration.status === 'SYNCING' ? (
                                <>
                                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                                  Syncing...
                                </>
                              ) : (
                                <>
                                  <RefreshCw className="w-4 h-4 mr-2" />
                                  Sync Now
                                </>
                              )}
                            </Button>

                            <Button variant="outline" size="sm">
                              <ExternalLink className="w-4 h-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {companies.length === 0 && (
        <div className="text-center py-12">
          <Settings className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-text mb-2">No Companies Found</h3>
          <p className="text-text-muted">
            You need to be an admin of a company to manage ATS integrations.
          </p>
        </div>
      )}
    </div>
  );
}