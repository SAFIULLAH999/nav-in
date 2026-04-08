'use client';

import React, { useState, useCallback } from 'react';
import {
  Search,
  ChevronDown,
  X,
  MapPin,
  Briefcase,
  GraduationCap,
  Tag,
  Users,
  Zap,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

interface SearchFilter {
  query?: string;
  companies?: string[];
  industries?: string[];
  locations?: string[];
  roles?: string[];
  skills?: string[];
  network?: 'ALL' | 'CONNECTIONS' | '2ND_DEGREE';
  openToStatus?: string[];
  sortBy?: 'relevance' | 'connections' | 'recent';
}

interface SearchFiltersProps {
  onFiltersChange: (filters: SearchFilter) => void;
  isLoading?: boolean;
  resultCount?: number;
}

export const SearchFilters: React.FC<SearchFiltersProps> = ({
  onFiltersChange,
  isLoading,
  resultCount,
}) => {
  const [filters, setFilters] = useState<SearchFilter>({
    query: '',
    network: 'ALL',
    sortBy: 'relevance',
  });
  const [expandedFilter, setExpandedFilter] = useState<string | null>(null);

  const industries = [
    'Technology',
    'Finance',
    'Healthcare',
    'Marketing',
    'Sales',
    'Education',
    'Manufacturing',
    'Retail',
    'Consulting',
  ];

  const openToStatuses = [
    { value: 'WORK', label: 'Open to Work' },
    { value: 'HIRING', label: 'Actively Hiring' },
    { value: 'FREELANCE', label: 'Open to Freelance' },
    { value: 'MENTORSHIP', label: 'Open to Mentor' },
    { value: 'COLLABORATION', label: 'Open to Collaborate' },
  ];

  const handleQueryChange = useCallback((query: string) => {
    const newFilters = { ...filters, query };
    setFilters(newFilters);
    onFiltersChange(newFilters);
  }, [filters, onFiltersChange]);

  const handleAddFilter = useCallback((filterType: string, value: string) => {
    setFilters((prev) => {
      const current = (prev[filterType as keyof SearchFilter] as string[]) || [];
      if (current.includes(value)) return prev;

      const newFilters = {
        ...prev,
        [filterType]: [...current, value],
      };
      onFiltersChange(newFilters);
      return newFilters;
    });
  }, [onFiltersChange]);

  const handleRemoveFilter = useCallback((filterType: string, value: string) => {
    setFilters((prev) => {
      const current = (prev[filterType as keyof SearchFilter] as string[]) || [];
      const newFilters = {
        ...prev,
        [filterType]: current.filter((v) => v !== value),
      };
      onFiltersChange(newFilters);
      return newFilters;
    });
  }, [onFiltersChange]);

  const handleNetworkChange = useCallback((network: 'ALL' | 'CONNECTIONS' | '2ND_DEGREE') => {
    const newFilters = { ...filters, network };
    setFilters(newFilters);
    onFiltersChange(newFilters);
  }, [filters, onFiltersChange]);

  const handleSortChange = useCallback((sortBy: 'relevance' | 'connections' | 'recent') => {
    const newFilters = { ...filters, sortBy };
    setFilters(newFilters);
    onFiltersChange(newFilters);
  }, [filters, onFiltersChange]);

  const handleClearAll = useCallback(() => {
    const newFilters = {
      query: '',
      network: 'ALL',
      sortBy: 'relevance',
    };
    setFilters(newFilters);
    onFiltersChange(newFilters);
  }, [onFiltersChange]);

  const activeFilterCount =
    (filters.companies?.length || 0) +
    (filters.industries?.length || 0) +
    (filters.locations?.length || 0) +
    (filters.roles?.length || 0) +
    (filters.skills?.length || 0) +
    (filters.openToStatus?.length || 0);

  return (
    <div className="w-full bg-white rounded-lg border border-gray-200 shadow-sm">
      {/* Search Bar */}
      <div className="border-b border-gray-200 p-4">
        <div className="relative">
          <Search className="absolute left-3 top-3 text-gray-400" size={20} />
          <Input
            type="text"
            placeholder="Search by name, title, company..."
            value={filters.query || ''}
            onChange={(e) => handleQueryChange(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-gray-200 p-4 bg-gray-50">
        {/* Network Filter */}
        <div className="flex gap-1">
          <Button
            variant={filters.network === 'ALL' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleNetworkChange('ALL')}
            className="gap-1"
          >
            <Users size={14} />
            All
          </Button>
          <Button
            variant={filters.network === 'CONNECTIONS' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleNetworkChange('CONNECTIONS')}
          >
            Connections
          </Button>
          <Button
            variant={filters.network === '2ND_DEGREE' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleNetworkChange('2ND_DEGREE')}
          >
            2nd Degree
          </Button>
        </div>

        {/* Sort */}
        <div className="ml-auto flex gap-1">
          <Button
            variant={filters.sortBy === 'relevance' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleSortChange('relevance')}
          >
            Relevant
          </Button>
          <Button
            variant={filters.sortBy === 'recent' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleSortChange('recent')}
          >
            Recent
          </Button>
        </div>
      </div>

      {/* Active Filters Display */}
      {activeFilterCount > 0 && (
        <div className="border-b border-gray-200 p-4 bg-blue-50">
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-sm font-medium text-gray-600">Active filters:</span>
            {filters.industries?.map((ind) => (
              <Badge
                key={ind}
                variant="secondary"
                className="gap-1 cursor-pointer hover:bg-gray-300"
                onClick={() => handleRemoveFilter('industries', ind)}
              >
                {ind} <X size={12} />
              </Badge>
            ))}
            {filters.locations?.map((loc) => (
              <Badge
                key={loc}
                variant="secondary"
                className="gap-1 cursor-pointer hover:bg-gray-300"
                onClick={() => handleRemoveFilter('locations', loc)}
              >
                {loc} <X size={12} />
              </Badge>
            ))}
            {filters.openToStatus?.map((status) => (
              <Badge
                key={status}
                variant="secondary"
                className="gap-1 cursor-pointer hover:bg-gray-300"
                onClick={() => handleRemoveFilter('openToStatus', status)}
              >
                {status} <X size={12} />
              </Badge>
            ))}
            {activeFilterCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearAll}
                className="ml-auto text-xs text-red-600 hover:text-red-700"
              >
                Clear all
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Filter Controls */}
      <div className="p-4 space-y-3">
        {/* Industries */}
        <div className="border rounded-lg p-3">
          <button
            onClick={() =>
              setExpandedFilter(expandedFilter === 'industries' ? null : 'industries')
            }
            className="flex items-center justify-between w-full font-medium text-sm hover:text-primary transition-colors"
          >
            <span className="flex items-center gap-2">
              <Tag size={16} />
              Industries
            </span>
            <ChevronDown
              size={16}
              className={`transition-transform ${expandedFilter === 'industries' ? 'rotate-180' : ''}`}
            />
          </button>
          <AnimatePresence>
            {expandedFilter === 'industries' && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="mt-3 flex flex-wrap gap-2"
              >
                {industries.map((industry) => (
                  <Button
                    key={industry}
                    variant={
                      filters.industries?.includes(industry) ? 'default' : 'outline'
                    }
                    size="sm"
                    onClick={() => handleAddFilter('industries', industry)}
                  >
                    {industry}
                  </Button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Open To Status */}
        <div className="border rounded-lg p-3">
          <button
            onClick={() =>
              setExpandedFilter(expandedFilter === 'openTo' ? null : 'openTo')
            }
            className="flex items-center justify-between w-full font-medium text-sm hover:text-primary transition-colors"
          >
            <span className="flex items-center gap-2">
              <Zap size={16} />
              Open To
            </span>
            <ChevronDown
              size={16}
              className={`transition-transform ${expandedFilter === 'openTo' ? 'rotate-180' : ''}`}
            />
          </button>
          <AnimatePresence>
            {expandedFilter === 'openTo' && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="mt-3 flex flex-wrap gap-2"
              >
                {openToStatuses.map((status) => (
                  <Button
                    key={status.value}
                    variant={
                      filters.openToStatus?.includes(status.value) ? 'default' : 'outline'
                    }
                    size="sm"
                    onClick={() => handleAddFilter('openToStatus', status.value)}
                  >
                    {status.label}
                  </Button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Results Info */}
      {resultCount !== undefined && (
        <div className="border-t border-gray-200 p-4 bg-gray-50 text-sm text-gray-600">
          {isLoading ? (
            'Searching...'
          ) : resultCount === 0 ? (
            'No results found. Try adjusting your filters.'
          ) : (
            `Found ${resultCount} profile${resultCount !== 1 ? 's' : ''}`
          )}
        </div>
      )}
    </div>
  );
};

export default SearchFilters;
