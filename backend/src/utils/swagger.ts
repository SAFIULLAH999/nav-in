import swaggerJsdoc from 'swagger-jsdoc';
import { Application } from 'express';
import { logger } from './logger';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'NavIN Backend API',
      version: '1.0.0',
      description: 'Professional networking platform backend API with real-time features',
      contact: {
        name: 'NavIN API Support',
        email: 'api@navin.com',
      },
    },
    servers: [
      {
        url: 'http://localhost:5000/api/v1',
        description: 'Development server',
      },
      {
        url: 'https://api.navin.com/api/v1',
        description: 'Production server',
      },
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
        ApiKeyAuth: {
          type: 'apiKey',
          in: 'header',
          name: 'x-api-key',
        },
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            email: { type: 'string', format: 'email' },
            name: { type: 'string' },
            username: { type: 'string' },
            bio: { type: 'string' },
            title: { type: 'string' },
            company: { type: 'string' },
            location: { type: 'string' },
            website: { type: 'string', format: 'uri' },
            avatar: { type: 'string', format: 'uri' },
            skills: { type: 'array', items: { type: 'string' } },
            role: { type: 'string', enum: ['USER', 'ADMIN', 'MODERATOR'] },
            isActive: { type: 'boolean' },
            emailVerified: { type: 'string', format: 'date-time' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        Post: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            content: { type: 'string' },
            image: { type: 'string', format: 'uri' },
            video: { type: 'string', format: 'uri' },
            authorId: { type: 'string', format: 'uuid' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
            author: { $ref: '#/components/schemas/User' },
            isLiked: { type: 'boolean' },
            _count: {
              type: 'object',
              properties: {
                likes: { type: 'integer' },
                comments: { type: 'integer' },
                shares: { type: 'integer' },
              },
            },
          },
        },
        Job: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            title: { type: 'string' },
            description: { type: 'string' },
            companyName: { type: 'string' },
            location: { type: 'string' },
            type: { type: 'string', enum: ['FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERNSHIP', 'FREELANCE', 'TEMPORARY'] },
            salaryMin: { type: 'integer' },
            salaryMax: { type: 'integer' },
            requirements: { type: 'array', items: { type: 'string' } },
            benefits: { type: 'array', items: { type: 'string' } },
            skills: { type: 'array', items: { type: 'string' } },
            experience: { type: 'string', enum: ['ENTRY', 'JUNIOR', 'MID', 'SENIOR', 'EXECUTIVE'] },
            isRemote: { type: 'boolean' },
            isActive: { type: 'boolean' },
            applicationDeadline: { type: 'string', format: 'date-time' },
            views: { type: 'integer' },
            applicationsCount: { type: 'integer' },
            authorId: { type: 'string', format: 'uuid' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        Connection: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            senderId: { type: 'string', format: 'uuid' },
            receiverId: { type: 'string', format: 'uuid' },
            status: { type: 'string', enum: ['PENDING', 'ACCEPTED', 'BLOCKED'] },
            connectionType: { type: 'string', enum: ['PROFESSIONAL', 'COLLEAGUE', 'FRIEND', 'MENTOR', 'MENTEE'] },
            strength: { type: 'integer', minimum: 1, maximum: 10 },
            notes: { type: 'string' },
            tags: { type: 'array', items: { type: 'string' } },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        Message: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            content: { type: 'string' },
            senderId: { type: 'string', format: 'uuid' },
            receiverId: { type: 'string', format: 'uuid' },
            isRead: { type: 'boolean' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        Notification: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            userId: { type: 'string', format: 'uuid' },
            type: { type: 'string' },
            title: { type: 'string' },
            message: { type: 'string' },
            isRead: { type: 'boolean' },
            data: { type: 'object' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        Error: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            error: {
              type: 'object',
              properties: {
                message: { type: 'string' },
                statusCode: { type: 'integer' },
                details: { type: 'array', items: { type: 'object' } },
                code: { type: 'string' },
              },
            },
          },
        },
        Success: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            data: { type: 'object' },
            message: { type: 'string' },
          },
        },
      },
    },
    security: [
      {
        BearerAuth: [],
      },
    ],
  },
  apis: [
    './src/routes/*.ts',
    './src/index.ts',
  ],
};

export const specs = swaggerJsdoc(options);

export const setupSwagger = (app: Application) => {
  app.get('/api/v1/docs', (req, res) => {
    res.json({
      title: 'NavIN Backend API Documentation',
      description: 'Professional networking platform API with real-time features',
      version: '1.0.0',
      openapiUrl: '/api/v1/docs/openapi.json',
      swaggerUrl: '/api/v1/docs/swagger-ui',
    });
  });

  app.get('/api/v1/docs/openapi.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(specs);
  });

  logger.info('API documentation available at /api/v1/docs');
};