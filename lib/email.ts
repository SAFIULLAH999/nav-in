import nodemailer from 'nodemailer'
import { prisma } from '@/lib/prisma'

// Email configuration
const SMTP_HOST = process.env.SMTP_HOST || 'smtp.gmail.com'
const SMTP_PORT = parseInt(process.env.SMTP_PORT || '587')
const SMTP_USER = process.env.SMTP_USER || ''
const SMTP_PASS = process.env.SMTP_PASS || ''

// Create transporter
const transporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port: SMTP_PORT,
  secure: false, // true for 465, false for other ports
  auth: {
    user: SMTP_USER,
    pass: SMTP_PASS
  }
})

// Email templates
export const emailTemplates = {
  welcome: (name: string, username: string) => ({
    subject: 'Welcome to NavIN!',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #2563eb;">Welcome to NavIN, ${name}!</h1>
        <p>Your account has been successfully created. You can now start connecting with professionals, posting updates, and exploring job opportunities.</p>
        <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3>Your Profile Details:</h3>
          <p><strong>Username:</strong> ${username}</p>
          <p><strong>Member since:</strong> ${new Date().toLocaleDateString()}</p>
        </div>
        <p>Get started by:</p>
        <ul>
          <li>Completing your profile</li>
          <li>Connecting with other professionals</li>
          <li>Exploring job opportunities</li>
          <li>Sharing your insights and updates</li>
        </ul>
        <div style="text-align: center; margin-top: 30px;">
          <a href="${process.env.NEXTAUTH_URL || 'http://localhost:3002'}/feed" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">Start Exploring</a>
        </div>
      </div>
    `
  }),

  connectionRequest: (senderName: string, senderUsername: string, receiverName: string) => ({
    subject: `${senderName} wants to connect with you`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #2563eb;">New Connection Request</h1>
        <p><strong>${senderName}</strong> (@${senderUsername}) wants to connect with you on NavIN.</p>
        <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p>This connection request helps you:</p>
          <ul>
            <li>Expand your professional network</li>
            <li>Share insights and opportunities</li>
            <li>Stay updated with industry trends</li>
          </ul>
        </div>
        <div style="text-align: center; margin-top: 30px;">
          <a href="${process.env.NEXTAUTH_URL || 'http://localhost:3002'}/network" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-right: 10px;">View Request</a>
          <a href="${process.env.NEXTAUTH_URL || 'http://localhost:3002'}/profile/${senderUsername}" style="background-color: #6b7280; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">View Profile</a>
        </div>
      </div>
    `
  }),

  connectionAccepted: (senderName: string, receiverName: string) => ({
    subject: `${receiverName} accepted your connection request`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #059669;">Connection Accepted!</h1>
        <p>Great news! <strong>${receiverName}</strong> has accepted your connection request on NavIN.</p>
        <p>You're now connected and can:</p>
        <ul>
          <li>Send direct messages</li>
          <li>Share posts with each other</li>
          <li>Collaborate on opportunities</li>
          <li>Stay updated with each other's activities</li>
        </ul>
        <div style="text-align: center; margin-top: 30px;">
          <a href="${process.env.NEXTAUTH_URL || 'http://localhost:3002'}/messages" style="background-color: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-right: 10px;">Send Message</a>
          <a href="${process.env.NEXTAUTH_URL || 'http://localhost:3002'}/feed" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">View Feed</a>
        </div>
      </div>
    `
  }),

  jobApplication: (applicantName: string, jobTitle: string, company: string) => ({
    subject: `New application for ${jobTitle}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #2563eb;">New Job Application</h1>
        <p><strong>${applicantName}</strong> has applied for the position:</p>
        <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3>${jobTitle}</h3>
          <p><strong>Company:</strong> ${company}</p>
          <p><strong>Applied on:</strong> ${new Date().toLocaleDateString()}</p>
        </div>
        <div style="text-align: center; margin-top: 30px;">
          <a href="${process.env.NEXTAUTH_URL || 'http://localhost:3002'}/jobs/applications" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">View Applications</a>
        </div>
      </div>
    `
  }),

  jobApplicationNotification: (employerEmail: string, employerName: string, applicantName: string, jobTitle: string, company: string, applicantEmail: string, profileUrl?: string) => ({
    subject: `New Application for ${jobTitle}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #2563eb;">New Job Application Received</h1>
        <p>Hi <strong>${employerName}</strong>,</p>
        <p><strong>${applicantName}</strong> has applied for the position:</p>
        <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3>${jobTitle}</h3>
          <p><strong>Company:</strong> ${company}</p>
          <p><strong>Applicant:</strong> ${applicantName}</p>
          <p><strong>Applicant Email:</strong> ${applicantEmail}</p>
          ${profileUrl ? `<p><strong>Profile:</strong> <a href="${profileUrl}">${profileUrl}</a></p>` : ''}
          <p><strong>Applied on:</strong> ${new Date().toLocaleDateString()}</p>
        </div>
        <p>Please review the application and contact the candidate if interested.</p>
        <div style="text-align: center; margin-top: 30px;">
          <a href="${process.env.NEXTAUTH_URL || 'http://localhost:3002'}/jobs/applications" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">View All Applications</a>
        </div>
      </div>
    `
  }),

  jobApplicationConfirmation: (applicantName: string, jobTitle: string, company: string, employerEmail: string, employerPhone?: string, employerName?: string) => ({
    subject: `Application Submitted for ${jobTitle}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #059669;">Application Submitted Successfully!</h1>
        <p>Hi <strong>${applicantName}</strong>,</p>
        <p>Thank you for applying to the position:</p>
        <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3>${jobTitle}</h3>
          <p><strong>Company:</strong> ${company}</p>
          <p><strong>Application sent to:</strong> ${employerEmail}</p>
          ${employerName ? `<p><strong>Hiring Manager:</strong> ${employerName}</p>` : ''}
          ${employerPhone ? `<p><strong>Contact Phone:</strong> ${employerPhone}</p>` : ''}
          <p><strong>Applied on:</strong> ${new Date().toLocaleDateString()}</p>
        </div>
        <p>Your application has been received and is under review. You will be notified of any updates.</p>
        <div style="text-align: center; margin-top: 30px;">
          <a href="${process.env.NEXTAUTH_URL || 'http://localhost:3002'}/applications" style="background-color: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-right: 10px;">View My Applications</a>
          <a href="${process.env.NEXTAUTH_URL || 'http://localhost:3002'}/jobs" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">Browse More Jobs</a>
        </div>
      </div>
    `
  }),

  passwordReset: (name: string, resetToken: string) => ({
    subject: 'Password Reset Request',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #dc2626;">Password Reset</h1>
        <p>Hello ${name},</p>
        <p>You have requested to reset your password for your NavIN account.</p>
        <p>Please click the button below to reset your password. This link will expire in 1 hour.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.NEXTAUTH_URL || 'http://localhost:3002'}/reset-password?token=${resetToken}" style="background-color: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">Reset Password</a>
        </div>
        <p style="color: #6b7280; font-size: 14px;">If you didn't request this password reset, please ignore this email. Your password will remain unchanged.</p>
      </div>
    `
  }),

  emailVerification: (name: string, verificationToken: string) => ({
    subject: 'Verify Your Email Address',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #2563eb;">Verify Your Email</h1>
        <p>Hello ${name},</p>
        <p>Welcome to NavIN! Please verify your email address to activate your account and start connecting with professionals.</p>
        <p>Click the button below to verify your email address:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.NEXTAUTH_URL || 'http://localhost:3002'}/verify-email?token=${verificationToken}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">Verify Email</a>
        </div>
        <p style="color: #6b7280; font-size: 14px;">This verification link will expire in 24 hours. If you didn't create an account with NavIN, please ignore this email.</p>
        <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Why verify your email?</strong></p>
          <ul>
            <li>Secure your account</li>
            <li>Receive important notifications</li>
            <li>Reset your password if needed</li>
            <li>Connect with other professionals</li>
          </ul>
        </div>
      </div>
    `
  }),

  notification: (title: string, message: string, actionUrl?: string, actionText?: string) => ({
    subject: title,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #2563eb;">${title}</h1>
        <p>${message}</p>
        ${actionUrl && actionText ? `
          <div style="text-align: center; margin-top: 30px;">
            <a href="${actionUrl.startsWith('http') ? actionUrl : (process.env.NEXTAUTH_URL || 'http://localhost:3002') + actionUrl}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">${actionText}</a>
          </div>
        ` : ''}
      </div>
    `
  })
}

// Email service class
export class EmailService {
  static async sendEmail(to: string, template: { subject: string; html: string }): Promise<boolean> {
    try {
      if (!SMTP_USER || !SMTP_PASS) {
        console.warn('Email credentials not configured, skipping email send')
        return false
      }

      const mailOptions = {
        from: `"NavIN" <${SMTP_USER}>`,
        to,
        subject: template.subject,
        html: template.html
      }

      await transporter.sendMail(mailOptions)
      console.log(`Email sent successfully to ${to}`)
      return true
    } catch (error) {
      console.error('Error sending email:', error)
      return false
    }
  }

  static async sendWelcomeEmail(userEmail: string, name: string, username: string): Promise<void> {
    const template = emailTemplates.welcome(name, username)
    await this.sendEmail(userEmail, template)
  }

  static async sendConnectionRequestEmail(
    receiverEmail: string,
    senderName: string,
    senderUsername: string,
    receiverName: string
  ): Promise<void> {
    const template = emailTemplates.connectionRequest(senderName, senderUsername, receiverName)
    await this.sendEmail(receiverEmail, template)
  }

  static async sendConnectionAcceptedEmail(
    senderEmail: string,
    senderName: string,
    receiverName: string
  ): Promise<void> {
    const template = emailTemplates.connectionAccepted(senderName, receiverName)
    await this.sendEmail(senderEmail, template)
  }

  static async sendJobApplicationEmail(
    employerEmail: string,
    applicantName: string,
    jobTitle: string,
    company: string
  ): Promise<void> {
    const template = emailTemplates.jobApplication(applicantName, jobTitle, company)
    await this.sendEmail(employerEmail, template)
  }

  static async sendJobApplicationConfirmationEmail(
    applicantEmail: string,
    applicantName: string,
    jobTitle: string,
    company: string,
    employerEmail: string,
    employerPhone?: string,
    employerName?: string
  ): Promise<void> {
    const template = emailTemplates.jobApplicationConfirmation(applicantName, jobTitle, company, employerEmail, employerPhone, employerName)
    await this.sendEmail(applicantEmail, template)
  }

  static async sendJobApplicationNotificationEmail(
    employerEmail: string,
    employerName: string,
    applicantName: string,
    jobTitle: string,
    company: string,
    applicantEmail: string,
    profileUrl?: string
  ): Promise<void> {
    const template = emailTemplates.jobApplicationNotification(employerEmail, employerName, applicantName, jobTitle, company, applicantEmail, profileUrl)
    await this.sendEmail(employerEmail, template)
  }

  static async sendPasswordResetEmail(userEmail: string, name: string, resetToken: string): Promise<void> {
    const template = emailTemplates.passwordReset(name, resetToken)
    await this.sendEmail(userEmail, template)
  }

  static async sendEmailVerification(userEmail: string, name: string, verificationToken: string): Promise<void> {
    const template = emailTemplates.emailVerification(name, verificationToken)
    await this.sendEmail(userEmail, template)
  }

  static async sendNotificationEmail(
    userEmail: string,
    title: string,
    message: string,
    actionUrl?: string,
    actionText?: string
  ): Promise<void> {
    const template = emailTemplates.notification(title, message, actionUrl, actionText)
    await this.sendEmail(userEmail, template)
  }

  // Queue email for background processing (for high volume)
  static async queueEmail(
    to: string,
    template: { subject: string; html: string },
    scheduledFor?: Date
  ): Promise<void> {
    await prisma.emailQueue.create({
      data: {
        to,
        subject: template.subject,
        html: template.html,
        scheduledFor: scheduledFor || new Date(),
        status: 'PENDING'
      }
    })
  }

  // Process email queue (should be run by a cron job)
  static async processEmailQueue(): Promise<void> {
    const pendingEmails = await prisma.emailQueue.findMany({
      where: {
        status: 'PENDING',
        scheduledFor: { lte: new Date() }
      },
      take: 10 // Process 10 emails at a time
    })

    for (const email of pendingEmails) {
      try {
        const success = await this.sendEmail(email.to, {
          subject: email.subject,
          html: email.html
        })

        await prisma.emailQueue.update({
          where: { id: email.id },
          data: {
            status: success ? 'SENT' : 'FAILED',
            sentAt: success ? new Date() : undefined,
            error: success ? undefined : 'Failed to send email'
          }
        })
      } catch (error) {
        await prisma.emailQueue.update({
          where: { id: email.id },
          data: {
            status: 'FAILED',
            error: error instanceof Error ? error.message : 'Unknown error'
          }
        })
      }
    }
  }
}
