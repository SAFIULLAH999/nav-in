import Link from 'next/link';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Integrations - HireSphere',
  description: 'Discover integrations that connect with your favorite tools and platforms to streamline your hiring process.',
  openGraph: {
    title: 'Integrations - HireSphere',
    description: 'Connect HireSphere with your favorite tools and platforms.',
    url: 'https://hiresphere.vercel.app/integrations',
    siteName: 'HireSphere',
    images: [
      {
        url: '/og/integrations',
        width: 1200,
        height: 630,
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
};

const integrations = [
  {
    name: 'Slack',
    description: 'Get notified about new applications and updates directly in your Slack workspace.',
    category: 'Communication',
    status: 'Available',
    logo: '💬',
    features: ['Real-time notifications', 'Application updates', 'Team collaboration'],
  },
  {
    name: 'Google Calendar',
    description: 'Schedule interviews automatically and sync with your existing calendar.',
    category: 'Productivity',
    status: 'Available',
    logo: '📅',
    features: ['Automatic scheduling', 'Interview reminders', 'Calendar sync'],
  },
  {
    name: 'Zapier',
    description: 'Connect with thousands of apps through automated workflows.',
    category: 'Automation',
    status: 'Available',
    logo: '⚡',
    features: ['Workflow automation', 'Custom triggers', 'Multi-app integration'],
  },
  {
    name: 'Zoom',
    description: 'Schedule and conduct video interviews seamlessly.',
    category: 'Communication',
    status: 'Coming Soon',
    logo: '📹',
    features: ['Video interviews', 'Screen sharing', 'Recording capabilities'],
  },
  {
    name: 'Salesforce',
    description: 'Sync candidate data with your CRM for better lead management.',
    category: 'CRM',
    status: 'Coming Soon',
    logo: '☁️',
    features: ['Candidate sync', 'Lead tracking', 'Custom fields'],
  },
  {
    name: 'Microsoft Teams',
    description: 'Integrate with Teams for internal communication and interviews.',
    category: 'Communication',
    status: 'Coming Soon',
    logo: '👥',
    features: ['Team chat', 'Video meetings', 'File sharing'],
  },
];

const categories = ['All', 'Communication', 'Productivity', 'Automation', 'CRM'];

export default function IntegrationsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Integrations</h1>
              <p className="mt-2 text-slate-600 dark:text-slate-400">
                Connect HireSphere with your favorite tools and streamline your workflow
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
        {/* Category Filter */}
        <div className="flex flex-wrap gap-2 mb-8">
          {categories.map((category) => (
            <button
              key={category}
              className="px-4 py-2 rounded-full text-sm font-medium bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
            >
              {category}
            </button>
          ))}
        </div>

        {/* Integration Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {integrations.map((integration, index) => (
            <div
              key={index}
              className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">{integration.logo}</span>
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                      {integration.name}
                    </h3>
                    <span className="text-sm text-slate-500 dark:text-slate-400">
                      {integration.category}
                    </span>
                  </div>
                </div>
                <span
                  className={`px-2 py-1 text-xs font-medium rounded-full ${
                    integration.status === 'Available'
                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                      : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
                  }`}
                >
                  {integration.status}
                </span>
              </div>

              <p className="text-slate-600 dark:text-slate-400 mb-4">
                {integration.description}
              </p>

              <div className="space-y-2">
                <h4 className="text-sm font-medium text-slate-900 dark:text-white">Features:</h4>
                <ul className="space-y-1">
                  {integration.features.map((feature, featureIndex) => (
                    <li
                      key={featureIndex}
                      className="text-sm text-slate-600 dark:text-slate-400 flex items-center"
                    >
                      <span className="w-1 h-1 bg-blue-500 rounded-full mr-2"></span>
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-6">
                {integration.status === 'Available' ? (
                  <button className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors">
                    Install Integration
                  </button>
                ) : (
                  <button className="w-full bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 py-2 px-4 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors cursor-not-allowed">
                    Coming Soon
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* CTA Section */}
        <div className="mt-16 bg-blue-600 rounded-2xl p-8 text-center text-white">
          <h2 className="text-2xl font-bold mb-4">Need a Custom Integration?</h2>
          <p className="text-blue-100 mb-6 max-w-2xl mx-auto">
            We work with teams to create custom integrations for their specific needs. 
            Contact our development team to discuss your requirements.
          </p>
          <Link
            href="/contact"
            className="inline-block bg-white text-blue-600 px-6 py-3 rounded-lg font-medium hover:bg-blue-50 transition-colors"
          >
            Contact Development Team
          </Link>
        </div>
      </div>
    </div>
  );
}