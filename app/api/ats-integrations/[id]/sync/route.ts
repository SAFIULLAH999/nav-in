import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// POST /api/ats-integrations/[id]/sync - Trigger ATS sync
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: integrationId } = params;

    // Get integration and verify access
    const integration = await prisma.atsIntegration.findUnique({
      where: { id: integrationId },
      include: {
        company: {
          include: {
            employees: {
              where: {
                userId: session.user.id,
                isAdmin: true,
              },
            },
          },
        },
      },
    });

    if (!integration) {
      return NextResponse.json({ error: 'Integration not found' }, { status: 404 });
    }

    if (integration.company.employees.length === 0) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    if (integration.status === 'SYNCING') {
      return NextResponse.json({ error: 'Sync already in progress' }, { status: 400 });
    }

    // Update integration status to syncing
    await prisma.atsIntegration.update({
      where: { id: integrationId },
      data: {
        status: 'SYNCING',
        lastSyncAt: new Date(),
      },
    });

    // Create sync log entry
    const syncLog = await prisma.atsSyncLog.create({
      data: {
        integrationId: integrationId,
        syncType: 'FULL',
        status: 'SUCCESS', // Will be updated by sync process
        startedAt: new Date(),
      },
    });

    // Here you would trigger the actual ATS sync process
    // For now, we'll simulate it with a timeout
    setTimeout(async () => {
      try {
        // Simulate sync completion
        await prisma.atsSyncLog.update({
          where: { id: syncLog.id },
          data: {
            status: 'SUCCESS',
            recordsProcessed: 0,
            recordsCreated: 0,
            recordsUpdated: 0,
            completedAt: new Date(),
          },
        });

        await prisma.atsIntegration.update({
          where: { id: integrationId },
          data: {
            status: 'ACTIVE',
          },
        });
      } catch (error) {
        console.error('Sync process error:', error);

        await prisma.atsSyncLog.update({
          where: { id: syncLog.id },
          data: {
            status: 'ERROR',
            errorMessage: 'Sync process failed',
            completedAt: new Date(),
          },
        });

        await prisma.atsIntegration.update({
          where: { id: integrationId },
          data: {
            status: 'ERROR',
          },
        });
      }
    }, 5000); // 5 second delay for demo

    return NextResponse.json({
      message: 'Sync started',
      syncLogId: syncLog.id,
    });
  } catch (error) {
    console.error('Error starting ATS sync:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}