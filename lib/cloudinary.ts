import { v2 as cloudinary } from 'cloudinary'
import { Readable } from 'stream'

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

export interface UploadResult {
  public_id: string
  secure_url: string
  width?: number
  height?: number
  format?: string
  bytes?: number
  url?: string
}

export interface UploadOptions {
  folder?: string
  transformation?: Array<{
    width?: number
    height?: number
    crop?: string
    quality?: string | number
    format?: string
  }>
  resource_type?: 'image' | 'video' | 'raw' | 'auto'
  public_id?: string
  overwrite?: boolean
  format?: string
  quality?: string | number
}

export class CloudinaryService {
  // Upload file buffer to Cloudinary
  static async uploadFromBuffer(
    buffer: Buffer,
    options: UploadOptions = {}
  ): Promise<UploadResult> {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: options.folder || 'navin-platform',
          resource_type: options.resource_type || 'auto',
          public_id: options.public_id,
          overwrite: options.overwrite || false,
          format: options.format,
          quality: options.quality,
          ...options
        },
        (error, result) => {
          if (error) {
            reject(error)
          } else if (result) {
            resolve(result as UploadResult)
          } else {
            reject(new Error('Upload failed - no result returned'))
          }
        }
      )

      const stream = Readable.from(buffer)
      stream.pipe(uploadStream)
    })
  }

  // Upload from file path
  static async uploadFromPath(
    filePath: string,
    options: UploadOptions = {}
  ): Promise<UploadResult> {
    try {
      const result = await cloudinary.uploader.upload(filePath, {
        folder: options.folder || 'navin-platform',
        resource_type: options.resource_type || 'auto',
        public_id: options.public_id,
        overwrite: options.overwrite || false,
        format: options.format,
        quality: options.quality,
        ...options
      })

      return result as UploadResult
    } catch (error) {
      throw new Error(`Cloudinary upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  // Upload from URL
  static async uploadFromUrl(
    url: string,
    options: UploadOptions = {}
  ): Promise<UploadResult> {
    try {
      const result = await cloudinary.uploader.upload(url, {
        folder: options.folder || 'navin-platform',
        resource_type: options.resource_type || 'auto',
        public_id: options.public_id,
        overwrite: options.overwrite || false,
        format: options.format,
        quality: options.quality,
        ...options
      })

      return result as UploadResult
    } catch (error) {
      throw new Error(`Cloudinary upload from URL failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  // Delete file from Cloudinary
  static async deleteFile(publicId: string): Promise<void> {
    try {
      await cloudinary.uploader.destroy(publicId)
    } catch (error) {
      throw new Error(`Cloudinary delete failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  // Get optimized image URL
  static getOptimizedImageUrl(
    publicId: string,
    options: {
      width?: number
      height?: number
      quality?: string | number
      format?: string
      crop?: string
      gravity?: string
    } = {}
  ): string {
    const transformations: any = {}

    if (options.width) transformations.width = options.width
    if (options.height) transformations.height = options.height
    if (options.quality) transformations.quality = options.quality
    if (options.format) transformations.format = options.format
    if (options.crop) transformations.crop = options.crop
    if (options.gravity) transformations.gravity = options.gravity

    return cloudinary.url(publicId, {
      ...transformations,
      secure: true
    })
  }

  // Generate thumbnail URL
  static getThumbnailUrl(
    publicId: string,
    size: { width: number; height: number } = { width: 150, height: 150 }
  ): string {
    return cloudinary.url(publicId, {
      width: size.width,
      height: size.height,
      crop: 'fill',
      gravity: 'face',
      quality: 'auto',
      format: 'jpg',
      secure: true
    })
  }

  // Generate avatar URL with face detection
  static getAvatarUrl(
    publicId: string,
    size: { width: number; height: number } = { width: 200, height: 200 }
  ): string {
    return cloudinary.url(publicId, {
      width: size.width,
      height: size.height,
      crop: 'thumb',
      gravity: 'face',
      quality: 'auto',
      format: 'jpg',
      secure: true
    })
  }

  // Generate multiple image sizes for responsive images
  static getResponsiveImageUrls(
    publicId: string,
    sizes: Array<{ width: number; height: number; quality?: string | number }>
  ): Array<{ url: string; width: number; height: number }> {
    return sizes.map(size => ({
      url: cloudinary.url(publicId, {
        width: size.width,
        height: size.height,
        crop: 'fill',
        gravity: 'auto',
        quality: size.quality || 'auto',
        format: 'jpg',
        secure: true
      }),
      width: size.width,
      height: size.height
    }))
  }

  // Validate file before upload
  static validateFile(file: {
    buffer?: Buffer
    size?: number
    mimetype?: string
    originalname?: string
  }): { valid: boolean; error?: string } {
    // Check file size (max 10MB)
    if (file.size && file.size > 10 * 1024 * 1024) {
      return { valid: false, error: 'File size must be less than 10MB' }
    }

    // Check file type
    const allowedTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/webp',
      'video/mp4',
      'video/webm',
      'video/quicktime',
      'application/pdf'
    ]

    if (file.mimetype && !allowedTypes.includes(file.mimetype)) {
      return { valid: false, error: 'File type not allowed' }
    }

    return { valid: true }
  }

  // Generate signed upload URL for direct client-side uploads
  static async generateUploadSignature(
    options: {
      folder?: string
      public_id?: string
      overwrite?: boolean
      format?: string
      quality?: string | number
      expires_at?: number
    } = {}
  ): Promise<{
    signature: string
    timestamp: number
    cloud_name: string
    api_key: string
    upload_url: string
  }> {
    const timestamp = Math.round(Date.now() / 1000)
    const expiresAt = options.expires_at || timestamp + (60 * 60) // 1 hour default

    // Create signature string
    const params = {
      folder: options.folder || 'navin-platform',
      public_id: options.public_id,
      overwrite: options.overwrite || false,
      format: options.format,
      quality: options.quality,
      timestamp: expiresAt,
    }

    // Remove undefined values
    Object.keys(params).forEach(key => {
      if (params[key as keyof typeof params] === undefined) {
        delete params[key as keyof typeof params]
      }
    })

    // Generate signature
    const signature = cloudinary.utils.api_sign_request(params, process.env.CLOUDINARY_API_SECRET!)

    return {
      signature,
      timestamp: expiresAt,
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
      api_key: process.env.CLOUDINARY_API_KEY!,
      upload_url: `https://api.cloudinary.com/v1_1/${process.env.CLOUDINARY_CLOUD_NAME}/auto/upload`
    }
  }

  // Extract public ID from Cloudinary URL
  static extractPublicId(url: string): string | null {
    try {
      const matches = url.match(/\/v\d+\/(.+)\.\w+$/)
      return matches ? matches[1] : null
    } catch {
      return null
    }
  }

  // Batch delete files
  static async deleteFiles(publicIds: string[]): Promise<void> {
    try {
      await cloudinary.api.delete_resources(publicIds)
    } catch (error) {
      throw new Error(`Cloudinary batch delete failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  // Get asset info
  static async getAssetInfo(publicId: string): Promise<any> {
    try {
      const result = await cloudinary.api.resource(publicId)
      return result
    } catch (error) {
      throw new Error(`Failed to get asset info: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }
}

// File upload utilities
export class FileUploadService {
  // Process uploaded file and upload to Cloudinary
  static async processAndUploadFile(
    file: {
      buffer: Buffer
      mimetype: string
      originalname: string
      size: number
    },
    options: UploadOptions = {}
  ): Promise<UploadResult> {
    // Validate file
    const validation = CloudinaryService.validateFile(file)
    if (!validation.valid) {
      throw new Error(validation.error || 'File validation failed')
    }

    // Determine folder based on file type
    let folder = options.folder
    if (!folder) {
      if (file.mimetype.startsWith('image/')) {
        folder = 'navin-platform/images'
      } else if (file.mimetype.startsWith('video/')) {
        folder = 'navin-platform/videos'
      } else {
        folder = 'navin-platform/documents'
      }
    }

    // Generate unique public ID
    const timestamp = Date.now()
    const randomSuffix = Math.random().toString(36).substring(2, 8)
    const publicId = `upload_${timestamp}_${randomSuffix}`

    // Upload to Cloudinary
    const result = await CloudinaryService.uploadFromBuffer(file.buffer, {
      ...options,
      folder,
      public_id: publicId,
      quality: options.quality || 'auto',
      format: options.format || (file.mimetype.startsWith('image/') ? 'jpg' : undefined)
    })

    return result
  }

  // Process avatar upload with face detection
  static async processAvatarUpload(
    file: {
      buffer: Buffer
      mimetype: string
      originalname: string
      size: number
    }
  ): Promise<UploadResult> {
    // Validate file is an image
    if (!file.mimetype.startsWith('image/')) {
      throw new Error('Avatar must be an image file')
    }

    return await this.processAndUploadFile(file, {
      folder: 'navin-platform/avatars',
      quality: 90,
      format: 'jpg'
    })
  }

  // Process post image upload
  static async processPostImageUpload(
    file: {
      buffer: Buffer
      mimetype: string
      originalname: string
      size: number
    }
  ): Promise<UploadResult> {
    // Validate file is an image
    if (!file.mimetype.startsWith('image/')) {
      throw new Error('Post image must be an image file')
    }

    return await this.processAndUploadFile(file, {
      folder: 'navin-platform/posts',
      quality: 85,
      format: 'jpg'
    })
  }

  // Process document upload (resume, etc.)
  static async processDocumentUpload(
    file: {
      buffer: Buffer
      mimetype: string
      originalname: string
      size: number
    }
  ): Promise<UploadResult> {
    // Validate file type
    const allowedDocTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ]

    if (!allowedDocTypes.includes(file.mimetype)) {
      throw new Error('Document must be PDF or Word format')
    }

    return await this.processAndUploadFile(file, {
      folder: 'navin-platform/documents',
      resource_type: 'raw'
    })
  }
}
