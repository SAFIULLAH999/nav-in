const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkUsers() {
  try {
    console.log('Checking users in database...');

    // Get all active users
    const users = await prisma.user.findMany({
      where: {
        isActive: true
      },
      select: {
        id: true,
        name: true,
        email: true,
        username: true,
        title: true,
        company: true,
        location: true,
        createdAt: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    console.log(`Found ${users.length} active users:`);
    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.name} (${user.email}) - ${user.title || 'No title'} - ${user.company || 'No company'}`);
    });

    // Get all jobs
    const jobs = await prisma.job.findMany({
      where: {
        isActive: true
      },
      select: {
        id: true,
        title: true,
        companyName: true,
        location: true,
        createdAt: true
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 10
    });

    console.log(`\nFound ${jobs.length} active jobs:`);
    jobs.forEach((job, index) => {
      console.log(`${index + 1}. ${job.title} at ${job.companyName} (${job.location})`);
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUsers();
