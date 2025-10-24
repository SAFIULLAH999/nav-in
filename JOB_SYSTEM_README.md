# Job Application System - Setup Guide

## ✅ What's Been Implemented

1. **New Job Application Page**: A complete application form at `/apply/[jobId]` where users can submit cover letters and upload resumes.

2. **Updated Job Cards**: All "Apply Now" buttons now link to the application page.

3. **Email Notifications**: Automatic emails sent to both employers and applicants after job applications.

4. **Ultra-Fast Job Fetching**: Background job scraping that runs automatically every 5 seconds from Indeed, LinkedIn, and other career sites.

5. **Smart Job Limit**: Automatically stops fetching after reaching 100 jobs to maintain quality.

6. **Demo-Friendly**: No authentication required for testing - uses demo user credentials.

7. **Applied Jobs Management**: Applied jobs are hidden from main listings, dedicated applications page shows all submissions with status tracking.

8. **Application Statistics**: Shows total applications and breakdown by status (pending, accepted, rejected).

9. **Smart Job Filtering**: Jobs you've applied to are automatically filtered out from the main jobs page.

10. **Live Auto-Fetching**: Real-time job fetching with toggle controls and live status indicators.

11. **Dynamic Job Refresh**: New jobs are automatically added when you apply to existing ones.

12. **24/7 Automatic Operation**: System runs continuously without manual intervention once set up.

## 🚀 Quick Start

### 1. Install Redis (Required for Background Jobs)

**Windows:**
```bash
# Download Redis from: https://github.com/microsoftarchive/redis/releases
# Extract and run: redis-server.exe
```

**Ubuntu/Linux:**
```bash
sudo apt update
sudo apt install redis-server
sudo systemctl start redis-server
```

**macOS:**
```bash
brew install redis
brew services start redis
```

### 2. Setup Database

```bash
# Navigate to backend directory
cd backend

# Push database schema
npm run db:push

# Seed sample jobs (optional but recommended)
npm run seed-jobs
```

### 3. Configure Email (Optional)

Create a `.env` file in the backend directory:

```env
# Email Configuration (for Gmail)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# JWT Secret (for authentication)
JWT_SECRET=your-secret-key-here

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
```

### 4. Start the System

**Start Backend Server (includes automatic job fetching):**
```bash
cd backend
npm run dev
```

**Start Frontend:**
```bash
npm run dev
```

**Start Background Worker (for job processing):**
```bash
cd backend
npm run worker
```

## 📋 Available Scripts

### Backend Scripts:
- `npm run dev` - Start development server with auto job fetching
- `npm run worker` - Start background job worker
- `npm run schedule-jobs` - Manually schedule job fetching
- `npm run seed-jobs` - Add sample jobs to database

### Frontend Scripts:
- `npm run dev` - Start Next.js development server

## 🔧 How It Works

### Job Application Flow:
1. User clicks "Apply Now" on any job card
2. Redirected to `/apply/[jobId]` with application form
3. Submits cover letter and/or resume
4. Application saved to database
5. Emails sent to employer and applicant
6. User redirected to applications page

### Automatic Job Fetching:
1. Server starts and automatically schedules job fetching
2. Runs every 5 seconds in the background (configurable)
3. Scrapes jobs from Indeed, LinkedIn, and other career sites
4. Stops automatically after reaching 100 jobs
5. Triggers new job fetching when you apply to jobs
6. No manual intervention required - completely automatic

## 🐛 Troubleshooting

### "Internal Server Error" on Application:
- Check if database is running: `npm run db:push`
- Verify Redis connection: `redis-cli ping`
- Check server logs for detailed errors

### No Jobs Showing:
- Seed sample jobs: `npm run seed-jobs`
- Check if job fetching is working: Look for logs in backend console
- Verify database connection

### Email Not Sending:
- Configure SMTP settings in `.env` (see Step 3 above)
- Check email service logs in backend console
- Verify email credentials are correct
- For Gmail: Enable 2FA and use App Password instead of regular password
- Test email: Check spam folder and ensure SMTP settings are correct

### Worker Not Starting:
- Ensure Redis is running: `redis-cli ping`
- Check for port conflicts on 6379
- Review worker logs for connection errors

## 📁 Key Files Modified/Created:

### Frontend:
- `app/apply/[jobId]/page.tsx` - New application page
- `components/JobCard.tsx` - Updated with apply links
- `app/jobs/page.tsx` - Updated job card component
- `app/api/jobs/[id]/route.ts` - Individual job fetching
- `app/api/applications/route.ts` - Application submission with emails

### Backend:
- `backend/src/services/queue.ts` - Enhanced with job fetching
- `backend/src/schedule-jobs.ts` - Automatic job scheduling
- `backend/src/index.ts` - Auto-starts job fetching on server start
- `backend/src/utils/seed-jobs.ts` - Sample job data
- `lib/job-scrapers/scraper-manager.ts` - Job scraping logic

## 🎯 Demo Features

- **No Authentication Required**: Applications work with demo user
- **Sample Jobs**: 5 pre-loaded job postings for testing
- **Email Templates**: Professional email notifications
- **Ultra-Fast Auto-Fetching**: Jobs fetched every 5 seconds automatically
- **Smart Job Management**: Applied jobs hidden, new jobs added dynamically
- **Live Status Indicators**: Real-time fetching status with toggle controls
- **Application Statistics**: Track all applications with status breakdown
- **File Upload**: Resume upload functionality (demo mode)
- **100 Job Limit**: Automatically stops at 100 jobs for quality control

## 🔄 System Architecture

```
Frontend (Next.js) → API Routes → Database (Prisma)
                     ↓
                Background Worker (BullMQ + Redis)
                     ↓
                Job Scrapers (Indeed, LinkedIn)
                     ↓
                Email Service (Nodemailer)
```

The system now runs 24/7 automatically once set up. Job fetching happens every 5 seconds, applications work without authentication, and emails are sent automatically.

## 📞 Support

If you encounter issues:
1. Check the console logs in both frontend and backend
2. Verify Redis is running: `redis-cli ping`
3. Ensure database is connected: `npm run db:push`
4. Review the troubleshooting section above

The system is designed to be self-sustaining once properly configured!
