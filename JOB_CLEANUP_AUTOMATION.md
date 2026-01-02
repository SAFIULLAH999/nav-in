# 🧹 Automated Job Cleanup System

## Overview

The job cleanup system automatically removes expired and invalid job postings to keep your job board clean and up-to-date. This prevents users from seeing outdated job listings.

## ✅ **Features Implemented**

### **Automatic Job Removal**
- **Expired Jobs**: Jobs with `expiresAt` date in the past are automatically deactivated
- **Invalid Jobs**: Jobs that return "Page not found" or other errors are marked invalid
- **Old Jobs**: Jobs older than 90 days that haven't been validated recently are cleaned up

### **Smart Validation**
- Checks job posting validity periodically
- Updates `lastValidated` timestamp for active jobs
- Prevents removal of jobs with recent activity
- Rate-limited to avoid overwhelming external APIs

## 🚀 **How to Set Up Automation**

### **Option 1: Cron Job (Recommended for Production)**

Set up a daily cron job on your server:

```bash
# Edit crontab
crontab -e

# Add this line to run cleanup daily at 2 AM
0 2 * * * cd /path/to/your/project && npm run cleanup-jobs

# For testing (run every hour)
0 * * * * cd /path/to/your/project && npm run cleanup-jobs
```

### **Option 2: Vercel Cron Jobs**

If using Vercel, add to `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/jobs/cleanup",
      "schedule": "0 2 * * *"
    }
  ]
}
```

### **Option 3: GitHub Actions**

Create `.github/workflows/cleanup-jobs.yml`:

```yaml
name: Cleanup Expired Jobs
on:
  schedule:
    - cron: '0 2 * * *'  # Daily at 2 AM UTC
  workflow_dispatch:     # Manual trigger

jobs:
  cleanup:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run cleanup-jobs
        env:
          NEXTAUTH_URL: ${{ secrets.NEXTAUTH_URL }}
```

## 📋 **Manual Usage**

### **Run Cleanup**
```bash
# Live cleanup (removes jobs)
npm run cleanup-jobs

# Dry run (preview only)
npm run cleanup-jobs:dry-run
```

### **Check Cleanup Statistics**
```bash
curl http://localhost:3000/api/jobs/cleanup
```

## 🔧 **Configuration**

### **Database Schema Updates**
The system uses these new Job model fields:

```prisma
model Job {
  // ... existing fields ...
  expiresAt        DateTime?     // When job expires
  validityStatus   String        // VALID, EXPIRED, NOT_FOUND, INVALID_URL
  lastValidated    DateTime?     // Last validation check
  // ... rest of fields ...
}
```

### **Cleanup Rules**

1. **Expired Jobs**: `expiresAt < now()`
2. **Invalid Jobs**: Jobs that can't be validated after multiple attempts
3. **Old Jobs**: Jobs >90 days old without recent validation
4. **Source Validation**: Checks if job sources are still active

## 📊 **Monitoring**

### **API Endpoints**

**GET `/api/jobs/cleanup`**
Returns cleanup statistics:
```json
{
  "success": true,
  "data": {
    "totalJobs": 150,
    "activeJobs": 120,
    "expiredJobs": 5,
    "invalidJobs": 3,
    "recentlyValidated": 25
  }
}
```

**POST `/api/jobs/cleanup`**
Performs cleanup:
```json
{
  "dryRun": false,
  "jobsRemoved": 8,
  "jobsExpired": 5,
  "jobsInvalid": 3
}
```

## 🧪 **Testing**

### **Test with Mock Data**
```bash
# Start dev server
npm run dev

# Run dry cleanup
npm run cleanup-jobs:dry-run

# Check statistics
curl http://localhost:3000/api/jobs/cleanup
```

### **Sample Output**
```
🧹 Starting automated job cleanup...
Mode: DRY RUN (no changes)
──────────────────────────────────────────────────
✅ Job cleanup completed successfully!
Jobs removed: 3
- Expired jobs: 2
- Invalid jobs: 1

📋 This was a dry run. No jobs were actually removed.
```

## ⚠️ **Important Notes**

### **Rate Limiting**
- Cleanup processes max 50 jobs per run to avoid server overload
- 100ms delay between job validations
- Rate-limited to prevent API abuse

### **Data Safety**
- All changes are logged
- Dry-run mode available for testing
- Jobs with recent applications are preserved
- Backup recommended before large cleanups

### **Production Considerations**
- Run during low-traffic hours (2 AM recommended)
- Monitor cleanup logs for issues
- Set up alerts for failed cleanups
- Consider job posting analytics before removal

## 🎯 **Benefits**

- ✅ **Clean Job Board**: No outdated listings
- ✅ **Better UX**: Users see only active jobs
- ✅ **Storage Efficiency**: Removes unnecessary data
- ✅ **Automated Maintenance**: No manual intervention needed
- ✅ **Scalable**: Handles thousands of jobs efficiently

The automated job cleanup system ensures your platform stays fresh and relevant for job seekers! 🚀
