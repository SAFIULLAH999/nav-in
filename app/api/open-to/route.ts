import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const openToSchema = z.object({
  type: z.enum(['WORK', 'HIRING', 'FREELANCE', 'MENTORSHIP', 'COLLABORATION', 'SPEAKING', 'VOLUNTEERING']),
  visibility: z.enum(['PUBLIC', 'CONNECTIONS_ONLY', 'PRIVATE']).default('PUBLIC'),
  message: z.string().optional(),
  expiresAt: z.string().datetime().optional(),
});

// GET /api/open-to - Get user's current open to statuses
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const openToStatuses = await prisma.openTo.findMany({
      where: {
        userId: session.user.id,
        isActive: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(openToStatuses);
  } catch (error) {
    console.error('Error fetching open to statuses:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/open-to - Create or update open to status
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = openToSchema.parse(body);

    // First, deactivate any existing status of the same type
    await prisma.openTo.updateMany({
      where: {
        userId: session.user.id,
        type: validatedData.type,
      },
      data: {
        isActive: false,
      },
    });

    // Create new open to status
    const openToStatus = await prisma.openTo.create({
      data: {
        userId: session.user.id,
        type: validatedData.type,
        visibility: validatedData.visibility,
        message: validatedData.message,
        expiresAt: validatedData.expiresAt ? new Date(validatedData.expiresAt) : null,
      },
    });

    // Update user's current open to status for quick access
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        openToStatus: validatedData.type,
      },
    });

    return NextResponse.json(openToStatus, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error creating open to status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/open-to?type=WORK - Remove open to status
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');

    if (!type) {
      return NextResponse.json(
        { error: 'Type parameter is required' },
        { status: 400 }
      );
    }

    // Deactivate the open to status
    await prisma.openTo.updateMany({
      where: {
        userId: session.user.id,
        type: type,
      },
      data: {
        isActive: false,
      },
    });

    // Update user's current open to status
    const activeStatuses = await prisma.openTo.findMany({
      where: {
        userId: session.user.id,
        isActive: true,
      },
    });

    const currentStatus = activeStatuses.length > 0 ? activeStatuses[0].type : null;

    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        openToStatus: currentStatus,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting open to status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}