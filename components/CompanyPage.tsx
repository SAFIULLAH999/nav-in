'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Building2, MapPin, Users, Briefcase, Globe, 
  Star, TrendingUp, Plus, Edit, UserPlus 
} from 'lucide-react';
import VideoPlayer from './VideoPlayer';

interface Company {
  id: string;
  name: string;
  description?: string;
  website?: string;
  logo?: string;
  industry?: string;
  size?: string;
  location?: string;
  foundedYear?: number;
  isVerified: boolean;
  followerCount?: number;
  isFollowing?: boolean;
  isAdmin?: boolean;
}

interface CompanyPageProps {
  companyId: string;
  currentUserId?: string;
}

export default function CompanyPage({ companyId, currentUserId }: CompanyPageProps) {
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'about' | 'jobs' | 'people' | 'insights'>('about');

  useEffect(() => {
    fetchCompany();
  }, [companyId]);

  const fetchCompany = async () => {
    try {
      const response = await fetch(`/api/companies/${companyId}`);
      const data = await response.json();
      setCompany(data);
    } catch (error) {
      console.error('Error fetching company:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFollow = async () => {
    try {
      const response = await fetch(`/api/companies/${companyId}/follow`, {
        method: company?.isFollowing ? 'DELETE' : 'POST',
      });

      if (response.ok) {
        setCompany(prev => prev ? {
          ...prev,
          isFollowing: !prev.isFollowing,
          followerCount: (prev.followerCount || 0) + (prev.isFollowing ? -1 : 1)
        } : null);
      }
    } catch (error) {
      console.error('Error following company:', error);
    }
  };

  if (loading) {
    return <div className="animate-pulse bg-gray-200 h-96 rounded-lg"></div>;
  }

  if (!company) {
    return <div className="text-center py-12">Company not found</div>;
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="bg-white rounded-lg shadow mb-6">
        {/* Cover Image */}
        <div className="h-48 bg-gradient-to-r from-blue-600 to-purple-600 rounded-t-lg"></div>

        <div className="px-6 pb-6">
          {/* Logo and Basic Info */}
          <div className="flex items-start gap-6 -mt-16">
            <div className="w-32 h-32 bg-white border-4 border-white rounded-lg shadow-lg overflow-hidden">
              {company.logo ? (
                <img src={company.logo} alt={company.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                  <Building2 className="w-16 h-16 text-gray-400" />
                </div>
              )}
            </div>

            <div className="flex-1 mt-16">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold">{company.name}</h1>
                {company.isVerified && (
                  <div className="flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                    <Star className="w-4 h-4 fill-current" />
                    Verified
                  </div>
                )}
              </div>

              <div className="flex flex-wrap gap-4 text-gray-600 mb-4">
                {company.industry && (
                  <span className="flex items-center gap-1">
                    <Briefcase className="w-4 h-4" />
                    {company.industry}
                  </span>
                )}
                {company.location && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    {company.location}
                  </span>
                )}
                {company.size && (
                  <span className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    {company.size} employees
                  </span>
                )}
                {company.website && (
                  <a
                    href={company.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-blue-600 hover:text-blue-700"
                  >
                    <Globe className="w-4 h-4" />
                    Website
                  </a>
                )}
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={handleFollow}
                  className={`flex items-center gap-2 px-6 py-2 rounded-lg font-medium transition ${
                    company.isFollowing
                      ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  {company.isFollowing ? (
                    <>
                      <UserPlus className="w-5 h-5" />
                      Following
                    </>
                  ) : (
                    <>
                      <Plus className="w-5 h-5" />
                      Follow
                    </>
                  )}
                </button>

                <span className="text-gray-600">
                  {company.followerCount?.toLocaleString() || 0} followers
                </span>

                {company.isAdmin && (
                  <button className="ml-auto flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition">
                    <Edit className="w-5 h-5" />
                    Edit Page
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-6 mt-6 border-b">
            <button
              onClick={() => setActiveTab('about')}
              className={`pb-3 font-medium transition ${
                activeTab === 'about'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              About
            </button>
            <button
              onClick={() => setActiveTab('jobs')}
              className={`pb-3 font-medium transition ${
                activeTab === 'jobs'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Jobs
            </button>
            <button
              onClick={() => setActiveTab('people')}
              className={`pb-3 font-medium transition ${
                activeTab === 'people'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              People
            </button>
            <button
              onClick={() => setActiveTab('insights')}
              className={`pb-3 font-medium transition ${
                activeTab === 'insights'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <TrendingUp className="w-4 h-4 inline mr-1" />
              Insights
            </button>
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {activeTab === 'about' && <AboutSection company={company} />}
          {activeTab === 'jobs' && <JobsSection companyId={companyId} />}
          {activeTab === 'people' && <PeopleSection companyId={companyId} />}
          {activeTab === 'insights' && <InsightsSection companyId={companyId} />}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <CompanySidebar company={company} />
        </div>
      </div>
    </div>
  );
}

function AboutSection({ company }: { company: Company }) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-bold mb-4">About {company.name}</h2>
      {company.description ? (
        <p className="text-gray-700 leading-relaxed whitespace-pre-line">{company.description}</p>
      ) : (
        <p className="text-gray-500 italic">No description available</p>
      )}

      {company.foundedYear && (
        <div className="mt-6 pt-6 border-t">
          <h3 className="font-semibold text-gray-900 mb-2">Founded</h3>
          <p className="text-gray-700">{company.foundedYear}</p>
        </div>
      )}
    </div>
  );
}

function JobsSection({ companyId }: { companyId: string }) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-bold mb-4">Open Positions</h2>
      <p className="text-gray-500">Job listings coming soon...</p>
    </div>
  );
}

function PeopleSection({ companyId }: { companyId: string }) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-bold mb-4">People</h2>
      <p className="text-gray-500">Employee directory coming soon...</p>
    </div>
  );
}

function InsightsSection({ companyId }: { companyId: string }) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-bold mb-4">Company Insights</h2>
      <p className="text-gray-500">Analytics and insights coming soon...</p>
    </div>
  );
}

function CompanySidebar({ company }: { company: Company }) {
  return (
    <>
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="font-bold mb-4">Company Details</h3>
        <div className="space-y-3 text-sm">
          {company.industry && (
            <div>
              <span className="text-gray-600">Industry</span>
              <p className="font-medium">{company.industry}</p>
            </div>
          )}
          {company.size && (
            <div>
              <span className="text-gray-600">Company size</span>
              <p className="font-medium">{company.size} employees</p>
            </div>
          )}
          {company.location && (
            <div>
              <span className="text-gray-600">Headquarters</span>
              <p className="font-medium">{company.location}</p>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="font-bold mb-4">Similar Companies</h3>
        <p className="text-sm text-gray-500">Recommendations coming soon...</p>
      </div>
    </>
  );
}
