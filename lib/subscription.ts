import { prisma } from './prisma'

export async function checkPremiumStatus(userId: string): Promise<{
  isPremium: boolean
  isTrial: boolean
  trialEndsAt?: Date
  subscription?: any
}> {
  try {
    // Check if user has an active subscription
    const subscription = await prisma.premiumSubscription.findUnique({
      where: { userId }
    })

    // Check if user is new (created within last 1 month) for trial
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { createdAt: true }
    })

    if (!user) {
      return { isPremium: false, isTrial: false }
    }

    // Calculate trial period (1 month from account creation)
    const trialEndsAt = new Date(user.createdAt)
    trialEndsAt.setMonth(trialEndsAt.getMonth() + 1)

    const now = new Date()
    const isTrial = !subscription && now < trialEndsAt

    if (subscription) {
      // User has a paid subscription
      const isActive = subscription.status === 'ACTIVE' &&
                      (!subscription.expiresAt || new Date(subscription.expiresAt) > now)

      return {
        isPremium: isActive,
        isTrial: false,
        subscription: isActive ? subscription : null
      }
    } else if (isTrial) {
      // User is in trial period
      return {
        isPremium: true,
        isTrial: true,
        trialEndsAt
      }
    } else {
      // No subscription and trial expired
      return {
        isPremium: false,
        isTrial: false
      }
    }
  } catch (error) {
    console.error('Error checking premium status:', error)
    return { isPremium: false, isTrial: false }
  }
}

export async function getSubscriptionStatus(userId: string) {
  return checkPremiumStatus(userId)
}
