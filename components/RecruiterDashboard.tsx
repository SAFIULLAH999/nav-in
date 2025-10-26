'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Users, Briefcase, Send, TrendingUp, Filter,
  Search, Mail, Eye, CheckCircle, Clock, XCircle
} from 'lucide-react';

interface DashboardStats {
  totalJobs: number;
  activeJobs: number;
  totalApplications: number;
  pendingReview: number;
  interviewed: number;
  hired: number;
}

interface Application {
  id: string;
  jobTitle: string;
  candidate: {
    id: string;
    name: string;
    avatar?: string;
    title?: string;
    location?: string;
  };
  status: string;
  appliedAt: string;
  resume?: string;
  coverLetter?: string;
}

export default function RecruiterDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'applications' | 'candidates' | 'messages'>('overview');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [statsRes, applicationsRes] = await Promise.all([
        fetch('/api/recruiter/stats'),
        fetch('/api/recruiter/applications')
      ]);

      const statsData = await statsRes.json();
      const applicationsData = await applicationsRes.json();

      setStats(statsData);
      setApplications(applicationsData);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (applicationId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/recruiter/applications/${applicationId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });

      if (response.ok) {
        fetchDashboardData();
      }
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  if (loading) {
    return <div className="animate-pulse bg-gray-200 h-96 rounded-lg"></div>;
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Recruiter Dashboard</h1>
        <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
          <Briefcase className="w-5 h-5" />
          Post New Job
        </button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <StatCard
            icon={<Briefcase className="w-8 h-8" />}
            title="Active Jobs"
            value={stats.activeJobs}
            subtitle={`${stats.totalJobs} total jobs`}
            color="blue"
          />
          <StatCard
            icon={<Users className="w-8 h-8" />}
            title="Total Applications"
            value={stats.totalApplications}
            subtitle={`${stats.pendingReview} pending review`}
            color="purple"
          />
          <StatCard
            icon={<CheckCircle className="w-8 h-8" />}
            title="Hired"
            value={stats.hired}
            subtitle={`${stats.interviewed} interviewed`}
            color="green"
          />
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="flex border-b">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-6 py-4 font-medium transition ${
              activeTab === 'overview'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('applications')}
            className={`px-6 py-4 font-medium transition ${
              activeTab === 'applications'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Applications
          </button>
          <button
            onClick={() => setActiveTab('candidates')}
            className={`px-6 py-4 font-medium transition ${
              activeTab === 'candidates'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Candidate Search
          </button>
          <button
            onClick={() => setActiveTab('messages')}
            className={`px-6 py-4 font-medium transition ${
              activeTab === 'messages'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Messages
          </button>
        </div>

        <div className="p-6">
          {activeTab === 'overview' && <OverviewTab stats={stats} />}
          {activeTab === 'applications' && (
            <ApplicationsTab
              applications={applications}
              filterStatus={filterStatus}
              setFilterStatus={setFilterStatus}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              onStatusChange={handleStatusChange}
            />
          )}
          {activeTab === 'candidates' && <CandidateSearchTab />}
          {activeTab === 'messages' && <MessagesTab />}
        </div>
      </div>
    </div>
  );
}

function StatCard({ 
  icon, 
  title, 
  value, 
  subtitle, 
  color 
}: { 
  icon: React.ReactNode;
  title: string;
  value: number;
  subtitle: string;
  color: 'blue' | 'purple' | 'green';
}) {
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-600',
    purple: 'bg-purple-100 text-purple-600',
    green: 'bg-green-100 text-green-600'
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-lg shadow p-6"
    >
      <div className="flex items-start justify-between mb-4">
        <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
          {icon}
        </div>
      </div>
      <h3 className="text-2xl font-bold mb-1">{value}</h3>
      <p className="text-gray-600 font-medium">{title}</p>
      <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
    </motion.div>
  );
}

function OverviewTab({ stats }: { stats: DashboardStats | null }) {
  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Recent Activity</h2>
      <p className="text-gray-600">Analytics and recent activity coming soon...</p>
    </div>
  );
}

function ApplicationsTab({
  applications,
  filterStatus,
  setFilterStatus,
  searchQuery,
  setSearchQuery,
  onStatusChange
}: {
  applications: Application[];
  filterStatus: string;
  setFilterStatus: (status: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onStatusChange: (id: string, status: string) => void;
}) {
  const filteredApplications = applications.filter(app => {
    const matchesStatus = filterStatus === 'all' || app.status === filterStatus;
    const matchesSearch = app.candidate.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          app.jobTitle.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  return (
    <div>
      {/* Filters */}
      <div className="flex gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search applications..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Status</option>
          <option value="PENDING">Pending</option>
          <option value="REVIEWING">Reviewing</option>
          <option value="INTERVIEWED">Interviewed</option>
          <option value="OFFERED">Offered</option>
          <option value="HIRED">Hired</option>
          <option value="REJECTED">Rejected</option>
        </select>
      </div>

      {/* Applications List */}
      <div className="space-y-4">
        {filteredApplications.map((app) => (
          <ApplicationCard
            key={app.id}
            application={app}
            onStatusChange={onStatusChange}
          />
        ))}

        {filteredApplications.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            No applications found
          </div>
        )}
      </div>
    </div>
  );
}

function ApplicationCard({
  application,
  onStatusChange
}: {
  application: Application;
  onStatusChange: (id: string, status: string) => void;
}) {
  return (
    <div className="border rounded-lg p-4 hover:shadow-md transition">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4 flex-1">
          <img
            src={application.candidate.avatar || '/default-avatar.png'}
            alt={application.candidate.name}
            className="w-12 h-12 rounded-full object-cover"
          />
          <div className="flex-1">
            <h3 className="font-bold text-lg">{application.candidate.name}</h3>
            <p className="text-gray-600">{application.candidate.title}</p>
            <p className="text-sm text-gray-500 mt-1">
              Applied for: {application.jobTitle}
            </p>
            <p className="text-sm text-gray-400 mt-1">
              {new Date(application.appliedAt).toLocaleDateString()}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={application.status}
            onChange={(e) => onStatusChange(application.id, e.target.value)}
            className="px-3 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500"
          >
            <option value="PENDING">Pending</option>
            <option value="REVIEWING">Reviewing</option>
            <option value="INTERVIEWED">Interviewed</option>
            <option value="OFFERED">Offered</option>
            <option value="HIRED">Hired</option>
            <option value="REJECTED">Rejected</option>
          </select>

          {application.resume && (
            <a
              href={application.resume}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 text-blue-600 hover:bg-blue-50 rounded transition"
              title="View Resume"
            >
              <Eye className="w-5 h-5" />
            </a>
          )}

          <button
            className="p-2 text-gray-600 hover:bg-gray-100 rounded transition"
            title="Send Message"
          >
            <Mail className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}

function CandidateSearchTab() {
  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Search Candidates</h2>
      <p className="text-gray-600">Advanced candidate search coming soon...</p>
    </div>
  );
}

function MessagesTab() {
  return (
    <div>
      <h2 className="text-xl font-bold mb-4">InMail Messages</h2>
      <p className="text-gray-600">Messaging system coming soon...</p>
    </div>
  );
}
