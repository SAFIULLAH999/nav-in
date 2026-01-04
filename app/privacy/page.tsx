import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Privacy Policy - HireSphere',
  description: 'Read HireSphere\'s Privacy Policy to understand how we collect, use, and protect your personal information.',
  openGraph: {
    title: 'Privacy Policy - HireSphere',
    description: 'Read HireSphere\'s Privacy Policy to understand how we protect your data.',
    url: 'https://hiresphere.vercel.app/privacy',
    siteName: 'HireSphere',
    images: [
      {
        url: '/og/privacy',
        width: 1200,
        height: 630,
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
};

const sections = [
  {
    id: 'overview',
    title: '1. Overview',
    content: `At HireSphere, we are committed to protecting your privacy and ensuring the security of your personal information. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our professional networking platform.

This policy applies to all users of HireSphere and covers information collected through our website, mobile applications, and related services. By using our Service, you consent to the data practices described in this policy.`
  },
  {
    id: 'information-we-collect',
    title: '2. Information We Collect',
    content: `We collect information you provide directly to us and information we obtain automatically when you use our Service:

**Information You Provide:**
• Account registration information (name, email, password)
• Profile information (headline, summary, experience, education, skills)
• Profile photos and other media you upload
• Job applications and related documents
• Messages and communications with other users
• Content you post (articles, comments, updates)
• Feedback, surveys, and support requests

**Information We Collect Automatically:**
• Device information (IP address, browser type, operating system)
• Usage data (pages visited, time spent, features used)
• Location information (general geographic location)
• Cookies and similar tracking technologies`
  },
  {
    id: 'how-we-use',
    title: '3. How We Use Your Information',
    content: `We use your information to provide, maintain, and improve our Service:

**Service Provision:**
• Create and manage your account
• Provide personalized content and recommendations
• Facilitate networking and job connections
• Process job applications and facilitate hiring
• Enable messaging and communication features

**Service Improvement:**
• Analyze usage patterns and improve features
• Develop new services and functionality
• Conduct research and analytics
• Debug and fix technical issues

**Communication:**
• Send service-related notifications
• Respond to your inquiries and support requests
• Provide updates about new features (with your consent)
• Send important policy changes and notices`
  },
  {
    id: 'information-sharing',
    title: '4. How We Share Your Information',
    content: `We may share your information in the following circumstances:

**With Other Users:**
• Profile information is visible to other users
• Your posts and content may be shared with your network
• Job applications are shared with relevant employers

**With Service Providers:**
• Third-party services that help operate our platform
• Cloud hosting and storage providers
• Analytics and marketing services
• Payment processors for subscription services

**Legal Requirements:**
• To comply with legal obligations
• To protect the rights and safety of users
• In response to lawful government requests
• To enforce our terms of service

**Business Transfers:**
• In connection with mergers or acquisitions
• During corporate restructuring
• With your consent for other purposes`
  },
  {
    id: 'data-security',
    title: '5. Data Security',
    content: `We implement appropriate technical and organizational measures to protect your information:

**Technical Safeguards:**
• Encryption of data in transit and at rest
• Secure authentication and access controls
• Regular security assessments and monitoring
• Protected API endpoints and secure coding practices

**Organizational Measures:**
• Employee training on data protection
• Access controls and need-to-know basis
• Incident response and breach notification procedures
• Regular audits and compliance reviews

**Data Breach Response:**
In the event of a data breach that affects your personal information, we will notify you within 72 hours and provide details about the incident and our response measures.`
  },
  {
    id: 'your-rights',
    title: '6. Your Rights and Choices',
    content: `You have several rights regarding your personal information:

**Access and Portability:**
• Request a copy of your personal data
• Download your data in a portable format
• Access your account settings and profile information

**Correction and Updates:**
• Update your profile information at any time
• Correct inaccurate or incomplete data
• Request deletion of outdated information

**Deletion and Restriction:**
• Request deletion of your account and associated data
• Restrict processing of your information in certain circumstances
• Object to certain types of data processing

**Communication Preferences:**
• Opt out of promotional communications
• Manage notification preferences
• Control visibility of your profile information

To exercise these rights, please contact us at privacy@hiresphere.com.`
  },
  {
    id: 'cookies',
    title: '7. Cookies and Tracking Technologies',
    content: `We use cookies and similar technologies to enhance your experience:

**Types of Cookies:**
• Essential cookies (required for basic functionality)
• Performance cookies (help us improve the Service)
• Functional cookies (remember your preferences)
• Analytics cookies (help us understand usage patterns)

**Managing Cookies:**
You can control cookies through your browser settings. However, disabling certain cookies may limit the functionality of our Service. We also provide cookie preference controls in your account settings.

**Third-Party Tracking:**
We may use third-party analytics services that employ cookies to collect usage information. These services are subject to their own privacy policies.`
  },
  {
    id: 'data-retention',
    title: '8. Data Retention',
    content: `We retain your information for as long as necessary to provide our Service and comply with legal obligations:

**Account Information:**
• Retained while your account is active
• Deleted within 30 days of account deletion (with some exceptions)
• Anonymized data may be retained for analytics purposes

**Job Applications:**
• Retained for up to 2 years after application
• Deleted upon request or account deletion
• May be retained longer if required by law

**Communications:**
• Message history retained while account is active
• Deleted within 30 days of account deletion
• Backup data may be retained for up to 90 days

**Legal Requirements:**
Some information may be retained longer to comply with legal obligations or resolve disputes.`
  },
  {
    id: 'international-transfers',
    title: '9. International Data Transfers',
    content: `Your information may be transferred to and processed in countries other than your own:

**Transfer Safeguards:**
• We use standard contractual clauses approved by relevant authorities
• We ensure adequate levels of data protection
• We implement additional safeguards as required by law

**Your Rights:**
• You may have rights under local data protection laws
• You can contact us to exercise these rights
• We will respond to requests within applicable timeframes

**Cross-Border Processing:**
When we transfer data internationally, we ensure that appropriate safeguards are in place to protect your information in accordance with this Privacy Policy.`
  },
  {
    id: 'children',
    title: '10. Children's Privacy',
    content: `Our Service is not intended for children under 16 years of age:

**Age Restrictions:**
• We do not knowingly collect personal information from children under 16
• If we discover we have collected such information, we will delete it promptly
• Parents or guardians may contact us if they believe their child has provided personal information

**Parental Consent:**
• For users between 13-16, we may require parental consent
• We will notify parents if we collect information from their children
• Parents can request deletion of their child's information at any time`
  },
  {
    id: 'changes',
    title: '11. Changes to This Privacy Policy',
    content: `We may update this Privacy Policy from time to time to reflect changes in our practices or legal requirements:

**Notification of Changes:**
• We will post the updated policy on this page
• We will update the "last modified" date
• For material changes, we will provide additional notice
• We may send email notifications for significant changes

**Your Continued Use:**
Your continued use of the Service after the effective date of the updated policy constitutes acceptance of the changes. If you do not agree to the updated policy, you may need to stop using our Service.`
  },
  {
    id: 'contact',
    title: '12. Contact Information',
    content: `If you have questions about this Privacy Policy or our data practices, please contact us:

**Privacy Officer:**
• Email: privacy@hiresphere.com
• Address: 123 Tech Street, Suite 100, San Francisco, CA 94107
• Phone: +1 (555) 123-4567

**Data Protection Requests:**
• Subject Line: "Data Protection Request"
• Include: Your name, email, and specific request details
• Response Time: We will respond within 30 days

**Complaints:**
You may also have the right to lodge a complaint with your local data protection authority.`
  }
];

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between mb-4">
            <Link
              href="/"
              className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
            >
              ← Back to Home
            </Link>
            <div className="text-sm text-slate-500 dark:text-slate-400">
              Last updated: January 2, 2026
            </div>
          </div>
          <h1 className="text-4xl font-bold text-slate-900 dark:text-white">
            Privacy Policy
          </h1>
          <p className="mt-4 text-lg text-slate-600 dark:text-slate-400">
            Learn how we protect and handle your personal information with transparency and care.
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Table of Contents */}
        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700 mb-8">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">
            Table of Contents
          </h2>
          <nav className="space-y-2">
            {sections.map((section) => (
              <a
                key={section.id}
                href={`#${section.id}`}
                className="block text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
              >
                {section.title}
              </a>
            ))}
          </nav>
        </div>

        {/* Privacy Policy Content */}
        <div className="bg-white dark:bg-slate-800 rounded-xl p-8 shadow-sm border border-slate-200 dark:border-slate-700">
          <div className="prose prose-slate dark:prose-invert max-w-none">
            {sections.map((section) => (
              <section key={section.id} id={section.id} className="mb-12 last:mb-0">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
                  {section.title}
                </h2>
                <div className="text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                  {section.content}
                </div>
              </section>
            ))}
          </div>
        </div>

        {/* Privacy Highlights */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700 text-center">
            <div className="text-3xl mb-3">🔒</div>
            <h3 className="font-semibold text-slate-900 dark:text-white mb-2">Data Security</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Enterprise-grade encryption and security measures
            </p>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700 text-center">
            <div className="text-3xl mb-3">⚙️</div>
            <h3 className="font-semibold text-slate-900 dark:text-white mb-2">Your Control</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Manage your privacy settings and data preferences
            </p>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700 text-center">
            <div className="text-3xl mb-3">📋</div>
            <h3 className="font-semibold text-slate-900 dark:text-white mb-2">Transparency</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Clear information about data collection and usage
            </p>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700 text-center">
            <div className="text-3xl mb-3">🛡️</div>
            <h3 className="font-semibold text-slate-900 dark:text-white mb-2">Compliance</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              GDPR, CCPA and other privacy regulation compliance
            </p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link
            href="/terms"
            className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700 hover:shadow-md transition-shadow text-center"
          >
            <div className="text-2xl mb-3">📄</div>
            <h3 className="font-semibold text-slate-900 dark:text-white mb-2">
              Terms of Service
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Read our terms and conditions
            </p>
          </Link>

          <Link
            href="/contact"
            className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700 hover:shadow-md transition-shadow text-center"
          >
            <div className="text-2xl mb-3">💬</div>
            <h3 className="font-semibold text-slate-900 dark:text-white mb-2">
              Privacy Questions
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Contact our privacy team
            </p>
          </Link>

          <Link
            href="/help"
            className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700 hover:shadow-md transition-shadow text-center"
          >
            <div className="text-2xl mb-3">❓</div>
            <h3 className="font-semibold text-slate-900 dark:text-white mb-2">
              Help Center
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Get support and guidance
            </p>
          </Link>
        </div>

        {/* Trust Banner */}
        <div className="mt-12 bg-green-600 rounded-2xl p-8 text-center text-white">
          <h2 className="text-2xl font-bold mb-4">Your privacy is our priority</h2>
          <p className="text-green-100 mb-6 max-w-2xl mx-auto">
            We are committed to protecting your personal information and providing you with control 
            over your data. Your trust is essential to our mission of connecting professionals.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/contact"
              className="inline-block bg-white text-green-600 px-6 py-3 rounded-lg font-medium hover:bg-green-50 transition-colors"
            >
              Contact Privacy Team
            </Link>
            <a
              href="mailto:privacy@hiresphere.com"
              className="inline-block bg-green-700 text-white px-6 py-3 rounded-lg font-medium hover:bg-green-800 transition-colors"
            >
              Email Privacy Officer
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}