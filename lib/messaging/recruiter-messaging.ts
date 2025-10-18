import { prisma } from '@/lib/prisma'

export interface MessageTemplate {
  id: string
  name: string
  subject: string
  content: string
  category: 'initial_outreach' | 'follow_up' | 'interview_request' | 'offer' | 'rejection' | 'custom'
  variables: string[] // Variables like {{candidate_name}}, {{job_title}}, etc.
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export interface RecruiterMessage {
  id: string
  recruiterId: string
  candidateId: string
  jobId?: string
  subject: string
  content: string
  type: 'outreach' | 'follow_up' | 'interview' | 'offer' | 'rejection' | 'general'
  status: 'sent' | 'delivered' | 'read' | 'replied'
  isTemplate: boolean
  templateId?: string
  threadId?: string
  metadata?: any
  createdAt: Date
  updatedAt: Date
}

export interface MessageThread {
  id: string
  participants: string[]
  jobId?: string
  subject: string
  lastMessage?: string
  lastMessageAt: Date
  unreadCount: { [userId: string]: number }
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export class RecruiterMessagingSystem {
  // Send a message from recruiter to candidate
  async sendMessage(
    recruiterId: string,
    candidateId: string,
    messageData: {
      subject: string
      content: string
      jobId?: string
      type?: 'outreach' | 'follow_up' | 'interview' | 'offer' | 'rejection' | 'general'
      templateId?: string
      threadId?: string
    }
  ): Promise<string> {
    try {
      // Check if recruiter can message this candidate
      const recruiter = await prisma.user.findUnique({
        where: { id: recruiterId },
        select: { role: true }
      })

      if (!recruiter || !['RECRUITER', 'ADMIN', 'COMPANY_ADMIN'].includes(recruiter.role)) {
        throw new Error('Unauthorized: Only recruiters can send messages')
      }

      // Check if candidate exists and is active
      const candidate = await prisma.user.findUnique({
        where: { id: candidateId, isActive: true },
        select: { id: true, name: true, email: true }
      })

      if (!candidate) {
        throw new Error('Candidate not found or inactive')
      }

      // Handle message threading
      let threadId = messageData.threadId
      if (!threadId) {
        // Check if there's an existing thread between these users
        const existingThread = await prisma.messageThread.findFirst({
          where: {
            participants: {
              hasEvery: [recruiterId, candidateId]
            },
            isActive: true
          }
        })

        if (existingThread) {
          threadId = existingThread.id
        } else {
          // Create new thread
          const newThread = await prisma.messageThread.create({
            data: {
              participants: [recruiterId, candidateId],
              jobId: messageData.jobId,
              subject: messageData.subject,
              isActive: true
            }
          })
          threadId = newThread.id
        }
      }

      // Create the message
      const message = await prisma.recruiterMessage.create({
        data: {
          recruiterId,
          candidateId,
          jobId: messageData.jobId,
          subject: messageData.subject,
          content: messageData.content,
          type: messageData.type || 'general',
          status: 'sent',
          isTemplate: !!messageData.templateId,
          templateId: messageData.templateId,
          threadId,
          metadata: messageData.jobId ? JSON.stringify({ jobId: messageData.jobId }) : null
        }
      })

      // Update thread's last message
      await prisma.messageThread.update({
        where: { id: threadId },
        data: {
          lastMessage: messageData.content.substring(0, 100),
          lastMessageAt: new Date(),
          updatedAt: new Date()
        }
      })

      // Create notification for candidate
      await prisma.notification.create({
        data: {
          userId: candidateId,
          type: 'MESSAGE',
          title: 'New message from recruiter',
          message: `${messageData.subject} - ${messageData.content.substring(0, 50)}...`,
          data: JSON.stringify({
            messageId: message.id,
            threadId,
            recruiterId,
            jobId: messageData.jobId
          })
        }
      })

      // Log messaging event
      await prisma.analyticsEvent.create({
        data: {
          userId: recruiterId,
          eventType: 'recruiter_messaging',
          eventName: 'message_sent',
          properties: JSON.stringify({
            messageId: message.id,
            candidateId,
            jobId: messageData.jobId,
            type: messageData.type,
            isTemplate: !!messageData.templateId
          })
        }
      })

      return message.id

    } catch (error) {
      console.error('Error sending recruiter message:', error)
      throw error
    }
  }

  // Get message templates for a recruiter
  async getMessageTemplates(recruiterId: string): Promise<MessageTemplate[]> {
    try {
      const templates = await prisma.messageTemplate.findMany({
        where: {
          OR: [
            { recruiterId },
            { isPublic: true } // Public templates available to all recruiters
          ],
          isActive: true
        },
        orderBy: { category: 'asc' }
      })

      return templates.map(template => ({
        id: template.id,
        name: template.name,
        subject: template.subject,
        content: template.content,
        category: template.category as any,
        variables: JSON.parse(template.variables || '[]'),
        isActive: template.isActive,
        createdAt: template.createdAt,
        updatedAt: template.updatedAt
      }))

    } catch (error) {
      console.error('Error getting message templates:', error)
      return []
    }
  }

  // Create a custom message template
  async createMessageTemplate(
    recruiterId: string,
    templateData: {
      name: string
      subject: string
      content: string
      category: 'initial_outreach' | 'follow_up' | 'interview_request' | 'offer' | 'rejection' | 'custom'
      isPublic?: boolean
    }
  ): Promise<string> {
    try {
      // Extract variables from content (e.g., {{variable_name}})
      const variables = this.extractVariables(templateData.content)

      const template = await prisma.messageTemplate.create({
        data: {
          recruiterId,
          name: templateData.name,
          subject: templateData.subject,
          content: templateData.content,
          category: templateData.category,
          variables: JSON.stringify(variables),
          isPublic: templateData.isPublic || false,
          isActive: true
        }
      })

      return template.id

    } catch (error) {
      console.error('Error creating message template:', error)
      throw error
    }
  }

  // Extract variables from template content
  private extractVariables(content: string): string[] {
    const variableRegex = /\{\{(\w+)\}\}/g
    const variables: string[] = []
    let match

    while ((match = variableRegex.exec(content)) !== null) {
      if (!variables.includes(match[1])) {
        variables.push(match[1])
      }
    }

    return variables
  }

  // Process template with variables
  processTemplate(template: string, variables: Record<string, string>): string {
    let processed = template

    for (const [key, value] of Object.entries(variables)) {
      const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g')
      processed = processed.replace(regex, value)
    }

    return processed
  }

  // Get message threads for a recruiter
  async getRecruiterThreads(
    recruiterId: string,
    options: {
      page?: number
      limit?: number
      jobId?: string
      unreadOnly?: boolean
    } = {}
  ): Promise<{
    threads: MessageThread[]
    total: number
    hasMore: boolean
  }> {
    try {
      const page = options.page || 1
      const limit = options.limit || 20
      const offset = (page - 1) * limit

      // Build where clause
      const where: any = {
        participants: { has: recruiterId },
        isActive: true
      }

      if (options.jobId) {
        where.jobId = options.jobId
      }

      if (options.unreadOnly) {
        where.unreadCount = { [recruiterId]: { gt: 0 } }
      }

      const threads = await prisma.messageThread.findMany({
        where,
        take: limit,
        skip: offset,
        orderBy: { lastMessageAt: 'desc' },
        include: {
          messages: {
            take: 1,
            orderBy: { createdAt: 'desc' }
          }
        }
      })

      const total = await prisma.messageThread.count({ where })

      return {
        threads: threads.map(thread => ({
          id: thread.id,
          participants: thread.participants,
          jobId: thread.jobId || undefined,
          subject: thread.subject,
          lastMessage: thread.lastMessage || undefined,
          lastMessageAt: thread.lastMessageAt,
          unreadCount: thread.unreadCount as { [userId: string]: number },
          isActive: thread.isActive,
          createdAt: thread.createdAt,
          updatedAt: thread.updatedAt
        })),
        total,
        hasMore: offset + limit < total
      }

    } catch (error) {
      console.error('Error getting recruiter threads:', error)
      return { threads: [], total: 0, hasMore: false }
    }
  }

  // Get messages in a thread
  async getThreadMessages(
    threadId: string,
    recruiterId: string,
    options: { page?: number; limit?: number } = {}
  ): Promise<{
    messages: RecruiterMessage[]
    total: number
    hasMore: boolean
  }> {
    try {
      // Verify recruiter is participant in thread
      const thread = await prisma.messageThread.findFirst({
        where: {
          id: threadId,
          participants: { has: recruiterId },
          isActive: true
        }
      })

      if (!thread) {
        throw new Error('Thread not found or access denied')
      }

      const page = options.page || 1
      const limit = options.limit || 50
      const offset = (page - 1) * limit

      const messages = await prisma.recruiterMessage.findMany({
        where: { threadId },
        take: limit,
        skip: offset,
        orderBy: { createdAt: 'asc' }
      })

      const total = await prisma.recruiterMessage.count({
        where: { threadId }
      })

      // Mark messages as read
      await prisma.messageThread.update({
        where: { id: threadId },
        data: {
          unreadCount: {
            ...thread.unreadCount,
            [recruiterId]: 0
          },
          updatedAt: new Date()
        }
      })

      return {
        messages: messages.map(message => ({
          id: message.id,
          recruiterId: message.recruiterId,
          candidateId: message.candidateId,
          jobId: message.jobId || undefined,
          subject: message.subject,
          content: message.content,
          type: message.type as any,
          status: message.status as any,
          isTemplate: message.isTemplate,
          templateId: message.templateId || undefined,
          threadId: message.threadId || undefined,
          metadata: message.metadata ? JSON.parse(message.metadata) : undefined,
          createdAt: message.createdAt,
          updatedAt: message.updatedAt
        })),
        total,
        hasMore: offset + limit < total
      }

    } catch (error) {
      console.error('Error getting thread messages:', error)
      throw error
    }
  }

  // Mark thread as read
  async markThreadAsRead(threadId: string, recruiterId: string): Promise<boolean> {
    try {
      const result = await prisma.messageThread.updateMany({
        where: {
          id: threadId,
          participants: { has: recruiterId }
        },
        data: {
          unreadCount: {
            [recruiterId]: 0
          },
          updatedAt: new Date()
        }
      })

      return result.count > 0

    } catch (error) {
      console.error('Error marking thread as read:', error)
      return false
    }
  }

  // Get messaging statistics for a recruiter
  async getRecruiterMessagingStats(recruiterId: string): Promise<{
    totalMessages: number
    unreadThreads: number
    responseRate: number
    averageResponseTime: number // in hours
  }> {
    try {
      // Total messages sent
      const totalMessages = await prisma.recruiterMessage.count({
        where: { recruiterId }
      })

      // Unread threads
      const threadsWithUnread = await prisma.messageThread.findMany({
        where: {
          participants: { has: recruiterId },
          isActive: true,
          unreadCount: { [recruiterId]: { gt: 0 } }
        }
      })

      const unreadThreads = threadsWithUnread.length

      // Calculate response rate (simplified)
      const messagesWithReplies = await prisma.recruiterMessage.count({
        where: {
          recruiterId,
          status: 'replied'
        }
      })

      const responseRate = totalMessages > 0 ? (messagesWithReplies / totalMessages) * 100 : 0

      // Average response time (simplified calculation)
      const recentMessages = await prisma.recruiterMessage.findMany({
        where: {
          recruiterId,
          status: 'replied'
        },
        orderBy: { createdAt: 'desc' },
        take: 100
      })

      let totalResponseTime = 0
      let responseCount = 0

      // This is a simplified calculation - in reality, you'd track actual response times
      for (const message of recentMessages) {
        if (message.updatedAt.getTime() - message.createdAt.getTime() > 0) {
          totalResponseTime += message.updatedAt.getTime() - message.createdAt.getTime()
          responseCount++
        }
      }

      const averageResponseTime = responseCount > 0 ?
        (totalResponseTime / responseCount) / (1000 * 60 * 60) : 0 // Convert to hours

      return {
        totalMessages,
        unreadThreads,
        responseRate: Math.round(responseRate * 100) / 100,
        averageResponseTime: Math.round(averageResponseTime * 100) / 100
      }

    } catch (error) {
      console.error('Error getting recruiter messaging stats:', error)
      return {
        totalMessages: 0,
        unreadThreads: 0,
        responseRate: 0,
        averageResponseTime: 0
      }
    }
  }
}