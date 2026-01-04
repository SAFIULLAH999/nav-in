import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Terms of Service - HireSphere',
  description: 'Read HireSphere\'s Terms of Service to understand the rules and guidelines for using our platform.',
  openGraph: {
    title: 'Terms of Service - HireSphere',
    description: 'Read HireSphere\'s Terms of Service to understand the rules and guidelines.',
    url: 'https://hiresphere.vercel.app/terms',
    siteName: 'HireSphere',
    images: [
      {
        url: '/og/terms',
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
    id: 'acceptance',
    title: '1. Acceptance of Terms',
    content: `By accessing and using HireSphere ("Service"), you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.`
  },
  {
    id: 'description',
    title: '2. Description of Service',
    content: `HireSphere is a professional networking platform that connects job seekers with employers, facilitates professional networking, and provides job search tools. The Service includes:
    • Professional networking features
    • Job search and application system
    • Company profiles and reviews
    • Messaging and communication tools
    • Content sharing and social features`
  },
  {
    id: 'registration',
    title: '3. User Registration and Account',
    content: `To use certain features of the Service, you must register for an account by providing accurate, current, and complete information. You are responsible for:
    • Maintaining the confidentiality of your account credentials
    • All activities that occur under your account
    • Immediately notifying us of any unauthorized use
    • Ensuring your information remains accurate and up-to-date
    You must be at least 16 years old to register for an account.`
  },
  {
    id: 'user-conduct',
    title: '4. User Conduct and Prohibited Activities',
    content: `You agree not to engage in any of the following prohibited activities:
    • Violating any applicable laws or regulations
    • Infringing on intellectual property rights
    • Transmitting malicious code or attempting to gain unauthorized access
    • Impersonating others or providing false information
    • Harassing, abusing, or harming other users
    • Posting spam, advertisements, or promotional content without permission
    • Using automated systems to interact with the Service
    • Attempting to reverse engineer or exploit the Service`
  },
  {
    id: 'content',
    title: '5. User Content and Intellectual Property',
    content: `You retain ownership of content you post on HireSphere. However, by posting content, you grant us a worldwide, non-exclusive, royalty-free license to use, modify, and display your content in connection with operating and improving the Service.
    
    You represent and warrant that:
    • You own or have the necessary rights to your content
    • Your content does not violate any laws or third-party rights
    • Your content is not harmful, offensive, or inappropriate
    
    We reserve the right to remove content that violates these terms.`
  },
  {
    id: 'privacy',
    title: '6. Privacy and Data Protection',
    content: `Your privacy is important to us. Our collection and use of personal information is governed by our Privacy Policy, which is incorporated into these Terms by reference. By using the Service, you consent to the collection and use of your information as described in our Privacy Policy.`
  },
  {
    id: 'payments',
    title: '7. Payments and Subscriptions',
    content: `Certain features of the Service require payment. All fees are non-refundable except as required by law or as explicitly stated in these terms.
    
    • Subscription fees are billed in advance on a recurring basis
    • You may cancel your subscription at any time
    • We reserve the right to change our pricing with 30 days notice
    • Failure to pay fees may result in suspension of your account`
  },
  {
    id: 'disclaimers',
    title: '8. Disclaimers and Limitation of Liability',
    content: `THE SERVICE IS PROVIDED "AS IS" WITHOUT WARRANTIES OF ANY KIND. TO THE MAXIMUM EXTENT PERMITTED BY LAW, HIRESPHERE DISCLAIMS ALL WARRANTIES, EXPRESS OR IMPLIED, INCLUDING MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.
    
    IN NO EVENT SHALL HIRESPHERE BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING BUT NOT LIMITED TO LOSS OF PROFITS, DATA, OR USE.`
  },
  {
    id: 'termination',
    title: '9. Termination',
    content: `You may terminate your account at any time by contacting us or using the account deletion feature in your settings. We may terminate or suspend your account immediately, without prior notice, for conduct that we believe violates these Terms or is harmful to other users, us, or third parties. Upon termination, your right to use the Service will cease immediately.`
  },
  {
    id: 'changes',
    title: '10. Changes to Terms',
    content: `We reserve the right to modify or replace these Terms at any time. We will notify users of any material changes by posting the new Terms on this page and updating the "last modified" date. Your continued use of the Service after any such changes constitutes acceptance of the new Terms.`
  },
  {
    id: 'governing-law',
    title: '11. Governing Law',
    content: `These Terms shall be governed by and construed in accordance with the laws of the State of California, United States, without regard to its conflict of law provisions. Any disputes arising under these Terms shall be resolved in the courts located in San Francisco County, California.`
  },
  {
    id: 'contact',
    title: '12. Contact Information',
    content: `If you have any questions about these Terms of Service, please contact us at:
    • Email: legal@hiresphere.com
    • Address: 123 Tech Street, Suite 100, San Francisco, CA 94107
    • Phone: +1 (555) 123-4567`
  }
];

export default function TermsPage() {
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
            Terms of Service
          </h1>
          <p className="mt-4 text-lg text-slate-600 dark:text-slate-400">
            Please read these terms and conditions carefully before using our service.
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

        {/* Terms Content */}
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

        {/* Quick Actions */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link
            href="/privacy"
            className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700 hover:shadow-md transition-shadow text-center"
          >
            <div className="text-2xl mb-3">🔒</div>
            <h3 className="font-semibold text-slate-900 dark:text-white mb-2">
              Privacy Policy
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Learn how we protect your data
            </p>
          </Link>

          <Link
            href="/contact"
            className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700 hover:shadow-md transition-shadow text-center"
          >
            <div className="text-2xl mb-3">💬</div>
            <h3 className="font-semibold text-slate-900 dark:text-white mb-2">
              Contact Us
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Questions about these terms?
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

        {/* Agreement Banner */}
        <div className="mt-12 bg-blue-600 rounded-2xl p-8 text-center text-white">
          <h2 className="text-2xl font-bold mb-4">By using HireSphere, you agree to these terms</h2>
          <p className="text-blue-100 mb-6 max-w-2xl mx-auto">
            These Terms of Service constitute a legally binding agreement between you and HireSphere. 
            If you have any questions or concerns, please don't hesitate to contact our legal team.
          </p>
          <Link
            href="/contact"
            className="inline-block bg-white text-blue-600 px-6 py-3 rounded-lg font-medium hover:bg-blue-50 transition-colors"
          >
            Contact Legal Team
          </Link>
        </div>
      </div>
    </div>
  );
}