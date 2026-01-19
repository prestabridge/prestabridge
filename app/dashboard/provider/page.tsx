import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Briefcase, Plus, Package } from 'lucide-react'
import Link from 'next/link'

export default async function ProviderDashboardPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'provider') {
    redirect('/onboarding')
  }

  // Récupérer les services du prestataire
  const { data: services } = await supabase
    .from('services')
    .select('*')
    .eq('provider_id', user.id)
    .order('created_at', { ascending: false })

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-serif font-bold text-foreground mb-2">
                Dashboard <span className="text-gold-gradient">Prestataire</span>
              </h1>
              <p className="text-muted-foreground">
                Gérez vos services et réservations
              </p>
            </div>
            <Link href="/dashboard/provider/create-service">
              <Button className="bg-gold-gradient text-background hover:opacity-90 font-medium gold-shimmer glow-gold">
                <Plus className="h-4 w-4 mr-2" />
                Nouveau service
              </Button>
            </Link>
          </div>
        </div>

        {/* Services */}
        <div className="space-y-4">
          <h2 className="text-xl font-serif font-bold text-foreground flex items-center gap-2">
            <Package className="h-5 w-5 text-gold" />
            Mes Services ({services?.length || 0})
          </h2>

          {services && services.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {services.map((service) => (
                <Card key={service.id} className="glass-gold border-gold/30 hover-glow">
                  <CardHeader>
                    <CardTitle className="text-lg">{service.title}</CardTitle>
                    <CardDescription>{service.category}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                      {service.description}
                    </p>
                    <div className="flex items-center justify-between">
                      <div className="text-sm">
                        {service.price_per_hour && (
                          <span className="text-gold font-medium">
                            {service.price_per_hour}€/h
                          </span>
                        )}
                        {service.price_per_day && (
                          <span className="text-gold font-medium">
                            {service.price_per_day}€/jour
                          </span>
                        )}
                        {service.price_fixed && (
                          <span className="text-gold font-medium">
                            {service.price_fixed}€
                          </span>
                        )}
                      </div>
                      <span
                        className={`text-xs px-2 py-1 rounded ${
                          service.is_active
                            ? 'bg-green-500/20 text-green-400'
                            : 'bg-gray-500/20 text-gray-400'
                        }`}
                      >
                        {service.is_active ? 'Actif' : 'Inactif'}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="glass-gold border-gold/30">
              <CardContent className="p-12 text-center">
                <Briefcase className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Aucun service créé</h3>
                <p className="text-muted-foreground mb-6">
                  Commencez par créer votre premier service pour apparaître dans les recherches
                </p>
                <Link href="/dashboard/provider/create-service">
                  <Button className="bg-gold-gradient text-background hover:opacity-90 font-medium gold-shimmer glow-gold">
                    <Plus className="h-4 w-4 mr-2" />
                    Créer mon premier service
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
