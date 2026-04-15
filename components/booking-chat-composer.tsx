'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { sendBookingMessage } from '@/app/actions/booking-messages'

export function BookingChatComposer({ bookingId }: { bookingId: string }) {
  const router = useRouter()
  const [message, setMessage] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  const onSend = () => {
    if (!message.trim()) return
    setError(null)

    startTransition(async () => {
      const res = await sendBookingMessage({ bookingId, content: message })
      if (res.error) {
        setError(res.error)
        return
      }
      setMessage('')
      router.refresh()
    })
  }

  return (
    <div className="border-t border-gold/20 p-3 md:p-4 bg-background/80 backdrop-blur">
      <div className="flex items-start gap-2">
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Écrivez votre message..."
          className="flex-1 min-h-[44px] max-h-32 rounded-xl border border-gold/20 bg-secondary px-3 py-2 text-base md:text-sm outline-none focus:border-gold resize-y"
        />
        <Button
          onClick={onSend}
          disabled={pending || !message.trim()}
          className="h-11 px-5 bg-gold-gradient text-background hover:opacity-90"
        >
          {pending ? '...' : 'Envoyer'}
        </Button>
      </div>
      {error && <p className="text-xs text-destructive mt-2">{error}</p>}
    </div>
  )
}
