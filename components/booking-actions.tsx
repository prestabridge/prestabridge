'use client'

import { useState } from 'react'
import { providerAcceptBooking, providerDeclineBooking } from '@/app/actions/vendor-booking'
import { Button } from '@/components/ui/button'
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface BookingActionsProps {
  bookingId: string
}

export function BookingActions({ bookingId }: BookingActionsProps) {
  const router = useRouter()
  const [loading, setLoading] = useState<'accept' | 'decline' | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleAccept = async () => {
    setLoading('accept')
    setError(null)
    try {
      const result = await providerAcceptBooking(bookingId)
      if (result.error) {
        setError(result.error)
        setLoading(null)
      } else {
        router.push('/dashboard?booking=accepted')
      }
    } catch {
      setError('Une erreur est survenue')
      setLoading(null)
    }
  }

  const handleDecline = async () => {
    setLoading('decline')
    setError(null)
    try {
      const result = await providerDeclineBooking(bookingId)
      if (result.error) {
        setError(result.error)
        setLoading(null)
      } else {
        router.push('/dashboard?booking=declined')
      }
    } catch {
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
        onClick={handleAccept}
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
        onClick={handleDecline}
        disabled={loading !== null}
        variant="destructive"
        size="sm"
      >
        {loading === 'decline' ? (
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        ) : (
          <XCircle className="h-4 w-4 mr-2" />
        )}
        Refuser
      </Button>
    </div>
  )
}
