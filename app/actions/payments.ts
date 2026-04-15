'use server'

import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'
import { triggerVendorNotifications } from '@/lib/notifications/vendors'

type SelectedService = {
  id: string
  title: string
  category?: string
  price_fixed: number | null
  price_per_day: number | null
  price_per_hour: number | null
}

function getStripeClient() {
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) throw new Error('STRIPE_SECRET_KEY manquante')
  return new Stripe(key, { apiVersion: '2025-02-24.acacia' })
}

function computeServiceAmount(service: SelectedService) {
  const raw = service.price_fixed ?? service.price_per_day ?? (service.price_per_hour ? service.price_per_hour * 5 : 0)
  return Math.max(0, Math.round(raw * 100))
}

async function tryBookingStatusUpdate(
  supabase: Awaited<ReturnType<typeof createClient>>,
  bookingIds: string[],
  desired: string,
  fallback: string
) {
  const desiredAttempt = await supabase.from('bookings').update({ status: desired }).in('id', bookingIds)
  if (!desiredAttempt.error) return desired

  const fallbackAttempt = await supabase.from('bookings').update({ status: fallback }).in('id', bookingIds)
  if (fallbackAttempt.error) throw new Error(fallbackAttempt.error.message)
  return fallback
}

export async function createManualPaymentIntentForScene(input: {
  projectSpecId: string
  selectedServices: SelectedService[]
  cascadeByCategory?: Record<string, string[]>
}) {
  const supabase = await createClient()
  const stripe = getStripeClient()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) return { error: 'Non authentifié' }
  if (!input.selectedServices.length) return { error: 'Aucun prestataire sélectionné' }

  const serviceIds = input.selectedServices.map((s) => s.id)
  const { data: services, error: servicesError } = await supabase
    .from('services')
    .select('id, provider_id')
    .in('id', serviceIds)

  if (servicesError || !services?.length) return { error: 'Impossible de récupérer les prestataires sélectionnés' }

  const providersByService = new Map(services.map((s) => [s.id, s.provider_id]))
  const amount = input.selectedServices.reduce((acc, s) => acc + computeServiceAmount(s), 0)
  if (amount <= 0) return { error: 'Montant invalide pour le paiement' }

  const paymentIntent = await stripe.paymentIntents.create({
    amount,
    currency: 'eur',
    capture_method: 'manual',
    automatic_payment_methods: { enabled: true },
    metadata: {
      user_id: user.id,
      project_spec_id: input.projectSpecId,
    },
  })

  const bookingRows = input.selectedServices
    .map((service) => {
      const providerId = providersByService.get(service.id)
      if (!providerId) return null
      const serviceAmount = computeServiceAmount(service)
      return {
        client_id: user.id,
        provider_id: providerId,
        service_id: service.id,
        project_spec_id: input.projectSpecId,
        booking_date: new Date().toISOString().slice(0, 10),
        booking_time_start: '10:00:00',
        booking_time_end: '18:00:00',
        duration_hours: 8,
        base_price: serviceAmount / 100,
        additional_fees: 0,
        total_amount: serviceAmount / 100,
        escrow_amount: serviceAmount / 100,
        currency: 'EUR',
        status: 'pending_payment',
        stripe_payment_intent_id: paymentIntent.id,
        cascade_service_ids: service.category && input.cascadeByCategory?.[service.category]
          ? input.cascadeByCategory[service.category]
          : [service.id],
        cascade_position: 0,
        non_responding_provider_ids: [] as string[],
        last_notified_at: null,
      }
    })
    .filter(Boolean)

  if (!bookingRows.length) return { error: 'Aucune réservation valide à créer' }

  const { data: insertedBookings, error: insertError } = await supabase
    .from('bookings')
    .insert(bookingRows as never[])
    .select('id')

  if (insertError) {
    if (insertError.message.includes('column') && insertError.message.includes('does not exist')) {
      const { data: legacyBookings, error: legacyError } = await supabase
        .from('bookings')
        .insert(
          (bookingRows as any[]).map(
            ({
              cascade_service_ids,
              cascade_position,
              non_responding_provider_ids,
              last_notified_at,
              ...rest
            }) => rest
          )
        )
        .select('id')
      if (legacyError) return { error: legacyError.message }
      return {
        success: true,
        paymentIntentId: paymentIntent.id,
        clientSecret: paymentIntent.client_secret,
        bookingIds: legacyBookings?.map((b) => b.id) ?? [],
        amount: paymentIntent.amount,
      }
    }
    if (insertError.message.includes('invalid input value for enum booking_status')) {
      const { data: fallbackBookings, error: fallbackError } = await supabase
        .from('bookings')
        .insert((bookingRows as any[]).map((r) => ({ ...r, status: 'pending' })))
        .select('id')
      if (fallbackError) return { error: fallbackError.message }
      return {
        success: true,
        paymentIntentId: paymentIntent.id,
        clientSecret: paymentIntent.client_secret,
        bookingIds: fallbackBookings?.map((b) => b.id) ?? [],
        amount: paymentIntent.amount,
      }
    }
    return { error: insertError.message }
  }

  return {
    success: true,
    paymentIntentId: paymentIntent.id,
    clientSecret: paymentIntent.client_secret,
    bookingIds: insertedBookings?.map((b) => b.id) ?? [],
    amount: paymentIntent.amount,
  }
}

export async function finalizeManualHoldAndNotify(input: { paymentIntentId: string }) {
  const supabase = await createClient()
  const stripe = getStripeClient()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()
  if (userError || !user) return { error: 'Non authentifié' }

  const paymentIntent = await stripe.paymentIntents.retrieve(input.paymentIntentId)
  if (!paymentIntent || paymentIntent.metadata.user_id !== user.id) {
    return { error: 'Paiement introuvable ou non autorisé' }
  }

  if (paymentIntent.status !== 'requires_capture') {
    const { data: alreadyDone } = await supabase
      .from('bookings')
      .select('id')
      .eq('stripe_payment_intent_id', input.paymentIntentId)
      .eq('client_id', user.id)
      .in('status', ['pending_vendor_validation', 'validated', 'accepted'])

    if (alreadyDone && alreadyDone.length > 0) {
      return { success: true, bookingIds: alreadyDone.map((b) => b.id), appliedStatus: 'already_processed' }
    }

    return { error: `Statut paiement invalide: ${paymentIntent.status}` }
  }

  const { data: bookings, error: bookingsError } = await supabase
    .from('bookings')
    .select('id, status')
    .eq('stripe_payment_intent_id', input.paymentIntentId)
    .eq('client_id', user.id)

  if (bookingsError || !bookings?.length) return { error: 'Réservations liées au paiement introuvables' }

  const pendingBookings = bookings.filter((b: { status: string }) => b.status === 'pending_payment' || b.status === 'pending')
  if (pendingBookings.length === 0) {
    return { success: true, bookingIds: bookings.map((b) => b.id), appliedStatus: 'already_processed' }
  }

  const pendingIds = pendingBookings.map((b) => b.id)
  const appliedStatus = await tryBookingStatusUpdate(supabase, pendingIds, 'pending_vendor_validation', 'validated')
  await triggerVendorNotifications(pendingIds)
  await supabase
    .from('bookings')
    .update({ last_notified_at: new Date().toISOString() })
    .in('id', pendingIds)

  return { success: true, bookingIds: pendingIds, appliedStatus }
}

export async function getCheckoutSummary(paymentIntentId: string) {
  const supabase = await createClient()
  const stripe = getStripeClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié' }

  const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId)
  if (!paymentIntent || paymentIntent.metadata.user_id !== user.id) {
    return { error: 'Paiement introuvable ou non autorisé' }
  }

  const { data: bookings } = await supabase
    .from('bookings')
    .select('id, service_id, total_amount, status, services(title)')
    .eq('stripe_payment_intent_id', paymentIntentId)
    .eq('client_id', user.id)

  return {
    success: true,
    amount: paymentIntent.amount,
    currency: paymentIntent.currency,
    clientSecret: paymentIntent.client_secret,
    paymentIntentId: paymentIntent.id,
    bookings: bookings ?? [],
  }
}

export async function finalizePaymentCapture(input: { bookingId: string }) {
  const supabase = await createClient()
  const stripe = getStripeClient()

  const { data: booking, error } = await supabase
    .from('bookings')
    .select('id, stripe_payment_intent_id, total_amount')
    .eq('id', input.bookingId)
    .single()

  if (error || !booking?.stripe_payment_intent_id) {
    return { error: 'Booking ou PaymentIntent introuvable' }
  }

  const paymentIntent = await stripe.paymentIntents.retrieve(booking.stripe_payment_intent_id)
  if (!paymentIntent) return { error: 'PaymentIntent introuvable' }

  if (paymentIntent.status === 'succeeded') {
    return { success: true, status: paymentIntent.status, alreadyCaptured: true }
  }

  if (paymentIntent.status !== 'requires_capture') {
    return { error: `Capture impossible, statut actuel: ${paymentIntent.status}` }
  }

  const amountToCapture = Math.max(0, Math.round(Number(booking.total_amount || 0) * 100))
  if (amountToCapture <= 0) return { error: 'Montant de capture invalide' }

  const capturable = paymentIntent.amount_capturable ?? 0
  const finalAmount = Math.min(capturable, amountToCapture)
  if (finalAmount <= 0) {
    return { error: 'Aucun montant capturable restant sur ce PaymentIntent' }
  }

  const captured = await stripe.paymentIntents.capture(paymentIntent.id, {
    amount_to_capture: finalAmount,
  })

  return {
    success: true,
    status: captured.status,
    capturedAmount: finalAmount,
    paymentIntentId: captured.id,
  }
}
