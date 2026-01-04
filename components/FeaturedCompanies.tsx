'use client'

import { motion } from 'framer-motion'
import { Building, ArrowRight } from 'lucide-react'
import Link from 'next/link'

const companies = [
  {
    name: 'TechCorp',
    logo: 'T',
    industry: 'Technology',
    employees: '10,000+',
    openPositions: 45,
    color: 'bg-blue-500'
  },
  {
    name: 'InnovateLab',
    logo: 'I',
    industry: 'Research & Development',
    employees: '2,500+',
    openPositions: 23,
    color: 'bg-purple-500'
  },
  {
    name: 'GlobalFinance',
    logo: 'G',
    industry: 'Financial Services',
    employees: '15,000+',
    openPositions: 67,
    color: 'bg-green-500'
  },
  {
    name: 'HealthTech',
    logo: 'H',
    industry: 'Healthcare Technology',
    employees: '5,000+',
    openPositions: 34,
    color: 'bg-red-500'
  },
  {
    name: 'EduPlatform',
    logo: 'E',
    industry: 'Education Technology',
    employees: '1,200+',
    openPositions: 18,
    color: 'bg-yellow-500'
  },
  {
    name: 'EcoSolutions',
    logo: 'E',
    industry: 'Environmental Services',
    employees: '3,500+',
    openPositions: 29,
    color: 'bg-emerald-500'
  }
]

export function FeaturedCompanies() {
  return (
    <section className="py-16 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl font-bold text-text mb-4">
            Trusted by Leading <span className="text-primary">Companies</span>
          </h2>
          <p className="text-text-muted max-w-2xl mx-auto">
            Join thousands of professionals who are building their careers with these innovative companies.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {companies.map((company, index) => (
            <motion.div
              key={company.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="bg-card rounded-2xl p-6 border border-border hover:shadow-lg transition-all duration-300 hover:-translate-y-1 group"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-4">
                  <div className={`w-12 h-12 ${company.color} rounded-xl flex items-center justify-center text-white font-bold text-lg`}>
                    {company.logo}
                  </div>
                  <div>
                    <h3 className="font-semibold text-text group-hover:text-primary transition-colors">
                      {company.name}
                    </h3>
                    <p className="text-sm text-text-muted">{company.industry}</p>
                  </div>
                </div>
                <Building className="w-5 h-5 text-text-muted" />
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-text-muted">Employees</span>
                  <span className="text-text font-medium">{company.employees}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-text-muted">Open Positions</span>
                  <span className="text-primary font-medium">{company.openPositions}</span>
                </div>
              </div>

              <Link
                href={`/jobs?company=${encodeURIComponent(company.name)}`}
                className="flex items-center justify-center space-x-2 w-full py-3 bg-secondary text-text rounded-xl hover:bg-primary/10 hover:text-primary transition-all duration-300 group"
              >
                <span className="text-sm font-medium">View Jobs</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
          className="text-center"
        >
          <div className="bg-gradient-to-r from-primary/5 to-accent/5 rounded-2xl p-8">
            <h3 className="text-xl font-bold text-text mb-4">
              Want to feature your company here?
            </h3>
            <p className="text-text-muted mb-6 max-w-2xl mx-auto">
              Join our growing network of companies and start connecting with top talent today.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/pricing"
                className="bg-primary text-white px-6 py-3 rounded-xl font-semibold hover:bg-primary/90 transition-colors"
              >
                View Pricing Plans
              </Link>
              <Link
                href="/contact"
                className="border-2 border-primary/20 text-primary px-6 py-3 rounded-xl font-semibold hover:bg-primary/5 transition-colors"
              >
                Contact Sales
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}