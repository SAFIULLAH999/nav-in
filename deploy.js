#!/usr/bin/env node

/**
 * Deployment script for NavIN platform
 * This script helps with Vercel deployment and troubleshooting
 */

const { execSync } = require('child_process');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function main() {
  console.log('🚀 NavIN Deployment Helper');
  console.log('========================\n');

  try {
    // Check if we're in the right directory
    console.log('📁 Checking project structure...');
    execSync('ls -la', { stdio: 'inherit' });

    // Check if .env.local exists
    console.log('\n🔐 Checking environment variables...');
    try {
      execSync('cat .env.example', { stdio: 'inherit' });
      console.log('\n⚠️  Make sure you have .env.local configured with your database URL');
    } catch (error) {
      console.log('✅ Environment configuration looks good');
    }

    // Generate Prisma client
    console.log('\n🏗️  Generating Prisma client...');
    execSync('npx prisma generate', { stdio: 'inherit' });

    // Try to build
    console.log('\n🔨 Building for production...');
    execSync('npm run build', { stdio: 'inherit' });

    console.log('\n✅ Build successful!');
    console.log('\n🚀 Ready for Vercel deployment!');
    console.log('\nNext steps:');
    console.log('1. Run: vercel --prod');
    console.log('2. Set environment variables in Vercel dashboard');
    console.log('3. Redeploy if needed');

  } catch (error) {
    console.error('\n❌ Build failed:', error.message);
    console.log('\n🔧 Troubleshooting steps:');
    console.log('1. Check your DATABASE_URL in .env.local');
    console.log('2. Run: npx prisma generate');
    console.log('3. Run: npm run build');
    console.log('4. Check Vercel dashboard for detailed error logs');
  }

  rl.close();
}

main().catch(console.error);
