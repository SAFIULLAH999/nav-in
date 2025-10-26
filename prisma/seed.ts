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

  // Create additional users for a more realistic network
  const additionalUsers = [
    {
      id: 'user-4',
      name: 'David Chen',
      email: 'david@navin.com',
      password: 'demo-password',
      username: 'david-chen',
      title: 'Data Scientist',
      company: 'DataDriven Corp',
      location: 'Seattle, WA',
      bio: 'Data scientist with expertise in machine learning and predictive analytics.',
      skills: JSON.stringify(['Python', 'Machine Learning', 'TensorFlow', 'SQL', 'Statistics']),
      role: 'USER',
    },
    {
      id: 'user-5',
      name: 'Emma Wilson',
      email: 'emma@navin.com',
      password: 'demo-password',
      username: 'emma-wilson',
      title: 'Frontend Developer',
      company: 'WebCraft Studios',
      location: 'Los Angeles, CA',
      bio: 'Frontend developer passionate about creating beautiful and accessible user interfaces.',
      skills: JSON.stringify(['React', 'TypeScript', 'CSS', 'JavaScript', 'Figma']),
      role: 'USER',
    },
    {
      id: 'user-6',
      name: 'Frank Miller',
      email: 'frank@navin.com',
      password: 'demo-password',
      username: 'frank-miller',
      title: 'Backend Developer',
      company: 'ServerSide Co',
      location: 'Chicago, IL',
      bio: 'Backend developer specializing in scalable systems and API design.',
      skills: JSON.stringify(['Node.js', 'PostgreSQL', 'Redis', 'Docker', 'AWS']),
      role: 'USER',
    },
    {
      id: 'user-7',
      name: 'Grace Lee',
      email: 'grace@navin.com',
      password: 'demo-password',
      username: 'grace-lee',
      title: 'Full Stack Developer',
      company: 'FullStack Labs',
      location: 'Miami, FL',
      bio: 'Full stack developer with experience in both frontend and backend technologies.',
      skills: JSON.stringify(['React', 'Node.js', 'MongoDB', 'Express', 'GraphQL']),
      role: 'USER',
    },
    {
      id: 'user-8',
      name: 'Henry Taylor',
      email: 'henry@navin.com',
      password: 'demo-password',
      username: 'henry-taylor',
      title: 'DevOps Engineer',
      company: 'CloudTech Solutions',
      location: 'Denver, CO',
      bio: 'DevOps engineer focused on automation, CI/CD, and cloud infrastructure.',
      skills: JSON.stringify(['AWS', 'Kubernetes', 'Docker', 'Jenkins', 'Terraform']),
      role: 'USER',
    },
    {
      id: 'user-9',
      name: 'Iris Brown',
      email: 'iris@navin.com',
      password: 'demo-password',
      username: 'iris-brown',
      title: 'Marketing Manager',
      company: 'GrowthCorp',
      location: 'Boston, MA',
      bio: 'Marketing manager with expertise in digital marketing and growth strategies.',
      skills: JSON.stringify(['Digital Marketing', 'SEO', 'Content Strategy', 'Analytics', 'Social Media']),
      role: 'USER',
    },
    {
      id: 'user-10',
      name: 'Jack Anderson',
      email: 'jack@navin.com',
      password: 'demo-password',
      username: 'jack-anderson',
      title: 'HR Manager',
      company: 'PeopleFirst Inc',
      location: 'Portland, OR',
      bio: 'HR manager passionate about talent acquisition and employee development.',
      skills: JSON.stringify(['Recruitment', 'Employee Relations', 'Training', 'HR Analytics', 'Compliance']),
      role: 'USER',
    },
  ];

  const createdUsers = [];
  for (const userData of additionalUsers) {
    const user = await prisma.user.upsert({
      where: { id: userData.id },
      update: {},
      create: userData,
    });
    createdUsers.push(user);
  }

  console.log(`Created ${createdUsers.length} additional users`);

  // Add real users that logged in successfully
  const realUsers = [
    {
      id: 'real-user-1',
      name: 'Safiullah',
      email: 'safiullahgamer7543@gmail.com',
      password: 'demo-password', // For testing purposes
      username: 'safiullah-hacker',
      title: 'Software Developer',
      company: 'Independent',
      location: 'Unknown',
      bio: 'Professional developer and cybersecurity enthusiast.',
      skills: JSON.stringify(['JavaScript', 'Python', 'Cybersecurity', 'Web Development', 'Ethical Hacking']),
      role: 'USER',
    },
    {
      id: 'real-user-2',
      name: 'Saif Dev',
      email: 'saifdev222@gmail.com',
      password: 'demo-password', // For testing purposes
      username: 'saif-dev',
      title: 'Full Stack Developer',
      company: 'Tech Solutions',
      location: 'Unknown',
      bio: 'Full stack developer with expertise in modern web technologies.',
      skills: JSON.stringify(['React', 'Node.js', 'TypeScript', 'MongoDB', 'Express']),
      role: 'USER',
    },
  ];

  const realCreatedUsers = [];
  for (const userData of realUsers) {
    const user = await prisma.user.upsert({
      where: { id: userData.id },
      update: {},
      create: userData,
    });
    realCreatedUsers.push(user);
  }

  console.log(`Created ${realCreatedUsers.length} real users`);

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

  // Create sample jobs using existing users as authors
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
      authorId: demoUser1.id,
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
      authorId: demoUser2.id,
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
      authorId: demoUser3.id,
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
      authorId: demoUser1.id,
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
      authorId: demoUser2.id,
    },
    {
      title: 'Frontend Developer',
      description: 'We are looking for a Frontend Developer to create beautiful and responsive user interfaces. Experience with React and modern CSS is required.',
      companyName: 'WebCraft Studios',
      location: 'Los Angeles, CA',
      type: 'FULL_TIME',
      salaryMin: 70000,
      salaryMax: 110000,
      requirements: JSON.stringify(['React expertise', 'CSS/SASS', 'JavaScript ES6+', 'Responsive design']),
      benefits: 'Health insurance, remote work, professional development',
      experience: 'Mid Level',
      isRemote: true,
      authorId: demoUser3.id,
    },
    {
      title: 'Backend Developer',
      description: 'Join our backend team to build scalable APIs and microservices. Strong experience with Node.js and database design required.',
      companyName: 'ServerSide Co',
      location: 'Chicago, IL',
      type: 'FULL_TIME',
      salaryMin: 90000,
      salaryMax: 130000,
      requirements: JSON.stringify(['Node.js expertise', 'Database design', 'API development', 'Microservices']),
      benefits: 'Health benefits, 401k, flexible hours',
      experience: 'Mid Level',
      isRemote: false,
      authorId: demoUser1.id,
    },
    {
      title: 'Full Stack Developer',
      description: 'Looking for a versatile Full Stack Developer to work on both frontend and backend systems. Experience with modern web technologies required.',
      companyName: 'FullStack Labs',
      location: 'Miami, FL',
      type: 'FULL_TIME',
      salaryMin: 85000,
      salaryMax: 125000,
      requirements: JSON.stringify(['Full stack experience', 'React/Node.js', 'Database skills', 'Problem solving']),
      benefits: 'Health insurance, stock options, unlimited PTO',
      experience: 'Mid Level',
      isRemote: true,
      authorId: demoUser2.id,
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
