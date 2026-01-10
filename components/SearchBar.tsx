import React, { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Search, X } from 'lucide-react'
import Avatar from '@/components/Avatar'

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
  const [results, setResults] = useState<any[]>([])
  const [loadingResults, setLoadingResults] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const abortRef = useRef<AbortController | null>(null)
  const debounceRef = useRef<number | null>(null)

  const router = useRouter()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const q = query.trim()
    if (!q) return

    if (onSearch) {
      onSearch(q, searchType)
      return
    }

    // Default navigation when no onSearch prop is provided
    if (searchType === 'jobs') {
      router.push(`/jobs?search=${encodeURIComponent(q)}`)
    } else if (searchType === 'people' || searchType === 'all') {
      router.push(`/network?query=${encodeURIComponent(q)}`)
    } else if (searchType === 'posts') {
      router.push(`/feed?query=${encodeURIComponent(q)}`)
    } else {
      router.push(`/network?query=${encodeURIComponent(q)}`)
    }
  }

  const clearSearch = () => {
    setQuery('')
    setIsExpanded(false)
    setResults([])
    setSelectedIndex(-1)
  }

  // Debounced search effect
  useEffect(() => {
    if (!isExpanded || !query || query.trim().length < 2) {
      setResults([])
      setLoadingResults(false)
      return
    }

    setLoadingResults(true)

    if (debounceRef.current) {
      window.clearTimeout(debounceRef.current)
    }

    debounceRef.current = window.setTimeout(async () => {
      // Abort previous
      abortRef.current?.abort()
      abortRef.current = new AbortController()

      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}&type=${searchType}&limit=6`, { signal: abortRef.current.signal })
        const data = await res.json()

        if (data?.success && data?.data) {
          const items: any[] = []
          // Prioritize users, then jobs, then posts
          ;(data.data.users || []).forEach((u: any) => items.push({ type: 'people', id: u.id, title: u.name, subtitle: u.title || u.company || '', avatar: u.avatar, href: `/in/${u.username || u.id}` }))
          if (items.length < 6) {
            ;(data.data.jobs || []).forEach((j: any) => items.push({ type: 'jobs', id: j.id, title: j.title, subtitle: j.companyName || j.location || '', avatar: '', href: `/jobs/${j.id}` }))
          }
          if (items.length < 6) {
            ;(data.data.posts || []).forEach((p: any) => {
              if (items.length < 6) items.push({ type: 'posts', id: p.id, title: p.author?.name || 'Post', subtitle: p.content?.slice(0, 120) || '', avatar: p.author?.avatar || '', href: `/feed?query=${encodeURIComponent(query)}#post-${p.id}` })
            })
          }

          setResults(items.slice(0, 6))
        } else {
          setResults([])
        }
      } catch (err: any) {
        if (err?.name !== 'AbortError') console.error('Search fetch error', err)
        setResults([])
      } finally {
        setLoadingResults(false)
      }
    }, 300)

    return () => {
      if (debounceRef.current) {
        window.clearTimeout(debounceRef.current)
        debounceRef.current = null
      }
      abortRef.current?.abort()
    }
  }, [query, searchType, isExpanded])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isExpanded) return

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex(prev => (prev < results.length - 1 ? prev + 1 : 0))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex(prev => (prev > 0 ? prev - 1 : (results.length - 1)))
    } else if (e.key === 'Enter') {
      if (selectedIndex >= 0 && results[selectedIndex]) {
        e.preventDefault()
        const item = results[selectedIndex]
        router.push(item.href)
        setIsExpanded(false)
        setQuery('')
        setResults([])
        setSelectedIndex(-1)
      }
    } else if (e.key === 'Escape') {
      setIsExpanded(false)
      setSelectedIndex(-1)
    }
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
            onKeyDown={handleKeyDown}
            onFocus={() => setIsExpanded(true)}
            placeholder={placeholder}
            aria-label="Search"
            aria-controls="search-results-list"
            aria-activedescendant={selectedIndex >= 0 ? `search-result-${selectedIndex}` : undefined}
            className="bg-transparent border-none outline-none px-3 py-2 text-foreground placeholder-muted-foreground flex-1 min-w-[120px] max-w-[680px] h-10"
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
            className="w-10 h-10 bg-primary text-primary-foreground rounded-full hover:bg-primary/90 transition-colors mr-2 flex items-center justify-center"
          >
            <Search className="w-4 h-4" />
          </button>
        </div>
      </form>

      {/* Search Results Dropdown */}
      {isExpanded && query && (
        <div id="search-results-list" className="absolute top-full mt-2 max-w-[420px] w-full bg-card rounded-xl shadow-xl border border-border z-50 max-h-96 overflow-y-auto" role="listbox" aria-label="Search results">
          <div className="p-4">
            <div className="text-sm text-muted-foreground mb-3">
              Search results for "{query}" in {searchType.charAt(0).toUpperCase() + searchType.slice(1)}
            </div>

            {/* Results */}
            <div className="space-y-1">
              {loadingResults ? (
                <div className="text-center py-6">
                  <div className="animate-spin w-5 h-5 border-2 border-primary border-t-transparent rounded-full mx-auto"></div>
                </div>
              ) : results.length === 0 ? (
                <div className="text-center py-6 text-text-muted">No results</div>
              ) : (
                results.map((item, idx) => (
                  <div
                    id={`search-result-${idx}`}
                    key={`${item.type}-${item.id}`}
                    role="option"
                    aria-selected={selectedIndex === idx}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    onMouseLeave={() => setSelectedIndex(-1)}
                    onClick={() => {
                      router.push(item.href)
                      setIsExpanded(false)
                      setQuery('')
                      setResults([])
                    }}
                    className={`flex items-center space-x-3 p-3 rounded-lg cursor-pointer ${selectedIndex === idx ? 'bg-secondary' : 'hover:bg-secondary'}`}
                  >
                    {item.avatar ? (
                      <Avatar src={item.avatar || null} name={item.title} size="sm" />
                    ) : (
                      <div className="w-10 h-10 bg-secondary rounded-full flex items-center justify-center text-white font-medium">{item.title?.charAt(0)}</div>
                    )}
                    <div className="flex-1">
                      <div className="text-sm font-medium">{item.title}</div>
                      <div className="text-xs text-text-muted truncate">{item.subtitle}</div>
                    </div>
                    <div className="text-xs text-text-muted">{item.type}</div>
                  </div>
                ))
              )}
            </div>

            <div className="mt-3 pt-3 border-t border-border flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  const q = encodeURIComponent(query)
                  if (searchType === 'jobs') {
                    router.push(`/jobs?search=${q}`)
                  } else if (searchType === 'posts') {
                    router.push(`/feed?query=${q}`)
                  } else {
                    router.push(`/network?query=${q}`)
                  }
                }}
                className="text-sm text-primary hover:text-primary/80 font-medium"
              >
                View all results →
              </button>
              <div className="text-xs text-text-muted">Showing {results.length} results</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
