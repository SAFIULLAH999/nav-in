import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create demo users
  const demoUser1 = await prisma.user.upsert({
    where: { id: 'demo-user-1' },
    update: {},
    create: {
      id: 'demo-user-1',
      name: 'Alice Johnson',
      email: 'alice@navin.com',
      password: 'demo-password',
      username: 'alice-johnson',
      title: 'Senior Software Engineer',
      company: 'TechCorp Inc.',
      location: 'San Francisco, CA',
      bio: 'Passionate software engineer with 5+ years of experience in full-stack development.',
      skills: JSON.stringify(['React', 'TypeScript', 'Node.js', 'Python', 'AWS']),
      role: 'USER',
    },
  });

  const demoUser2 = await prisma.user.upsert({
    where: { id: 'demo-user-2' },
    update: {},
    create: {
      id: 'demo-user-2',
      name: 'Bob Smith',
      email: 'bob@navin.com',
      password: 'demo-password',
      username: 'bob-smith',
      title: 'Product Manager',
      company: 'InnovateLab',
      location: 'New York, NY',
      bio: 'Product manager focused on building user-centric solutions.',
      skills: JSON.stringify(['Product Strategy', 'Agile', 'User Research', 'Data Analysis']),
      role: 'USER',
    },
  });

  const demoUser3 = await prisma.user.upsert({
    where: { id: 'demo-user-3' },
    update: {},
    create: {
      id: 'demo-user-3',
      name: 'Carol Davis',
      email: 'carol@navin.com',
      password: 'demo-password',
      username: 'carol-davis',
      title: 'UX Designer',
      company: 'DesignStudio',
      location: 'Austin, TX',
      bio: 'Creative UX designer with a passion for intuitive user experiences.',
      skills: JSON.stringify(['Figma', 'User Research', 'Prototyping', 'Design Systems']),
      role: 'USER',
    },
  });

  console.log('Demo users created:', demoUser1.id, demoUser2.id, demoUser3.id);

  // Create connections between users
  const connection1 = await prisma.connection.upsert({
    where: {
      id: 'connection-1-2'
    },
    update: {},
    create: {
      id: 'connection-1-2',
      senderId: demoUser1.id,
      receiverId: demoUser2.id,
      status: 'ACCEPTED',
      connectionType: 'PROFESSIONAL',
    },
  });

  const connection2 = await prisma.connection.upsert({
    where: {
      id: 'connection-1-3'
    },
    update: {},
    create: {
      id: 'connection-1-3',
      senderId: demoUser1.id,
      receiverId: demoUser3.id,
      status: 'ACCEPTED',
      connectionType: 'PROFESSIONAL',
    },
  });

  const connection3 = await prisma.connection.upsert({
    where: {
      id: 'connection-2-3'
    },
    update: {},
    create: {
      id: 'connection-2-3',
      senderId: demoUser2.id,
      receiverId: demoUser3.id,
      status: 'ACCEPTED',
      connectionType: 'PROFESSIONAL',
    },
  });

  console.log('Connections created between users');

  // Create sample jobs
  const jobs = [
    {
      title: 'Senior Software Engineer',
      description: 'We are looking for a Senior Software Engineer to join our dynamic team. You will be responsible for developing high-quality software solutions and mentoring junior developers.',
      companyName: 'TechCorp Inc.',
      location: 'San Francisco, CA',
      type: 'FULL_TIME',
      salaryMin: 120000,
      salaryMax: 180000,
      requirements: JSON.stringify(['5+ years of experience', 'React expertise', 'Node.js proficiency', 'Leadership skills']),
      benefits: 'Health insurance, 401k matching, flexible PTO',
      experience: 'Senior Level',
      isRemote: true,
      authorId: 'demo-user-id',
    },
    {
      title: 'Product Manager',
      description: 'Join our product team to drive the development of innovative products. You will work closely with engineering, design, and marketing teams.',
      companyName: 'InnovateLab',
      location: 'New York, NY',
      type: 'FULL_TIME',
      salaryMin: 100000,
      salaryMax: 140000,
      requirements: JSON.stringify(['3+ years PM experience', 'Agile methodology', 'Data-driven decision making']),
      benefits: 'Stock options, health benefits, learning budget',
      experience: 'Mid Level',
      isRemote: false,
      authorId: 'demo-user-id',
    },
    {
      title: 'UX Designer',
      description: 'We are seeking a talented UX Designer to create intuitive and engaging user experiences for our web and mobile applications.',
      companyName: 'DesignStudio',
      location: 'Austin, TX',
      type: 'FULL_TIME',
      salaryMin: 80000,
      salaryMax: 120000,
      requirements: JSON.stringify(['Portfolio required', 'Figma proficiency', 'User research experience']),
      benefits: 'Creative freedom, flexible hours, top-tier equipment',
      experience: 'Mid Level',
      isRemote: true,
      authorId: 'demo-user-id',
    },
    {
      title: 'Data Scientist',
      description: 'Looking for a Data Scientist to analyze large datasets and build machine learning models that drive business insights.',
      companyName: 'DataDriven Corp',
      location: 'Seattle, WA',
      type: 'FULL_TIME',
      salaryMin: 110000,
      salaryMax: 160000,
      requirements: JSON.stringify(['Python expertise', 'ML experience', 'Statistical knowledge', 'SQL proficiency']),
      benefits: 'Research time, conference budget, powerful hardware',
      experience: 'Senior Level',
      isRemote: false,
      authorId: 'demo-user-id',
    },
    {
      title: 'DevOps Engineer',
      description: 'Join our infrastructure team to build and maintain scalable, reliable systems. Experience with cloud platforms and automation tools required.',
      companyName: 'CloudTech Solutions',
      location: 'Denver, CO',
      type: 'FULL_TIME',
      salaryMin: 95000,
      salaryMax: 135000,
      requirements: JSON.stringify(['AWS/Azure experience', 'Docker/Kubernetes', 'CI/CD pipelines', 'Infrastructure as Code']),
      benefits: 'Cloud certifications budget, flexible schedule, remote options',
      experience: 'Mid Level',
      isRemote: true,
      authorId: 'demo-user-id',
    },
  ];

  for (const jobData of jobs) {
    await prisma.job.create({
      data: jobData,
    });
  }

  console.log('Database seeded with sample jobs!');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
