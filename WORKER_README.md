# NavIN Background Worker Service

This document explains how to deploy and manage the NavIN background worker service that handles job processing, scraping, and other background tasks 24/7.

## 🚀 Quick Start

### Development
```bash
# Start the main app and worker together
npm run worker:dev

# Or start worker separately
npm run worker
```

### Production Deployment
```bash
# Build the worker
npm run build

# Start worker service
npm run worker:prod
```

## 📁 Worker Components

### Core Services
- **BackgroundJobProcessor** (`background-processor.ts`) - Main job processor
- **EnhancedJobScraperManager** (`enhanced-scraper-manager.ts`) - Job scraping coordination
- **JobQueueManager** (`job-queue-manager.ts`) - Queue management and scheduling
- **Redis/BullMQ** (`queue.ts`) - High-performance job queue

### Worker Scripts
- **worker.ts** - Main worker service (recommended)
- **worker-runner.ts** - Database-only job processor
- **worker-bullmq.ts** - Redis/BullMQ worker

## 🔧 Configuration

### Environment Variables
Copy `backend/.env.worker` to `.env` and configure:

```env
# Database
DATABASE_URL="postgresql://..."

# Redis (for BullMQ)
REDIS_HOST="localhost"
REDIS_PORT="6379"
REDIS_PASSWORD=""

# Queue Settings
QUEUE_CONCURRENCY="5"
JOB_RETRY_ATTEMPTS="3"

# Worker Settings
WORKER_CHECK_INTERVAL="30000"
WORKER_BATCH_SIZE="10"
```

## 🚀 Deployment Options

### Option 1: Separate Worker Service (Recommended)

**Render/Railway Deployment:**
1. Create a separate service for the worker
2. Set environment variables
3. Deploy with command: `npm run worker:prod`
4. Scale worker instances based on load

**Docker Deployment:**
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
CMD ["npm", "run", "worker:prod"]
```

### Option 2: Monolith with Worker Thread

Deploy the main app with worker running in background:
```bash
npm run worker:background &
npm start
```

### Option 3: Serverless Functions

For Vercel/Netlify, use API routes to trigger jobs:
```typescript
// POST /api/jobs/trigger-scraping
export async function POST() {
  await jobQueueManager.scheduleFetchJobs();
  return Response.json({ success: true });
}
```

## 📊 Monitoring & Health Checks

### Built-in Health Endpoints
```bash
# Worker health
curl http://localhost:3001/health

# Queue stats
curl http://localhost:3001/queue/stats
```

### Job Types Supported
- **fetch_jobs** - Scrape jobs from external sources
- **send_email** - Send notification emails
- **rebuild_index** - Rebuild search indexes
- **archive_logs** - Archive old log files
- **data_processing** - Process analytics data
- **cleanup** - Clean up old data

## 🔄 Job Scheduling

### Schedule Recurring Jobs
```typescript
// Daily log archival
await jobQueueManager.scheduleArchiveLogs({}, {
  scheduledFor: new Date(Date.now() + 24 * 60 * 60 * 1000)
});

// Hourly job fetching
setInterval(() => {
  jobQueueManager.scheduleFetchJobs();
}, 60 * 60 * 1000);
```

### Priority Levels
- **URGENT** (10) - Critical system tasks
- **HIGH** (8) - Job scraping, user notifications
- **MEDIUM** (5) - Data processing, analytics
- **LOW** (1) - Cleanup, maintenance

## 🛠️ Management Commands

### Queue Management
```bash
# View pending jobs
npm run worker -- --action=stats

# Process jobs immediately
npm run worker -- --action=process

# Clean old jobs
npm run worker -- --action=cleanup
```

### Scraping Management
```typescript
// Add new scraping source
await enhancedScraperManager.addScrapingSource({
  name: 'LinkedIn',
  baseUrl: 'https://linkedin.com',
  isActive: true,
  rateLimit: 100
});

// Force scrape specific source
await enhancedScraperManager.forceScrapeSource('source-id');
```

## 📈 Scaling

### Horizontal Scaling
- Run multiple worker instances
- Use Redis for coordination
- Implement leader election for singletons

### Vertical Scaling
- Increase `QUEUE_CONCURRENCY`
- Adjust `WORKER_BATCH_SIZE`
- Fine-tune rate limits

## 🔍 Troubleshooting

### Common Issues

**Worker not starting:**
```bash
# Check database connection
npm run db:studio

# Check Redis connection
redis-cli ping

# View worker logs
tail -f logs/worker.log
```

**Jobs not processing:**
```bash
# Check queue status
npm run worker -- --action=stats

# View failed jobs
npm run worker -- --action=failed
```

**Memory issues:**
- Reduce batch size
- Increase check intervals
- Monitor memory usage

## 🚀 Production Checklist

- [ ] PostgreSQL database configured
- [ ] Redis instance running (for BullMQ)
- [ ] Environment variables set
- [ ] Worker service deployed separately
- [ ] Health checks configured
- [ ] Log aggregation setup
- [ ] Monitoring alerts configured
- [ ] Backup strategy implemented

## 📞 Support

For issues with the worker service:
1. Check the logs in `logs/worker.log`
2. Verify database and Redis connections
3. Review queue statistics
4. Check for failed jobs

The worker service is designed to be resilient and will automatically retry failed jobs and handle graceful shutdowns.
