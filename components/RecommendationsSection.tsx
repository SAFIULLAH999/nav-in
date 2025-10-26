'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface Recommendation {
  id: string;
  relationship: string;
  position?: string;
  content: string;
  status: string;
  recommender: {
    id: string;
    name: string;
    title?: string;
    avatar?: string;
    company?: string;
  };
  createdAt: string;
}

export default function RecommendationsSection({ userId }: { userId: string }) {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRecommendations();
  }, [userId]);

  const fetchRecommendations = async () => {
    try {
      const response = await fetch('/api/recommendations/received?status=ACCEPTED');
      const data = await response.json();
      setRecommendations(data);
    } catch (error) {
      console.error('Error fetching recommendations:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="animate-pulse bg-gray-200 h-64 rounded-lg"></div>;
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Recommendations</h2>
        <button
          onClick={() => setShowRequestModal(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          Ask for recommendation
        </button>
      </div>

      {recommendations.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 mb-4">No recommendations yet</p>
          <button
            onClick={() => setShowRequestModal(true)}
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            Request your first recommendation
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {recommendations.map((rec) => (
            <motion.div
              key={rec.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="border-b pb-6 last:border-b-0"
            >
              <div className="flex items-start gap-4">
                <img
                  src={rec.recommender.avatar || '/default-avatar.png'}
                  alt={rec.recommender.name}
                  className="w-16 h-16 rounded-full object-cover"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-bold text-gray-900">{rec.recommender.name}</h3>
                    <span className="text-gray-500">·</span>
                    <span className="text-gray-600">{rec.relationship}</span>
                  </div>
                  {rec.recommender.title && (
                    <p className="text-sm text-gray-600 mb-2">
                      {rec.recommender.title}
                      {rec.recommender.company && ` at ${rec.recommender.company}`}
                    </p>
                  )}
                  {rec.position && (
                    <p className="text-sm text-gray-500 mb-3">
                      {rec.recommender.name} worked with you as {rec.position}
                    </p>
                  )}
                  <p className="text-gray-700 leading-relaxed">{rec.content}</p>
                  <p className="text-sm text-gray-400 mt-3">
                    {new Date(rec.createdAt).toLocaleDateString('en-US', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {showRequestModal && (
        <RequestRecommendationModal
          onClose={() => setShowRequestModal(false)}
          onSuccess={fetchRecommendations}
        />
      )}
    </div>
  );
}

function RequestRecommendationModal({ 
  onClose, 
  onSuccess 
}: { 
  onClose: () => void; 
  onSuccess: () => void; 
}) {
  const [formData, setFormData] = useState({
    recommenderId: '',
    relationship: '',
    position: '',
    message: ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/recommendations/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        onSuccess();
        onClose();
      } else {
        alert('Failed to request recommendation');
      }
    } catch (error) {
      console.error('Error requesting recommendation:', error);
      alert('An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-lg p-6 max-w-md w-full mx-4"
      >
        <h3 className="text-xl font-bold mb-4">Request a Recommendation</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Who do you want to ask?
            </label>
            <input
              type="text"
              placeholder="Search connections..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              value={formData.recommenderId}
              onChange={(e) => setFormData({ ...formData, recommenderId: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Relationship
            </label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              value={formData.relationship}
              onChange={(e) => setFormData({ ...formData, relationship: e.target.value })}
              required
            >
              <option value="">Select relationship</option>
              <option value="Manager">Manager</option>
              <option value="Colleague">Colleague</option>
              <option value="Client">Client</option>
              <option value="Mentor">Mentor</option>
              <option value="Mentee">Mentee</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Position (optional)
            </label>
            <input
              type="text"
              placeholder="e.g., Senior Developer"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              value={formData.position}
              onChange={(e) => setFormData({ ...formData, position: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Personal message (optional)
            </label>
            <textarea
              placeholder="Add a personal note to your request..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              rows={3}
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
            />
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
            >
              {loading ? 'Sending...' : 'Send Request'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
