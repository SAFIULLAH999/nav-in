# NavIN - Professional Network Platform

A modern LinkedIn-style professional networking platform built with Next.js, TypeScript, Prisma, and Tailwind CSS.

## 🚀 Features

- **Professional Profile Management**: Create and edit detailed professional profiles
- **Experience & Education**: Add work experience and education history
- **Skills Management**: Add and manage professional skills
- **Settings Panel**: Comprehensive settings with tabbed interface
- **Responsive Design**: Works seamlessly on all devices
- **Modern UI**: Clean, professional interface with smooth animations

## 🛠️ Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: Tailwind CSS
- **Animations**: Framer Motion
- **Database**: Prisma ORM with PostgreSQL
- **Authentication**: NextAuth.js (ready for integration)
- **Deployment**: Vercel

## 📦 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd navin-platform
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```

   Fill in your environment variables in `.env.local`:
   ```env
   DATABASE_URL="your-database-url"
   NEXTAUTH_SECRET="your-secret-key"
   NEXTAUTH_URL="http://localhost:3000"
   ```

4. **Set up the database**
   ```bash
   npx prisma generate
   npx prisma db push
   ```

5. **Run the development server**
   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) to view the application.

## 🚀 Deployment to Vercel

### Prerequisites

1. **Database Setup**: You'll need a PostgreSQL database. For Vercel, we recommend:
   - [Vercel Postgres](https://vercel.com/storage/postgres) (recommended)
   - [Supabase](https://supabase.com/)
   - [Neon](https://neon.tech/)
   - [Railway](https://railway.app/)

2. **Environment Variables**: Set these in your Vercel dashboard:
   ```env
   DATABASE_URL="your-production-database-url"
   NEXTAUTH_SECRET="your-production-secret"
   NEXTAUTH_URL="https://your-domain.vercel.app"
   ```

### Deployment Steps

1. **Connect to Vercel**:
   ```bash
   vercel --prod
   ```

2. **Set Environment Variables**:
   - Go to your Vercel dashboard
   - Navigate to your project settings
   - Add environment variables in the "Environment Variables" section

3. **Deploy**:
   ```bash
   vercel --prod
   ```

### Vercel Configuration

The `vercel.json` file is configured to handle:
- API routes (`/api/*`)
- Static assets with proper caching
- Serverless functions for Prisma

### Troubleshooting Vercel Deployment

If you encounter 404 errors on Vercel:

1. **Check Environment Variables**:
   - Ensure `DATABASE_URL` is set in Vercel dashboard
   - Verify `NEXTAUTH_SECRET` is configured
   - Check `NEXTAUTH_URL` matches your Vercel domain

2. **Database Connection**:
   - Test your database connection from Vercel
   - Ensure the database accepts connections from Vercel's IP range
   - Check database credentials and permissions

3. **Build Issues**:
   - The app uses static generation where possible
   - API routes are serverless functions
   - Prisma client is generated during build

4. **Common Fixes**:
   - Redeploy after setting environment variables
   - Check build logs in Vercel dashboard
   - Ensure all pages exist in the `app/` directory

## 📁 Project Structure

```
├── app/                    # Next.js 13+ app directory
│   ├── api/               # API routes
│   │   └── profile/       # Profile management API
│   ├── feed/              # Feed page
│   ├── jobs/              # Jobs page
│   ├── login/             # Login page
│   ├── messages/          # Messages page
│   ├── network/           # Network page
│   ├── notifications/     # Notifications page
│   ├── profile/           # Profile page
│   ├── register/          # Registration page
│   └── settings/          # Settings page
├── components/            # Reusable React components
│   ├── Navbar.tsx        # Navigation bar
│   ├── LeftSidebar.tsx   # Left sidebar (feed only)
│   ├── RightSidebar.tsx  # Right sidebar (feed only)
│   └── ...
├── prisma/               # Database schema and migrations
│   └── schema.prisma     # Prisma schema
└── types/                # TypeScript type definitions
```

## 🔧 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run db:generate` - Generate Prisma client
- `npm run db:push` - Push schema to database
- `npm run db:studio` - Open Prisma Studio

## 🎨 UI Components

### Settings Page
- **Profile Tab**: Edit basic information (name, title, company, etc.)
- **Experience Tab**: Add/manage work experience
- **Education Tab**: Add/manage education history
- **Skills Tab**: Add/manage professional skills
- **Account Tab**: Account settings and password management

### Navigation
- **Responsive Navbar**: Works on all screen sizes
- **Profile Menu**: Dropdown with profile and settings access
- **Conditional Sidebar**: Only shows on feed page for better UX

## 🔒 Authentication

The app is set up to use NextAuth.js. To enable authentication:

1. Configure authentication providers in `pages/api/auth/[...nextauth].ts`
2. Set up OAuth providers (Google, GitHub, etc.)
3. Add authentication environment variables

## 📊 Database Schema

The Prisma schema includes models for:
- **User**: User profiles and authentication
- **Experience**: Work experience entries
- **Education**: Education history
- **Post**: Social posts (ready for expansion)
- **Connection**: Professional connections
- **Job**: Job postings
- **Message**: Private messaging

## 🚨 Troubleshooting

### Common Issues

1. **Prisma Build Errors**:
   ```bash
   npm run prebuild
   ```

2. **Vercel Deployment Issues**:
   - Ensure all environment variables are set in Vercel dashboard
   - Check that the database is accessible from Vercel
   - Verify API routes are working correctly

3. **404 Errors on Deployment**:
   - Check that all pages exist in the `app/` directory
   - Verify Vercel configuration in `vercel.json`
   - Ensure API routes are properly configured

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the troubleshooting section above
- Review the Vercel deployment documentation

---

Built with ❤️ using Next.js, TypeScript, and modern web technologies.
