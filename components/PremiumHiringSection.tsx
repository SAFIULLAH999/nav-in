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
      await new Promise(resolve => setTimeout(resolve, 2000));
      toast.success('Premium upgrade initiated! You will be redirected to complete the purchase.');
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
      className="bg-primary rounded-xl p-8 text-white relative overflow-hidden"
    >
      {/* Header */}
      <div className="relative z-10 mb-6">
        <div className="flex items-center gap-3 mb-2">
          <Crown className="w-8 h-8 text-accent" />
          <span className="text-sm font-medium text-accent bg-accent/20 px-3 py-1 rounded-full">
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
            <Search className="w-6 h-6 text-accent" />
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
            <FileText className="w-6 h-6 text-accent" />
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
            <Users className="w-6 h-6 text-accent" />
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
            <Crown className="w-6 h-6 text-accent" />
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
          className="bg-accent text-white font-semibold px-8 py-3 rounded-lg transition-all duration-300 transform hover:scale-105 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
        >
          {isLoading ? (
            <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
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
