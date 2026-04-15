import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createAdminClient } from '@/lib/supabase/admin'
import { triggerVendorNotificationsAdmin } from '@/lib/notifications/vendors-admin'

export const runtime = 'nodejs'

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) throw new Error('STRIPE_SECRET_KEY manquante')
  return new Stripe(key, { apiVersion: '2025-02-24.acacia' })
}

async function transitionBookings(
  paymentIntentId: string,
  fromStatus: string,
  toStatus: string,
  fallbackTo?: string
) {
  const admin = createAdminClient()

  const { data: bookings } = await admin
    .from('bookings')
    .select('id')
    .eq('stripe_payment_intent_id', paymentIntentId)
    .eq('status', fromStatus)

  if (!bookings?.length) return { updated: 0, bookingIds: [] }

  const ids = bookings.map((b: { id: string }) => b.id)

  const { error } = await admin
    .from('bookings')
    .update({ status: toStatus })
    .in('id', ids)

  if (error && fallbackTo) {
    await admin.from('bookings').update({ status: fallbackTo }).in('id', ids)
  }

  return { updated: ids.length, bookingIds: ids }
}

export async function POST(request: NextRequest) {
  const stripe = getStripe()
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

  if (!webhookSecret) {
    console.error('STRIPE_WEBHOOK_SECRET manquante')
    return NextResponse.json({ error: 'Configuration serveur incomplète' }, { status: 500 })
  }

  const body = await request.text()
  const signature = request.headers.get('stripe-signature')

  if (!signature) {
    return NextResponse.json({ error: 'Signature manquante' }, { status: 400 })
  }

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Signature invalide'
    console.error('WEBHOOK STRIPE - Vérification signature échouée:', message)
    return NextResponse.json({ error: message }, { status: 400 })
  }

  try {
    const admin = createAdminClient()

    const { data: existing } = await admin
      .from('booking_watchdog_events')
      .select('id')
      .eq('event_type', event.id)
      .limit(1)

    if (existing && existing.length > 0) {
      console.log(`[WEBHOOK] Événement ${event.id} déjà traité, skip`)
      return NextResponse.json({ received: true, skipped: true }, { status: 200 })
    }

    await admin.from('booking_watchdog_events').insert({
      event_type: event.id,
      booking_id: (event.data.object as { id: string }).id,
      action_type: event.type,
    } as never)

    switch (event.type) {
      case 'payment_intent.amount_capturable_updated': {
        const pi = event.data.object as Stripe.PaymentIntent

        if (pi.status !== 'requires_capture') break

        console.log(`[WEBHOOK] amount_capturable_updated: ${pi.id} — montant capturable: ${pi.amount_capturable}`)

        const { bookingIds } = await transitionBookings(
          pi.id,
          'pending_payment',
          'pending_vendor_validation',
          'pending'
        )

        if (bookingIds.length > 0) {
          await triggerVendorNotificationsAdmin(admin, bookingIds)
          await admin
            .from('bookings')
            .update({ last_notified_at: new Date().toISOString() })
            .in('id', bookingIds)

          console.log(`[WEBHOOK] ${bookingIds.length} booking(s) passé(s) en pending_vendor_validation, prestataires notifiés`)
        }

        break
      }

      case 'payment_intent.payment_failed': {
        const pi = event.data.object as Stripe.PaymentIntent

        console.log(`[WEBHOOK] payment_failed: ${pi.id} — raison: ${pi.last_payment_error?.message ?? 'inconnue'}`)

        const { updated } = await transitionBookings(
          pi.id,
          'pending_payment',
          'cancelled',
          'cancelled'
        )

        if (updated > 0) {
          console.log(`[WEBHOOK] ${updated} booking(s) annulé(s) suite à échec de paiement`)
        }

        break
      }

      case 'payment_intent.canceled': {
        const pi = event.data.object as Stripe.PaymentIntent

        console.log(`[WEBHOOK] canceled: ${pi.id}`)

        await transitionBookings(pi.id, 'pending_payment', 'cancelled', 'cancelled')
        await transitionBookings(pi.id, 'pending_vendor_validation', 'cancelled', 'cancelled')

        break
      }

      default:
        break
    }
  } catch (err) {
    console.error(`WEBHOOK STRIPE - Erreur traitement ${event.type}:`, err)
    return NextResponse.json({ error: 'Erreur interne' }, { status: 500 })
  }

  return NextResponse.json({ received: true }, { status: 200 })
}
