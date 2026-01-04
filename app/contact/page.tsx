import Link from 'next/link';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Contact Us - HireSphere',
  description: 'Get in touch with the HireSphere team. We\'re here to help with any questions or feedback.',
  openGraph: {
    title: 'Contact Us - HireSphere',
    description: 'Get in touch with the HireSphere team. We\'re here to help.',
    url: 'https://hiresphere.vercel.app/contact',
    siteName: 'HireSphere',
    images: [
      {
        url: '/og/contact',
        width: 1200,
        height: 630,
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
};

const contactMethods = [
  {
    icon: '📧',
    title: 'Email Us',
    description: 'Send us an email and we\'ll respond within 24 hours',
    contact: 'support@hiresphere.com',
    action: 'mailto:support@hiresphere.com',
  },
  {
    icon: '💬',
    title: 'Live Chat',
    description: 'Chat with our support team in real-time',
    contact: 'Available 9 AM - 6 PM EST',
    action: '#',
  },
  {
    icon: '🐛',
    title: 'Report a Bug',
    description: 'Found an issue? Help us improve by reporting it',
    contact: 'bugs@hiresphere.com',
    action: 'mailto:bugs@hiresphere.com',
  },
  {
    icon: '💡',
    title: 'Feature Requests',
    description: 'Have an idea? We\'d love to hear it',
    contact: 'feedback@hiresphere.com',
    action: 'mailto:feedback@hiresphere.com',
  },
];

const offices = [
  {
    city: 'San Francisco',
    address: '123 Tech Street, Suite 100\nSan Francisco, CA 94107',
    timezone: 'PST (UTC-8)',
  },
  {
    city: 'New York',
    address: '456 Innovation Ave, Floor 15\nNew York, NY 10001',
    timezone: 'EST (UTC-5)',
  },
  {
    city: 'Remote',
    address: 'Team members working globally\nacross 15+ countries',
    timezone: 'Multiple timezones',
  },
];

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Contact Us</h1>
              <p className="mt-2 text-slate-600 dark:text-slate-400">
                We're here to help. Get in touch with our team.
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
            Let's Start a Conversation
          </h2>
          <p className="text-xl text-slate-600 dark:text-slate-400 max-w-3xl mx-auto">
            Whether you have questions about our platform, need technical support, or want to 
            provide feedback, we're here to help. Reach out to us through any of the channels below.
          </p>
        </div>

        {/* Contact Methods */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {contactMethods.map((method, index) => (
            <div
              key={index}
              className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700 hover:shadow-md transition-shadow"
            >
              <div className="text-3xl mb-4">{method.icon}</div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                {method.title}
              </h3>
              <p className="text-slate-600 dark:text-slate-400 text-sm mb-4">
                {method.description}
              </p>
              <p className="text-slate-800 dark:text-slate-200 font-medium mb-4">
                {method.contact}
              </p>
              <a
                href={method.action}
                className="inline-block bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                Contact
              </a>
            </div>
          ))}
        </div>

        {/* Contact Form and Info */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
          {/* Contact Form */}
          <div className="bg-white dark:bg-slate-800 rounded-xl p-8 shadow-sm border border-slate-200 dark:border-slate-700">
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">
              Send us a Message
            </h3>
            <form className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="firstName"
                    className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2"
                  >
                    First Name *
                  </label>
                  <input
                    type="text"
                    id="firstName"
                    name="firstName"
                    required
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
                    placeholder="John"
                  />
                </div>
                <div>
                  <label
                    htmlFor="lastName"
                    className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2"
                  >
                    Last Name *
                  </label>
                  <input
                    type="text"
                    id="lastName"
                    name="lastName"
                    required
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
                    placeholder="Doe"
                  />
                </div>
              </div>
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2"
                >
                  Email Address *
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  required
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
                  placeholder="john@example.com"
                />
              </div>
              <div>
                <label
                  htmlFor="subject"
                  className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2"
                >
                  Subject *
                </label>
                <select
                  id="subject"
                  name="subject"
                  required
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
                >
                  <option value="">Select a subject</option>
                  <option value="general">General Inquiry</option>
                  <option value="support">Technical Support</option>
                  <option value="billing">Billing Question</option>
                  <option value="partnership">Partnership Opportunity</option>
                  <option value="feedback">Feedback</option>
                  <option value="bug">Bug Report</option>
                  <option value="feature">Feature Request</option>
                </select>
              </div>
              <div>
                <label
                  htmlFor="message"
                  className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2"
                >
                  Message *
                </label>
                <textarea
                  id="message"
                  name="message"
                  required
                  rows={6}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
                  placeholder="Tell us how we can help you..."
                />
              </div>
              <button
                type="submit"
                className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                Send Message
              </button>
            </form>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">
              Get in Touch
            </h3>
            <div className="space-y-8">
              <div>
                <h4 className="text-lg font-semibold text-slate-900 dark:text-white mb-3">
                  📞 Phone Support
                </h4>
                <p className="text-slate-600 dark:text-slate-400 mb-2">
                  Available for Premium subscribers
                </p>
                <p className="text-slate-800 dark:text-slate-200 font-medium">
                  +1 (555) 123-4567
                </p>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Monday - Friday, 9 AM - 6 PM EST
                </p>
              </div>

              <div>
                <h4 className="text-lg font-semibold text-slate-900 dark:text-white mb-3">
                  🏢 Our Offices
                </h4>
                <div className="space-y-4">
                  {offices.map((office, index) => (
                    <div key={index}>
                      <p className="font-medium text-slate-800 dark:text-slate-200">
                        {office.city}
                      </p>
                      <p className="text-sm text-slate-600 dark:text-slate-400 whitespace-pre-line">
                        {office.address}
                      </p>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        {office.timezone}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-lg font-semibold text-slate-900 dark:text-white mb-3">
                  🚀 Response Times
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">General Inquiries</span>
                    <span className="text-slate-800 dark:text-slate-200">24 hours</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">Technical Support</span>
                    <span className="text-slate-800 dark:text-slate-200">4 hours</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">Bug Reports</span>
                    <span className="text-slate-800 dark:text-slate-200">2 hours</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">Feature Requests</span>
                    <span className="text-slate-800 dark:text-slate-200">48 hours</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="bg-white dark:bg-slate-800 rounded-xl p-8 shadow-sm border border-slate-200 dark:border-slate-700 mb-16">
          <h3 className="text-2xl font-bold text-slate-900 dark:text-white text-center mb-8">
            Frequently Asked Questions
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h4 className="font-semibold text-slate-900 dark:text-white mb-2">
                How quickly will I get a response?
              </h4>
              <p className="text-slate-600 dark:text-slate-400 text-sm">
                We typically respond to all inquiries within 24 hours. Technical support 
                requests are usually handled within 4 hours during business days.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-slate-900 dark:text-white mb-2">
                Do you offer phone support?
              </h4>
              <p className="text-slate-600 dark:text-slate-400 text-sm">
                Yes, phone support is available for Premium subscribers during business 
                hours (9 AM - 6 PM EST, Monday - Friday).
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-slate-900 dark:text-white mb-2">
                Can I schedule a demo?
              </h4>
              <p className="text-slate-600 dark:text-slate-400 text-sm">
                Absolutely! Contact our sales team to schedule a personalized demo 
                of HireSphere's features and capabilities.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-slate-900 dark:text-white mb-2">
                How can I report security issues?
              </h4>
              <p className="text-slate-600 dark:text-slate-400 text-sm">
                For security-related issues, please email security@hiresphere.com. 
                We take all security reports seriously and respond within 24 hours.
              </p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-blue-600 rounded-2xl p-8 text-center text-white">
          <h2 className="text-2xl font-bold mb-4">Need Immediate Help?</h2>
          <p className="text-blue-100 mb-6 max-w-2xl mx-auto">
            Check out our Help Center for quick answers to common questions, or 
            browse our documentation for detailed guides and tutorials.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/help"
              className="inline-block bg-white text-blue-600 px-6 py-3 rounded-lg font-medium hover:bg-blue-50 transition-colors"
            >
              Help Center
            </Link>
            <a
              href="https://docs.hiresphere.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block bg-blue-700 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-800 transition-colors"
            >
              Documentation
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}