 # NavIN Backend API

A comprehensive backend API for the NavIN professional networking platform, built with Node.js, Express, TypeScript, and PostgreSQL.

## 🚀 Features

- **Authentication & Authorization**: JWT-based auth with role-based access control
- **User Management**: Complete user profiles with skills, experience, and connections
- **Social Features**: Posts, likes, comments, and real-time interactions
- **Messaging System**: Direct messaging between users
- **Job Management**: Job posting, applications, and search functionality
- **Connection System**: Professional networking with connection requests
- **Notification System**: Real-time notifications for all user activities
- **Real-time Updates**: Ably-powered real-time features
- **File Upload**: Image and document upload handling
- **Background Jobs**: Queue system for emails, notifications, and data processing
- **API Documentation**: Comprehensive Swagger/OpenAPI documentation
- **Rate Limiting**: Built-in protection against abuse
- **Security**: Helmet, CORS, input validation, and SQL injection protection

## 📋 Prerequisites

- Node.js 18+
- PostgreSQL 13+
- Redis 6+ (for caching and sessions)
- Ably account (for real-time features)

## 🛠️ Installation

1. **Install dependencies:**
   ```bash
   cd backend
   npm install
   ```

2. **Set up environment variables:**
   ```bash
   cp .env.example .env
   ```

   Edit `.env` with your configuration:
   ```env
   # Server Configuration
   PORT=5000
   NODE_ENV=development

   # Database
   DATABASE_URL="postgresql://username:password@localhost:5432/navin_backend"

   # JWT Secrets
   JWT_SECRET="your-super-secret-jwt-key"
   JWT_REFRESH_SECRET="your-refresh-secret-key"

   # Redis
   REDIS_HOST=localhost
   REDIS_PORT=6379

   # Ably (for real-time features)
   ABLY_API_KEY="your-ably-api-key"
   ```

3. **Set up the database:**
   ```bash
   # Generate Prisma client
   npx prisma generate

   # Run database migrations
   npx prisma db push

   # Seed the database with sample data
   npm run db:seed
   ```

4. **Start Redis server** (if not already running)

5. **Start the development server:**
   ```bash
   npm run dev
   ```

The server will be available at `http://localhost:5000`

## 📚 API Documentation

API documentation is available at: `http://localhost:5000/api/v1/docs`

### Key Endpoints:

- **Authentication**: `/api/v1/auth/signup`, `/api/v1/auth/login`
- **Users**: `/api/v1/users`
- **Posts**: `/api/v1/posts`, `/api/v1/posts/:id/like`, `/api/v1/posts/:id/comments`
- **Jobs**: `/api/v1/jobs`, `/api/v1/jobs/:id/apply`
- **Messages**: `/api/v1/messages`
- **Connections**: `/api/v1/connections`, `/api/v1/connections/request`
- **Notifications**: `/api/v1/notifications`

## 🔧 Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run test` - Run tests
- `npm run db:generate` - Generate Prisma client
- `npm run db:push` - Push schema to database
- `npm run db:seed` - Seed database with sample data
- `npm run db:studio` - Open Prisma Studio

## 🏗️ Project Structure

```
backend/
├── src/
│   ├── controllers/     # Request handlers (ready for implementation)
│   ├── middleware/      # Custom middleware
│   │   ├── auth.ts      # JWT authentication
│   │   ├── rateLimit.ts # Rate limiting
│   │   ├── errorHandler.ts # Error handling
│   │   └── requestLogger.ts # Request logging
│   ├── routes/         # API route handlers
│   │   ├── auth.ts     # Authentication routes
│   │   ├── users.ts    # User management
│   │   ├── posts.ts    # Posts and social features
│   │   ├── jobs.ts     # Job management
│   │   ├── messages.ts # Messaging system
│   │   ├── connections.ts # Connection management
│   │   └── notifications.ts # Notification system
│   ├── services/       # Business logic services
│   │   ├── redis.ts    # Redis client
│   │   ├── ably.ts     # Real-time service
│   │   └── queue.ts    # Background job queue
│   ├── utils/         # Utility functions
│   │   ├── prisma.ts   # Database client
│   │   ├── logger.ts   # Logging utility
│   │   ├── swagger.ts  # API documentation
│   │   └── seed.ts     # Database seeding
│   └── index.ts       # Main application file
├── uploads/           # File upload directory
├── .env              # Environment variables
├── .env.example      # Environment template
└── package.json      # Dependencies and scripts
```

## 🔐 Authentication

The API uses JWT (JSON Web Tokens) for authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

### Sample Login Request:
```bash
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }'
```

## 🌐 Real-time Features

The API supports real-time updates using Ably. Events are published for:

- New posts, likes, and comments
- Connection requests and acceptances
- New messages
- Job applications
- Notifications

Subscribe to channels like:
- `post:{postId}` - Post-specific events
- `user:{userId}` - User-specific events
- `global` - Global events

## 📊 Background Jobs

The system uses BullMQ for background job processing:

- **Email sending** - Welcome emails, notifications
- **Data processing** - Analytics, cleanup tasks
- **Notification delivery** - Push notifications
- **File processing** - Image optimization, document conversion

## 🔒 Security Features

- **Rate Limiting**: Prevents API abuse
- **Input Validation**: Comprehensive request validation
- **SQL Injection Protection**: Prisma ORM with parameterized queries
- **CORS**: Configurable cross-origin resource sharing
- **Helmet**: Security headers
- **Password Hashing**: bcrypt with salt rounds

## 🚀 Deployment

1. **Build for production:**
   ```bash
   npm run build
   ```

2. **Set production environment variables**

3. **Start production server:**
   ```bash
   npm start
   ```

## 🧪 Testing

```bash
# Run tests
npm test

# Run tests in watch mode
npm run test:watch
```

## 📈 Monitoring

- **Health Check**: `GET /health`
- **Metrics**: Built-in request logging and performance monitoring
- **Error Tracking**: Comprehensive error logging with Winston

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if necessary
5. Run linting: `npm run lint`
6. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Contact the development team

---

**Happy coding!** 🎉