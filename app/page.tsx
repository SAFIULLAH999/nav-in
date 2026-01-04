import { HeroSection } from '@/components/HeroSection'
import { FeaturesSection } from '@/components/FeaturesSection'
import { FeaturedCompanies } from '@/components/FeaturedCompanies'
import { Footer } from '@/components/Footer'

export default function Home() {
  return (
    <>
      <HeroSection />
      <FeaturesSection />
      <FeaturedCompanies />
      <Footer />
    </>
  )
}
