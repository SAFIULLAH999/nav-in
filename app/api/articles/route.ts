import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const createArticleSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
  subtitle: z.string().max(300, 'Subtitle too long').optional(),
  content: z.string().min(1, 'Content is required'),
  excerpt: z.string().max(500, 'Excerpt too long').optional(),
  coverImage: z.string().optional(),
  tags: z.array(z.string()).optional(),
  category: z.string().optional(),
  isPublished: z.boolean().default(false),
});

// GET /api/articles - Get all articles
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const authorId = searchParams.get('authorId');
    const isPublished = searchParams.get('published') === 'true';
    const featured = searchParams.get('featured') === 'true';
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    const where: any = {};

    if (isPublished !== undefined) {
      where.isPublished = isPublished;
    }

    if (category) {
      where.category = category;
    }

    if (authorId) {
      where.authorId = authorId;
    }

    if (featured) {
      where.isFeatured = true;
    }

    const articles = await prisma.article.findMany({
      where,
      include: {
        author: {
          select: {
            id: true,
            name: true,
            username: true,
            avatar: true,
            title: true,
          },
        },
        _count: {
          select: {
            likes: true,
            comments: true,
            shares: true,
            bookmarks: true,
          },
        },
      },
      orderBy: [
        { isFeatured: 'desc' },
        { publishedAt: 'desc' },
        { createdAt: 'desc' },
      ],
      take: limit,
      skip: offset,
    });

    return NextResponse.json(articles);
  } catch (error) {
    console.error('Error fetching articles:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/articles - Create a new article
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = createArticleSchema.parse(body);

    // Calculate reading time (rough estimate: 200 words per minute)
    const wordCount = validatedData.content.split(/\s+/).length;
    const readTime = Math.max(1, Math.ceil(wordCount / 200));

    // Generate excerpt if not provided
    const excerpt = validatedData.excerpt || validatedData.content.substring(0, 200) + '...';

    const article = await prisma.article.create({
      data: {
        title: validatedData.title,
        subtitle: validatedData.subtitle,
        content: validatedData.content,
        excerpt,
        coverImage: validatedData.coverImage,
        tags: validatedData.tags ? JSON.stringify(validatedData.tags) : null,
        category: validatedData.category,
        readTime,
        isPublished: validatedData.isPublished,
        authorId: session.user.id,
        publishedAt: validatedData.isPublished ? new Date() : null,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            username: true,
            avatar: true,
            title: true,
          },
        },
        _count: {
          select: {
            likes: true,
            comments: true,
            shares: true,
            bookmarks: true,
          },
        },
      },
    });

    return NextResponse.json(article, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error creating article:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}