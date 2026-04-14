import { redirect } from 'next/navigation'
import { getCheckoutSummary } from '@/app/actions/payments'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { StripeCheckoutElements } from '@/components/stripe-checkout-elements'

export default async function CheckoutPage({
  searchParams,
}: {
  searchParams: Promise<{ pi?: string }>
}) {
  const params = await searchParams
  const paymentIntentId = params.pi

  if (!paymentIntentId) redirect('/dashboard')

  const summary = await getCheckoutSummary(paymentIntentId)
  if (!summary.success || !summary.clientSecret) redirect('/dashboard')

  const amountInEur = (summary.amount / 100).toFixed(2)

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-4xl mx-auto grid gap-6 md:grid-cols-2">
        <Card className="glass-gold border-gold/30">
          <CardHeader>
            <CardTitle>Récapitulatif de blocage</CardTitle>
            <CardDescription>
              Empreinte bancaire uniquement - aucun débit immédiat.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-xl border border-gold/20 p-4">
              <p className="text-sm text-muted-foreground">Montant total bloqué</p>
              <p className="text-3xl font-bold">{amountInEur} EUR</p>
            </div>
            <div className="space-y-2">
              {(summary.bookings ?? []).map((booking: any) => (
                <div key={booking.id} className="flex items-center justify-between text-sm">
                  <span>{booking.services?.title ?? 'Service'}</span>
                  <span>{Number(booking.total_amount ?? 0).toFixed(2)} EUR</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="glass-gold border-gold/30">
          <CardHeader>
            <CardTitle>Paiement sécurisé Stripe</CardTitle>
            <CardDescription>
              Entrez votre carte pour autoriser le montant ({amountInEur} EUR).
            </CardDescription>
          </CardHeader>
          <CardContent>
            <StripeCheckoutElements clientSecret={summary.clientSecret} paymentIntentId={summary.paymentIntentId} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
