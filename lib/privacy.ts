import { prisma } from './prisma'

export interface PrivacySettings {
  profileVisibility: 'PUBLIC' | 'CONNECTIONS_ONLY' | 'PRIVATE'
  showInSearch: boolean
  allowConnectionRequests: boolean
  showActivityStatus: boolean
  showLastSeen: boolean
  allowTagging: boolean
  dataSharing?: {
    analytics: boolean
    marketing: boolean
    research: boolean
  }
}

export type PrivacyLevel = 'PUBLIC' | 'CONNECTIONS_ONLY' | 'PRIVATE'

/**
 * Get default privacy settings for a user
 */
export function getDefaultPrivacySettings(): PrivacySettings {
  return {
    profileVisibility: 'PUBLIC',
    showInSearch: true,
    allowConnectionRequests: true,
    showActivityStatus: true,
    showLastSeen: true,
    allowTagging: true,
    dataSharing: {
      analytics: false,
      marketing: false,
      research: false
    }
  }
}

/**
 * Check if a user can view another user's profile based on privacy settings
 */
export async function canViewProfile(
  targetUserId: string,
  requestingUserId?: string
): Promise<boolean> {
  try {
    // If no requesting user (anonymous), only allow public profiles
    if (!requestingUserId) {
      const settings = await getUserPrivacySettings(targetUserId)
      return settings.profileVisibility === 'PUBLIC'
    }

    // Users can always view their own profile
    if (targetUserId === requestingUserId) {
      return true
    }

    const settings = await getUserPrivacySettings(targetUserId)

    switch (settings.profileVisibility) {
      case 'PUBLIC':
        return true
      case 'CONNECTIONS_ONLY':
        // Check if users are connected
        return await areUsersConnected(targetUserId, requestingUserId)
      case 'PRIVATE':
        return false
      default:
        return false
    }
  } catch (error) {
    console.error('Error checking profile visibility:', error)
    return false
  }
}

/**
 * Check if a user can send connection requests to another user
 */
export async function canSendConnectionRequest(
  targetUserId: string,
  requestingUserId: string
): Promise<boolean> {
  try {
    // Users cannot send requests to themselves
    if (targetUserId === requestingUserId) {
      return false
    }

    const settings = await getUserPrivacySettings(targetUserId)
    return settings.allowConnectionRequests
  } catch (error) {
    console.error('Error checking connection request permission:', error)
    return false
  }
}

/**
 * Check if two users are connected
 */
export async function areUsersConnected(
  userId1: string,
  userId2: string
): Promise<boolean> {
  try {
    const connection = await prisma.connection.findFirst({
      where: {
        OR: [
          { senderId: userId1, receiverId: userId2, status: 'ACCEPTED' },
          { senderId: userId2, receiverId: userId1, status: 'ACCEPTED' }
        ]
      }
    })
    return !!connection
  } catch (error) {
    console.error('Error checking user connection:', error)
    return false
  }
}

/**
 * Get user's privacy settings (placeholder implementation)
 * In a full implementation, this would query a UserPrivacySettings model
 */
export async function getUserPrivacySettings(userId: string): Promise<PrivacySettings> {
  try {
    // For now, return default settings
    // TODO: Implement UserPrivacySettings model and query it here
    return getDefaultPrivacySettings()
  } catch (error) {
    console.error('Error fetching user privacy settings:', error)
    return getDefaultPrivacySettings()
  }
}

/**
 * Filter users based on search visibility
 */
export async function filterSearchableUsers(users: any[]): Promise<any[]> {
  try {
    const searchableUsers = []

    for (const user of users) {
      const settings = await getUserPrivacySettings(user.id)
      if (settings.showInSearch) {
        searchableUsers.push(user)
      }
    }

    return searchableUsers
  } catch (error) {
    console.error('Error filtering searchable users:', error)
    return users
  }
}

/**
 * Check if a user should appear in suggestions for another user
 */
export async function canSuggestUser(
  targetUserId: string,
  requestingUserId: string
): Promise<boolean> {
  try {
    // Don't suggest users to themselves
    if (targetUserId === requestingUserId) {
      return false
    }

    // Check if already connected
    if (await areUsersConnected(targetUserId, requestingUserId)) {
      return false
    }

    // Check privacy settings
    const settings = await getUserPrivacySettings(targetUserId)
    return settings.profileVisibility !== 'PRIVATE'
  } catch (error) {
    console.error('Error checking suggestion eligibility:', error)
    return false
  }
}

/**
 * Sanitize user data based on viewer's permissions
 */
export async function sanitizeUserData(
  userData: any,
  targetUserId: string,
  requestingUserId?: string
): Promise<any> {
  try {
    const canView = await canViewProfile(targetUserId, requestingUserId)

    if (!canView) {
      // Return only public information
      return {
        id: userData.id,
        name: userData.name,
        username: userData.username,
        avatar: userData.avatar,
        title: userData.title
      }
    }

    // If user can view full profile, return all data
    return userData
  } catch (error) {
    console.error('Error sanitizing user data:', error)
    return userData
  }
}
