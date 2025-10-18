import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const submitAttemptSchema = z.object({
  answers: z.record(z.string()), // questionId -> userAnswer
  timeSpent: z.number().positive(), // in seconds
});

// POST /api/quizzes/[id]/attempt - Submit quiz attempt
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: quizId } = params;
    const body = await request.json();
    const validatedData = submitAttemptSchema.parse(body);

    // Get quiz with questions
    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId },
      include: {
        questions: {
          orderBy: {
            order: 'asc',
          },
        },
      },
    });

    if (!quiz) {
      return NextResponse.json({ error: 'Quiz not found' }, { status: 404 });
    }

    if (!quiz.isActive) {
      return NextResponse.json({ error: 'Quiz is not active' }, { status: 400 });
    }

    // Check if user already completed this quiz
    const existingAttempt = await prisma.quizAttempt.findUnique({
      where: {
        userId_quizId: {
          userId: session.user.id,
          quizId: quizId,
        },
      },
    });

    if (existingAttempt) {
      return NextResponse.json(
        { error: 'Quiz already completed' },
        { status: 400 }
      );
    }

    // Calculate score
    let totalPoints = 0;
    let earnedPoints = 0;

    const answers = validatedData.answers;

    for (const question of quiz.questions) {
      totalPoints += question.points;

      const userAnswer = answers[question.id];
      if (userAnswer && userAnswer.trim().toLowerCase() === question.correctAnswer.trim().toLowerCase()) {
        earnedPoints += question.points;
      }
    }

    const score = Math.round((earnedPoints / totalPoints) * 100);
    const passed = score >= quiz.passingScore;

    // Create attempt record
    const attempt = await prisma.quizAttempt.create({
      data: {
        userId: session.user.id,
        quizId: quizId,
        score: score,
        totalPoints: totalPoints,
        earnedPoints: earnedPoints,
        answers: JSON.stringify(answers),
        timeSpent: validatedData.timeSpent,
        passed: passed,
      },
    });

    return NextResponse.json({
      ...attempt,
      quiz: {
        title: quiz.title,
        skill: quiz.skillId,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error submitting quiz attempt:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}