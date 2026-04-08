import { Prisma } from '@prisma/client';

export interface AdvancedSearchFilters {
  query?: string;
  currentCompanies?: string[];
  pastCompanies?: string[];
  schools?: string[];
  industries?: string[];
  locations?: string[];
  roles?: string[];
  skills?: Array<{ skillId: string; minEndorsements?: number }>;
  network?: 'CONNECTIONS' | '2ND_DEGREE' | 'ALL';
  openToStatus?: Array<'WORK' | 'HIRING' | 'FREELANCE' | 'MENTORSHIP' | 'COLLABORATION'>;
  sortBy?: 'relevance' | 'connections' | 'recent';
  limit?: number;
  offset?: number;
  userId?: string; // Current user ID for connection filtering
}

/**
 * Build Prisma where clause for advanced user search
 */
export const buildUserSearchWhere = (
  filters: AdvancedSearchFilters
): Prisma.UserWhereInput => {
  const where: Prisma.UserWhereInput = {
    isActive: true,
  };

  // Text search
  if (filters.query) {
    where.OR = [
      { name: { contains: filters.query, mode: 'insensitive' } },
      { bio: { contains: filters.query, mode: 'insensitive' } },
      { title: { contains: filters.query, mode: 'insensitive' } },
      { company: { contains: filters.query, mode: 'insensitive' } },
      { skills: { contains: filters.query, mode: 'insensitive' } },
    ];
  }

  // Company filters
  if (filters.currentCompanies && filters.currentCompanies.length > 0) {
    where.AND = where.AND || [];
    (where.AND as any).push({
      company: { in: filters.currentCompanies, mode: 'insensitive' },
    });
  }

  // Industry filters
  if (filters.industries && filters.industries.length > 0) {
    where.AND = where.AND || [];
    (where.AND as any).push({
      industry: { in: filters.industries, mode: 'insensitive' },
    });
  }

  // Location filters
  if (filters.locations && filters.locations.length > 0) {
    where.AND = where.AND || [];
    (where.AND as any).push({
      location: {
        OR: filters.locations.map((loc) => ({
          contains: loc,
          mode: 'insensitive',
        })),
      },
    });
  }

  // Title/Role filters
  if (filters.roles && filters.roles.length > 0) {
    where.AND = where.AND || [];
    (where.AND as any).push({
      title: {
        OR: filters.roles.map((role) => ({
          contains: role,
          mode: 'insensitive',
        })),
      },
    });
  }

  // Open To Status filters
  if (filters.openToStatus && filters.openToStatus.length > 0) {
    where.AND = where.AND || [];
    (where.AND as any).push({
      openToStatuses: {
        some: {
          type: { in: filters.openToStatus },
          isActive: true,
        },
      },
    });
  }

  return where;
};

/**
 * Build Prisma orderBy clause for sorting
 */
export const buildSearchOrderBy = (
  sortBy: AdvancedSearchFilters['sortBy'],
  userId?: string
): Prisma.UserOrderByWithRelationInput[] => {
  switch (sortBy) {
    case 'recent':
      return [{ createdAt: 'desc' }];

    case 'connections':
      // If userId provided, can order by connection strength
      return [{ name: 'asc' }];

    case 'relevance':
    default:
      return [{ name: 'asc' }];
  }
};

/**
 * Filter results by skills with endorsement count
 * (Applied in-memory since Prisma nested count is limited)
 */
export const filterBySkills = async (
  users: any[],
  skillFilters: AdvancedSearchFilters['skills']
): Promise<any[]> => {
  if (!skillFilters || skillFilters.length === 0) return users;

  return users.filter((user) => {
    if (!user.userSkills) return false;

    return skillFilters.every((skillFilter) => {
      const userSkill = user.userSkills.find((us: any) => us.skillId === skillFilter.skillId);
      if (!userSkill) return false;

      if (skillFilter.minEndorsements) {
        // Would need to count endorsements in userSkill
        // This is simplified - real implementation would aggregate endorsement counts
        return true;
      }

      return true;
    });
  });
};

/**
 * Filter results by network connection (requires connection lookup)
 */
export const filterByNetwork = async (
  users: any[],
  currentUserId: string,
  network: AdvancedSearchFilters['network'],
  prisma: any
): Promise<any[]> => {
  if (network === 'ALL') return users;

  // Get current user's connections for filtering
  const connections = await prisma.connection.findMany({
    where: {
      senderId: currentUserId,
      status: 'ACCEPTED',
    },
    select: { receiverId: true },
  });

  const connectionIds = new Set(connections.map((c: any) => c.receiverId));

  if (network === 'CONNECTIONS') {
    return users.filter((u) => connectionIds.has(u.id));
  }

  if (network === '2ND_DEGREE') {
    // Get connections of connections
    const secondDegreeConnections = await prisma.connection.findMany({
      where: {
        senderId: { in: Array.from(connectionIds) },
        status: 'ACCEPTED',
      },
      select: { receiverId: true },
    });

    const secondDegreeIds = new Set(
      secondDegreeConnections.map((c: any) => c.receiverId).filter((id) => id !== currentUserId)
    );

    return users.filter((u) => secondDegreeIds.has(u.id) && !connectionIds.has(u.id));
  }

  return users;
};

/**
 * Validate and sanitize search filters
 */
export const validateSearchFilters = (filters: any): AdvancedSearchFilters => {
  return {
    query: filters.query?.toString().substring(0, 500) || undefined,
    currentCompanies: Array.isArray(filters.currentCompanies) ? filters.currentCompanies : [],
    pastCompanies: Array.isArray(filters.pastCompanies) ? filters.pastCompanies : [],
    schools: Array.isArray(filters.schools) ? filters.schools : [],
    industries: Array.isArray(filters.industries) ? filters.industries : [],
    locations: Array.isArray(filters.locations) ? filters.locations : [],
    roles: Array.isArray(filters.roles) ? filters.roles : [],
    skills: Array.isArray(filters.skills)
      ? filters.skills.map((s: any) => ({
          skillId: s.skillId?.toString() || '',
          minEndorsements: s.minEndorsements ? parseInt(s.minEndorsements) : undefined,
        }))
      : [],
    network: ['CONNECTIONS', '2ND_DEGREE', 'ALL'].includes(filters.network)
      ? filters.network
      : 'ALL',
    openToStatus: Array.isArray(filters.openToStatus)
      ? filters.openToStatus.filter((s: string) =>
          ['WORK', 'HIRING', 'FREELANCE', 'MENTORSHIP', 'COLLABORATION'].includes(s)
        )
      : [],
    sortBy: ['relevance', 'connections', 'recent'].includes(filters.sortBy)
      ? filters.sortBy
      : 'relevance',
    limit: Math.min(parseInt(filters.limit) || 20, 100),
    offset: Math.max(parseInt(filters.offset) || 0, 0),
    userId: filters.userId?.toString(),
  };
};

/**
 * Get popular filter options (for UI dropdowns)
 */
export const getFilterOptions = async (prisma: any) => {
  const [companies, industries, schools] = await Promise.all([
    // Top companies
    prisma.experience.groupBy({
      by: ['company'],
      _count: { id: true },
      orderBy: [{ _count: { id: 'desc' } }],
      take: 50,
    }),
    // Top industries
    prisma.user.groupBy({
      by: ['industry'],
      where: { industry: { not: null } },
      _count: { id: true },
      orderBy: [{ _count: { id: 'desc' } }],
      take: 30,
    }),
    // Top schools
    prisma.education.groupBy({
      by: ['institution'],
      _count: { id: true },
      orderBy: [{ _count: { id: 'desc' } }],
      take: 50,
    }),
  ]);

  return {
    companies: companies
      .filter((c: any) => c.company)
      .map((c: any) => ({ label: c.company, value: c.company, count: c._count.id })),
    industries: industries
      .filter((i: any) => i.industry)
      .map((i: any) => ({ label: i.industry, value: i.industry, count: i._count.id })),
    schools: schools
      .filter((s: any) => s.institution)
      .map((s: any) => ({ label: s.institution, value: s.institution, count: s._count.id })),
    openToStatuses: [
      { label: 'Open to Work', value: 'WORK' },
      { label: 'Hiring', value: 'HIRING' },
      { label: 'Freelance', value: 'FREELANCE' },
      { label: 'Mentoring', value: 'MENTORSHIP' },
      { label: 'Collaborating', value: 'COLLABORATION' },
    ],
  };
};
