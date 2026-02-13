import { v2 as cloudinary } from 'cloudinary'
import { Readable } from 'stream'
import sharp from 'sharp'

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
})

export interface ImageUploadOptions {
  folder?: string
  public_id?: string
  overwrite?: boolean
  invalidate?: boolean
  transformation?: any[]
  metadata?: Record<string, any>
}

export interface ImageResizeOptions {
  width?: number
  height?: number
  fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside'
  position?: 'center' | 'top' | 'bottom' | 'left' | 'right'
  quality?: number
  format?: 'jpeg' | 'png' | 'webp' | 'avif'
}

export interface ImageOptimizationOptions {
  compression?: 'lossless' | 'lossy'
  quality?: number
  progressive?: boolean
  stripMetadata?: boolean
  format?: 'auto' | 'jpeg' | 'png' | 'webp' | 'avif'
}

export class ImageHandler {
  /**
   * Upload image to Cloudinary with optimizations
   */
  static async uploadImage(
    fileBuffer: Buffer,
    options: ImageUploadOptions = {}
  ): Promise<{
    url: string
    secure_url: string
    public_id: string
    format: string
    width: number
    height: number
    bytes: number
    etag: string
  }> {
    try {
      const uploadOptions = {
        folder: options.folder || 'navin-platform',
        public_id: options.public_id,
        overwrite: options.overwrite || true,
        invalidate: options.invalidate || true,
        resource_type: 'image' as const,
        transformation: options.transformation || [
          { quality: 'auto:best' },
          { fetch_format: 'auto' }
        ],
        ...options.metadata
      }

      const result = await cloudinary.uploader.upload(
        `data:image/jpeg;base64,${fileBuffer.toString('base64')}`,
        uploadOptions
      )

      return {
        url: result.url,
        secure_url: result.secure_url,
        public_id: result.public_id,
        format: result.format,
        width: result.width,
        height: result.height,
        bytes: result.bytes,
        etag: result.etag
      }
    } catch (error) {
      console.error('Image upload failed:', error)
      throw new Error('Failed to upload image')
    }
  }

  /**
   * Optimize image using Sharp
   */
  static async optimizeImage(
    buffer: Buffer,
    options: ImageOptimizationOptions = {}
  ): Promise<Buffer> {
    try {
      const sharpOptions = {
        quality: options.quality || 80,
        progressive: options.progressive || true,
        stripMetadata: options.stripMetadata || true
      }

      let image = sharp(buffer)

      // Apply compression settings
      if (options.compression === 'lossless') {
        sharpOptions.quality = 100
      }

      // Convert format if specified
      if (options.format === 'webp') {
        image = image.webp({ quality: sharpOptions.quality })
      } else if (options.format === 'avif') {
        image = image.avif({ quality: sharpOptions.quality })
      } else if (options.format === 'jpeg') {
        image = image.jpeg({ quality: sharpOptions.quality, progressive: sharpOptions.progressive })
      } else if (options.format === 'png') {
        image = image.png({ compressionLevel: 9, progressive: sharpOptions.progressive })
      } else {
        // Auto format - try WebP first, fallback to JPEG
        image = image.webp({ quality: sharpOptions.quality })
          .jpeg({ quality: sharpOptions.quality, progressive: sharpOptions.progressive })
      }

      // Strip metadata if requested
      if (sharpOptions.stripMetadata) {
        image = image.withMetadata({ exif: {} })
      }

      return await image.toBuffer()
    } catch (error) {
      console.error('Image optimization failed:', error)
      throw new Error('Failed to optimize image')
    }
  }

  /**
   * Resize image to specific dimensions
   */
  static async resizeImage(
    buffer: Buffer,
    resizeOptions: ImageResizeOptions
  ): Promise<Buffer> {
    try {
      let image = sharp(buffer)

      if (resizeOptions.width || resizeOptions.height) {
        image = image.resize({
          width: resizeOptions.width,
          height: resizeOptions.height,
          fit: resizeOptions.fit || 'cover',
          position: resizeOptions.position || 'center'
        })
      }

      if (resizeOptions.format) {
        switch (resizeOptions.format) {
          case 'jpeg':
            image = image.jpeg({ quality: resizeOptions.quality || 80 })
            break
          case 'png':
            image = image.png({ quality: resizeOptions.quality || 80 })
            break
          case 'webp':
            image = image.webp({ quality: resizeOptions.quality || 80 })
            break
          case 'avif':
            image = image.avif({ quality: resizeOptions.quality || 80 })
            break
        }
      }

      return await image.toBuffer()
    } catch (error) {
      console.error('Image resize failed:', error)
      throw new Error('Failed to resize image')
    }
  }

  /**
   * Generate multiple image sizes for responsive design
   */
  static async generateResponsiveImages(
    buffer: Buffer,
    baseOptions: ImageOptimizationOptions = {}
  ): Promise<{
    original: Buffer
    thumbnail: Buffer
    medium: Buffer
    large: Buffer
  }> {
    try {
      const original = await this.optimizeImage(buffer, { ...baseOptions, format: 'auto' })
      const thumbnail = await this.resizeImage(original, { width: 150, height: 150, fit: 'cover', format: 'webp' })
      const medium = await this.resizeImage(original, { width: 600, height: 400, fit: 'cover', format: 'webp' })
      const large = await this.resizeImage(original, { width: 1200, height: 800, fit: 'cover', format: 'webp' })

      return {
        original,
        thumbnail,
        medium,
        large
      }
    } catch (error) {
      console.error('Responsive image generation failed:', error)
      throw new Error('Failed to generate responsive images')
    }
  }

  /**
   * Remove background from image
   */
  static async removeBackground(
    buffer: Buffer,
    options: { crop?: boolean; padding?: number } = {}
  ): Promise<Buffer> {
    try {
      // First optimize the image
      const optimizedBuffer = await this.optimizeImage(buffer, { format: 'png' })

      // Use Cloudinary's background removal
      const result = await cloudinary.uploader.upload(
        `data:image/png;base64,${optimizedBuffer.toString('base64')}`,
        {
          background_removal: 'cloudinary_ai',
          crop: options.crop ? 'limit' : 'fit',
          width: options.crop ? 1000 : undefined,
          height: options.crop ? 1000 : undefined,
          gravity: 'auto',
          resource_type: 'image'
        }
      )

      // Download the processed image
      const response = await fetch(result.secure_url)
      const processedBuffer = Buffer.from(await response.arrayBuffer())

      return processedBuffer
    } catch (error) {
      console.error('Background removal failed:', error)
      throw new Error('Failed to remove background')
    }
  }

  /**
   * Add watermark to image
   */
  static async addWatermark(
    buffer: Buffer,
    watermarkText: string,
    options: {
      position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center'
      opacity?: number
      fontSize?: number
      color?: string
    } = {}
  ): Promise<Buffer> {
    try {
      const positionMap = {
        'top-left': 'northwest',
        'top-right': 'northeast',
        'bottom-left': 'southwest',
        'bottom-right': 'southeast',
        'center': 'center'
      }

      const result = await cloudinary.uploader.upload(
        `data:image/jpeg;base64,${buffer.toString('base64')}`,
        {
          transformation: [
            {
              overlay: {
                text: watermarkText,
                font_family: 'Arial',
                font_size: options.fontSize || 50,
                font_weight: 'bold',
                text_color: options.color || 'rgba(255,255,255,0.7)'
              },
              gravity: positionMap[options.position || 'bottom-right'],
              opacity: options.opacity || 50
            }
          ],
          resource_type: 'image'
        }
      )

      const response = await fetch(result.secure_url)
      return Buffer.from(await response.arrayBuffer())
    } catch (error) {
      console.error('Watermark addition failed:', error)
      throw new Error('Failed to add watermark')
    }
  }

  /**
   * Generate image variants for different use cases
   */
  static async generateImageVariants(
    buffer: Buffer,
    variants: {
      name: string
      resize?: ImageResizeOptions
      optimize?: ImageOptimizationOptions
    }[]
  ): Promise<Record<string, Buffer>> {
    try {
      const results: Record<string, Buffer> = {}

      for (const variant of variants) {
        let processedBuffer = buffer

        // Apply resize if specified
        if (variant.resize) {
          processedBuffer = await this.resizeImage(processedBuffer, variant.resize)
        }

        // Apply optimization if specified
        if (variant.optimize) {
          processedBuffer = await this.optimizeImage(processedBuffer, variant.optimize)
        }

        results[variant.name] = processedBuffer
      }

      return results
    } catch (error) {
      console.error('Image variant generation failed:', error)
      throw new Error('Failed to generate image variants')
    }
  }

  /**
   * Validate image file
   */
  static async validateImage(buffer: Buffer): Promise<{
    isValid: boolean
    format: string
    width: number
    height: number
    size: number
    error?: string
  }> {
    try {
      const metadata = await sharp(buffer).metadata()

      const isValid = metadata.format && metadata.width && metadata.height
      const maxFileSize = 10 * 1024 * 1024 // 10MB limit

      if (!isValid) {
        return {
          isValid: false,
          format: '',
          width: 0,
          height: 0,
          size: buffer.length,
          error: 'Invalid image format'
        }
      }

      if (buffer.length > maxFileSize) {
        return {
          isValid: false,
          format: metadata.format!,
          width: metadata.width!,
          height: metadata.height!,
          size: buffer.length,
          error: 'Image file too large (max 10MB)'
        }
      }

      return {
        isValid: true,
        format: metadata.format!,
        width: metadata.width!,
        height: metadata.height!,
        size: buffer.length
      }
    } catch (error) {
      return {
        isValid: false,
        format: '',
        width: 0,
        height: 0,
        size: buffer.length,
        error: 'Invalid image file'
      }
    }
  }

  /**
   * Delete image from Cloudinary
   */
  static async deleteImage(publicId: string): Promise<boolean> {
    try {
      await cloudinary.uploader.destroy(publicId)
      return true
    } catch (error) {
      console.error('Image deletion failed:', error)
      return false
    }
  }

  /**
   * Get image URL with transformations
   */
  static getImageUrl(
    publicId: string,
    transformations: any[] = []
  ): string {
    return cloudinary.url(publicId, {
      transformation: transformations
    })
  }

}

// Utility functions for common image operations
export const ImageUtils = {
  /**
   * Process uploaded file buffer
   */
  async processUpload(
    fileBuffer: Buffer,
    options: {
      folder?: string
      resize?: ImageResizeOptions
      optimize?: ImageOptimizationOptions
      watermark?: string
    } = {}
  ): Promise<{
    url: string
    secure_url: string
    public_id: string
    variants: Record<string, string>
  }> {
    try {
      // Validate image
      const validation = await ImageHandler.validateImage(fileBuffer)
      if (!validation.isValid) {
        throw new Error(validation.error || 'Invalid image')
      }

      // Optimize image
      const optimizedBuffer = await ImageHandler.optimizeImage(
        fileBuffer,
        options.optimize || { format: 'auto', quality: 85 }
      )

      // Upload original
      const uploadResult = await ImageHandler.uploadImage(optimizedBuffer, {
        folder: options.folder,
        transformation: [
          { quality: 'auto:best' },
          { fetch_format: 'auto' }
        ]
      })

      // Generate variants
      const variants = await ImageHandler.generateImageVariants(optimizedBuffer, [
        {
          name: 'thumbnail',
          resize: { width: 150, height: 150, fit: 'cover' },
          optimize: { format: 'webp', quality: 80 }
        },
        {
          name: 'medium',
          resize: { width: 600, height: 400, fit: 'cover' },
          optimize: { format: 'webp', quality: 85 }
        },
        {
          name: 'large',
          resize: { width: 1200, height: 800, fit: 'cover' },
          optimize: { format: 'webp', quality: 90 }
        }
      ])

      // Upload variants
      const variantUrls: Record<string, string> = {}
      for (const [name, buffer] of Object.entries(variants)) {
        const result = await ImageHandler.uploadImage(buffer, {
          folder: options.folder,
          public_id: `${uploadResult.public_id}_${name}`
        })
        variantUrls[name] = result.secure_url
      }

      // Add watermark if specified
      if (options.watermark) {
        const watermarkedBuffer = await ImageHandler.addWatermark(optimizedBuffer, options.watermark)
        await ImageHandler.uploadImage(watermarkedBuffer, {
          folder: options.folder,
          public_id: `${uploadResult.public_id}_watermarked`
        })
      }

      return {
        url: uploadResult.url,
        secure_url: uploadResult.secure_url,
        public_id: uploadResult.public_id,
        variants: variantUrls
      }
    } catch (error) {
      console.error('Image processing failed:', error)
      throw error
    }
  },

  /**
   * Get responsive image srcSet
   */
  getResponsiveSrcSet(publicId: string): string {
    const sizes = [
      { width: 300, quality: 50 },
      { width: 600, quality: 70 },
      { width: 1200, quality: 85 },
      { width: 2400, quality: 90 }
    ]

    return sizes
      .map(size => {
        const url = ImageHandler.getImageUrl(publicId, [
          { width: size.width, crop: 'limit' },
          { quality: size.quality },
          { fetch_format: 'auto' }
        ])
        return `${url} ${size.width}w`
      })
      .join(', ')
  }
}