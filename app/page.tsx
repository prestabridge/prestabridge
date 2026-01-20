import { Header } from "@/components/header"
import { HeroSection } from "@/components/hero-section"
import { SelectionModeSection } from "@/components/selection-mode"
import { TrustSection } from "@/components/trust-section"
import { Footer } from "@/components/footer"
import { ServiceCard } from "@/components/service-card"
import { createClient } from "@/lib/supabase/server"
import { Sparkles } from "lucide-react"

export default async function Home() {
  const supabase = await createClient()

  // Récupérer les services actifs
  const { data: services } = await supabase
    .from('services')
    .select('id, title, description, category, city, price_per_hour, price_per_day, price_fixed, price_start, images')
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(6)

  return (
    <main className="min-h-screen bg-background">
      <Header />
      <HeroSection />
      <SelectionModeSection />
      
      {/* Section Services - Vitrine */}
      {services && services.length > 0 && (
        <section className="py-24 px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            {/* Section Header */}
            <div className="text-center mb-12">
              <p className="text-gold-gradient uppercase tracking-[0.3em] text-sm mb-4 font-semibold">
                Services Disponibles
              </p>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-serif text-foreground mb-6 text-balance">
                Découvrez nos <span className="text-gold-gradient">prestataires d'exception</span>
              </h2>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto text-pretty">
                Une sélection de services premium pour rendre votre événement inoubliable
              </p>
            </div>

            {/* Grille de services */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {services.map((service) => (
                <ServiceCard
                  key={service.id}
                  id={service.id}
                  title={service.title}
                  description={service.description || ''}
                  category={service.category}
                  city={service.city || ''}
                  price_per_hour={service.price_per_hour}
                  price_per_day={service.price_per_day}
                  price_fixed={service.price_fixed}
                  price_start={service.price_start}
                  images={service.images}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* État vide si aucun service */}
      {(!services || services.length === 0) && (
        <section className="py-24 px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl text-center">
            <div className="glass-gold rounded-2xl p-12 border-gold/30">
              <Sparkles className="h-16 w-16 text-gold mx-auto mb-6 opacity-50" />
              <h2 className="text-2xl font-serif font-semibold text-foreground mb-4">
                Aucun service disponible pour le moment
              </h2>
              <p className="text-muted-foreground">
                Les prestataires ajoutent leurs services chaque jour. Revenez bientôt !
              </p>
            </div>
          </div>
        </section>
      )}

      <TrustSection />
      <Footer />
    </main>
  )
}
