'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, Heart, MessageCircle, Share2, Bookmark, Eye, Plus } from 'lucide-react';
import { toast } from 'react-hot-toast';
import Link from 'next/link';

interface Article {
  id: string;
  title: string;
  subtitle?: string;
  excerpt?: string;
  coverImage?: string;
  tags?: string[];
  category?: string;
  readTime?: number;
  isPublished: boolean;
  isFeatured: boolean;
  views: number;
  likesCount: number;
  commentsCount: number;
  sharesCount: number;
  publishedAt?: string;
  createdAt: string;
  author: {
    id: string;
    name?: string;
    username?: string;
    avatar?: string;
    title?: string;
  };
  _count: {
    likes: number;
    comments: number;
    shares: number;
    bookmarks: number;
  };
}

const CATEGORIES = [
  'All',
  'Technology',
  'Career',
  'Business',
  'Design',
  'Marketing',
  'Finance',
  'Health',
  'Education',
  'Lifestyle',
];

export function ArticlesList() {
  const { data: session, status } = useSession();
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [showWriteForm, setShowWriteForm] = useState(false);

  useEffect(() => {
    fetchArticles();
  }, [selectedCategory]);

  const fetchArticles = async () => {
    try {
      const params = new URLSearchParams();
      params.append('published', 'true');
      if (selectedCategory !== 'All') {
        params.append('category', selectedCategory);
      }

      const response = await fetch(`/api/articles?${params}`);
      if (response.ok) {
        const data = await response.json();
        setArticles(data);
      }
    } catch (error) {
      console.error('Error fetching articles:', error);
      toast.error('Failed to load articles');
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (articleId: string) => {
    if (status !== 'authenticated' || !session?.user?.id) {
      toast.error('Please sign in to like articles');
      return;
    }

    try {
      const response = await fetch(`/api/articles/${articleId}/like`, {
        method: 'POST',
      });

      if (response.ok) {
        fetchArticles(); // Refresh articles to update like count
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to like article');
      }
    } catch (error) {
      console.error('Error liking article:', error);
      toast.error('Failed to like article');
    }
  };

  const handleBookmark = async (articleId: string) => {
    if (status !== 'authenticated' || !session?.user?.id) {
      toast.error('Please sign in to bookmark articles');
      return;
    }

    try {
      const response = await fetch(`/api/articles/${articleId}/bookmark`, {
        method: 'POST',
      });

      if (response.ok) {
        toast.success('Article bookmarked');
        fetchArticles();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to bookmark article');
      }
    } catch (error) {
      console.error('Error bookmarking article:', error);
      toast.error('Failed to bookmark article');
    }
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
          <h2 className="text-2xl font-bold text-text">Articles</h2>
          <p className="text-text-muted">Discover insights and stories from professionals</p>
        </div>
        {status === 'authenticated' && session?.user?.id && (
          <Link href="/articles/write">
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Write Article
            </Button>
          </Link>
        )}
      </div>

      {/* Category Filter */}
      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map((category) => (
          <Button
            key={category}
            variant={selectedCategory === category ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedCategory(category)}
          >
            {category}
          </Button>
        ))}
      </div>

      {/* Articles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {articles.map((article) => (
          <Card key={article.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              {article.coverImage && (
                <div className="aspect-video w-full bg-gray-200 rounded-lg mb-3 overflow-hidden">
                  <img
                    src={article.coverImage}
                    alt={article.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <CardTitle className="text-lg leading-tight mb-2 line-clamp-2">
                    <Link href={`/articles/${article.id}`} className="hover:text-primary">
                      {article.title}
                    </Link>
                  </CardTitle>

                  {article.subtitle && (
                    <p className="text-sm text-text-muted mb-2 line-clamp-2">
                      {article.subtitle}
                    </p>
                  )}
                </div>

                {article.isFeatured && (
                  <Badge className="bg-yellow-100 text-yellow-800">Featured</Badge>
                )}
              </div>

              {article.excerpt && (
                <p className="text-sm text-text-muted line-clamp-3">
                  {article.excerpt}
                </p>
              )}
            </CardHeader>

            <CardContent className="pt-0">
              {/* Author Info */}
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white text-sm font-semibold">
                  {article.author.avatar ? (
                    <img
                      src={article.author.avatar}
                      alt={article.author.name || 'Author'}
                      className="w-full h-full object-cover rounded-full"
                    />
                  ) : (
                    (article.author.name || article.author.username || 'A').charAt(0).toUpperCase()
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-text">
                    {article.author.name || article.author.username}
                  </p>
                  <p className="text-xs text-text-muted">
                    {article.author.title}
                  </p>
                </div>
              </div>

              {/* Article Meta */}
              <div className="flex items-center justify-between text-sm text-text-muted mb-4">
                <div className="flex items-center space-x-4">
                  {article.readTime && (
                    <div className="flex items-center space-x-1">
                      <Clock className="w-4 h-4" />
                      <span>{article.readTime} min read</span>
                    </div>
                  )}
                  <div className="flex items-center space-x-1">
                    <Eye className="w-4 h-4" />
                    <span>{article.views} views</span>
                  </div>
                </div>

                {article.publishedAt && (
                  <span>{new Date(article.publishedAt).toLocaleDateString()}</span>
                )}
              </div>

              {/* Tags */}
              {article.tags && article.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-4">
                  {article.tags.slice(0, 3).map((tag, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                  {article.tags.length > 3 && (
                    <Badge variant="secondary" className="text-xs">
                      +{article.tags.length - 3} more
                    </Badge>
                  )}
                </div>
              )}

              {/* Engagement Actions */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleLike(article.id)}
                    className="flex items-center space-x-1"
                  >
                    <Heart className="w-4 h-4" />
                    <span className="text-sm">{article.likesCount}</span>
                  </Button>

                  <Button variant="ghost" size="sm" className="flex items-center space-x-1">
                    <MessageCircle className="w-4 h-4" />
                    <span className="text-sm">{article.commentsCount}</span>
                  </Button>

                  <Button variant="ghost" size="sm" className="flex items-center space-x-1">
                    <Share2 className="w-4 h-4" />
                    <span className="text-sm">{article.sharesCount}</span>
                  </Button>
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleBookmark(article.id)}
                >
                  <Bookmark className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {articles.length === 0 && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📝</div>
          <h3 className="text-lg font-semibold text-text mb-2">
            {selectedCategory === 'All' ? 'No articles yet' : `No articles in ${selectedCategory}`}
          </h3>
          <p className="text-text-muted">
            {selectedCategory === 'All'
              ? 'Be the first to share your insights!'
              : `Check back later for articles in ${selectedCategory.toLowerCase()}`
            }
          </p>
        </div>
      )}
    </div>
  );
}