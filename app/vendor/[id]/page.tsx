import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ServiceCard } from '@/components/service-card'
import { Card, CardContent } from '@/components/ui/card'
import { BadgeCheck, MapPin } from 'lucide-react'

export default async function VendorPortfolioPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const [{ data: profile }, { data: services }] = await Promise.all([
    supabase
      .from('profiles')
      .select('id, first_name, last_name, bio, provider_type, city, verified, avatar_url')
      .eq('id', id)
      .single(),
    supabase
      .from('services')
      .select('id, provider_id, title, description, category, city, price_per_hour, price_per_day, price_fixed, price_start, images')
      .eq('provider_id', id)
      .eq('is_active', true)
      .order('created_at', { ascending: false }),
  ])

  if (!profile) notFound()

  const fullName = `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'Prestataire'

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <Card className="glass-gold border-gold/30">
          <CardContent className="p-6 md:p-8">
            <div className="flex flex-col md:flex-row md:items-center gap-6">
              <div className="h-20 w-20 rounded-full bg-gold/15 border border-gold/30 flex items-center justify-center text-2xl font-serif text-gold">
                {fullName.charAt(0)}
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-3xl md:text-4xl font-serif font-bold">{fullName}</h1>
                  {profile.verified && (
                    <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-green-500/10 text-green-400 border border-green-500/20">
                      <BadgeCheck className="h-3 w-3" />
                      Vérifié
                    </span>
                  )}
                </div>
                <p className="text-gold-gradient uppercase tracking-[0.2em] text-xs">
                  {profile.provider_type || 'prestataire'}
                </p>
                {profile.city && (
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-gold" />
                    {profile.city}
                  </p>
                )}
                <p className="text-muted-foreground max-w-3xl">
                  {profile.bio || 'Ce prestataire n’a pas encore ajouté de biographie.'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <section>
          <h2 className="text-2xl font-serif font-semibold mb-5">
            Services proposés
          </h2>
          {services && services.length > 0 ? (
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
          ) : (
            <Card className="glass-gold border-gold/30">
              <CardContent className="p-6 text-muted-foreground">
                Aucun service actif pour ce prestataire.
              </CardContent>
            </Card>
          )}
        </section>
      </div>
    </div>
  )
}
