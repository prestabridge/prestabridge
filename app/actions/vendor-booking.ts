'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { finalizePaymentCapture } from '@/app/actions/payments'
import { triggerVendorNotificationsAdmin } from '@/lib/notifications/vendors-admin'
import { Resend } from 'resend'

async function updateBookingStatusWithFallback(
  supabase: Awaited<ReturnType<typeof createClient>>,
  bookingId: string,
  desired: string,
  fallback: string
) {
  const first = await supabase.from('bookings').update({ status: desired }).eq('id', bookingId)
  if (!first.error) return desired
  const second = await supabase.from('bookings').update({ status: fallback }).eq('id', bookingId)
  if (second.error) throw new Error(second.error.message)
  return fallback
}

export async function providerAcceptBooking(bookingId: string) {
  const supabase = await createClient()
  const admin = createAdminClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()
  if (authError || !user) return { error: 'Non authentifié' }

  const { data: booking, error } = await supabase
    .from('bookings')
    .select('id, provider_id, status, client_id')
    .eq('id', bookingId)
    .single()
  if (error || !booking) return { error: 'Booking introuvable' }
  if (booking.provider_id !== user.id) return { error: 'Accès non autorisé' }

  const appliedStatus = await updateBookingStatusWithFallback(
    supabase,
    bookingId,
    'accepted',
    'validated'
  )

  const capture = await finalizePaymentCapture({ bookingId })
  if (capture.error) return { error: capture.error }

  await admin
    .from('booking_provider_attempts')
    .upsert(
      {
        booking_id: bookingId,
        provider_id: booking.provider_id,
        status: 'accepted',
        responded_at: new Date().toISOString(),
      },
      { onConflict: 'booking_id,provider_id' }
    )

  await admin
    .from('booking_provider_attempts')
    .update({
      status: 'cancelled_by_winner',
      responded_at: new Date().toISOString(),
    })
    .eq('booking_id', bookingId)
    .neq('provider_id', booking.provider_id)

  const { data: clientProfile } = await supabase
    .from('profiles')
    .select('email, first_name')
    .eq('id', booking.client_id)
    .single()
  const { data: providerProfile } = await supabase
    .from('profiles')
    .select('first_name')
    .eq('id', booking.provider_id)
    .single()

  const resendKey = process.env.RESEND_API_KEY
  const from = process.env.RESEND_FROM_EMAIL
  if (resendKey && from && clientProfile?.email) {
    const resend = new Resend(resendKey)
    await resend.emails.send({
      from,
      to: [clientProfile.email],
      subject: 'Bonne nouvelle ! Votre prestataire a accepte la mission',
      html: `<p>Bonjour ${clientProfile.first_name || ''},</p>
             <p>Bonne nouvelle ! Le prestataire ${providerProfile?.first_name || ''} a valide votre evenement.</p>
             <p>Vous pouvez suivre la suite dans votre dashboard.</p>`,
    })
  }

  revalidatePath('/dashboard')
  revalidatePath('/dashboard/provider')
  return { success: true, status: appliedStatus }
}

export async function providerDeclineBooking(bookingId: string) {
  const supabase = await createClient()
  const admin = createAdminClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()
  if (authError || !user) return { error: 'Non authentifié' }

  const { data: booking, error } = await supabase
    .from('bookings')
    .select('id, provider_id, client_id')
    .eq('id', bookingId)
    .single()
  if (error || !booking) return { error: 'Booking introuvable' }
  if (booking.provider_id !== user.id) return { error: 'Accès non autorisé' }

  // Marquer ce prestataire comme indisponible/declined (fallback rejected)
  await updateBookingStatusWithFallback(supabase, bookingId, 'declined', 'rejected')
  await admin
    .from('booking_provider_attempts')
    .upsert(
      {
        booking_id: bookingId,
        provider_id: booking.provider_id,
        status: 'declined',
        responded_at: new Date().toISOString(),
      },
      { onConflict: 'booking_id,provider_id' }
    )

  // Rebasculer immédiatement en attente prestataire avant cascade instantanée
  await updateBookingStatusWithFallback(
    supabase,
    bookingId,
    'pending_vendor_validation',
    'pending'
  )

  const { data: processed, error: rpcError } = await admin.rpc('process_watchdog_single_booking', {
    p_booking_id: bookingId,
  })
  if (rpcError) return { error: rpcError.message }

  const row = (processed ?? [])[0] as
    | { booking_id: string; action_type: string }
    | undefined

  if (!row) return { success: true, action: 'none' }

  if (row.action_type === 'no_response_reassigned') {
    await triggerVendorNotificationsAdmin(admin, [bookingId])
  } else if (row.action_type === 'no_response_exhausted') {
    const { data: clientProfile } = await admin
      .from('profiles')
      .select('email, first_name')
      .eq('id', booking.client_id)
      .single()
    const resendKey = process.env.RESEND_API_KEY
    const from = process.env.RESEND_FROM_EMAIL
    const base = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
    if (resendKey && from && clientProfile?.email) {
      const resend = new Resend(resendKey)
      await resend.emails.send({
        from,
        to: [clientProfile.email],
        subject: 'Alerte Urgente IA - action requise sur votre scene',
        html: `<p>Bonjour ${clientProfile.first_name || ''},</p>
               <p>Le dernier backup a aussi refuse votre demande.</p>
               <p>Rouvrez votre configurateur ou augmentez votre budget pour debloquer de nouvelles options.</p>
               <p><a href="${base}/onboarding">Reouvrir le configurateur</a></p>`,
      })
    }
  }

  revalidatePath('/dashboard')
  revalidatePath('/dashboard/provider')
  return { success: true, action: row.action_type }
}
