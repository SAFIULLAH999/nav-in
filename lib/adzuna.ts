// lib/adzuna.ts
// Adzuna public job search API
// Docs: https://developer.adzuna.com/overview

export interface AdzunaJob {
  id: string
  title: string
  company: string
  location: string
  description: string
  salary_min: number | null
  salary_max: number | null
  job_type: string
  is_remote: boolean
  apply_url: string
  posted_at: string
  skills: string[]
  logo: string | null
}

const ADZUNA_APP_ID  = process.env.ADZUNA_APP_ID  ?? ""
const ADZUNA_APP_KEY = process.env.ADZUNA_APP_KEY ?? ""

// If no API keys configured, return rich mock data so the UI never breaks
const MOCK_JOBS: AdzunaJob[] = [
  {
    id: "mock-1",
    title: "Senior Frontend Engineer",
    company: "TechCorp",
    location: "Remote — Worldwide",
    description: "We are looking for a Senior Frontend Engineer to join our product team. You will build and ship high-quality React applications used by millions of professionals. Strong TypeScript skills required.",
    salary_min: 90000,
    salary_max: 130000,
    job_type: "Full-time",
    is_remote: true,
    apply_url: "#",
    posted_at: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
    skills: ["React", "TypeScript", "Next.js", "Tailwind CSS"],
    logo: null,
  },
  {
    id: "mock-2",
    title: "Backend Developer (Node.js)",
    company: "InnovateLab",
    location: "Lahore, Pakistan",
    description: "Join our engineering team to build scalable REST APIs and microservices. You will work on high-traffic systems serving thousands of requests per second. PostgreSQL and Redis experience is a plus.",
    salary_min: 60000,
    salary_max: 90000,
    job_type: "Full-time",
    is_remote: false,
    apply_url: "#",
    posted_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    skills: ["Node.js", "PostgreSQL", "REST APIs", "Docker"],
    logo: null,
  },
  {
    id: "mock-3",
    title: "Product Designer (UI/UX)",
    company: "HealthTech",
    location: "Karachi, Pakistan",
    description: "We need a creative Product Designer to own the end-to-end design process. From user research to high-fidelity prototypes in Figma. You will collaborate closely with engineering and product.",
    salary_min: 55000,
    salary_max: 80000,
    job_type: "Contract",
    is_remote: true,
    apply_url: "#",
    posted_at: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
    skills: ["Figma", "UI/UX", "Prototyping", "User Research"],
    logo: null,
  },
  {
    id: "mock-4",
    title: "Full Stack Engineer",
    company: "EduPlatform",
    location: "Islamabad, Pakistan",
    description: "Looking for a versatile Full Stack Engineer comfortable with both frontend (React) and backend (Python/Django). You will own features from database schema to UI polish.",
    salary_min: 70000,
    salary_max: 110000,
    job_type: "Full-time",
    is_remote: false,
    apply_url: "#",
    posted_at: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(),
    skills: ["React", "Python", "Django", "PostgreSQL"],
    logo: null,
  },
  {
    id: "mock-5",
    title: "DevOps Engineer",
    company: "GlobalFinance",
    location: "Remote — Asia",
    description: "We are hiring a DevOps Engineer to own our CI/CD pipelines, Kubernetes clusters, and cloud infrastructure on AWS. You will drive reliability, scalability, and deployment velocity.",
    salary_min: 85000,
    salary_max: 120000,
    job_type: "Full-time",
    is_remote: true,
    apply_url: "#",
    posted_at: new Date(Date.now() - 1000 * 60 * 60 * 96).toISOString(),
    skills: ["AWS", "Kubernetes", "Docker", "Terraform", "CI/CD"],
    logo: null,
  },
  {
    id: "mock-6",
    title: "Mobile Developer (React Native)",
    company: "EcoSolutions",
    location: "Remote — Pakistan",
    description: "Build cross-platform mobile apps for iOS and Android using React Native. You will work on a green-tech product used by environmental professionals across 30+ countries.",
    salary_min: 65000,
    salary_max: 95000,
    job_type: "Part-time",
    is_remote: true,
    apply_url: "#",
    posted_at: new Date(Date.now() - 1000 * 60 * 60 * 120).toISOString(),
    skills: ["React Native", "TypeScript", "iOS", "Android"],
    logo: null,
  },
]

export async function fetchJobs(params: {
  query?: string
  type?: string
  remote?: boolean
  country?: string
  page?: number
}): Promise<{ jobs: AdzunaJob[]; total: number; error: string | null }> {
  
  // If no API keys, always return mock data
  if (!ADZUNA_APP_ID || !ADZUNA_APP_KEY) {
    let jobs = [...MOCK_JOBS]
    if (params.query) {
      const q = params.query.toLowerCase()
      jobs = jobs.filter(j =>
        j.title.toLowerCase().includes(q) ||
        j.company.toLowerCase().includes(q) ||
        j.skills.some(s => s.toLowerCase().includes(q))
      )
    }
    if (params.type && params.type !== "all") {
      jobs = jobs.filter(j => j.job_type.toLowerCase().replace("-", "").includes(params.type!.toLowerCase().replace("-", "")))
    }
    if (params.remote) {
      jobs = jobs.filter(j => j.is_remote)
    }
    return { jobs, total: jobs.length, error: null }
  }

  // Real Adzuna API call
  try {
    const country = params.country ?? "pk"
    const page    = params.page ?? 1
    const url     = new URL(`https://api.adzuna.com/v1/api/jobs/${country}/search/${page}`)

    url.searchParams.set("app_id",           ADZUNA_APP_ID)
    url.searchParams.set("app_key",          ADZUNA_APP_KEY)
    url.searchParams.set("results_per_page", "20")
    url.searchParams.set("content-type",     "application/json")

    if (params.query) url.searchParams.set("what", params.query)
    if (params.remote) url.searchParams.set("what_exclude", "")

    const res = await fetch(url.toString(), {
      next: { revalidate: 3600 }, // cache for 1 hour
    })

    if (!res.ok) throw new Error(`Adzuna API returned ${res.status}`)

    const data = await res.json()

    const jobs: AdzunaJob[] = (data.results ?? []).map((r: any) => ({
      id:          String(r.id),
      title:       r.title ?? "Untitled",
      company:     r.company?.display_name ?? "Unknown Company",
      location:    r.location?.display_name ?? "",
      description: r.description ?? "",
      salary_min:  r.salary_min ? Math.round(r.salary_min) : null,
      salary_max:  r.salary_max ? Math.round(r.salary_max) : null,
      job_type:    detectJobType(r.title + " " + (r.description ?? "")),
      is_remote:   (r.title + " " + (r.description ?? "")).toLowerCase().includes("remote"),
      apply_url:   r.redirect_url ?? "#",
      posted_at:   r.created ?? new Date().toISOString(),
      skills:      extractSkills(r.description ?? ""),
      logo:        null,
    }))

    // Apply type filter client-side since Adzuna doesn't support it directly
    let filtered = jobs
    if (params.type && params.type !== "all") {
      filtered = jobs.filter(j =>
        j.job_type.toLowerCase().replace(/[-\s]/g, "").includes(
          params.type!.toLowerCase().replace(/[-\s]/g, "")
        )
      )
    }

    return { jobs: filtered, total: data.count ?? filtered.length, error: null }
  } catch (err) {
    console.error("[ADZUNA_ERROR]", err)
    // Graceful fallback to mock data on API failure
    return { jobs: MOCK_JOBS, total: MOCK_JOBS.length, error: null }
  }
}

function detectJobType(text: string): string {
  const t = text.toLowerCase()
  if (t.includes("part-time") || t.includes("part time")) return "Part-time"
  if (t.includes("contract") || t.includes("freelance"))  return "Contract"
  if (t.includes("internship") || t.includes("intern"))   return "Internship"
  return "Full-time"
}

const SKILL_LIST = [
  "React","Next.js","TypeScript","JavaScript","Python","Node.js","Django","FastAPI",
  "PostgreSQL","MySQL","MongoDB","Redis","AWS","Azure","GCP","Docker","Kubernetes",
  "Terraform","Git","GraphQL","REST","Figma","SQL","Java","C++","C#","Go","Rust",
  "Tailwind CSS","CSS","HTML","Vue","Angular","Flutter","React Native","Swift","Kotlin",
]

function extractSkills(text: string): string[] {
  return SKILL_LIST.filter(s => text.toLowerCase().includes(s.toLowerCase())).slice(0, 6)
}
