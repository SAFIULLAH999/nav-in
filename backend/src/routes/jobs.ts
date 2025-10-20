import { Router, Request, Response } from 'express';
import { body, validationResult, query } from 'express-validator';
import { prisma } from '../utils/prisma';
import { logger, logAuthEvent } from '../utils/logger';
import { authenticateToken } from '../middleware/auth';
import { addNotificationJob } from '../services/queue';

const router = Router();

// Validation rules
const createJobValidation = [
  body('title').trim().isLength({ min: 5, max: 200 }).withMessage('Title must be between 5 and 200 characters'),
  body('description').trim().isLength({ min: 20, max: 10000 }).withMessage('Description must be between 20 and 10000 characters'),
  body('companyName').trim().isLength({ min: 2, max: 100 }).withMessage('Company name must be between 2 and 100 characters'),
  body('location').trim().isLength({ min: 2, max: 100 }).withMessage('Location must be between 2 and 100 characters'),
  body('type').isIn(['FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERNSHIP', 'FREELANCE', 'TEMPORARY']).withMessage('Invalid job type'),
  body('salaryMin').optional().isNumeric().withMessage('Minimum salary must be a number'),
  body('salaryMax').optional().isNumeric().withMessage('Maximum salary must be a number'),
  body('requirements').optional().isArray().withMessage('Requirements must be an array'),
  body('benefits').optional().isArray().withMessage('Benefits must be an array'),
  body('skills').optional().isArray().withMessage('Skills must be an array'),
  body('experience').optional().isIn(['ENTRY', 'JUNIOR', 'MID', 'SENIOR', 'EXECUTIVE']).withMessage('Invalid experience level'),
  body('isRemote').optional().isBoolean().withMessage('isRemote must be a boolean'),
  body('applicationDeadline').optional().isISO8601().withMessage('Invalid application deadline'),
];

const jobSearchValidation = [
  query('q').optional().trim().isLength({ min: 1, max: 100 }),
  query('location').optional().trim().isLength({ min: 1, max: 100 }),
  query('type').optional().isIn(['FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERNSHIP', 'FREELANCE', 'TEMPORARY']),
  query('experience').optional().isIn(['ENTRY', 'JUNIOR', 'MID', 'SENIOR', 'EXECUTIVE']),
  query('isRemote').optional().isIn(['true', 'false']),
  query('salaryMin').optional().isNumeric(),
  query('salaryMax').optional().isNumeric(),
  query('page').optional().isNumeric().toInt(),
  query('limit').optional().isNumeric().toInt(),
];

// Get all jobs with search and filtering
router.get('/', jobSearchValidation, async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Validation failed',
          details: errors.array(),
          statusCode: 400,
        },
      });
    }

    const {
      q,
      location,
      type,
      experience,
      isRemote,
      salaryMin,
      salaryMax,
      page = 1,
      limit = 20,
    } = req.query;

    const offset = (Number(page) - 1) * Number(limit);

    // Build search conditions
    const whereConditions: any = {
      isActive: true,
    };

    // Text search across multiple fields
    if (q) {
      whereConditions.OR = [
        { title: { contains: q as string, mode: 'insensitive' } },
        { description: { contains: q as string, mode: 'insensitive' } },
        { companyName: { contains: q as string, mode: 'insensitive' } },
        { requirements: { contains: q as string, mode: 'insensitive' } },
        { skills: { contains: q as string, mode: 'insensitive' } },
      ];
    }

    // Location filter
    if (location) {
      whereConditions.location = { contains: location as string, mode: 'insensitive' };
    }

    // Job type filter
    if (type) {
      whereConditions.type = type as string;
    }

    // Experience level filter
    if (experience) {
      whereConditions.experience = experience as string;
    }

    // Remote work filter
    if (isRemote === 'true') {
      whereConditions.isRemote = true;
    }

    // Salary range filter
    if (salaryMin || salaryMax) {
      whereConditions.AND = [];
      if (salaryMin) {
        whereConditions.AND.push({ salaryMin: { gte: Number(salaryMin) } });
      }
      if (salaryMax) {
        whereConditions.AND.push({ salaryMax: { lte: Number(salaryMax) } });
      }
    }

    // Application deadline filter (not expired)
    whereConditions.OR = [
      { applicationDeadline: null },
      { applicationDeadline: { gt: new Date() } },
    ];

    const jobs = await prisma.job.findMany({
      where: whereConditions,
      include: {
        author: {
          select: {
            id: true,
            name: true,
            username: true,
            avatar: true,
            title: true,
            company: true,
          },
        },
        company: {
          select: {
            id: true,
            name: true,
            logo: true,
            industry: true,
          },
        },
        _count: {
          select: {
            applications: true,
          },
        },
      },
      orderBy: [
        { isRemote: 'desc' }, // Remote jobs first
        { createdAt: 'desc' },
      ],
      take: Number(limit),
      skip: offset,
    });

    // Get total count for pagination
    const totalCount = await prisma.job.count({ where: whereConditions });

    res.json({
      success: true,
      data: {
        jobs,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: totalCount,
          totalPages: Math.ceil(totalCount / Number(limit)),
          hasMore: offset + jobs.length < totalCount,
        },
        filters: {
          q,
          location,
          type,
          experience,
          isRemote,
          salaryMin,
          salaryMax,
        },
      },
    });
  } catch (error) {
    logger.error('Get jobs error:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to get jobs',
        statusCode: 500,
      },
    });
  }
});

// Get job by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const currentUserId = (req as any).user?.id;

    // Increment view count
    await prisma.job.update({
      where: { id },
      data: { views: { increment: 1 } },
    });

    const job = await prisma.job.findUnique({
      where: { id },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            username: true,
            avatar: true,
            title: true,
            company: true,
          },
        },
        company: {
          select: {
            id: true,
            name: true,
            logo: true,
            industry: true,
            description: true,
            website: true,
          },
        },
        applications: currentUserId ? {
          where: { userId: currentUserId },
          select: { id: true, status: true, appliedAt: true },
        } : false,
        _count: {
          select: {
            applications: true,
          },
        },
      },
    });

    if (!job) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'Job not found',
          statusCode: 404,
        },
      });
    }

    res.json({
      success: true,
      data: {
        job: {
          ...job,
          hasApplied: currentUserId ? job.applications.length > 0 : false,
          applications: undefined, // Remove applications array from response
        },
      },
    });
  } catch (error) {
    logger.error('Get job error:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to get job',
        statusCode: 500,
      },
    });
  }
});

// Create new job (requires authentication)
router.post('/', authenticateToken, createJobValidation, async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Validation failed',
          details: errors.array(),
          statusCode: 400,
        },
      });
    }

    const currentUserId = (req as any).user.id;
    const {
      title,
      description,
      companyName,
      location,
      type,
      salaryMin,
      salaryMax,
      requirements,
      benefits,
      skills,
      experience,
      isRemote,
      applicationDeadline,
      companyId,
    } = req.body;

    const job = await prisma.job.create({
      data: {
        title,
        description,
        companyName,
        location,
        type,
        salaryMin: salaryMin ? Number(salaryMin) : null,
        salaryMax: salaryMax ? Number(salaryMax) : null,
        requirements: requirements ? JSON.stringify(requirements) : null,
        benefits: benefits ? JSON.stringify(benefits) : null,
        skills: skills ? JSON.stringify(skills) : null,
        experience,
        isRemote: Boolean(isRemote),
        applicationDeadline: applicationDeadline ? new Date(applicationDeadline) : null,
        authorId: currentUserId,
        companyId,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            username: true,
            avatar: true,
          },
        },
        _count: {
          select: {
            applications: true,
          },
        },
      },
    });

    logAuthEvent('Job Created', currentUserId, {
      jobId: job.id,
      title: job.title,
      companyName: job.companyName,
    });

    res.status(201).json({
      success: true,
      data: { job },
      message: 'Job posted successfully',
    });
  } catch (error) {
    logger.error('Create job error:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to create job',
        statusCode: 500,
      },
    });
  }
});

// Update job
router.put('/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const currentUserId = (req as any).user.id;
    const { id } = req.params;
    const updateData = req.body;

    // Check if job exists and user is the author
    const existingJob = await prisma.job.findUnique({
      where: { id },
      select: { id: true, authorId: true },
    });

    if (!existingJob) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'Job not found',
          statusCode: 404,
        },
      });
    }

    if (existingJob.authorId !== currentUserId) {
      return res.status(403).json({
        success: false,
        error: {
          message: 'Not authorized to edit this job',
          statusCode: 403,
        },
      });
    }

    // Prepare update data
    const dataToUpdate: any = { ...updateData };
    if (dataToUpdate.salaryMin) dataToUpdate.salaryMin = Number(dataToUpdate.salaryMin);
    if (dataToUpdate.salaryMax) dataToUpdate.salaryMax = Number(dataToUpdate.salaryMax);
    if (dataToUpdate.requirements) dataToUpdate.requirements = JSON.stringify(dataToUpdate.requirements);
    if (dataToUpdate.benefits) dataToUpdate.benefits = JSON.stringify(dataToUpdate.benefits);
    if (dataToUpdate.skills) dataToUpdate.skills = JSON.stringify(dataToUpdate.skills);
    if (dataToUpdate.applicationDeadline) dataToUpdate.applicationDeadline = new Date(dataToUpdate.applicationDeadline);
    if (dataToUpdate.isRemote !== undefined) dataToUpdate.isRemote = Boolean(dataToUpdate.isRemote);

    const updatedJob = await prisma.job.update({
      where: { id },
      data: dataToUpdate,
      include: {
        author: {
          select: {
            id: true,
            name: true,
            username: true,
            avatar: true,
          },
        },
        _count: {
          select: {
            applications: true,
          },
        },
      },
    });

    logAuthEvent('Job Updated', currentUserId, { jobId: id });

    res.json({
      success: true,
      data: { job: updatedJob },
      message: 'Job updated successfully',
    });
  } catch (error) {
    logger.error('Update job error:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to update job',
        statusCode: 500,
      },
    });
  }
});

// Delete job
router.delete('/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const currentUserId = (req as any).user.id;
    const { id } = req.params;

    // Check if job exists and user is the author
    const existingJob = await prisma.job.findUnique({
      where: { id },
      select: { id: true, authorId: true, title: true },
    });

    if (!existingJob) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'Job not found',
          statusCode: 404,
        },
      });
    }

    if (existingJob.authorId !== currentUserId) {
      return res.status(403).json({
        success: false,
        error: {
          message: 'Not authorized to delete this job',
          statusCode: 403,
        },
      });
    }

    await prisma.job.delete({
      where: { id },
    });

    logAuthEvent('Job Deleted', currentUserId, { jobId: id, title: existingJob.title });

    res.json({
      success: true,
      message: 'Job deleted successfully',
    });
  } catch (error) {
    logger.error('Delete job error:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to delete job',
        statusCode: 500,
      },
    });
  }
});

// Apply for job
router.post('/:id/apply', authenticateToken, async (req: Request, res: Response) => {
  try {
    const currentUserId = (req as any).user.id;
    const { id: jobId } = req.params;
    const { resume, coverLetter } = req.body;

    // Check if job exists and is active
    const job = await prisma.job.findUnique({
      where: { id: jobId },
      select: {
        id: true,
        title: true,
        companyName: true,
        authorId: true,
        isActive: true,
        applicationDeadline: true,
      },
    });

    if (!job || !job.isActive) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'Job not found or inactive',
          statusCode: 404,
        },
      });
    }

    // Check if application deadline has passed
    if (job.applicationDeadline && job.applicationDeadline < new Date()) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Application deadline has passed',
          statusCode: 400,
        },
      });
    }

    // Check if user already applied
    const existingApplication = await prisma.application.findUnique({
      where: {
        userId_jobId: {
          userId: currentUserId,
          jobId,
        },
      },
    });

    if (existingApplication) {
      return res.status(409).json({
        success: false,
        error: {
          message: 'Already applied for this job',
          statusCode: 409,
        },
      });
    }

    // Create application
    const application = await prisma.application.create({
      data: {
        userId: currentUserId,
        jobId,
        resume,
        coverLetter,
        status: 'PENDING',
      },
      include: {
        job: {
          select: {
            id: true,
            title: true,
            companyName: true,
          },
        },
      },
    });

    // Update job application count
    await prisma.job.update({
      where: { id: jobId },
      data: { applicationsCount: { increment: 1 } },
    });

    // Send notification to job poster
    if (job.authorId !== currentUserId) {
      await addNotificationJob({
        userId: job.authorId,
        type: 'JOB_APPLICATION',
        title: 'New Job Application',
        message: `${(req as any).user.name} applied for your job: ${job.title}`,
        data: {
          jobId,
          applicationId: application.id,
          applicantId: currentUserId,
          applicantName: (req as any).user.name,
          jobTitle: job.title,
        },
      });
    }

    logAuthEvent('Job Application Submitted', currentUserId, {
      jobId,
      jobTitle: job.title,
    });

    res.status(201).json({
      success: true,
      data: { application },
      message: 'Application submitted successfully',
    });
  } catch (error) {
    logger.error('Apply for job error:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to submit application',
        statusCode: 500,
      },
    });
  }
});

// Get user's job applications
router.get('/applications/my', authenticateToken, async (req: Request, res: Response) => {
  try {
    const currentUserId = (req as any).user.id;
    const status = req.query.status as string;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = (page - 1) * limit;

    const whereConditions: any = { userId: currentUserId };
    if (status) {
      whereConditions.status = status;
    }

    const applications = await prisma.application.findMany({
      where: whereConditions,
      include: {
        job: {
          select: {
            id: true,
            title: true,
            companyName: true,
            location: true,
            type: true,
            salaryMin: true,
            salaryMax: true,
            isActive: true,
            createdAt: true,
          },
        },
      },
      orderBy: { appliedAt: 'desc' },
      take: limit,
      skip: offset,
    });

    const totalCount = await prisma.application.count({ where: whereConditions });

    res.json({
      success: true,
      data: {
        applications,
        pagination: {
          page,
          limit,
          total: totalCount,
          totalPages: Math.ceil(totalCount / limit),
          hasMore: offset + applications.length < totalCount,
        },
      },
    });
  } catch (error) {
    logger.error('Get my applications error:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to get applications',
        statusCode: 500,
      },
    });
  }
});

// Get job applications (for job poster)
router.get('/:id/applications', authenticateToken, async (req: Request, res: Response) => {
  try {
    const currentUserId = (req as any).user.id;
    const { id: jobId } = req.params;

    // Check if job exists and user is the author
    const job = await prisma.job.findUnique({
      where: { id: jobId },
      select: { id: true, authorId: true, title: true },
    });

    if (!job) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'Job not found',
          statusCode: 404,
        },
      });
    }

    if (job.authorId !== currentUserId) {
      return res.status(403).json({
        success: false,
        error: {
          message: 'Not authorized to view applications for this job',
          statusCode: 403,
        },
      });
    }

    const applications = await prisma.application.findMany({
      where: { jobId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            username: true,
            avatar: true,
            title: true,
            company: true,
            location: true,
            skills: true,
          },
        },
      },
      orderBy: { appliedAt: 'desc' },
    });

    res.json({
      success: true,
      data: { applications },
    });
  } catch (error) {
    logger.error('Get job applications error:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to get job applications',
        statusCode: 500,
      },
    });
  }
});

// Update application status (for job poster)
router.put('/:jobId/applications/:applicationId', authenticateToken, async (req: Request, res: Response) => {
  try {
    const currentUserId = (req as any).user.id;
    const { jobId, applicationId } = req.params;
    const { status } = req.body;

    // Validate status
    const validStatuses = ['PENDING', 'REVIEWED', 'INTERVIEWED', 'ACCEPTED', 'REJECTED'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Invalid application status',
          statusCode: 400,
        },
      });
    }

    // Check if job exists and user is the author
    const job = await prisma.job.findUnique({
      where: { id: jobId },
      select: { id: true, authorId: true },
    });

    if (!job || job.authorId !== currentUserId) {
      return res.status(403).json({
        success: false,
        error: {
          message: 'Not authorized to update applications for this job',
          statusCode: 403,
        },
      });
    }

    // Update application status
    const updatedApplication = await prisma.application.update({
      where: { id: applicationId },
      data: { status },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        job: {
          select: {
            id: true,
            title: true,
            companyName: true,
          },
        },
      },
    });

    // Send notification to applicant
    await addNotificationJob({
      userId: updatedApplication.userId,
      type: 'APPLICATION_UPDATE',
      title: 'Application Status Updated',
      message: `Your application for ${updatedApplication.job.title} has been ${status.toLowerCase()}`,
      data: {
        jobId,
        applicationId,
        newStatus: status,
        jobTitle: updatedApplication.job.title,
      },
    });

    logAuthEvent('Application Status Updated', currentUserId, {
      jobId,
      applicationId,
      newStatus: status,
    });

    res.json({
      success: true,
      data: { application: updatedApplication },
      message: 'Application status updated successfully',
    });
  } catch (error) {
    logger.error('Update application status error:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to update application status',
        statusCode: 500,
      },
    });
  }
});

export default router;