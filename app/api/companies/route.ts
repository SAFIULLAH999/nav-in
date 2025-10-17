import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { authenticateRequest } from '@/lib/jwt'
import { z } from 'zod'

const createCompanySchema = z.object({
  name: z.string().min(1, 'Company name is required').max(100, 'Name too long'),
  description: z.string().max(1000, 'Description too long').optional(),
  website: z.string().url().optional(),
  logo: z.string().url().optional(),
  industry: z.string().max(50, 'Industry too long').optional(),
  size: z.enum(['startup', 'SMB', 'enterprise']).optional(),
  location: z.string().max(100, 'Location too long').optional(),
  foundedYear: z.number().min(1800).max(new Date().getFullYear()).optional(),
})

// GET - Search companies
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''
    const industry = searchParams.get('industry') || ''
    const location = searchParams.get('location') || ''
    const offset = (page - 1) * limit

    // Build where clause for filtering
    const where: any = {
      isVerified: true
    }

    if (search) {
      where.name = { contains: search, mode: 'insensitive' }
    }

    if (industry) {
      where.industry = { contains: industry, mode: 'insensitive' }
    }

    if (location) {
      where.location = { contains: location, mode: 'insensitive' }
    }

    const companies = await prisma.company.findMany({
      where,
      take: limit,
      skip: offset,
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: {
            employees: true,
            jobs: {
              where: { isActive: true }
            },
            posts: true
          }
        }
      }
    })

    // Transform companies for frontend
    const transformedCompanies = companies.map(company => ({
      id: company.id,
      name: company.name,
      description: company.description,
      website: company.website,
      logo: company.logo,
      industry: company.industry,
      size: company.size,
      location: company.location,
      foundedYear: company.foundedYear,
      isVerified: company.isVerified,
      createdAt: company.createdAt.toISOString(),
      stats: {
        employees: company._count.employees,
        activeJobs: company._count.jobs,
        posts: company._count.posts
      }
    }))

    return NextResponse.json({
      success: true,
      data: transformedCompanies,
      pagination: {
        page,
        limit,
        hasMore: companies.length === limit
      }
    })
  } catch (error) {
    console.error('Error fetching companies:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch companies' },
      { status: 500 }
    )
  }
}

// POST - Create a company page
export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const authResult = await authenticateRequest(request)

    if ('error' in authResult) {
      return NextResponse.json(
        { success: false, error: authResult.error },
        { status: 401 }
      )
    }

    const body = await request.json()
    const companyData = createCompanySchema.parse(body)

    const userId = authResult.user.userId

    // Check if user has permission to create company pages
    if (!['ADMIN', 'COMPANY_ADMIN'].includes(authResult.user.role)) {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions to create company pages' },
        { status: 403 }
      )
    }

    // Check if company already exists
    const existingCompany = await prisma.company.findFirst({
      where: { name: companyData.name }
    })

    if (existingCompany) {
      return NextResponse.json(
        { success: false, error: 'Company already exists' },
        { status: 400 }
      )
    }

    // Create the company
    const newCompany = await prisma.company.create({
      data: {
        name: companyData.name,
        description: companyData.description,
        website: companyData.website,
        logo: companyData.logo,
        industry: companyData.industry,
        size: companyData.size,
        location: companyData.location,
        foundedYear: companyData.foundedYear
      }
    })

    // Add creator as admin employee
    await prisma.companyEmployee.create({
      data: {
        userId,
        companyId: newCompany.id,
        role: 'Founder/CEO',
        isAdmin: true
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        id: newCompany.id,
        name: newCompany.name,
        description: newCompany.description,
        website: newCompany.website,
        logo: newCompany.logo,
        industry: newCompany.industry,
        size: newCompany.size,
        location: newCompany.location,
        foundedYear: newCompany.foundedYear,
        isVerified: newCompany.isVerified,
        createdAt: newCompany.createdAt.toISOString()
      },
      message: 'Company created successfully'
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error creating company:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create company' },
      { status: 500 }
    )
  }
}
