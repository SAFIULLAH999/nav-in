import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const createAtsIntegrationSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
  provider: z.enum(['GREENHOUSE', 'LEVER', 'WORKDAY', 'BAMBOOHR', 'ICIMS', 'ADP', 'PAYCOR', 'CUSTOM']),
  apiEndpoint: z.string().url().optional(),
  apiKey: z.string().optional(),
  accessToken: z.string().optional(),
  refreshToken: z.string().optional(),
  webhookSecret: z.string().optional(),
  configuration: z.record(z.any()).optional(),
  syncFrequency: z.number().min(60).max(86400).default(3600), // 1 minute to 24 hours
});

// GET /api/ats-integrations - Get ATS integrations for user's companies
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get companies where user is an admin
    const companies = await prisma.company.findMany({
      where: {
        employees: {
          some: {
            userId: session.user.id,
            isAdmin: true,
          },
        },
      },
      include: {
        atsIntegrations: {
          include: {
            creator: {
              select: {
                id: true,
                name: true,
                username: true,
              },
            },
            _count: {
              select: {
                syncLogs: true,
                jobMappings: true,
                candidateMappings: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    return NextResponse.json(companies);
  } catch (error) {
    console.error('Error fetching ATS integrations:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/ats-integrations - Create a new ATS integration
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = createAtsIntegrationSchema.parse(body);

    // Verify user has admin access to the company
    const company = await prisma.company.findFirst({
      where: {
        id: body.companyId,
        employees: {
          some: {
            userId: session.user.id,
            isAdmin: true,
          },
        },
      },
    });

    if (!company) {
      return NextResponse.json(
        { error: 'Company not found or access denied' },
        { status: 404 }
      );
    }

    // Check if integration already exists for this provider
    const existingIntegration = await prisma.atsIntegration.findUnique({
      where: {
        companyId_provider: {
          companyId: body.companyId,
          provider: validatedData.provider,
        },
      },
    });

    if (existingIntegration) {
      return NextResponse.json(
        { error: 'Integration for this provider already exists' },
        { status: 400 }
      );
    }

    // Encrypt sensitive data before storing
    const integration = await prisma.atsIntegration.create({
      data: {
        companyId: body.companyId,
        name: validatedData.name,
        provider: validatedData.provider,
        apiEndpoint: validatedData.apiEndpoint,
        apiKey: validatedData.apiKey ? Buffer.from(validatedData.apiKey).toString('base64') : null,
        accessToken: validatedData.accessToken ? Buffer.from(validatedData.accessToken).toString('base64') : null,
        refreshToken: validatedData.refreshToken ? Buffer.from(validatedData.refreshToken).toString('base64') : null,
        webhookSecret: validatedData.webhookSecret ? Buffer.from(validatedData.webhookSecret).toString('base64') : null,
        configuration: validatedData.configuration ? JSON.stringify(validatedData.configuration) : null,
        syncFrequency: validatedData.syncFrequency,
        createdBy: session.user.id,
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            username: true,
          },
        },
      },
    });

    return NextResponse.json(integration, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error creating ATS integration:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}