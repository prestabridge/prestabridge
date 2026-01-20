import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Briefcase, Plus, Package, Calendar, User, MessageSquare, CheckCircle2, XCircle, Clock } from 'lucide-react'
import Link from 'next/link'
import { BookingActions } from '@/components/booking-actions'

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

  // Récupérer les réservations reçues (pour ce prestataire)
  let receivedBookings: any[] = []

  // Tentative 1 : Version complète (booking_date)
  const { data: fullBookings, error: fullError } = await supabase
    .from('bookings')
    .select('id, booking_date, status, client_message, created_at, service_id, client_id')
    .eq('provider_id', user.id)
    .order('created_at', { ascending: false })

  if (!fullError && fullBookings && fullBookings.length > 0) {
    // Récupérer les profils clients et services
    const clientIds = fullBookings.map((b: any) => b.client_id).filter(Boolean)
    const serviceIds = fullBookings.map((b: any) => b.service_id).filter(Boolean)

    const { data: clients } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, email')
      .in('id', clientIds)

    const { data: servicesData } = await supabase
      .from('services')
      .select('id, title')
      .in('id', serviceIds)

    const clientsMap = new Map(clients?.map((c: any) => [c.id, c]) || [])
    const servicesMap = new Map(servicesData?.map((s: any) => [s.id, s]) || [])

    receivedBookings = fullBookings.map((booking: any) => ({
      ...booking,
      date: booking.booking_date,
      client: clientsMap.get(booking.client_id) || null,
      service: servicesMap.get(booking.service_id) || null,
    }))
  } else {
    // Tentative 2 : Version simplifiée (date)
    const { data: simpleBookings, error: simpleError } = await supabase
      .from('bookings')
      .select('id, date, status, message, created_at, service_id, client_id')
      .eq('provider_id', user.id)
      .order('created_at', { ascending: false })

    if (!simpleError && simpleBookings && simpleBookings.length > 0) {
      // Récupérer les profils clients et services
      const clientIds = simpleBookings.map((b: any) => b.client_id).filter(Boolean)
      const serviceIds = simpleBookings.map((b: any) => b.service_id).filter(Boolean)

      const { data: clients } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, email')
        .in('id', clientIds)

      const { data: servicesData } = await supabase
        .from('services')
        .select('id, title')
        .in('id', serviceIds)

      const clientsMap = new Map(clients?.map((c: any) => [c.id, c]) || [])
      const servicesMap = new Map(servicesData?.map((s: any) => [s.id, s]) || [])

      receivedBookings = simpleBookings.map((booking: any) => ({
        ...booking,
        client_message: booking.message,
        client: clientsMap.get(booking.client_id) || null,
        service: servicesMap.get(booking.service_id) || null,
      }))
    }
  }

  // Fonction pour obtenir le badge de statut
  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
      pending: { label: 'En attente', variant: 'secondary' },
      accepted: { label: 'Acceptée', variant: 'default' },
      validated: { label: 'Validée', variant: 'default' },
      rejected: { label: 'Refusée', variant: 'destructive' },
      paid: { label: 'Payée', variant: 'default' },
      completed: { label: 'Terminée', variant: 'default' },
      cancelled: { label: 'Annulée', variant: 'destructive' },
    }

    const statusInfo = statusMap[status] || { label: status, variant: 'outline' as const }

    return (
      <Badge
        variant={statusInfo.variant}
        className={
          status === 'pending'
            ? 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20'
            : status === 'accepted' || status === 'validated' || status === 'paid'
            ? 'bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20'
            : ''
        }
      >
        {statusInfo.label}
      </Badge>
    )
  }

  // Formater la date
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

        {/* Section Demandes Reçues */}
        {receivedBookings.length > 0 && (
          <div className="mt-12 space-y-4">
            <h2 className="text-xl font-serif font-bold text-foreground flex items-center gap-2">
              <Calendar className="h-5 w-5 text-gold" />
              Demandes Reçues ({receivedBookings.length})
            </h2>

            <div className="space-y-4">
              {receivedBookings.map((booking) => (
                <Card key={booking.id} className="glass-gold border-gold/30">
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                      <div className="flex-1 space-y-3">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <User className="h-4 w-4 text-gold" />
                              <h3 className="font-semibold text-lg">
                                {booking.client
                                  ? `${booking.client.first_name || ''} ${booking.client.last_name || ''}`.trim() ||
                                    booking.client.email
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
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
