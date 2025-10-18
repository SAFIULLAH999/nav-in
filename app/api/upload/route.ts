import { NextRequest, NextResponse } from 'next/server'
import { FileUploadService, CloudinaryService } from '@/lib/cloudinary'
import { verifyAccessToken } from '@/lib/jwt'
import { Logger } from '@/lib/logger'

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const token = authHeader.substring(7)
    const payload = verifyAccessToken(token)

    if (!payload) {
      return NextResponse.json(
        { success: false, error: 'Invalid token' },
        { status: 401 }
      )
    }

    const data = await request.formData()
    const file: File | null = data.get('file') as unknown as File
    const uploadType = data.get('type') as string || 'general' // avatar, post, document

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file received' },
        { status: 400 }
      )
    }

    // Convert File to buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    const fileData = {
      buffer,
      mimetype: file.type,
      originalname: file.name,
      size: file.size
    }

    let result

    // Process based on upload type
    switch (uploadType) {
      case 'avatar':
        result = await FileUploadService.processAvatarUpload(fileData)
        break
      case 'post':
        result = await FileUploadService.processPostImageUpload(fileData)
        break
      case 'document':
        result = await FileUploadService.processDocumentUpload(fileData)
        break
      default:
        result = await FileUploadService.processAndUploadFile(fileData)
    }

    Logger.info('File uploaded successfully', {
      userId: payload.userId,
      fileType: uploadType,
      publicId: result.public_id,
      size: result.bytes
    })

    return NextResponse.json({
      success: true,
      data: {
        url: result.secure_url,
        publicId: result.public_id,
        width: result.width,
        height: result.height,
        format: result.format,
        bytes: result.bytes
      },
      message: 'File uploaded successfully'
    })
  } catch (error) {
    Logger.error('File upload error', error as Error, {
      error: error instanceof Error ? error.message : 'Unknown error'
    })

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Upload failed'
      },
      { status: 500 }
    )
  }
}

// GET - Generate upload signature for client-side uploads
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const token = authHeader.substring(7)
    const payload = verifyAccessToken(token)

    if (!payload) {
      return NextResponse.json(
        { success: false, error: 'Invalid token' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const folder = searchParams.get('folder') || 'navin-platform'
    const expiresAt = parseInt(searchParams.get('expires_at') || '3600') // 1 hour default

    const signatureData = await CloudinaryService.generateUploadSignature({
      folder,
      expires_at: Math.round(Date.now() / 1000) + expiresAt
    })

    Logger.info('Upload signature generated', {
      userId: payload.userId,
      folder
    })

    return NextResponse.json({
      success: true,
      data: signatureData
    })
  } catch (error) {
    Logger.error('Upload signature generation error', error as Error)

    return NextResponse.json(
      { success: false, error: 'Failed to generate upload signature' },
      { status: 500 }
    )
  }
}
