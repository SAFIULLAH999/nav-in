import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const createQuizSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  skillId: z.string().min(1, 'Skill ID is required'),
  difficulty: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED']).default('INTERMEDIATE'),
  timeLimit: z.number().positive().optional(),
  passingScore: z.number().min(0).max(100).default(70),
  questions: z.array(z.object({
    question: z.string().min(1, 'Question is required'),
    type: z.enum(['MULTIPLE_CHOICE', 'TRUE_FALSE', 'SHORT_ANSWER']).default('MULTIPLE_CHOICE'),
    options: z.array(z.string()).optional(),
    correctAnswer: z.string().min(1, 'Correct answer is required'),
    points: z.number().positive().default(1),
    explanation: z.string().optional(),
  })).min(1, 'At least one question is required'),
});

// GET /api/quizzes - Get all available quizzes
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const skillId = searchParams.get('skillId');
    const difficulty = searchParams.get('difficulty');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    const where: any = {
      isActive: true,
    };

    if (skillId) {
      where.skillId = skillId;
    }

    if (difficulty) {
      where.difficulty = difficulty;
    }

    const quizzes = await prisma.quiz.findMany({
      where,
      include: {
        skill: true,
        creator: {
          select: {
            id: true,
            name: true,
            username: true,
            avatar: true,
          },
        },
        questions: {
          select: {
            id: true,
            question: true,
            type: true,
            points: true,
            order: true,
          },
          orderBy: {
            order: 'asc',
          },
        },
        _count: {
          select: {
            attempts: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
      skip: offset,
    });

    return NextResponse.json(quizzes);
  } catch (error) {
    console.error('Error fetching quizzes:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/quizzes - Create a new quiz
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = createQuizSchema.parse(body);

    // Check if skill exists
    const skill = await prisma.skill.findUnique({
      where: { id: validatedData.skillId },
    });

    if (!skill) {
      return NextResponse.json(
        { error: 'Skill not found' },
        { status: 404 }
      );
    }

    // Create quiz and questions in a transaction
    const quiz = await prisma.$transaction(async (tx) => {
      const newQuiz = await tx.quiz.create({
        data: {
          title: validatedData.title,
          description: validatedData.description,
          skillId: validatedData.skillId,
          difficulty: validatedData.difficulty,
          timeLimit: validatedData.timeLimit,
          passingScore: validatedData.passingScore,
          createdBy: session.user.id,
        },
      });

      // Create questions
      const questions = await Promise.all(
        validatedData.questions.map((question, index) =>
          tx.quizQuestion.create({
            data: {
              quizId: newQuiz.id,
              question: question.question,
              type: question.type,
              options: question.options ? JSON.stringify(question.options) : null,
              correctAnswer: question.correctAnswer,
              points: question.points,
              order: index + 1,
              explanation: question.explanation,
            },
          })
        )
      );

      return { ...newQuiz, questions };
    });

    return NextResponse.json(quiz, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error creating quiz:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}