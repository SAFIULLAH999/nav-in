'use client';

import { motion } from 'framer-motion';
import { Crown, Search, FileText, Users, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import toast from 'react-hot-toast';

export default function PremiumHiringSection() {
  const [isLoading, setIsLoading] = useState(false);

  const handleUpgrade = async () => {
    setIsLoading(true);
    try {
      // Simulate upgrade process
      await new Promise(resolve => setTimeout(resolve, 2000));
      toast.success('Premium upgrade initiated! You will be redirected to complete the purchase.');
      // In a real app, this would redirect to a payment processor
      // window.location.href = '/pricing';
    } catch (error) {
      toast.error('Failed to process upgrade. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl p-8 text-white relative overflow-hidden"
    >
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 right-0 w-64 h-64 bg-yellow-400 rounded-full -translate-y-32 translate-x-32"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-green-400 rounded-full translate-y-24 -translate-x-24"></div>
      </div>

      {/* Header */}
      <div className="relative z-10 mb-6">
        <div className="flex items-center gap-3 mb-2">
          <Crown className="w-8 h-8 text-yellow-400" />
          <span className="text-sm font-medium text-yellow-400 bg-yellow-400/20 px-3 py-1 rounded-full">
            Premium Feature
          </span>
        </div>
        <h2 className="text-3xl font-bold mb-2">Premium Hiring Section</h2>
        <p className="text-gray-300 text-lg">
          Unlock powerful hiring tools to find and connect with top talent.
        </p>
      </div>

      {/* Features Grid */}
      <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-white/10 rounded-lg">
            <Search className="w-6 h-6 text-blue-400" />
          </div>
          <div>
            <h3 className="font-semibold mb-1">Advanced Search Filters</h3>
            <p className="text-gray-300 text-sm">
              Find candidates with specific skills, profiles, and experiences.
            </p>
          </div>
        </div>

        <div className="flex items-start gap-4">
          <div className="p-3 bg-white/10 rounded-lg">
            <FileText className="w-6 h-6 text-green-400" />
          </div>
          <div>
            <h3 className="font-semibold mb-1">Unlimited Job Postings</h3>
            <p className="text-gray-300 text-sm">
              Post unlimited job openings and reach more candidates.
            </p>
          </div>
        </div>

        <div className="flex items-start gap-4">
          <div className="p-3 bg-white/10 rounded-lg">
            <Users className="w-6 h-6 text-purple-400" />
          </div>
          <div>
            <h3 className="font-semibold mb-1">Access to Premium Candidates</h3>
            <p className="text-gray-300 text-sm">
              Connect with detailed profiles and verified candidates.
            </p>
          </div>
        </div>

        <div className="flex items-start gap-4">
          <div className="p-3 bg-white/10 rounded-lg">
            <Crown className="w-6 h-6 text-yellow-400" />
          </div>
          <div>
            <h3 className="font-semibold mb-1">Priority Support</h3>
            <p className="text-gray-300 text-sm">
              Get priority access to our hiring experts and support team.
            </p>
          </div>
        </div>
      </div>

      {/* CTA Button */}
      <div className="relative z-10">
        <Button 
          onClick={handleUpgrade}
          disabled={isLoading}
          className="bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-gray-900 font-semibold px-8 py-3 rounded-lg transition-all duration-300 transform hover:scale-105 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <div className="animate-spin w-5 h-5 border-2 border-gray-900 border-t-transparent rounded-full" />
          ) : (
            <>
              Upgrade to Premium
              <ArrowRight className="w-5 h-5" />
            </>
          )}
        </Button>
        <p className="text-gray-400 text-sm mt-2">
          Start your free trial today
        </p>
      </div>

      {/* Decorative Elements */}
      <div className="absolute top-4 right-4 opacity-20">
        <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
      </div>
      <div className="absolute bottom-4 left-4 opacity-20">
        <div className="w-1 h-1 bg-white rounded-full animate-pulse delay-1000"></div>
      </div>
    </motion.div>
  );
}
