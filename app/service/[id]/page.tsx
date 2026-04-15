import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { MapPin, Euro, ArrowLeft, Sparkles } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { ServiceImageGallery } from '@/components/service-image-gallery'

export default async function ServiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  // Récupérer le service
  const { data: service } = await supabase
    .from('services')
    .select('id, title, description, category, city, price_per_hour, price_per_day, price_fixed, price_start, images, is_active')
    .eq('id', id)
    .eq('is_active', true)
    .single()

  if (!service) {
    notFound()
  }

  // Formater la catégorie
  const formatCategory = (cat: string) => {
    return cat
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }

  // Déterminer le prix à afficher
  const displayPrice = service.price_fixed
    ? `${service.price_fixed}€`
    : service.price_per_day
    ? `${service.price_per_day}€/jour`
    : service.price_per_hour
    ? `${service.price_per_hour}€/h`
    : service.price_start
    ? `À partir de ${service.price_start}€`
    : 'Prix sur demande'

  const images = service.images || []

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        {/* Bouton retour */}
        <Link href="/">
          <Button variant="ghost" className="mb-6">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </Button>
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Galerie d'images */}
          <div>
            {images.length > 0 ? (
              <ServiceImageGallery images={images} title={service.title} />
            ) : (
              <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-gradient-to-br from-gold/20 to-gold/5 border border-gold/20 flex items-center justify-center">
                <div className="text-center">
                  <Sparkles className="h-16 w-16 text-gold mx-auto mb-4 opacity-50" />
                  <p className="text-sm text-muted-foreground">Image à venir</p>
                </div>
              </div>
            )}
          </div>

          {/* Détails */}
          <div className="space-y-6">
            <div>
              <span className="inline-block bg-gold-gradient text-background text-sm font-semibold px-3 py-1 rounded-full mb-4 glow-gold">
                {formatCategory(service.category)}
              </span>
              <h1 className="text-3xl md:text-4xl font-serif font-bold text-foreground mb-4">
                {service.title}
              </h1>
              <div className="flex items-center gap-4 text-muted-foreground mb-6 flex-wrap">
                {service.city && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-gold" />
                    <span>{service.city}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-gold font-semibold">
                  <Euro className="h-5 w-5" />
                  <span>{displayPrice}</span>
                </div>
              </div>
            </div>

            <Card className="glass-gold border-gold/30">
              <CardHeader>
                <CardTitle>Description</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground whitespace-pre-wrap">
                  {service.description || 'Aucune description disponible.'}
                </p>
              </CardContent>
            </Card>

            {/* CTA */}
            <Button
              asChild
              className="w-full h-12 bg-gold-gradient text-background hover:opacity-90 font-medium gold-shimmer glow-gold text-base"
            >
              <Link href="/dashboard/configurator">
                Réserver via le Configurateur
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
