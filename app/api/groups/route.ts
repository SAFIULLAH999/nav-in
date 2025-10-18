import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const createGroupSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
  description: z.string().max(500, 'Description too long').optional(),
  isPrivate: z.boolean().default(false),
});

// GET /api/groups - Get all groups
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    const where: any = {
      isActive: true,
    };

    if (query) {
      where.OR = [
        { name: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } },
      ];
    }

    const groups = await prisma.group.findMany({
      where,
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            username: true,
            avatar: true,
          },
        },
        memberships: {
          where: {
            status: 'ACTIVE',
          },
          select: {
            id: true,
            role: true,
          },
        },
        count: true,
      },
      orderBy: [
        { memberCount: 'desc' },
        { createdAt: 'desc' },
      ],
      take: limit,
      skip: offset,
    });

    return NextResponse.json(groups);
  } catch (error) {
    console.error('Error fetching groups:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/groups - Create a new group
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = createGroupSchema.parse(body);

    // Generate slug from name
    const slug = validatedData.name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();

    // Check if slug already exists
    const existingGroup = await prisma.group.findUnique({
      where: { slug },
    });

    if (existingGroup) {
      return NextResponse.json(
        { error: 'Group with similar name already exists' },
        { status: 400 }
      );
    }

    // Create group
    const group = await prisma.group.create({
      data: {
        name: validatedData.name,
        description: validatedData.description,
        slug,
        isPrivate: validatedData.isPrivate,
        createdBy: session.user.id,
        memberCount: 1, // Creator is first member
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            username: true,
            avatar: true,
          },
        },
      },
    });

    // Add creator as admin member
    await prisma.groupMembership.create({
      data: {
        userId: session.user.id,
        groupId: group.id,
        role: 'ADMIN',
        status: 'ACTIVE',
      },
    });

    // Create group count record
    await prisma.groupCount.create({
      data: {
        groupId: group.id,
        members: 1,
        activeMembers: 1,
      },
    });

    return NextResponse.json(group, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error creating group:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}