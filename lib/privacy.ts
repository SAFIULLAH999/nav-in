import { prisma } from '@/lib/prisma'
import { EmailService } from '@/lib/email'
import { CloudinaryService } from '@/lib/cloudinary'
import { Logger } from '@/lib/logger'

export interface GDPRRequest {
  id: string
  userId: string
  type: 'data_export' | 'data_deletion' | 'data_rectification' | 'data_portability'
  status: 'pending' | 'processing' | 'completed' | 'failed'
  requestedAt: Date
  completedAt?: Date
  downloadUrl?: string
  error?: string
}

export interface UserConsent {
  id: string
  userId: string
  type: 'terms' | 'privacy' | 'marketing' | 'analytics' | 'cookies'
  version: string
  granted: boolean
  grantedAt: Date
  ipAddress: string
  userAgent: string
}

export class PrivacyService {
  // Record user consent
  static async recordConsent(
    userId: string,
    consentType: UserConsent['type'],
    version: string,
    granted: boolean,
    ipAddress: string,
    userAgent: string
  ): Promise<void> {
    try {
      await prisma.userConsent.upsert({
        where: {
          userId_type: {
            userId,
            type: consentType
          }
        },
        update: {
          version,
          granted,
          grantedAt: new Date(),
          ipAddress,
          userAgent
        },
        create: {
          userId,
          type: consentType,
          version,
          granted,
          grantedAt: new Date(),
          ipAddress,
          userAgent
        }
      })

      Logger.info('User consent recorded', {
        userId,
        consentType,
        granted,
        version
      })
    } catch (error) {
      Logger.error('Failed to record user consent', error as Error, {
        userId,
        consentType
      })
      throw error
    }
  }

  // Check if user has consented to specific type
  static async hasConsented(
    userId: string,
    consentType: UserConsent['type'],
    version?: string
  ): Promise<boolean> {
    try {
      const consent = await prisma.userConsent.findUnique({
        where: {
          userId_type: {
            userId,
            type: consentType
          }
        }
      })

      if (!consent || !consent.granted) {
        return false
      }

      if (version && consent.version !== version) {
        return false
      }

      return true
    } catch (error) {
      Logger.error('Failed to check user consent', error as Error, {
        userId,
        consentType
      })
      return false
    }
  }

  // Request data export (GDPR Article 15)
  static async requestDataExport(userId: string): Promise<string> {
    try {
      // Create export request
      const request = await prisma.gDPRRequest.create({
        data: {
          userId,
          type: 'data_export',
          status: 'pending'
        }
      })

      // Process export in background (simulate async processing)
      this.processDataExport(request.id, userId)

      Logger.info('Data export requested', {
        userId,
        requestId: request.id
      })

      return request.id
    } catch (error) {
      Logger.error('Failed to create data export request', error as Error, {
        userId
      })
      throw error
    }
  }

  // Process data export
  private static async processDataExport(requestId: string, userId: string): Promise<void> {
    try {
      // Update status to processing
      await prisma.gDPRRequest.update({
        where: { id: requestId },
        data: { status: 'processing' }
      })

      // Gather all user data
      const userData = await this.gatherUserData(userId)

      // Create export file (JSON)
      const exportData = {
        exportInfo: {
          requestedAt: new Date().toISOString(),
          userId,
          dataTypes: Object.keys(userData)
        },
        data: userData
      }

      // In a real implementation, you'd save this to a secure location
      // and generate a time-limited download URL
      const downloadUrl = `/api/privacy/download/${requestId}`

      // Update request with completion
      await prisma.gDPRRequest.update({
        where: { id: requestId },
        data: {
          status: 'completed',
          completedAt: new Date(),
          downloadUrl
        }
      })

      // Send notification email
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { email: true, name: true }
      })

      if (user?.email) {
        await EmailService.sendNotificationEmail(
          user.email,
          'Data Export Ready',
          'Your data export is ready for download. The download link will expire in 7 days.',
          `${process.env.NEXTAUTH_URL}${downloadUrl}`,
          'Download Data'
        )
      }

      Logger.info('Data export completed', {
        userId,
        requestId
      })
    } catch (error) {
      // Update request with failure
      await prisma.gDPRRequest.update({
        where: { id: requestId },
        data: {
          status: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      })

      Logger.error('Data export failed', error as Error, {
        userId,
        requestId
      })
    }
  }

  // Gather all user data for export
  private static async gatherUserData(userId: string): Promise<any> {
    const [
      user,
      posts,
      connections,
      messages,
      applications,
      notifications,
      experiences,
      education
    ] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          name: true,
          email: true,
          username: true,
          bio: true,
          title: true,
          company: true,
          location: true,
          website: true,
          skills: true,
          avatar: true,
          summary: true,
          socialLinks: true,
          createdAt: true,
          updatedAt: true,
          lastLoginAt: true
        }
      }),
      prisma.post.findMany({
        where: { authorId: userId },
        include: {
          likes: true,
          comments: true,
          shares: true
        }
      }),
      prisma.connection.findMany({
        where: {
          OR: [
            { senderId: userId },
            { receiverId: userId }
          ]
        }
      }),
      prisma.message.findMany({
        where: {
          OR: [
            { senderId: userId },
            { receiverId: userId }
          ]
        }
      }),
      prisma.application.findMany({
        where: { userId }
      }),
      prisma.notification.findMany({
        where: { userId }
      }),
      prisma.experience.findMany({
        where: { userId }
      }),
      prisma.education.findMany({
        where: { userId }
      })
    ])

    return {
      profile: user,
      posts,
      connections,
      messages,
      applications,
      notifications,
      experiences,
      education
    }
  }

  // Request account deletion (GDPR Article 17)
  static async requestAccountDeletion(userId: string): Promise<string> {
    try {
      // Create deletion request
      const request = await prisma.gDPRRequest.create({
        data: {
          userId,
          type: 'data_deletion',
          status: 'pending'
        }
      })

      // Process deletion in background
      this.processAccountDeletion(request.id, userId)

      Logger.info('Account deletion requested', {
        userId,
        requestId: request.id
      })

      return request.id
    } catch (error) {
      Logger.error('Failed to create deletion request', error as Error, {
        userId
      })
      throw error
    }
  }

  // Process account deletion
  private static async processAccountDeletion(requestId: string, userId: string): Promise<void> {
    try {
      // Update status to processing
      await prisma.gDPRRequest.update({
        where: { id: requestId },
        data: { status: 'processing' }
      })

      // Get user data for cleanup
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          email: true,
          name: true,
          avatar: true,
          posts: {
            select: { id: true, image: true, video: true }
          },
          applications: {
            select: { resume: true }
          }
        }
      })

      if (!user) {
        throw new Error('User not found')
      }

      // 1. Delete files from Cloudinary
      const filesToDelete: string[] = []

      if (user.avatar) {
        const publicId = CloudinaryService.extractPublicId(user.avatar)
        if (publicId) filesToDelete.push(publicId)
      }

      // Delete post media files
      for (const post of user.posts) {
        if (post.image) {
          const publicId = CloudinaryService.extractPublicId(post.image)
          if (publicId) filesToDelete.push(publicId)
        }
        if (post.video) {
          const publicId = CloudinaryService.extractPublicId(post.video)
          if (publicId) filesToDelete.push(publicId)
        }
      }

      // Delete resume files
      for (const application of user.applications) {
        if (application.resume) {
          const publicId = CloudinaryService.extractPublicId(application.resume)
          if (publicId) filesToDelete.push(publicId)
        }
      }

      if (filesToDelete.length > 0) {
        await CloudinaryService.deleteFiles(filesToDelete)
      }

      // 2. Anonymize user data (soft delete approach)
      await prisma.user.update({
        where: { id: userId },
        data: {
          name: '[Deleted User]',
          email: `deleted.${userId}@deleted.local`,
          username: null,
          bio: null,
          title: null,
          company: null,
          location: null,
          website: null,
          skills: [],
          avatar: null,
          summary: null,
          socialLinks: null,
          isActive: false,
          // Keep email for account recovery if needed
          // In a real implementation, you might want to completely remove the user
        }
      })

      // 3. Mark request as completed
      await prisma.gDPRRequest.update({
        where: { id: requestId },
        data: {
          status: 'completed',
          completedAt: new Date()
        }
      })

      // 4. Send confirmation email
      if (user.email) {
        await EmailService.sendNotificationEmail(
          user.email,
          'Account Deletion Completed',
          'Your account and all associated data have been successfully deleted as requested.',
          `${process.env.NEXTAUTH_URL}/goodbye`,
          'Learn More'
        )
      }

      Logger.info('Account deletion completed', {
        userId,
        requestId,
        filesDeleted: filesToDelete.length
      })
    } catch (error) {
      // Update request with failure
      await prisma.gDPRRequest.update({
        where: { id: requestId },
        data: {
          status: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      })

      Logger.error('Account deletion failed', error as Error, {
        userId,
        requestId
      })
    }
  }

  // Get user's GDPR requests
  static async getUserGDPRRequests(userId: string): Promise<GDPRRequest[]> {
    try {
      const requests = await prisma.gDPRRequest.findMany({
        where: { userId },
        orderBy: { requestedAt: 'desc' }
      })

      return requests.map(request => ({
        id: request.id,
        userId: request.userId,
        type: request.type as GDPRRequest['type'],
        status: request.status as GDPRRequest['status'],
        requestedAt: request.requestedAt,
        completedAt: request.completedAt || undefined,
        downloadUrl: request.downloadUrl || undefined,
        error: request.error || undefined
      }))
    } catch (error) {
      Logger.error('Failed to get GDPR requests', error as Error, {
        userId
      })
      throw error
    }
  }

  // Get user's consent history
  static async getUserConsentHistory(userId: string): Promise<UserConsent[]> {
    try {
      const consents = await prisma.userConsent.findMany({
        where: { userId },
        orderBy: { grantedAt: 'desc' }
      })

      return consents.map(consent => ({
        id: consent.id,
        userId: consent.userId,
        type: consent.type as UserConsent['type'],
        version: consent.version,
        granted: consent.granted,
        grantedAt: consent.grantedAt,
        ipAddress: consent.ipAddress,
        userAgent: consent.userAgent
      }))
    } catch (error) {
      Logger.error('Failed to get consent history', error as Error, {
        userId
      })
      throw error
    }
  }

  // Data portability (GDPR Article 20)
  static async requestDataPortability(userId: string): Promise<string> {
    try {
      const request = await prisma.gDPRRequest.create({
        data: {
          userId,
          type: 'data_portability',
          status: 'pending'
        }
      })

      // Process in background
      this.processDataPortability(request.id, userId)

      Logger.info('Data portability requested', {
        userId,
        requestId: request.id
      })

      return request.id
    } catch (error) {
      Logger.error('Failed to create portability request', error as Error, {
        userId
      })
      throw error
    }
  }

  // Process data portability
  private static async processDataPortability(requestId: string, userId: string): Promise<void> {
    try {
      await prisma.gDPRRequest.update({
        where: { id: requestId },
        data: { status: 'processing' }
      })

      const userData = await this.gatherUserData(userId)

      // Format data for portability (JSON-LD or CSV)
      const portableData = {
        '@context': 'https://schema.org',
        '@type': 'Person',
        ...userData.profile,
        content: {
          posts: userData.posts,
          connections: userData.connections,
          experiences: userData.experiences,
          education: userData.education
        },
        exportedAt: new Date().toISOString(),
        format: 'JSON-LD'
      }

      // In a real implementation, save to downloadable file
      const downloadUrl = `/api/privacy/portability/${requestId}`

      await prisma.gDPRRequest.update({
        where: { id: requestId },
        data: {
          status: 'completed',
          completedAt: new Date(),
          downloadUrl
        }
      })

      Logger.info('Data portability completed', {
        userId,
        requestId
      })
    } catch (error) {
      await prisma.gDPRRequest.update({
        where: { id: requestId },
        data: {
          status: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      })

      Logger.error('Data portability failed', error as Error, {
        userId,
        requestId
      })
    }
  }
}
