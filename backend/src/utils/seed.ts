import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { logger } from './logger';

const prisma = new PrismaClient();

async function main() {
  logger.info('Starting database seeding...');

  // Create sample users
  const hashedPassword = await bcrypt.hash('password123', 12);

  const users = await Promise.all([
    prisma.user.upsert({
      where: { email: 'admin@navin.com' },
      update: {},
      create: {
        email: 'admin@navin.com',
        password: hashedPassword,
        name: 'Admin User',
        username: 'admin',
        bio: 'Platform administrator and professional network enthusiast.',
        title: 'Platform Administrator',
        company: 'NavIN',
        location: 'San Francisco, CA',
        role: 'ADMIN',
        isActive: true,
        emailVerified: new Date(),
      },
    }),
    prisma.user.upsert({
      where: { email: 'john.doe@example.com' },
      update: {},
      create: {
        email: 'john.doe@example.com',
        password: hashedPassword,
        name: 'John Doe',
        username: 'johndoe',
        bio: 'Senior Software Engineer passionate about building scalable web applications.',
        title: 'Senior Software Engineer',
        company: 'TechCorp Inc.',
        location: 'San Francisco, CA',
        skills: JSON.stringify(['JavaScript', 'TypeScript', 'React', 'Node.js', 'Python']),
        role: 'USER',
        isActive: true,
        emailVerified: new Date(),
      },
    }),
    prisma.user.upsert({
      where: { email: 'jane.smith@example.com' },
      update: {},
      create: {
        email: 'jane.smith@example.com',
        password: hashedPassword,
        name: 'Jane Smith',
        username: 'janesmith',
        bio: 'Product Manager with 8+ years of experience in fintech and SaaS products.',
        title: 'Senior Product Manager',
        company: 'FinanceFlow',
        location: 'New York, NY',
        skills: JSON.stringify(['Product Strategy', 'Agile', 'User Research', 'Data Analysis']),
        role: 'USER',
        isActive: true,
        emailVerified: new Date(),
      },
    }),
    prisma.user.upsert({
      where: { email: 'mike.johnson@example.com' },
      update: {},
      create: {
        email: 'mike.johnson@example.com',
        password: hashedPassword,
        name: 'Mike Johnson',
        username: 'mikejohnson',
        bio: 'UX Designer focused on creating intuitive and accessible user experiences.',
        title: 'Senior UX Designer',
        company: 'DesignStudio',
        location: 'Austin, TX',
        skills: JSON.stringify(['UX Design', 'Prototyping', 'User Research', 'Figma', 'Adobe Creative Suite']),
        role: 'USER',
        isActive: true,
        emailVerified: new Date(),
      },
    }),
    prisma.user.upsert({
      where: { email: 'sarah.williams@example.com' },
      update: {},
      create: {
        email: 'sarah.williams@example.com',
        password: hashedPassword,
        name: 'Sarah Williams',
        username: 'sarahwilliams',
        bio: 'Data Scientist specializing in machine learning and predictive analytics.',
        title: 'Senior Data Scientist',
        company: 'DataTech Solutions',
        location: 'Seattle, WA',
        skills: JSON.stringify(['Python', 'Machine Learning', 'SQL', 'TensorFlow', 'Statistics']),
        role: 'USER',
        isActive: true,
        emailVerified: new Date(),
      },
    }),
  ]);

  logger.info(`Created ${users.length} users`);

  // Create sample posts
  const posts = await Promise.all([
    prisma.post.create({
      data: {
        content: 'Excited to share that I\'ve been working on a new React application with TypeScript and Next.js! The developer experience has been fantastic. 🚀 #React #TypeScript #WebDev',
        authorId: users[1].id, // John Doe
      },
    }),
    prisma.post.create({
      data: {
        content: 'Just finished reading "The Pragmatic Programmer" - such valuable insights for software developers at any level. Highly recommend! 📚 #SoftwareDevelopment #CareerGrowth',
        authorId: users[2].id, // Jane Smith
      },
    }),
    prisma.post.create({
      data: {
        content: 'Working on a new design system that prioritizes accessibility and user experience. It\'s amazing how small changes can make such a big difference! 🎨 #UXDesign #Accessibility #DesignSystems',
        authorId: users[3].id, // Mike Johnson
      },
    }),
    prisma.post.create({
      data: {
        content: 'Built a machine learning model that improved our prediction accuracy by 25%! The power of quality data and proper feature engineering never ceases to amaze me. 🤖 #MachineLearning #DataScience #AI',
        authorId: users[4].id, // Sarah Williams
      },
    }),
    prisma.post.create({
      data: {
        content: 'Hot take: Remote work isn\'t just a trend, it\'s the future of work. Companies that embrace flexibility will attract the best talent. What are your thoughts? 💭 #RemoteWork #FutureOfWork #WorkLifeBalance',
        authorId: users[1].id, // John Doe
      },
    }),
  ]);

  logger.info(`Created ${posts.length} posts`);

  // Create sample jobs
  const jobs = await Promise.all([
    prisma.job.create({
      data: {
        title: 'Senior Frontend Developer',
        description: 'We are looking for a Senior Frontend Developer to join our growing team. You will be responsible for building responsive web applications using React, TypeScript, and modern CSS frameworks.',
        companyName: 'TechCorp Inc.',
        location: 'San Francisco, CA',
        type: 'FULL_TIME',
        salaryMin: 120000,
        salaryMax: 160000,
        requirements: JSON.stringify([
          '5+ years of experience with React and TypeScript',
          'Strong understanding of modern CSS and responsive design',
          'Experience with state management (Redux, Zustand, etc.)',
          'Knowledge of testing frameworks (Jest, React Testing Library)',
          'Familiarity with build tools and CI/CD pipelines',
        ]),
        benefits: JSON.stringify([
          'Competitive salary and equity package',
          'Health, dental, and vision insurance',
          'Flexible work arrangements',
          'Professional development budget',
          'Catered meals and snacks',
        ]),
        skills: JSON.stringify(['React', 'TypeScript', 'CSS', 'JavaScript', 'Redux']),
        experience: 'SENIOR',
        isRemote: true,
        authorId: users[1].id,
      },
    }),
    prisma.job.create({
      data: {
        title: 'Product Manager',
        description: 'Join our product team to drive the development of innovative fintech solutions. You will work closely with engineering, design, and business teams to deliver exceptional user experiences.',
        companyName: 'FinanceFlow',
        location: 'New York, NY',
        type: 'FULL_TIME',
        salaryMin: 110000,
        salaryMax: 140000,
        requirements: JSON.stringify([
          '3+ years of product management experience',
          'Experience in fintech or financial services',
          'Strong analytical and problem-solving skills',
          'Excellent communication and leadership abilities',
          'Experience with Agile development methodologies',
        ]),
        benefits: JSON.stringify([
          'Competitive compensation package',
          'Comprehensive health benefits',
          '401(k) with company matching',
          'Flexible PTO policy',
          'Stock options',
        ]),
        skills: JSON.stringify(['Product Strategy', 'Agile', 'Data Analysis', 'User Research']),
        experience: 'MID',
        isRemote: false,
        authorId: users[2].id,
      },
    }),
    prisma.job.create({
      data: {
        title: 'UX Designer',
        description: 'We are seeking a talented UX Designer to help shape the future of our design system and user experiences. You will collaborate with product and engineering teams to create intuitive interfaces.',
        companyName: 'DesignStudio',
        location: 'Austin, TX',
        type: 'FULL_TIME',
        salaryMin: 80000,
        salaryMax: 110000,
        requirements: JSON.stringify([
          '3+ years of UX design experience',
          'Proficiency in Figma, Sketch, or similar tools',
          'Strong portfolio demonstrating design process',
          'Experience with user research and usability testing',
          'Understanding of design systems and component libraries',
        ]),
        benefits: JSON.stringify([
          'Competitive salary',
          'Health and wellness benefits',
          'Creative and collaborative work environment',
          'Latest design tools and resources',
          'Conference and workshop attendance',
        ]),
        skills: JSON.stringify(['UX Design', 'Figma', 'User Research', 'Prototyping', 'Design Systems']),
        experience: 'MID',
        isRemote: true,
        authorId: users[3].id,
      },
    }),
  ]);

  logger.info(`Created ${jobs.length} jobs`);

  // Create sample connections
  const connections = await Promise.all([
    // John Doe connects with Jane Smith
    prisma.connection.upsert({
      where: {
        senderId_receiverId: {
          senderId: users[1].id,
          receiverId: users[2].id,
        },
      },
      update: {},
      create: {
        senderId: users[1].id,
        receiverId: users[2].id,
        status: 'ACCEPTED',
        connectionType: 'PROFESSIONAL',
        strength: 7,
      },
    }),
    // Jane Smith connects with Mike Johnson
    prisma.connection.upsert({
      where: {
        senderId_receiverId: {
          senderId: users[2].id,
          receiverId: users[3].id,
        },
      },
      update: {},
      create: {
        senderId: users[2].id,
        receiverId: users[3].id,
        status: 'ACCEPTED',
        connectionType: 'PROFESSIONAL',
        strength: 6,
      },
    }),
    // Mike Johnson connects with Sarah Williams
    prisma.connection.upsert({
      where: {
        senderId_receiverId: {
          senderId: users[3].id,
          receiverId: users[4].id,
        },
      },
      update: {},
      create: {
        senderId: users[3].id,
        receiverId: users[4].id,
        status: 'ACCEPTED',
        connectionType: 'PROFESSIONAL',
        strength: 8,
      },
    }),
  ]);

  logger.info(`Created ${connections.length} connections`);

  // Create sample likes
  const likes = await Promise.all([
    prisma.like.create({
      data: {
        userId: users[2].id, // Jane likes John's post
        postId: posts[0].id,
      },
    }),
    prisma.like.create({
      data: {
        userId: users[3].id, // Mike likes John's post
        postId: posts[0].id,
      },
    }),
    prisma.like.create({
      data: {
        userId: users[1].id, // John likes Jane's post
        postId: posts[1].id,
      },
    }),
    prisma.like.create({
      data: {
        userId: users[4].id, // Sarah likes Mike's post
        postId: posts[2].id,
      },
    }),
  ]);

  logger.info(`Created ${likes.length} likes`);

  // Create sample comments
  const comments = await Promise.all([
    prisma.comment.create({
      data: {
        content: 'This looks amazing! I\'ve been wanting to try Next.js for my next project.',
        userId: users[2].id, // Jane comments on John's post
        postId: posts[0].id,
      },
    }),
    prisma.comment.create({
      data: {
        content: 'Great insights! I especially agree with the emphasis on continuous learning.',
        userId: users[3].id, // Mike comments on Jane's post
        postId: posts[1].id,
      },
    }),
    prisma.comment.create({
      data: {
        content: 'Love this perspective! Remote work has definitely changed how we think about collaboration.',
        userId: users[4].id, // Sarah comments on John's second post
        postId: posts[4].id,
      },
    }),
  ]);

  logger.info(`Created ${comments.length} comments`);

  // Create sample notifications
  const notifications = await Promise.all([
    prisma.notification.create({
      data: {
        userId: users[1].id, // Notify John about Jane's like
        type: 'POST_LIKE',
        title: 'New Like',
        message: `${users[2].name} liked your post`,
        data: JSON.stringify({
          postId: posts[0].id,
          likerId: users[2].id,
        }),
      },
    }),
    prisma.notification.create({
      data: {
        userId: users[2].id, // Notify Jane about John's like
        type: 'POST_LIKE',
        title: 'New Like',
        message: `${users[1].name} liked your post`,
        data: JSON.stringify({
          postId: posts[1].id,
          likerId: users[1].id,
        }),
      },
    }),
    prisma.notification.create({
      data: {
        userId: users[1].id, // Notify John about Jane's comment
        type: 'POST_COMMENT',
        title: 'New Comment',
        message: `${users[2].name} commented on your post`,
        data: JSON.stringify({
          postId: posts[0].id,
          commentId: comments[0].id,
        }),
      },
    }),
  ]);

  logger.info(`Created ${notifications.length} notifications`);

  logger.info('Database seeding completed successfully!');
  logger.info('Sample users created:');
  users.forEach((user, index) => {
    logger.info(`${index + 1}. ${user.name} (${user.email}) - ${user.role}`);
  });

  logger.info('Sample data is ready for testing!');
}

main()
  .catch((e) => {
    logger.error('Error during database seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });