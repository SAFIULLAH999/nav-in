'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { SearchFilters } from '@/components/SearchFilters';
import { Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface SearchResult {
  id: string;
  name: string;
  avatar: string;
  title?: string;
  company?: string;
  location?: string;
  bio?: string;
  skills?: Array<{ id: string; name: string }>;
  currentOpenToType?: string;
  connectionStatus?: string;
}

interface SearchResponse {
  success: boolean;
  data: {
    results: SearchResult[];
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

export default function AdvancedSearchPage() {
  const router = useRouter();
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(false);

  const performSearch = useCallback(
    async (filters: any) => {
      try {
        setIsLoading(true);

        const params = new URLSearchParams();
        if (filters.query) params.append('q', filters.query);
        if (filters.industries?.length)
          params.append('industries', JSON.stringify(filters.industries));
        if (filters.locations?.length)
          params.append('locations', JSON.stringify(filters.locations));
        if (filters.openToStatus?.length)
          params.append('openToStatus', JSON.stringify(filters.openToStatus));
        params.append('network', filters.network || 'ALL');
        params.append('sortBy', filters.sortBy || 'relevance');
        params.append('limit', '20');
        params.append('offset', '0');

        const token =
          localStorage.getItem('accessToken') ||
          sessionStorage.getItem('accessToken');

        const response = await fetch(`/api/search/advanced?${params.toString()}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data: SearchResponse = await response.json();

        if (!data.success) {
          throw new Error(data.error?.message || 'Search failed');
        }

        setResults(data.data.results);
        setTotal(data.data.total);
        setOffset(0);
        setHasMore(data.data.hasMore);
      } catch (error) {
        console.error('Search error:', error);
        toast.error(
          error instanceof Error ? error.message : 'Search failed'
        );
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const handleLoadMore = useCallback(async () => {
    try {
      setIsLoading(true);
      const newOffset = offset + 20;

      // Implement pagination...
      // Similar to performSearch but with new offset

      setOffset(newOffset);
    } finally {
      setIsLoading(false);
    }
  }, [offset]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Find Professionals
          </h1>
          <p className="text-gray-600">
            Advanced search to find the right people for your network
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Filters Sidebar */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-1"
          >
            <SearchFilters
              onFiltersChange={performSearch}
              isLoading={isLoading}
              resultCount={total}
            />
          </motion.div>

          {/* Results */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-3 space-y-4"
          >
            {isLoading && results.length === 0 ? (
              <div className="flex items-center justify-center h-96">
                <Loader2 className="animate-spin text-primary" size={32} />
              </div>
            ) : results.length === 0 ? (
              <div className="bg-white rounded-lg p-12 text-center">
                <p className="text-gray-600 text-lg">
                  No results found. Try adjusting your search criteria.
                </p>
              </div>
            ) : (
              <>
                {results.map((result, index) => (
                  <motion.div
                    key={result.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="bg-white rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => router.push(`/in/${result.id}`)}
                  >
                    <div className="flex gap-4">
                      {/* Avatar */}
                      <img
                        src={result.avatar || '/default-avatar.png'}
                        alt={result.name}
                        className="w-16 h-16 rounded-full object-cover"
                      />

                      {/* Details */}
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg text-gray-900">
                          {result.name}
                        </h3>
                        {result.title && (
                          <p className="text-sm text-gray-600">{result.title}</p>
                        )}
                        {result.company && (
                          <p className="text-sm text-gray-500">{result.company}</p>
                        )}
                        {result.bio && (
                          <p className="text-sm text-gray-700 mt-1 line-clamp-2">
                            {result.bio}
                          </p>
                        )}

                        {/* Skills */}
                        {result.skills && result.skills.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {result.skills.slice(0, 3).map((skill) => (
                              <span
                                key={skill.id}
                                className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full"
                              >
                                {skill.name}
                              </span>
                            ))}
                            {result.skills.length > 3 && (
                              <span className="text-xs text-gray-600">
                                +{result.skills.length - 3} more
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Open To Status */}
                      {result.currentOpenToType && (
                        <div className="flex items-center">
                          <span className="text-xs font-semibold px-2 py-1 bg-green-100 text-green-700 rounded-full">
                            {result.currentOpenToType}
                          </span>
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}

                {/* Load More */}
                {hasMore && (
                  <div className="text-center pt-4">
                    <button
                      onClick={handleLoadMore}
                      disabled={isLoading}
                      className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50"
                    >
                      {isLoading ? 'Loading...' : 'Load More'}
                    </button>
                  </div>
                )}
              </>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
