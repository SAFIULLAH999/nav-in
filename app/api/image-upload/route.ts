import { NextRequest, NextResponse } from 'next/server'
import { ImageHandler, ImageUtils } from '@/lib/image-handler'
import { prisma } from '@/lib/prisma'
import jwt from 'jsonwebtoken'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '')

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as any
    const userId = decoded.userId

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Parse form data
    const formData = await req.formData()
    const file = formData.get('file') as File | null
    const folder = formData.get('folder') as string || 'user-uploads'
    const watermark = formData.get('watermark') as string || ''
    const resizeWidth = formData.get('resizeWidth') ? parseInt(formData.get('resizeWidth') as string) : undefined
    const resizeHeight = formData.get('resizeHeight') ? parseInt(formData.get('resizeHeight') as string) : undefined
    const quality = formData.get('quality') ? parseInt(formData.get('quality') as string) : 85

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Convert file to buffer
    const fileBuffer = Buffer.from(await file.arrayBuffer())

    // Process image
    const result = await ImageUtils.processUpload(fileBuffer, {
      folder,
      resize: {
        width: resizeWidth,
        height: resizeHeight,
        fit: 'cover'
      },
      optimize: {
        quality,
        format: 'auto',
        progressive: true
      },
      watermark: watermark || undefined
    })

    // Save to database
    const imageRecord = await prisma.profileMedia.create({
      data: {
        userId,
        type: 'IMAGE',
        url: result.secure_url,
        thumbnail: result.variants.thumbnail,
        medium: result.variants.medium,
        large: result.variants.large,
        title: file.name,
        category: 'PROFILE_PHOTO',
        metadata: JSON.stringify({
          originalName: file.name,
          size: file.size,
          type: file.type,
          dimensions: {
            width: resizeWidth,
            height: resizeHeight
          },
          quality,
          watermark: watermark || null
        }),
        isPublic: true
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Image uploaded successfully',
      data: {
        id: imageRecord.id,
        url: imageRecord.url,
        thumbnail: imageRecord.thumbnail,
        medium: imageRecord.medium,
        large: imageRecord.large,
        variants: result.variants
      }
    })
  } catch (error) {
    console.error('Image upload failed:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '')

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as any
    const userId = decoded.userId

    const { searchParams } = new URL(req.url)
    const category = searchParams.get('category')
    const type = searchParams.get('type')
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit') as string) : 10
    const offset = searchParams.get('offset') ? parseInt(searchParams.get('offset') as string) : 0

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const where: any = { userId }

    if (category) {
      where.category = category
    }

    if (type) {
      where.type = type
    }

    const images = await prisma.profileMedia.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: offset,
      take: limit
    })

    return NextResponse.json({
      success: true,
      data: {
        images,
        total: await prisma.profileMedia.count({ where }),
        hasMore: images.length === limit
      }
    })
  } catch (error) {
    console.error('Error fetching images:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '')

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as any
    const userId = decoded.userId

    const { searchParams } = new URL(req.url)
    const imageId = searchParams.get('imageId')

    if (!imageId) {
      return NextResponse.json({ error: 'Image ID is required' }, { status: 400 })
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get image record
    const image = await prisma.profileMedia.findUnique({
      where: { id: imageId }
    })

    if (!image) {
      return NextResponse.json({ error: 'Image not found' }, { status: 404 })
    }

    // Check ownership
    if (image.userId !== userId) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Extract public ID from URL
    const publicId = image.url.split('/').pop()?.split('.')[0]

    if (publicId) {
      // Delete from Cloudinary
      await ImageHandler.deleteImage(publicId)
    }

    // Delete from database
    await prisma.profileMedia.delete({
      where: { id: imageId }
    })

    return NextResponse.json({
      success: true,
      message: 'Image deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting image:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}