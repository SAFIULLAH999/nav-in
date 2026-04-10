import { Router } from 'express';
import { query, validationResult } from 'express-validator';
import { prisma } from '../utils/prisma';
import { authenticateToken } from '../middleware/auth';
import { logger } from '../utils/logger';
import {
  validateSearchFilters,
  buildUserSearchWhere,
  buildSearchOrderBy,
  filterByNetwork,
} from '../../lib/searchBuilder';

const router = Router();

// GET /api/v1/search/advanced - Advanced user search with multiple filters
router.get(
  '/',
  authenticateToken,
  query('q').optional().isString(),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('offset').optional().isInt({ min: 0 }),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: {
            message: 'Validation failed',
            statusCode: 400,
            details: errors.array(),
          },
        });
      }

      const userId = (req as any).user.id;

      // Parse and validate filters
      const filters = validateSearchFilters({
        query: req.query.q,
        currentCompanies: req.query.currentCompanies,
        pastCompanies: req.query.pastCompanies,
        schools: req.query.schools,
        industries: req.query.industries,
        locations: req.query.locations,
        roles: req.query.roles,
        skills: req.query.skills,
        network: req.query.network,
        openToStatus: req.query.openToStatus,
        sortBy: req.query.sortBy,
        limit: req.query.limit,
        offset: req.query.offset,
        userId,
      });

      // Build where clause
      const where = buildUserSearchWhere(filters);

      // Exclude current user
      where.id = { not: userId };

      // Build order by clause
      const orderBy = buildSearchOrderBy(filters.sortBy, userId);

      // Execute search query
      const [users, total] = await Promise.all([
        prisma.user.findMany({
          where,
          orderBy,
          select: {
            id: true,
            name: true,
            email: true,
            username: true,
            avatar: true,
            title: true,
            company: true,
            location: true,
            bio: true,
            industry: true,
            currentOpenToType: true,
            userSkills: {
              select: {
                skill: { select: { id: true, name: true } },
              },
              take: 5,
            },
            sentConnections: {
              where: {
                receiverId: userId,
              },
              select: { id: true, status: true },
              take: 1,
            },
            receivedConnections: {
              where: {
                senderId: userId,
              },
              select: { id: true, status: true },
              take: 1,
            },
          },
          take: filters.limit,
          skip: filters.offset,
        }),
        prisma.user.count({ where }),
      ]);

      // Apply network filtering if needed
      let filteredUsers = users;
      if (filters.network && filters.network !== 'ALL') {
        filteredUsers = await filterByNetwork(
          users,
          userId,
          filters.network,
          prisma
        );
      }

      // Transform response
      const results = filteredUsers.map((user) => ({
        ...user,
        skills: user.userSkills.map((us: any) => us.skill),
        connectionStatus: user.sentConnections[0]?.status || user.receivedConnections[0]?.status || null,
      }));

      return res.status(200).json({
        success: true,
        data: {
          results,
          total,
          limit: filters.limit,
          offset: filters.offset,
          hasMore: filters.offset + filters.limit < total,
        },
      });
    } catch (error) {
      logger.error('Advanced search error:', error);
      return res.status(500).json({
        success: false,
        error: {
          message: 'Search failed',
          statusCode: 500,
        },
      });
    }
  }
);

// GET /api/v1/search/filters - Get available filter options
router.get('/options', authenticateToken, async (req, res) => {
  try {
    // For now, return static options
    // In production, this would be cached and updated periodically
    const options = {
      industries: [
        { label: 'Technology', value: 'Technology' },
        { label: 'Finance', value: 'Finance' },
        { label: 'Healthcare', value: 'Healthcare' },
        { label: 'Marketing', value: 'Marketing' },
        { label: 'Sales', value: 'Sales' },
        // Add more...
      ],
      openToStatuses: [
        { label: 'Open to Work', value: 'WORK' },
        { label: 'Actively Hiring', value: 'HIRING' },
        { label: 'Open to Freelance', value: 'FREELANCE' },
        { label: 'Open to Mentoring', value: 'MENTORSHIP' },
        { label: 'Open to Collaborate', value: 'COLLABORATION' },
      ],
      networkTypes: [
        { label: 'All Users', value: 'ALL' },
        { label: 'My Connections', value: 'CONNECTIONS' },
        { label: '2nd Degree', value: '2ND_DEGREE' },
      ],
      sortOptions: [
        { label: 'Most Relevant', value: 'relevance' },
        { label: 'Connection Strength', value: 'connections' },
        { label: 'Recently Active', value: 'recent' },
      ],
    };

    return res.status(200).json({
      success: true,
      data: options,
    });
  } catch (error) {
    logger.error('Get filter options error:', error);
    return res.status(500).json({
      success: false,
      error: {
        message: 'Failed to get filter options',
        statusCode: 500,
      },
    });
  }
});

export default router;
