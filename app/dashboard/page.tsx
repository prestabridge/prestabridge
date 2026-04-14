import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { signOut } from '@/app/actions/auth'
import {
  Sparkles,
  User,
  Briefcase,
  Plus,
  ArrowRight,
  Calendar,
  Clock,
  Package,
  Crown,
  MessageSquare,
} from 'lucide-react'
import Link from 'next/link'
import { BookingSuccessBanner } from '@/components/booking-success-banner'
import { BookingActions } from '@/components/booking-actions'
import { ServiceCardDashboard } from '@/components/service-card-dashboard'

interface DashboardPageProps {
  searchParams?: Promise<{ booking?: string }>
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const supabase = await createClient()
  const params = await searchParams
  const showSuccess = params?.booking === 'success'

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

  // ============================================
  // RÉCUPÉRATION DES DONNÉES CLIENT
  // ============================================
  // Réservations envoyées (côté client)
  let sentBookings: any[] = []

  // Tentative 1 : Version complète (booking_date)
  const { data: fullBookings, error: fullError } = await supabase
    .from('bookings')
    .select('id, booking_date, status, client_message, created_at, service_id')
    .eq('client_id', user.id)
    .order('created_at', { ascending: false })

  if (!fullError && fullBookings && fullBookings.length > 0) {
    const serviceIds = fullBookings.map((b: any) => b.service_id).filter(Boolean)
    const { data: services } = await supabase
      .from('services')
      .select('id, title, category, images')
      .in('id', serviceIds)

    const servicesMap = new Map(services?.map((s: any) => [s.id, s]) || [])

    sentBookings = fullBookings.map((booking: any) => ({
      ...booking,
      date: booking.booking_date,
      service: servicesMap.get(booking.service_id) || null,
    }))
  } else {
    // Tentative 2 : Version simplifiée (date)
    const { data: simpleBookings, error: simpleError } = await supabase
      .from('bookings')
      .select('id, date, status, message, created_at, service_id')
      .eq('client_id', user.id)
      .order('created_at', { ascending: false })

    if (!simpleError && simpleBookings && simpleBookings.length > 0) {
      const serviceIds = simpleBookings.map((b: any) => b.service_id).filter(Boolean)
      const { data: services } = await supabase
        .from('services')
        .select('id, title, category, images')
        .in('id', serviceIds)

      const servicesMap = new Map(services?.map((s: any) => [s.id, s]) || [])

      sentBookings = simpleBookings.map((booking: any) => ({
        ...booking,
        client_message: booking.message,
        service: servicesMap.get(booking.service_id) || null,
      }))
    }
  }

  // ============================================
  // RÉCUPÉRATION DES DONNÉES PRESTATAIRE
  // ============================================
  // Services créés
  const { data: myServices } = await supabase
    .from('services')
    .select('*')
    .eq('provider_id', user.id)
    .order('created_at', { ascending: false })

  // Réservations reçues (pour les services du prestataire)
  let receivedBookings: any[] = []

  const isProvider = profile?.role === 'provider' || (myServices && myServices.length > 0)

  if (isProvider) {
    // Tentative 1 : Version complète (booking_date)
    const { data: fullReceived, error: fullReceivedError } = await supabase
      .from('bookings')
      .select('id, booking_date, status, client_message, created_at, service_id, client_id')
      .eq('provider_id', user.id)
      .order('created_at', { ascending: false })

    if (!fullReceivedError && fullReceived && fullReceived.length > 0) {
      const clientIds = fullReceived.map((b: any) => b.client_id).filter(Boolean)
      const serviceIds = fullReceived.map((b: any) => b.service_id).filter(Boolean)

      // Récupérer les profils clients avec jointure
      const { data: clients } = await supabase
        .from('profiles')
        .select('id, first_name, last_name')
        .in('id', clientIds)

      const { data: servicesData } = await supabase
        .from('services')
        .select('id, title')
        .in('id', serviceIds)

      // Créer un map avec full_name calculé
      const clientsMap = new Map(
        (clients || []).map((c: any) => {
          const fullName = `${c.first_name || ''} ${c.last_name || ''}`.trim()
          return [
            c.id,
            {
              ...c,
              full_name: fullName || null,
            },
          ]
        })
      )
      const servicesMap = new Map((servicesData || []).map((s: any) => [s.id, s]))

      receivedBookings = fullReceived.map((booking: any) => ({
        ...booking,
        date: booking.booking_date,
        client: clientsMap.get(booking.client_id) || null,
        service: servicesMap.get(booking.service_id) || null,
      }))
    } else {
      // Tentative 2 : Version simplifiée (date)
      const { data: simpleReceived, error: simpleReceivedError } = await supabase
        .from('bookings')
        .select('id, date, status, message, created_at, service_id, client_id')
        .eq('provider_id', user.id)
        .order('created_at', { ascending: false })

      if (!simpleReceivedError && simpleReceived && simpleReceived.length > 0) {
        const clientIds = simpleReceived.map((b: any) => b.client_id).filter(Boolean)
        const serviceIds = simpleReceived.map((b: any) => b.service_id).filter(Boolean)

        const { data: clients } = await supabase
          .from('profiles')
          .select('id, first_name, last_name')
          .in('id', clientIds)

        const { data: servicesData } = await supabase
          .from('services')
          .select('id, title')
          .in('id', serviceIds)

        // Créer un map avec full_name calculé
        const clientsMap = new Map(
          (clients || []).map((c: any) => {
            const fullName = `${c.first_name || ''} ${c.last_name || ''}`.trim()
            return [
              c.id,
              {
                ...c,
                full_name: fullName || null,
              },
            ]
          })
        )
        const servicesMap = new Map((servicesData || []).map((s: any) => [s.id, s]))

        receivedBookings = simpleReceived.map((booking: any) => ({
          ...booking,
          client_message: booking.message,
          client: clientsMap.get(booking.client_id) || null,
          service: servicesMap.get(booking.service_id) || null,
        }))
      }
    }
  }

  // ============================================
  // FONCTIONS UTILITAIRES
  // ============================================
  const getStatusBadge = (status: string) => {
    const statusMap: Record<
      string,
      { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }
    > = {
      pending: { label: 'En attente', variant: 'secondary' },
      pending_payment: { label: 'Paiement à confirmer', variant: 'secondary' },
      pending_vendor_validation: { label: 'En attente prestataire', variant: 'secondary' },
      accepted: { label: 'Validé', variant: 'default' },
      validated: { label: 'Validé', variant: 'default' },
      rejected: { label: 'Refusé', variant: 'destructive' },
      paid: { label: 'Payée', variant: 'default' },
      completed: { label: 'Terminée', variant: 'default' },
      cancelled: { label: 'Annulée', variant: 'destructive' },
    }

    const statusInfo = statusMap[status] || { label: status, variant: 'outline' as const }

    // Déterminer les classes CSS selon le statut
    let badgeClasses = ''
    if (status === 'pending' || status === 'pending_payment' || status === 'pending_vendor_validation') {
      badgeClasses = 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20'
    } else if (status === 'accepted' || status === 'validated' || status === 'paid') {
      badgeClasses = 'bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20'
    } else if (status === 'rejected' || status === 'cancelled') {
      badgeClasses = 'bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20'
    }

    return (
      <Badge variant={statusInfo.variant} className={badgeClasses}>
        {statusInfo.label}
      </Badge>
    )
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-serif font-bold text-foreground mb-2">
                Mon <span className="text-gold-gradient">Dashboard</span>
              </h1>
              <p className="text-muted-foreground">
                Gérez vos réservations et vos services
              </p>
            </div>
            <form action={signOut}>
              <Button type="submit" variant="outline">
                Déconnexion
              </Button>
            </form>
          </div>
        </div>

        {/* Notification de succès */}
        {showSuccess && <BookingSuccessBanner />}

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <Card className="glass-gold border-gold/30 hover-glow cursor-pointer">
            <Link href="/onboarding">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-xl bg-gold-gradient flex items-center justify-center glow-gold">
                    <Sparkles className="h-6 w-6 text-background" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg mb-1">Créer un événement</h3>
                    <p className="text-sm text-muted-foreground">
                      Utilisez notre configurateur intelligent
                    </p>
                  </div>
                  <ArrowRight className="h-5 w-5 text-gold" />
                </div>
              </CardContent>
            </Link>
          </Card>

          {/* Bouton "Devenir Prestataire" - Caché si déjà prestataire */}
          {!isProvider && (
            <Card className="glass-gold border-gold/30 hover-glow cursor-pointer">
              <Link href="/dashboard/provider/create-service">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-xl bg-gold-gradient flex items-center justify-center glow-gold">
                      <Plus className="h-6 w-6 text-background" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg mb-1">Devenir Prestataire</h3>
                      <p className="text-sm text-muted-foreground">
                        Proposez vos services sur la plateforme
                      </p>
                    </div>
                    <ArrowRight className="h-5 w-5 text-gold" />
                  </div>
                </CardContent>
              </Link>
            </Card>
          )}
        </div>

        {/* ============================================
            SECTION : MON ESPACE CLIENT
            ============================================ */}
        <div className="space-y-6 mb-12">
          <h2 className="text-2xl font-serif font-bold text-foreground flex items-center gap-2">
            <User className="h-6 w-6 text-gold" />
            Mon Espace Client
          </h2>

          {/* Mes Réservations Envoyées */}
          <Card className="glass-gold border-gold/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-gold" />
                Mes Réservations Envoyées
              </CardTitle>
              <CardDescription>
                {sentBookings.length === 0
                  ? 'Vous n\'avez pas encore de réservations'
                  : `${sentBookings.length} réservation${sentBookings.length > 1 ? 's' : ''}`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {sentBookings.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                  <p className="text-muted-foreground mb-4">
                    Vous n'avez pas encore fait de réservation
                  </p>
                  <Link href="/">
                    <Button variant="outline" className="bg-gold-gradient text-background hover:opacity-90">
                      Explorer les services
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {sentBookings.map((booking) => (
                    <div
                      key={booking.id}
                      className="p-4 rounded-lg border border-gold/20 bg-background/50 hover:bg-background/80 transition-colors"
                    >
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div className="flex-1 space-y-2">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <h3 className="font-semibold text-lg mb-1">
                                {booking.service?.title || 'Service supprimé'}
                              </h3>
                              <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                                <div className="flex items-center gap-1">
                                  <Calendar className="h-4 w-4" />
                                  <span>{formatDate(booking.date || booking.booking_date)}</span>
                                </div>
                                {booking.created_at && (
                                  <div className="flex items-center gap-1">
                                    <Clock className="h-4 w-4" />
                                    <span>
                                      Demandé le {new Date(booking.created_at).toLocaleDateString('fr-FR')}
                                    </span>
                                  </div>
                                )}
                              </div>
                              {booking.client_message && (
                                <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                                  {booking.client_message}
                                </p>
                              )}
                            </div>
                            <div className="flex-shrink-0">{getStatusBadge(booking.status)}</div>
                          </div>
                          {(booking.status === 'pending' || booking.status === 'pending_vendor_validation') && (
                            <div className="flex items-center gap-2 text-sm text-yellow-700 dark:text-yellow-400 mt-2">
                              <Clock className="h-4 w-4" />
                              <span>
                                {booking.status === 'pending_vendor_validation'
                                  ? 'En attente prestataire'
                                  : 'En attente de validation du prestataire'}
                              </span>
                            </div>
                          )}
                        </div>
                        {booking.service?.id && (
                          <div className="flex-shrink-0">
                            <Link href={`/service/${booking.service.id}`}>
                              <Button variant="outline" size="sm">
                                Voir le service
                              </Button>
                            </Link>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* ============================================
            SECTION : MON ESPACE PRESTATAIRE
            ============================================ */}
        {isProvider && (
          <div className="space-y-6">
            <h2 className="text-2xl font-serif font-bold text-foreground flex items-center gap-2">
              <Crown className="h-6 w-6 text-gold" />
              👑 Mon Espace Prestataire
            </h2>

            {/* Mes Services */}
            <Card className="glass-gold border-gold/30">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Package className="h-5 w-5 text-gold" />
                      Mes Services ({myServices?.length || 0})
                    </CardTitle>
                    <CardDescription>Gérez vos services proposés</CardDescription>
                  </div>
                  <Link href="/dashboard/provider/create-service">
                    <Button size="sm" className="bg-gold-gradient text-background hover:opacity-90">
                      <Plus className="h-4 w-4 mr-2" />
                      Nouveau service
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                {myServices && myServices.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {myServices.map((service) => (
                      <ServiceCardDashboard
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
                        is_active={service.is_active}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                    <p className="text-muted-foreground mb-4">Vous n'avez pas encore créé de service</p>
                    <Link href="/dashboard/provider/create-service">
                      <Button className="bg-gold-gradient text-background hover:opacity-90">
                        <Plus className="h-4 w-4 mr-2" />
                        Créer mon premier service
                      </Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Demandes Reçues */}
            {receivedBookings.length > 0 && (
              <Card className="glass-gold border-gold/30">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-gold" />
                    Demandes Reçues ({receivedBookings.length})
                  </CardTitle>
                  <CardDescription>Gérez les demandes de réservation pour vos services</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {receivedBookings.map((booking) => (
                      <div
                        key={booking.id}
                        className="p-4 rounded-lg border border-gold/20 bg-background/50 hover:bg-background/80 transition-colors"
                      >
                        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                          <div className="flex-1 space-y-3">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <User className="h-4 w-4 text-gold" />
                                  <h3 className="font-semibold text-lg">
                                    {booking.client
                                      ? booking.client.full_name || `Client ${booking.client.id.substring(0, 8)}...` || 'Client inconnu'
                                      : 'Client inconnu'}
                                  </h3>
                                </div>
                                {booking.service && (
                                  <p className="text-sm text-muted-foreground mb-2">
                                    Service : <span className="font-medium">{booking.service.title}</span>
                                  </p>
                                )}
                                <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground mb-2">
                                  <div className="flex items-center gap-1">
                                    <Calendar className="h-4 w-4" />
                                    <span>{formatDate(booking.date || booking.booking_date)}</span>
                                  </div>
                                  {booking.created_at && (
                                    <div className="flex items-center gap-1">
                                      <Clock className="h-4 w-4" />
                                      <span>
                                        Reçue le {new Date(booking.created_at).toLocaleDateString('fr-FR')}
                                      </span>
                                    </div>
                                  )}
                                </div>
                                {booking.client_message && (
                                  <div className="mt-3 p-3 rounded-lg bg-background/50 border border-gold/10">
                                    <div className="flex items-start gap-2">
                                      <MessageSquare className="h-4 w-4 text-gold mt-0.5 flex-shrink-0" />
                                      <p className="text-sm text-muted-foreground">{booking.client_message}</p>
                                    </div>
                                  </div>
                                )}
                              </div>
                              <div className="flex-shrink-0">{getStatusBadge(booking.status)}</div>
                            </div>
                          </div>
                          {booking.status === 'pending' && (
                            <div className="flex-shrink-0">
                              <BookingActions bookingId={booking.id} />
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
