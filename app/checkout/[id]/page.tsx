import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { ArrowLeft, Euro, Calendar, MessageSquare, Sparkles } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { CheckoutForm } from '@/components/checkout-form'

export default async function CheckoutPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  // Vérifier l'authentification
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect(`/login?redirect=/checkout/${id}`)
  }

  // Récupérer le service
  const { data: service } = await supabase
    .from('services')
    .select('id, title, description, category, city, price_per_hour, price_per_day, price_fixed, price_start, images, is_active, provider_id')
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

  const imageUrl = service.images && service.images.length > 0 ? service.images[0] : null

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        {/* Bouton retour */}
        <Link href={`/service/${id}`}>
          <Button variant="ghost" className="mb-6">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour au service
          </Button>
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Colonne Gauche : Récapitulatif */}
          <div className="space-y-6">
            <Card className="glass-gold border-gold/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-gold" />
                  Récapitulatif
                </CardTitle>
                <CardDescription>Vérifiez les détails de votre réservation</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Image */}
                <div className="relative w-full h-48 rounded-lg overflow-hidden bg-gradient-to-br from-gold/20 to-gold/5">
                  {imageUrl ? (
                    <Image
                      src={imageUrl}
                      alt={service.title}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Sparkles className="h-12 w-12 text-gold opacity-50" />
                    </div>
                  )}
                </div>

                {/* Détails */}
                <div className="space-y-3">
                  <div>
                    <h3 className="font-serif font-semibold text-lg mb-1">{service.title}</h3>
                    <p className="text-sm text-muted-foreground">{formatCategory(service.category)}</p>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-gold/20">
                    <span className="text-sm text-muted-foreground">Prix</span>
                    <div className="flex items-center gap-1 text-gold font-semibold">
                      <Euro className="h-4 w-4" />
                      <span>{displayPrice}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Colonne Droite : Formulaire */}
          <div>
            <Card className="glass-gold border-gold/30">
              <CardHeader>
                <CardTitle>Formulaire de réservation</CardTitle>
                <CardDescription>
                  Remplissez les informations pour votre demande de réservation
                </CardDescription>
              </CardHeader>
              <CardContent>
                <CheckoutForm serviceId={id} />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
