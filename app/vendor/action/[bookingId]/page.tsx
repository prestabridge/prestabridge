import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Calendar, MapPin, Euro } from 'lucide-react'
import { providerAcceptBooking, providerDeclineBooking } from '@/app/actions/vendor-booking'

export default async function VendorActionPage({
  params,
}: {
  params: Promise<{ bookingId: string }>
}) {
  const { bookingId } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect(`/login?redirect=/vendor/action/${bookingId}`)

  const { data: booking, error } = await supabase
    .from('bookings')
    .select('id, provider_id, booking_date, total_amount, status, services(title, city)')
    .eq('id', bookingId)
    .single()

  if (error || !booking || booking.provider_id !== user.id) {
    redirect('/dashboard')
  }

  const service = Array.isArray(booking.services) ? booking.services[0] : booking.services

  async function acceptAction() {
    'use server'
    await providerAcceptBooking(bookingId)
    redirect('/dashboard?booking=accepted')
  }

  async function declineAction() {
    'use server'
    await providerDeclineBooking(bookingId)
    redirect('/dashboard?booking=declined')
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-md mx-auto pt-6">
        <Card className="glass-gold border-gold/30">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-serif">Demande Express</CardTitle>
            <CardDescription>Validez ou refusez cette mission en un clic.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="rounded-xl border border-gold/20 p-4 space-y-3">
              <div className="font-semibold">{service?.title || 'Prestation'}</div>
              <div className="text-sm text-muted-foreground flex items-center gap-2">
                <Calendar className="h-4 w-4 text-gold" />
                {new Date(booking.booking_date).toLocaleDateString('fr-FR')}
              </div>
              <div className="text-sm text-muted-foreground flex items-center gap-2">
                <MapPin className="h-4 w-4 text-gold" />
                {service?.city || 'A preciser'}
              </div>
              <div className="text-sm font-semibold flex items-center gap-2">
                <Euro className="h-4 w-4 text-gold" />
                {Number(booking.total_amount || 0).toFixed(2)} EUR
              </div>
            </div>

            <form action={acceptAction}>
              <Button
                type="submit"
                className="w-full h-14 text-base font-bold bg-green-600 hover:bg-green-700 text-white"
              >
                ACCEPTER LA MISSION
              </Button>
            </form>

            <form action={declineAction}>
              <Button
                type="submit"
                variant="destructive"
                className="w-full h-14 text-base font-bold"
              >
                REFUSER / INDISPONIBLE
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
