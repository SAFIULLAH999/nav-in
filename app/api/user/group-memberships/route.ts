import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/user/group-memberships - Get user's group memberships
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const memberships = await prisma.groupMembership.findMany({
      where: {
        userId: session.user.id,
      },
      include: {
        group: {
          select: {
            id: true,
            name: true,
            slug: true,
            isPrivate: true,
            isActive: true,
            memberCount: true,
            createdAt: true,
          },
        },
      },
      orderBy: {
        joinedAt: 'desc',
      },
    });

    return NextResponse.json(memberships);
  } catch (error) {
    console.error('Error fetching user group memberships:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}