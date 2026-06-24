import { HeroSection } from '@/components/HeroSection'
import { FeaturesSection } from '@/components/FeaturesSection'
import { FeaturedCompanies } from '@/components/FeaturedCompanies'
import { Footer } from '@/components/Footer'

export default function Home() {
  return (
    <main className="flex flex-col items-center">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <HeroSection />
        <FeaturesSection />
        <FeaturedCompanies />
      </div>
      <div className="w-full">
        <Footer />
      </div>
    </main>
  )
}
