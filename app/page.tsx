import { Header } from "@/components/header"
import { HeroSection } from "@/components/hero-section"
import { SelectionModeSection } from "@/components/selection-mode"
import { TrustSection } from "@/components/trust-section"
import { Footer } from "@/components/footer"

export default function Home() {
  return (
    <main className="min-h-screen bg-background">
      <Header />
      <HeroSection />
      <SelectionModeSection />
      <TrustSection />
      <Footer />
    </main>
  )
}
