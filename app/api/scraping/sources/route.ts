import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const createSourceSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  baseUrl: z.string().url('Invalid URL'),
  rateLimit: z.number().min(1).max(10000).default(1000),
  config: z.record(z.any()).optional(),
});

// GET /api/scraping/sources - Get all job sources
export async function GET() {
  try {
    const sources = await prisma.jobSource.findMany({
      include: {
        _count: {
          select: {
            scrapingJobs: true,
            scrapingSessions: true,
            queue: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(sources);
  } catch (error) {
    console.error('Error fetching job sources:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/scraping/sources - Create a new job source
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = createSourceSchema.parse(body);

    // Check if source already exists
    const existingSource = await prisma.jobSource.findUnique({
      where: { name: validatedData.name },
    });

    if (existingSource) {
      return NextResponse.json(
        { error: 'Source already exists' },
        { status: 400 }
      );
    }

    const source = await prisma.jobSource.create({
      data: {
        name: validatedData.name,
        baseUrl: validatedData.baseUrl,
        rateLimit: validatedData.rateLimit,
        config: validatedData.config ? JSON.stringify(validatedData.config) : null,
      },
    });

    return NextResponse.json(source, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error creating job source:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}