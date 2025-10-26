import { NextRequest, NextResponse } from 'next/server'
import { Webhook } from 'svix'
import { prisma } from '@/lib/prisma'
import * as Ably from 'ably'

const webhookSecret = process.env.CLERK_WEBHOOK_SECRET

export async function POST(req: NextRequest) {
  if (!webhookSecret) {
    console.error('CLERK_WEBHOOK_SECRET not configured')
    return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 })
  }

  const svixId = req.headers.get('svix-id')
  const svixTimestamp = req.headers.get('svix-timestamp')
  const svixSignature = req.headers.get('svix-signature')

  if (!svixId || !svixTimestamp || !svixSignature) {
    return NextResponse.json({ error: 'Missing Svix headers' }, { status: 400 })
  }

  const body = await req.text()
  const wh = new Webhook(webhookSecret)

  let evt: any

  try {
    evt = wh.verify(body, {
      'svix-id': svixId,
      'svix-timestamp': svixTimestamp,
      'svix-signature': svixSignature,
    }) as any
  } catch (err) {
    console.error('Error verifying webhook:', err)
    return NextResponse.json({ error: 'Error occurred' }, { status: 400 })
  }

  const { id } = evt.data
  const eventType = evt.type

  if (eventType === 'user.created') {
    try {
      // Fetch user details from Clerk
      const userResponse = await fetch(`https://api.clerk.com/v1/users/${id}`, {
        headers: {
          Authorization: `Bearer ${process.env.CLERK_SECRET_KEY}`,
          'Content-Type': 'application/json',
        },
      })

      if (!userResponse.ok) {
        throw new Error('Failed to fetch user from Clerk')
      }

      const userData = await userResponse.json()

      // Create or update user in database
      const user = await prisma.user.upsert({
        where: { id },
        update: {
          name: userData.first_name + ' ' + userData.last_name,
          username: userData.username,
          avatar: userData.image_url,
          email: userData.email_addresses[0]?.email_address,
          isActive: true,
        },
        create: {
          id,
          name: userData.first_name + ' ' + userData.last_name,
          username: userData.username,
          avatar: userData.image_url,
          email: userData.email_addresses[0]?.email_address,
          password: 'clerk_user', // Dummy password since auth is handled by Clerk
          isActive: true,
        },
      })

      // Publish real-time event
      if (process.env.ABLY_API_KEY) {
        const ably = new Ably.Realtime({
          key: process.env.ABLY_API_KEY,
        })

        const channel = ably.channels.get('navin-updates')
        await channel.publish('new_user', {
          userId: user.id,
          name: user.name,
          username: user.username,
          avatar: user.avatar,
          title: user.title || '',
          company: user.company || '',
          location: user.location || '',
          bio: user.bio || '',
          skills: user.skills || '',
        })

        ably.close()
      }

      return NextResponse.json({ success: true })
    } catch (error) {
      console.error('Error handling user.created:', error)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
  }

  return NextResponse.json({ success: true })
}