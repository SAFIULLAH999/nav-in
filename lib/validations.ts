import { z } from 'zod'

// Profile validation schemas
export const profileUpdateSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must be less than 100 characters').optional(),
  username: z.string().min(3, 'Username must be at least 3 characters').max(30, 'Username must be less than 30 characters').regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores').optional(),
  bio: z.string().max(500, 'Bio must be less than 500 characters').optional(),
  title: z.string().max(100, 'Title must be less than 100 characters').optional(),
  company: z.string().max(100, 'Company must be less than 100 characters').optional(),
  location: z.string().max(100, 'Location must be less than 100 characters').optional(),
  website: z.string().url('Invalid website URL').optional().or(z.literal('')),
  skills: z.array(z.string().min(1).max(50)).max(20, 'Maximum 20 skills allowed').optional(),
  avatar: z.string().url('Invalid avatar URL').optional(),
  summary: z.string().max(1000, 'Summary must be less than 1000 characters').optional(),
  socialLinks: z.record(z.string().url()).optional()
})

export const experienceSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100, 'Title must be less than 100 characters'),
  company: z.string().min(1, 'Company is required').max(100, 'Company must be less than 100 characters'),
  location: z.string().max(100, 'Location must be less than 100 characters').optional(),
  isCurrent: z.boolean().default(false),
  startDate: z.string().datetime('Invalid start date'),
  endDate: z.string().datetime('Invalid end date').optional(),
  description: z.string().max(1000, 'Description must be less than 1000 characters').optional()
})

export const educationSchema = z.object({
  institution: z.string().min(1, 'Institution is required').max(100, 'Institution must be less than 100 characters'),
  degree: z.string().min(1, 'Degree is required').max(100, 'Degree must be less than 100 characters'),
  fieldOfStudy: z.string().max(100, 'Field of study must be less than 100 characters').optional(),
  startDate: z.string().datetime('Invalid start date'),
  endDate: z.string().datetime('Invalid end date').optional(),
  grade: z.string().max(20, 'Grade must be less than 20 characters').optional(),
  description: z.string().max(1000, 'Description must be less than 1000 characters').optional()
})

// Job validation schemas
export const jobCreateSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100, 'Title must be less than 100 characters'),
  description: z.string().min(1, 'Description is required').max(5000, 'Description must be less than 5000 characters'),
  company: z.string().min(1, 'Company is required').max(100, 'Company must be less than 100 characters'),
  location: z.string().min(1, 'Location is required').max(100, 'Location must be less than 100 characters'),
  type: z.enum(['FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERNSHIP', 'FREELANCE']),
  salaryMin: z.number().min(0, 'Minimum salary must be positive').optional(),
  salaryMax: z.number().min(0, 'Maximum salary must be positive').optional(),
  requirements: z.array(z.string().min(1).max(200)).max(20, 'Maximum 20 requirements allowed'),
  benefits: z.string().max(1000, 'Benefits must be less than 1000 characters').optional()
})

export const jobSearchSchema = z.object({
  query: z.string().optional(),
  location: z.string().optional(),
  type: z.enum(['FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERNSHIP', 'FREELANCE']).optional(),
  company: z.string().optional(),
  salaryMin: z.number().min(0).optional(),
  salaryMax: z.number().min(0).optional(),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(50).default(10)
})

// Message validation schemas
export const messageSchema = z.object({
  content: z.string().min(1, 'Message content is required').max(2000, 'Message must be less than 2000 characters'),
  receiverId: z.string().min(1, 'Receiver ID is required')
})

// Connection validation schemas
export const connectionSchema = z.object({
  receiverId: z.string().min(1, 'Receiver ID is required')
})

// Post validation schemas
export const postSchema = z.object({
  content: z.string().min(1, 'Post content is required').max(2000, 'Post must be less than 2000 characters'),
  image: z.string().url('Invalid image URL').optional(),
  video: z.string().url('Invalid video URL').optional()
})

// Type exports for use in API routes
export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>
export type ExperienceInput = z.infer<typeof experienceSchema>
export type EducationInput = z.infer<typeof educationSchema>
export type JobCreateInput = z.infer<typeof jobCreateSchema>
export type JobSearchInput = z.infer<typeof jobSearchSchema>
export type MessageInput = z.infer<typeof messageSchema>
export type ConnectionInput = z.infer<typeof connectionSchema>
export type PostInput = z.infer<typeof postSchema>

// Validation helper functions
export function validateData<T>(schema: z.ZodSchema<T>, data: unknown): { success: true; data: T } | { success: false; errors: z.ZodError } {
  const result = schema.safeParse(data)
  if (result.success) {
    return { success: true, data: result.data }
  }
  return { success: false, errors: result.error }
}
