import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/open-to/[userId] - Get public open to statuses for a user
export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const { userId } = params;

    const openToStatuses = await prisma.openTo.findMany({
      where: {
        userId: userId,
        isActive: true,
        visibility: {
          in: ['PUBLIC', 'CONNECTIONS_ONLY'], // Only show public and connections-only
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(openToStatuses);
  } catch (error) {
    console.error('Error fetching user open to statuses:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}