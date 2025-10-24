import { PrismaClient } from '@prisma/client'
import { logger } from '../utils/logger'

const prisma = new PrismaClient()

const sampleJobs = [
  {
    title: 'Frontend Developer',
    description: 'We are looking for a skilled Frontend Developer to join our team. You will be responsible for building responsive and interactive web applications using React, TypeScript, and modern CSS frameworks.',
    companyName: 'TechCorp Inc.',
    location: 'San Francisco, CA',
    type: 'FULL_TIME',
    salaryMin: 80000,
    salaryMax: 120000,
    requirements: JSON.stringify(['React', 'TypeScript', 'CSS', 'JavaScript', 'HTML']),
    benefits: 'Health insurance, 401k, remote work options',
    experience: 'MID',
    authorId: 'demo-user-id',
    isActive: true,
    isRemote: true,
    applicationDeadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
  },
  {
    title: 'Backend Developer',
    description: 'Join our backend team to build scalable APIs and microservices. Experience with Node.js, Python, or Java required.',
    companyName: 'DataFlow Systems',
    location: 'New York, NY',
    type: 'FULL_TIME',
    salaryMin: 90000,
    salaryMax: 130000,
    requirements: JSON.stringify(['Node.js', 'Python', 'PostgreSQL', 'AWS', 'Docker']),
    benefits: 'Health insurance, stock options, flexible hours',
    experience: 'SENIOR',
    authorId: 'demo-user-id',
    isActive: true,
    isRemote: false,
    applicationDeadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  },
  {
    title: 'Full Stack Developer',
    description: 'We need a versatile Full Stack Developer who can work on both frontend and backend. Experience with React, Node.js, and databases required.',
    companyName: 'StartupXYZ',
    location: 'Austin, TX',
    type: 'FULL_TIME',
    salaryMin: 70000,
    salaryMax: 100000,
    requirements: JSON.stringify(['React', 'Node.js', 'MongoDB', 'Express', 'JavaScript']),
    benefits: 'Equity, health insurance, unlimited PTO',
    experience: 'MID',
    authorId: 'demo-user-id',
    isActive: true,
    isRemote: true,
    applicationDeadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  },
  {
    title: 'DevOps Engineer',
    description: 'Looking for a DevOps Engineer to manage our cloud infrastructure and CI/CD pipelines. Experience with AWS, Kubernetes, and Docker required.',
    companyName: 'CloudTech Solutions',
    location: 'Seattle, WA',
    type: 'FULL_TIME',
    salaryMin: 100000,
    salaryMax: 140000,
    requirements: JSON.stringify(['AWS', 'Kubernetes', 'Docker', 'Jenkins', 'Linux']),
    benefits: 'Health insurance, 401k, professional development budget',
    experience: 'SENIOR',
    authorId: 'demo-user-id',
    isActive: true,
    isRemote: false,
    applicationDeadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  },
  {
    title: 'Mobile App Developer',
    description: 'Join our mobile team to build iOS and Android applications. Experience with React Native or Flutter preferred.',
    companyName: 'MobileFirst',
    location: 'Los Angeles, CA',
    type: 'FULL_TIME',
    salaryMin: 75000,
    salaryMax: 110000,
    requirements: JSON.stringify(['React Native', 'iOS', 'Android', 'JavaScript', 'Swift']),
    benefits: 'Health insurance, gym membership, flexible schedule',
    experience: 'MID',
    authorId: 'demo-user-id',
    isActive: true,
    isRemote: true,
    applicationDeadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  },
]

export async function seedJobs() {
  try {
    logger.info('🌱 Seeding jobs...')

    // Clear existing jobs
    await prisma.job.deleteMany({})
    logger.info('🗑️  Cleared existing jobs')

    // Create new jobs
    for (const jobData of sampleJobs) {
      const job = await prisma.job.create({
        data: jobData,
      })
      logger.info(`✅ Created job: ${job.title} at ${job.companyName}`)
    }

    logger.info(`🎉 Successfully seeded ${sampleJobs.length} jobs`)
  } catch (error) {
    logger.error('❌ Error seeding jobs:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Run if this file is executed directly
if (require.main === module) {
  seedJobs()
}
