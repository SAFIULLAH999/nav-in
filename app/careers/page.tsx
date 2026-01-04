import Link from 'next/link';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Careers - HireSphere',
  description: 'Join the HireSphere team and help build the future of professional networking and recruitment.',
  openGraph: {
    title: 'Careers - HireSphere',
    description: 'Join the HireSphere team and help build the future of professional networking.',
    url: 'https://hiresphere.vercel.app/careers',
    siteName: 'HireSphere',
    images: [
      {
        url: '/og/careers',
        width: 1200,
        height: 630,
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
};

const benefits = [
  {
    icon: '🏠',
    title: 'Remote-First',
    description: 'Work from anywhere in the world with our fully remote culture',
  },
  {
    icon: '💰',
    title: 'Competitive Salary',
    description: 'Market-leading compensation packages with equity options',
  },
  {
    icon: '📚',
    title: 'Learning Budget',
    description: '$2,000 annual budget for courses, books, and conferences',
  },
  {
    icon: '🏥',
    title: 'Health Benefits',
    description: 'Comprehensive health, dental, and vision coverage',
  },
  {
    icon: '⏰',
    title: 'Flexible Hours',
    description: 'Flexible working hours to fit your lifestyle',
  },
  {
    icon: '🌴',
    title: 'Unlimited PTO',
    description: 'Take the time you need to recharge and stay fresh',
  },
];

const openPositions = [
  {
    title: 'Senior Frontend Developer',
    department: 'Engineering',
    location: 'Remote',
    type: 'Full-time',
    description: 'Build amazing user experiences with React, Next.js, and TypeScript.',
    requirements: [
      '5+ years of frontend development experience',
      'Expert knowledge of React and Next.js',
      'Experience with TypeScript and modern CSS',
      'Strong understanding of performance optimization',
    ],
  },
  {
    title: 'Product Designer',
    department: 'Design',
    location: 'Remote',
    type: 'Full-time',
    description: 'Design intuitive and beautiful interfaces for millions of professionals.',
    requirements: [
      '3+ years of product design experience',
      'Proficiency in Figma and design systems',
      'Strong portfolio demonstrating UX/UI skills',
      'Experience with user research and testing',
    ],
  },
  {
    title: 'DevOps Engineer',
    department: 'Engineering',
    location: 'Remote',
    type: 'Full-time',
    description: 'Help scale our infrastructure and ensure reliable service delivery.',
    requirements: [
      '3+ years of DevOps experience',
      'Experience with AWS, Docker, and Kubernetes',
      'Knowledge of CI/CD pipelines and automation',
      'Strong scripting skills (Python, Bash)',
    ],
  },
  {
    title: 'Content Marketing Manager',
    department: 'Marketing',
    location: 'Remote',
    type: 'Full-time',
    description: 'Create compelling content that helps professionals grow their careers.',
    requirements: [
      '3+ years of content marketing experience',
      'Strong writing and editing skills',
      'Experience with SEO and social media',
      'Knowledge of professional networking trends',
    ],
  },
  {
    title: 'Customer Success Manager',
    department: 'Customer Success',
    location: 'Remote',
    type: 'Full-time',
    description: 'Help our customers succeed and get maximum value from HireSphere.',
    requirements: [
      '2+ years of customer success experience',
      'Strong communication and problem-solving skills',
      'Experience with SaaS products',
      'Background in recruitment or HR is a plus',
    ],
  },
];

export default function CareersPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Careers</h1>
              <p className="mt-2 text-slate-600 dark:text-slate-400">
                Join us in building the future of professional networking and recruitment
              </p>
            </div>
            <Link
              href="/"
              className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
            >
              ← Back to Home
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-slate-900 dark:text-white mb-4">
            Build the Future of Professional Networking
          </h2>
          <p className="text-xl text-slate-600 dark:text-slate-400 max-w-3xl mx-auto mb-8">
            We're a fast-growing startup on a mission to connect professionals and help them 
            advance their careers. Join our diverse team of innovators, problem-solvers, and 
            mission-driven individuals.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">50+</div>
              <div className="text-slate-600 dark:text-slate-400">Team Members</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">10K+</div>
              <div className="text-slate-600 dark:text-slate-400">Active Users</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">25+</div>
              <div className="text-slate-600 dark:text-slate-400">Countries</div>
            </div>
          </div>
        </div>

        {/* Benefits Section */}
        <div className="mb-16">
          <h3 className="text-2xl font-bold text-slate-900 dark:text-white text-center mb-8">
            Why Work With Us?
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {benefits.map((benefit, index) => (
              <div
                key={index}
                className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700"
              >
                <div className="text-3xl mb-4">{benefit.icon}</div>
                <h4 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                  {benefit.title}
                </h4>
                <p className="text-slate-600 dark:text-slate-400">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Open Positions */}
        <div className="mb-16">
          <h3 className="text-2xl font-bold text-slate-900 dark:text-white text-center mb-8">
            Open Positions
          </h3>
          <div className="space-y-6">
            {openPositions.map((position, index) => (
              <div
                key={index}
                className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700"
              >
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-4">
                  <div>
                    <h4 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
                      {position.title}
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      <span className="px-3 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300 text-sm rounded-full">
                        {position.department}
                      </span>
                      <span className="px-3 py-1 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300 text-sm rounded-full">
                        {position.location}
                      </span>
                      <span className="px-3 py-1 bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300 text-sm rounded-full">
                        {position.type}
                      </span>
                    </div>
                  </div>
                  <button className="mt-4 lg:mt-0 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                    Apply Now
                  </button>
                </div>
                <p className="text-slate-600 dark:text-slate-400 mb-4">{position.description}</p>
                <div>
                  <h5 className="font-semibold text-slate-900 dark:text-white mb-2">Requirements:</h5>
                  <ul className="space-y-1">
                    {position.requirements.map((req, reqIndex) => (
                      <li
                        key={reqIndex}
                        className="text-slate-600 dark:text-slate-400 flex items-center"
                      >
                        <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
                        {req}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Culture Section */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-sm border border-slate-200 dark:border-slate-700 mb-16">
          <h3 className="text-2xl font-bold text-slate-900 dark:text-white text-center mb-6">
            Our Culture
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h4 className="text-lg font-semibold text-slate-900 dark:text-white mb-3">🎯 Mission-Driven</h4>
              <p className="text-slate-600 dark:text-slate-400">
                We're passionate about helping professionals connect and grow their careers. 
                Every feature we build is focused on creating real value for our users.
              </p>
            </div>
            <div>
              <h4 className="text-lg font-semibold text-slate-900 dark:text-white mb-3">🚀 Innovation First</h4>
              <p className="text-slate-600 dark:text-slate-400">
                We encourage experimentation, embrace new technologies, and aren't afraid 
                to challenge the status quo to create better solutions.
              </p>
            </div>
            <div>
              <h4 className="text-lg font-semibold text-slate-900 dark:text-white mb-3">🤝 Collaboration</h4>
              <p className="text-slate-600 dark:text-slate-400">
                We believe the best ideas come from diverse perspectives. We foster an 
                inclusive environment where everyone can contribute and grow.
              </p>
            </div>
            <div>
              <h4 className="text-lg font-semibold text-slate-900 dark:text-white mb-3">📈 Continuous Growth</h4>
              <p className="text-slate-600 dark:text-slate-400">
                We invest in our team's professional development through conferences, 
                courses, and mentorship programs to help everyone reach their potential.
              </p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-blue-600 rounded-2xl p-8 text-center text-white">
          <h2 className="text-2xl font-bold mb-4">Don't See the Right Role?</h2>
          <p className="text-blue-100 mb-6 max-w-2xl mx-auto">
            We're always looking for talented people to join our team. Send us your resume 
            and tell us how you'd like to contribute to our mission.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/contact"
              className="inline-block bg-white text-blue-600 px-6 py-3 rounded-lg font-medium hover:bg-blue-50 transition-colors"
            >
              Contact Us
            </Link>
            <a
              href="mailto:careers@hiresphere.com"
              className="inline-block bg-blue-700 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-800 transition-colors"
            >
              Email Your Resume
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}