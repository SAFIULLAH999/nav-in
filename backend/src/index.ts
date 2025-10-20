import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import { createServer } from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';
import path from 'path';

// Import database and services
import { prisma } from './utils/prisma';
import { redisClient } from './services/redis';
import { logger } from './utils/logger';
import { initializeAbly } from './services/ably';
import { setupSwagger } from './utils/swagger';
import { errorHandler } from './middleware/errorHandler';
import { notFoundHandler } from './middleware/notFoundHandler';

// Import routes
import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import postRoutes from './routes/posts';
import jobRoutes from './routes/jobs';
import messageRoutes from './routes/messages';
import notificationRoutes from './routes/notifications';
import connectionRoutes from './routes/connections';
import analyticsRoutes from './routes/analytics';
import uploadRoutes from './routes/upload';
import adminRoutes from './routes/admin';

// Import middleware
import { rateLimitMiddleware } from './middleware/rateLimit';
import { authMiddleware } from './middleware/auth';
import { requestLogger } from './middleware/requestLogger';

// Import background jobs
import './services/queue';

// Load environment variables
dotenv.config();

const app = express();
const server = createServer(app);
const PORT = process.env.PORT || 5000;

// Socket.IO setup with CORS
export const io = new Server(server, {
  cors: {
    origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Global error handlers for Socket.IO
io.on('connection_error', (error) => {
  logger.error('Socket connection error:', error);
});

// Middleware setup
app.use(helmet({
  contentSecurityPolicy: process.env.HELMET_CONTENT_SECURITY_POLICY === 'true',
  crossOriginEmbedderPolicy: false,
}));

app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));

app.use(compression());
app.use(morgan('combined', { stream: { write: (message) => logger.info(message.trim()) } }));
app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static file serving for uploads
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Custom middleware
app.use(requestLogger);
app.use(rateLimitMiddleware);

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    // Check database connection
    await prisma.$queryRaw`SELECT 1`;
    
    // Check Redis connection
    await redisClient.ping();
    
    res.status(200).json({
      status: 'OK',
      timestamp: new Date().toISOString(),
      services: {
        database: 'connected',
        redis: 'connected',
      },
    });
  } catch (error) {
    logger.error('Health check failed:', error);
    res.status(503).json({
      status: 'ERROR',
      timestamp: new Date().toISOString(),
      services: {
        database: 'disconnected',
        redis: 'disconnected',
      },
    });
  }
});

// API routes
const API_PREFIX = process.env.API_PREFIX || '/api/v1';

app.use(`${API_PREFIX}/auth`, authRoutes);
app.use(`${API_PREFIX}/users`, userRoutes);
app.use(`${API_PREFIX}/posts`, postRoutes);
app.use(`${API_PREFIX}/jobs`, jobRoutes);
app.use(`${API_PREFIX}/messages`, messageRoutes);
app.use(`${API_PREFIX}/notifications`, notificationRoutes);
app.use(`${API_PREFIX}/connections`, connectionRoutes);
app.use(`${API_PREFIX}/analytics`, analyticsRoutes);
app.use(`${API_PREFIX}/upload`, uploadRoutes);
app.use(`${API_PREFIX}/admin`, adminRoutes);

// API documentation endpoint
app.get(`${API_PREFIX}`, (req, res) => {
  res.json({
    message: 'NavIN Backend API',
    version: '1.0.0',
    endpoints: {
      auth: `${API_PREFIX}/auth`,
      users: `${API_PREFIX}/users`,
      posts: `${API_PREFIX}/posts`,
      jobs: `${API_PREFIX}/jobs`,
      messages: `${API_PREFIX}/messages`,
      notifications: `${API_PREFIX}/notifications`,
      connections: `${API_PREFIX}/connections`,
      analytics: `${API_PREFIX}/analytics`,
      upload: `${API_PREFIX}/upload`,
      admin: `${API_PREFIX}/admin`,
      health: '/health',
    },
    documentation: `${API_PREFIX}/docs`,
  });
});

// Error handling middleware (must be last)
app.use(notFoundHandler);
app.use(errorHandler);

// Graceful shutdown
const gracefulShutdown = async (signal: string) => {
  logger.info(`Received ${signal}. Starting graceful shutdown...`);

  // Close HTTP server
  server.close(async () => {
    logger.info('HTTP server closed.');

    try {
      // Close database connections
      await prisma.$disconnect();
      logger.info('Database connections closed.');

      // Close Redis connection
      await redisClient.quit();
      logger.info('Redis connection closed.');

      // Close Socket.IO connections
      io.close();
      logger.info('Socket.IO server closed.');

      logger.info('Graceful shutdown completed.');
      process.exit(0);
    } catch (error) {
      logger.error('Error during graceful shutdown:', error);
      process.exit(1);
    }
  });

  // Force close server after 10 seconds
  setTimeout(() => {
    logger.error('Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 10000);
};

// Handle shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  gracefulShutdown('uncaughtException');
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  gracefulShutdown('unhandledRejection');
});

// Start server
const startServer = async () => {
  try {
    // Initialize database connection
    await prisma.$connect();
    logger.info('Database connected successfully');

    // Initialize Redis connection
    await redisClient.connect();
    logger.info('Redis connected successfully');

    // Initialize Ably connection
    await initializeAbly();

    // Start HTTP server
    server.listen(PORT, () => {
      logger.info(`🚀 NavIN Backend Server running on port ${PORT}`);
      logger.info(`📚 API Documentation available at http://localhost:${PORT}${API_PREFIX}/docs`);
      logger.info(`🏥 Health check available at http://localhost:${PORT}/health`);
    });

    // Setup API documentation
    setupSwagger(app);

    // Socket.IO connection handling
    io.on('connection', (socket) => {
      logger.info(`Socket client connected: ${socket.id}`);

      socket.on('disconnect', (reason) => {
        logger.info(`Socket client disconnected: ${socket.id}, reason: ${reason}`);
      });

      socket.on('error', (error) => {
        logger.error(`Socket error for ${socket.id}:`, error);
      });
    });

  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Start the server
if (require.main === module) {
  startServer();
}

export { app, server };