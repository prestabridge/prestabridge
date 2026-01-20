'use client'

import { useState } from 'react'
import { updateBookingStatus } from '@/app/actions/bookings'
import { Button } from '@/components/ui/button'
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface BookingActionsProps {
  bookingId: string
}

export function BookingActions({ bookingId }: BookingActionsProps) {
  const router = useRouter()
  const [loading, setLoading] = useState<'accept' | 'reject' | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleAction = async (status: 'accepted' | 'rejected') => {
    setLoading(status)
    setError(null)

    try {
      const result = await updateBookingStatus(bookingId, status)

      if (result.error) {
        setError(result.error)
        setLoading(null)
      } else {
        // Rafraîchir la page pour voir le nouveau statut
        // Utiliser router.push pour forcer un rechargement complet
        router.push('/dashboard')
      }
    } catch (err) {
      console.error('Erreur lors de la mise à jour:', err)
      setError('Une erreur est survenue')
      setLoading(null)
    }
  }

  return (
    <div className="flex flex-col sm:flex-row gap-2">
      {error && (
        <div className="col-span-2 p-2 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs">
          {error}
        </div>
      )}
      <Button
        onClick={() => handleAction('accepted')}
        disabled={loading !== null}
        className="bg-green-600 hover:bg-green-700 text-white"
        size="sm"
      >
        {loading === 'accept' ? (
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        ) : (
          <CheckCircle2 className="h-4 w-4 mr-2" />
        )}
        Accepter
      </Button>
      <Button
        onClick={() => handleAction('rejected')}
        disabled={loading !== null}
        variant="destructive"
        size="sm"
      >
        {loading === 'reject' ? (
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        ) : (
          <XCircle className="h-4 w-4 mr-2" />
        )}
        Refuser
      </Button>
    </div>
  )
}
