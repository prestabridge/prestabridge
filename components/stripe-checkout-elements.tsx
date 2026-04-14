'use client'

import { Elements } from '@stripe/react-stripe-js'
import { loadStripe } from '@stripe/stripe-js'
import { StripeCheckoutForm } from '@/components/stripe-checkout-form'

const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
const stripePromise = publishableKey ? loadStripe(publishableKey) : null

export function StripeCheckoutElements({
  clientSecret,
  paymentIntentId,
}: {
  clientSecret: string
  paymentIntentId: string
}) {
  if (!stripePromise) {
    return <p className="text-sm text-destructive">NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY manquante.</p>
  }

  return (
    <Elements stripe={stripePromise} options={{ clientSecret }}>
      <StripeCheckoutForm paymentIntentId={paymentIntentId} />
    </Elements>
  )
}
