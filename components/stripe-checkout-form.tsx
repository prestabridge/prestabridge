'use client'

import { useState } from 'react'
import { PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js'
import { Button } from '@/components/ui/button'

export function StripeCheckoutForm({ paymentIntentId }: { paymentIntentId: string }) {
  const stripe = useStripe()
  const elements = useElements()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!stripe || !elements) return

    setIsSubmitting(true)
    setError(null)

    const { error: submitError } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/success?pi=${encodeURIComponent(paymentIntentId)}`,
      },
    })

    if (submitError) {
      setError(submitError.message ?? 'Paiement impossible')
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement />
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button
        type="submit"
        disabled={!stripe || !elements || isSubmitting}
        className="w-full bg-gold-gradient text-background hover:opacity-90"
      >
        {isSubmitting ? "Validation de l'empreinte..." : "Bloquer le montant et continuer"}
      </Button>
    </form>
  )
}
