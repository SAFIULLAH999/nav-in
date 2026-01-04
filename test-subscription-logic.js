const { checkPremiumStatus } = require('./lib/subscription');

// Mock user data for testing
const mockUsers = [
  {
    id: 'new-user',
    createdAt: new Date(), // New user (should get trial)
    premiumSubscription: null
  },
  {
    id: 'old-user',
    createdAt: new Date('2023-01-01'), // Old user (trial expired)
    premiumSubscription: null
  },
  {
    id: 'premium-user',
    createdAt: new Date('2023-01-01'),
    premiumSubscription: {
      tier: 'PREMIUM',
      status: 'ACTIVE',
      expiresAt: new Date('2024-12-31')
    }
  },
  {
    id: 'expired-premium-user',
    createdAt: new Date('2023-01-01'),
    premiumSubscription: {
      tier: 'PREMIUM',
      status: 'ACTIVE',
      expiresAt: new Date('2023-06-30') // Expired subscription
    }
  }
];

// Mock prisma client
const mockPrisma = {
  premiumSubscription: {
    findUnique: async ({ where }) => {
      const user = mockUsers.find(u => u.id === where.userId);
      return user?.premiumSubscription || null;
    }
  },
  user: {
    findUnique: async ({ where }) => {
      const user = mockUsers.find(u => u.id === where.id);
      return user ? { createdAt: user.createdAt } : null;
    }
  }
};

// Test the subscription logic
async function testSubscriptionLogic() {
  console.log('Testing subscription logic...\\n');

  for (const user of mockUsers) {
    console.log(`Testing user: ${user.id}`);

    // Mock the prisma client temporarily
    const originalPrisma = require('./lib/subscription').prisma;
    require('./lib/subscription').prisma = mockPrisma;

    try {
      const result = await checkPremiumStatus(user.id);
      console.log('Result:', {
        isPremium: result.isPremium,
        isTrial: result.isTrial,
        trialEndsAt: result.trialEndsAt
      });
      console.log('---');
    } catch (error) {
      console.error('Error:', error.message);
    } finally {
      // Restore original prisma
      require('./lib/subscription').prisma = originalPrisma;
    }
  }
}

// Run the test
testSubscriptionLogic();
