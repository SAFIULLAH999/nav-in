import { NextRequest, NextResponse } from 'next/server'
import { subscribe, publish, jobBroadcast, postBroadcast, notificationBroadcast } from '@/lib/realtime'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const type = req.nextUrl.searchParams.get('type') || '*'

  const stream = new ReadableStream({
    start(controller) {
      const unsub = subscribe(controller)
      controller.signal.addEventListener('cancel', unsub)
      controller.enqueue(new TextEncoder().encode('event: connected\ndata: {"ok":true}\n\n'))
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  })
}

export async function POST(req: NextRequest) {
  const { event, data } = await req.json()

  if (event === 'job_update') jobBroadcast(data)
  else if (event === 'post_update') postBroadcast(data)
  else if (event === 'notification_update') notificationBroadcast(data)
  else publish(event, data)

  return NextResponse.json({ ok: true, recipients: true })
}
