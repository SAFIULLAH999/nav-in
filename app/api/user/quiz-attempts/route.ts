import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/user/quiz-attempts - Get user's quiz attempts
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const attempts = await prisma.quizAttempt.findMany({
      where: {
        userId: session.user.id,
      },
      include: {
        quiz: {
          select: {
            id: true,
            title: true,
            skill: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        completedAt: 'desc',
      },
    });

    return NextResponse.json(attempts);
  } catch (error) {
    console.error('Error fetching user quiz attempts:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}