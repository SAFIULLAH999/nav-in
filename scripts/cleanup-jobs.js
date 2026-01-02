#!/usr/bin/env node

/**
 * Job Cleanup Script
 *
 * This script automatically removes expired and invalid job postings.
 * Run this script periodically (e.g., daily) using a cron job.
 *
 * Usage:
 * - npm run cleanup-jobs
 * - node scripts/cleanup-jobs.js
 *
 * Options:
 * --dry-run: Preview what would be cleaned up without making changes
 * --verbose: Show detailed output
 */

const https = require('https')
const http = require('http')

async function cleanupJobs(dryRun = false, verbose = false) {
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'

  try {
    const url = `${baseUrl}/api/jobs/cleanup`
    const postData = JSON.stringify({ dryRun })

    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    }

    if (verbose) {
      console.log(`Making request to: ${url}`)
      console.log(`Dry run mode: ${dryRun}`)
    }

    const response = await makeRequest(url, options, postData)

    if (response.success) {
      console.log('✅ Job cleanup completed successfully!')
      console.log(`Jobs removed: ${response.data.jobsRemoved}`)
      console.log(`- Expired jobs: ${response.data.jobsExpired}`)
      console.log(`- Invalid jobs: ${response.data.jobsInvalid}`)

      if (dryRun) {
        console.log('\n📋 This was a dry run. No jobs were actually removed.')
        console.log(`To perform actual cleanup, run without --dry-run flag.`)
      }
    } else {
      console.error('❌ Job cleanup failed:', response.error)
      process.exit(1)
    }

  } catch (error) {
    console.error('❌ Error during job cleanup:', error.message)
    process.exit(1)
  }
}

function makeRequest(url, options, data) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https:') ? https : http
    const req = protocol.request(url, options, (res) => {
      let body = ''

      res.on('data', (chunk) => {
        body += chunk
      })

      res.on('end', () => {
        try {
          const response = JSON.parse(body)
          resolve(response)
        } catch (error) {
          reject(new Error(`Invalid JSON response: ${body}`))
        }
      })
    })

    req.on('error', (error) => {
      reject(error)
    })

    if (data) {
      req.write(data)
    }

    req.end()
  })
}

// Command line interface
function main() {
  const args = process.argv.slice(2)
  const dryRun = args.includes('--dry-run')
  const verbose = args.includes('--verbose') || args.includes('-v')

  console.log('🧹 Starting automated job cleanup...')
  console.log(`Mode: ${dryRun ? 'DRY RUN (no changes)' : 'LIVE (will remove jobs)'}`)
  console.log(`Verbose: ${verbose ? 'ON' : 'OFF'}`)
  console.log('─'.repeat(50))

  cleanupJobs(dryRun, verbose)
}

// Export for testing
module.exports = { cleanupJobs }

if (require.main === module) {
  main()
}
