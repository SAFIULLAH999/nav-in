import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// POST /api/ats-integrations/webhook - Handle ATS webhooks
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const signature = request.headers.get('x-webhook-signature');
    const provider = request.headers.get('x-ats-provider');

    if (!signature || !provider) {
      return NextResponse.json(
        { error: 'Missing required headers' },
        { status: 400 }
      );
    }

    // Find integration by webhook secret
    const integration = await prisma.atsIntegration.findFirst({
      where: {
        provider: provider,
        webhookSecret: {
          not: null,
        },
      },
    });

    if (!integration) {
      return NextResponse.json(
        { error: 'Integration not found' },
        { status: 404 }
      );
    }

    // Verify webhook signature (simplified for demo)
    const expectedSignature = Buffer.from(integration.webhookSecret || '').toString('base64');
    if (signature !== expectedSignature) {
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      );
    }

    // Create sync log for webhook
    const syncLog = await prisma.atsSyncLog.create({
      data: {
        integrationId: integration.id,
        syncType: 'WEBHOOK',
        status: 'SUCCESS',
        recordsProcessed: 1,
        startedAt: new Date(),
        completedAt: new Date(),
        metadata: JSON.stringify({
          eventType: body.eventType || 'unknown',
          timestamp: body.timestamp,
        }),
      },
    });

    // Here you would process the webhook data based on the provider
    // For now, we'll just log it and mark as successful

    return NextResponse.json({
      message: 'Webhook processed successfully',
      syncLogId: syncLog.id,
    });
  } catch (error) {
    console.error('Error processing ATS webhook:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}