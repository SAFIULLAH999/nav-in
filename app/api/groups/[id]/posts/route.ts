import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const createPostSchema = z.object({
  content: z.string().min(1, 'Content is required').max(2000, 'Content too long'),
  image: z.string().optional(),
  video: z.string().optional(),
});

// GET /api/groups/[id]/posts - Get group posts
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id: groupId } = params;
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Check if group exists and user has access
    const group = await prisma.group.findUnique({
      where: { id: groupId },
      include: {
        memberships: {
          where: {
            userId: (await getServerSession(authOptions))?.user?.id || '',
            status: 'ACTIVE',
          },
        },
      },
    });

    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    if (!group.isActive) {
      return NextResponse.json({ error: 'Group is not active' }, { status: 400 });
    }

    // Check if group is private and user is not a member
    if (group.isPrivate) {
      const session = await getServerSession(authOptions);
      if (!session?.user?.id || group.memberships.length === 0) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 });
      }
    }

    const posts = await prisma.groupPost.findMany({
      where: {
        groupId: groupId,
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
      },
      orderBy: [
        { isPinned: 'desc' },
        { createdAt: 'desc' },
      ],
      take: limit,
      skip: offset,
    });

    return NextResponse.json(posts);
  } catch (error) {
    console.error('Error fetching group posts:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/groups/[id]/posts - Create a new post in group
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: groupId } = params;
    const body = await request.json();
    const validatedData = createPostSchema.parse(body);

    // Check if group exists and user is a member
    const membership = await prisma.groupMembership.findUnique({
      where: {
        userId_groupId: {
          userId: session.user.id,
          groupId: groupId,
        },
      },
    });

    if (!membership || membership.status !== 'ACTIVE') {
      return NextResponse.json({ error: 'Not authorized to post in this group' }, { status: 403 });
    }

    const group = await prisma.group.findUnique({
      where: { id: groupId },
    });

    if (!group || !group.isActive) {
      return NextResponse.json({ error: 'Group not found or inactive' }, { status: 404 });
    }

    // Create post
    const post = await prisma.groupPost.create({
      data: {
        content: validatedData.content,
        image: validatedData.image,
        video: validatedData.video,
        authorId: session.user.id,
        groupId: groupId,
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
      },
    });

    // Update post count
    await prisma.groupCount.update({
      where: { groupId },
      data: {
        posts: {
          increment: 1,
        },
      },
    });

    return NextResponse.json(post, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error creating group post:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}