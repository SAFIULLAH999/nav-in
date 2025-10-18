import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '')

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as any
    const userId = decoded.userId

    const documents = await prisma.document.findMany({
      where: {
        OR: [
          { authorId: userId },
          {
            collaborators: {
              contains: userId
            }
          }
        ]
      },
      orderBy: { updatedAt: 'desc' },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            avatar: true
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      documents: documents.map((doc: any) => ({
        id: doc.id,
        title: doc.title,
        content: doc.content,
        authorId: doc.authorId,
        collaborators: JSON.parse(doc.collaborators || '[]'),
        lastModified: doc.updatedAt.toISOString(),
        isPublic: doc.isPublic
      }))
    })
  } catch (error) {
    console.error('Error fetching documents:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '')

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as any
    const userId = decoded.userId

    const { title, content, isPublic = false } = await req.json()

    const document = await prisma.document.create({
      data: {
        title: title || 'Untitled Document',
        content: content || '',
        authorId: userId,
        isPublic,
        collaborators: JSON.stringify([userId])
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            avatar: true
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      document: {
        id: document.id,
        title: document.title,
        content: document.content,
        authorId: document.authorId,
        collaborators: JSON.parse(document.collaborators || '[]'),
        lastModified: document.updatedAt.toISOString(),
        isPublic: document.isPublic
      }
    })
  } catch (error) {
    console.error('Error creating document:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}