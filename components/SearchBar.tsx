import React, { useState } from 'react'
import { Search, X } from 'lucide-react'

interface SearchBarProps {
  onSearch?: (query: string, type: string) => void
  placeholder?: string
  className?: string
  mobile?: boolean
}

export default function SearchBar({ onSearch, placeholder = "Search professionals, jobs, companies...", className = "", mobile = false }: SearchBarProps) {
  const [query, setQuery] = useState('')
  const [searchType, setSearchType] = useState('all')
  const [isExpanded, setIsExpanded] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim() && onSearch) {
      onSearch(query.trim(), searchType)
    }
  }

  const clearSearch = () => {
    setQuery('')
    setIsExpanded(false)
  }

  return (
    <div className={`relative ${className}`}>
      <form onSubmit={handleSubmit} className="relative">
        <div className={`flex items-center bg-background border border-border rounded-full transition-all duration-300 ${
          isExpanded ? 'shadow-lg' : 'hover:shadow-md'
        } ${mobile ? 'mobile-search' : ''}`}>
          {/* Search Type Selector - Hidden on mobile */}
          {!mobile && (
            <select
              value={searchType}
              onChange={(e) => setSearchType(e.target.value)}
              className="bg-transparent border-none outline-none pl-4 pr-2 py-2 text-sm text-muted-foreground cursor-pointer min-w-[120px]"
            >
              <option value="all">All</option>
              <option value="people">People</option>
              <option value="jobs">Jobs</option>
              <option value="companies">Companies</option>
              <option value="posts">Posts</option>
            </select>
          )}

          {/* Search Input */}
          <input
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              if (e.target.value && !isExpanded) setIsExpanded(true)
            }}
            onFocus={() => setIsExpanded(true)}
            placeholder={placeholder}
            className="bg-transparent border-none outline-none px-3 py-2 text-foreground placeholder-muted-foreground flex-1 min-w-[120px]"
          />

          {/* Clear Button */}
          {query && (
            <button
              type="button"
              onClick={clearSearch}
              className="p-2 hover:bg-secondary rounded-full transition-colors"
            >
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          )}

          {/* Search Button */}
          <button
            type="submit"
            className="p-3 bg-primary text-primary-foreground rounded-full hover:bg-primary/90 transition-colors mr-2"
          >
            <Search className="w-4 h-4" />
          </button>
        </div>
      </form>

      {/* Search Results Dropdown */}
      {isExpanded && query && (
        <div className="absolute top-full mt-2 w-full bg-card rounded-xl shadow-xl border border-border z-50 max-h-96 overflow-y-auto">
          <div className="p-4">
            <div className="text-sm text-muted-foreground mb-3">
              Search results for "{query}" in {searchType}
            </div>
            {/* Placeholder for search results */}
            <div className="space-y-3">
              <div className="flex items-center space-x-3 p-3 hover:bg-secondary rounded-lg cursor-pointer">
                <div className="w-10 h-10 bg-secondary rounded-full"></div>
                <div className="flex-1">
                  <div className="h-4 bg-secondary rounded w-32 mb-1"></div>
                  <div className="h-3 bg-secondary rounded w-48"></div>
                </div>
              </div>
              <div className="flex items-center space-x-3 p-3 hover:bg-secondary rounded-lg cursor-pointer">
                <div className="w-10 h-10 bg-secondary rounded-full"></div>
                <div className="flex-1">
                  <div className="h-4 bg-secondary rounded w-40 mb-1"></div>
                  <div className="h-3 bg-secondary rounded w-32"></div>
                </div>
              </div>
              <div className="flex items-center space-x-3 p-3 hover:bg-secondary rounded-lg cursor-pointer">
                <div className="w-10 h-10 bg-secondary rounded-full"></div>
                <div className="flex-1">
                  <div className="h-4 bg-secondary rounded w-36 mb-1"></div>
                  <div className="h-3 bg-secondary rounded w-24"></div>
                </div>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-border">
              <button className="text-sm text-primary hover:text-primary/80 font-medium">
                View all results →
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
