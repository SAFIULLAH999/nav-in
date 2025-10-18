import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create a demo user first
  const demoUser = await prisma.user.upsert({
    where: { id: 'demo-user-id' },
    update: {},
    create: {
      id: 'demo-user-id',
      name: 'Demo Recruiter',
      email: 'demo@navin.com',
      password: 'demo-password',
      username: 'demo-recruiter',
      title: 'HR Manager',
      role: 'RECRUITER',
    },
  });

  console.log('Demo user created:', demoUser.id);

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
