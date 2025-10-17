'use client'

import { motion } from 'framer-motion'
import { Facebook, Twitter, Linkedin, Instagram, Mail, MapPin, Phone } from 'lucide-react'

const footerLinks = {
  product: [
    { name: 'Features', href: '#' },
    { name: 'Pricing', href: '#' },
    { name: 'Integrations', href: '#' },
    { name: 'API', href: '#' },
  ],
  company: [
    { name: 'About', href: '#' },
    { name: 'Blog', href: '#' },
    { name: 'Careers', href: '#' },
    { name: 'Contact', href: '#' },
  ],
  support: [
    { name: 'Help Center', href: '#' },
    { name: 'Privacy Policy', href: '#' },
    { name: 'Terms of Service', href: '#' },
    { name: 'Status', href: '#' },
  ],
  social: [
    { name: 'Facebook', icon: Facebook, href: '#' },
    { name: 'Twitter', icon: Twitter, href: '#' },
    { name: 'LinkedIn', icon: Linkedin, href: '#' },
    { name: 'Instagram', icon: Instagram, href: '#' },
  ]
}

export function Footer() {
  return (
    <footer className="bg-surface border-t border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main Footer Content */}
        <div className="py-16">
          <div className="grid grid-cols-1 lg:grid-cols-6 gap-8">
            {/* Logo and Description */}
            <div className="lg:col-span-2">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="flex items-center space-x-2 mb-6"
              >
                <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white font-bold text-lg">
                  N
                </div>
                <span className="text-xl font-bold text-text">NavIN</span>
              </motion.div>
              <p className="text-text-muted mb-6 max-w-md">
                The modern professional network that connects you with opportunities,
                insights, and people who matter to your career growth.
              </p>

              {/* Contact Info */}
              <div className="space-y-3">
                <div className="flex items-center space-x-3 text-text-muted">
                  <Mail className="w-5 h-5 text-primary" />
                  <span>hello@navin.com</span>
                </div>
                <div className="flex items-center space-x-3 text-text-muted">
                  <Phone className="w-5 h-5 text-primary" />
                  <span>+1 (555) 123-4567</span>
                </div>
                <div className="flex items-center space-x-3 text-text-muted">
                  <MapPin className="w-5 h-5 text-primary" />
                  <span>San Francisco, CA</span>
                </div>
              </div>
            </div>

            {/* Footer Links */}
            <div className="lg:col-span-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                {/* Product Links */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.1 }}
                >
                  <h3 className="font-semibold text-text mb-4">Product</h3>
                  <ul className="space-y-3">
                    {footerLinks.product.map((link) => (
                      <li key={link.name}>
                        <a
                          href={link.href}
                          className="text-text-muted hover:text-primary transition-colors text-sm"
                        >
                          {link.name}
                        </a>
                      </li>
                    ))}
                  </ul>
                </motion.div>

                {/* Company Links */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.2 }}
                >
                  <h3 className="font-semibold text-text mb-4">Company</h3>
                  <ul className="space-y-3">
                    {footerLinks.company.map((link) => (
                      <li key={link.name}>
                        <a
                          href={link.href}
                          className="text-text-muted hover:text-primary transition-colors text-sm"
                        >
                          {link.name}
                        </a>
                      </li>
                    ))}
                  </ul>
                </motion.div>

                {/* Support Links */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.3 }}
                >
                  <h3 className="font-semibold text-text mb-4">Support</h3>
                  <ul className="space-y-3">
                    {footerLinks.support.map((link) => (
                      <li key={link.name}>
                        <a
                          href={link.href}
                          className="text-text-muted hover:text-primary transition-colors text-sm"
                        >
                          {link.name}
                        </a>
                      </li>
                    ))}
                  </ul>
                </motion.div>

                {/* Social Links */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.4 }}
                >
                  <h3 className="font-semibold text-text mb-4">Follow Us</h3>
                  <div className="flex space-x-4">
                    {footerLinks.social.map((social) => {
                      const Icon = social.icon
                      return (
                        <a
                          key={social.name}
                          href={social.href}
                          className="w-10 h-10 bg-secondary rounded-xl flex items-center justify-center text-text-muted hover:text-primary hover:bg-primary/10 transition-all duration-300"
                        >
                          <Icon className="w-5 h-5" />
                        </a>
                      )
                    })}
                  </div>
                </motion.div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="py-8 border-t border-border"
        >
          <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
            <div className="text-text-muted text-sm">
              © 2024 NavIN. All rights reserved.
            </div>
            <div className="flex items-center space-x-6 text-sm text-text-muted">
              <a href="#" className="hover:text-primary transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-primary transition-colors">Terms of Service</a>
              <a href="#" className="hover:text-primary transition-colors">Cookie Policy</a>
            </div>
          </div>
        </motion.div>
      </div>
    </footer>
  )
}
