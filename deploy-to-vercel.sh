#!/bin/bash

echo "🚀 NavIN Vercel Deployment Script"
echo "================================="
echo ""

# Check if .env.local exists
if [ ! -f ".env.local" ]; then
    echo "⚠️  Warning: .env.local not found!"
    echo "Please create .env.local with your environment variables:"
    echo "DATABASE_URL=your-database-url"
    echo "NEXTAUTH_SECRET=your-secret"
    echo "NEXTAUTH_URL=http://localhost:3000"
    echo ""
fi

# Install Vercel CLI if not installed
echo "📦 Installing Vercel CLI..."
npm install -g vercel

# Login to Vercel
echo "🔐 Logging into Vercel..."
vercel login

# Deploy to production
echo "🚀 Deploying to Vercel..."
vercel --prod

echo ""
echo "✅ Deployment complete!"
echo ""
echo "Next steps:"
echo "1. Go to your Vercel dashboard"
echo "2. Set environment variables in project settings"
echo "3. Add your DATABASE_URL"
echo "4. Redeploy if needed"
echo ""
echo "🔧 Environment variables to set in Vercel:"
echo "DATABASE_URL=your-production-database-url"
echo "NEXTAUTH_SECRET=your-production-secret"
echo "NEXTAUTH_URL=https://your-domain.vercel.app"
