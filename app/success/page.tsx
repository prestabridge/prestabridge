import { redirect } from 'next/navigation'
import { finalizeManualHoldAndNotify } from '@/app/actions/payments'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CheckCircle2 } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default async function SuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ payment_intent?: string; pi?: string }>
}) {
  const params = await searchParams
  const paymentIntentId = params.payment_intent ?? params.pi

  if (!paymentIntentId) redirect('/dashboard')

  const result = await finalizeManualHoldAndNotify({ paymentIntentId })
  if (!result.success) redirect('/dashboard')

  return (
    <div className="min-h-screen bg-background p-4 md:p-8 flex items-center justify-center">
      <Card className="w-full max-w-xl glass-gold border-gold/30">
        <CardHeader className="text-center">
          <div className="mx-auto mb-3 h-14 w-14 rounded-full bg-green-500/15 flex items-center justify-center">
            <CheckCircle2 className="h-8 w-8 text-green-500" />
          </div>
          <CardTitle>Empreinte bancaire validée</CardTitle>
          <CardDescription>
            Vos demandes sont passées en attente de validation prestataire.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center text-sm text-muted-foreground">
          <p className="mb-4">Votre scène est enregistrée et les prestataires vont être notifiés.</p>
          <Link href="/dashboard?booking=success">
            <Button className="bg-gold-gradient text-background hover:opacity-90">Aller au dashboard</Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}
