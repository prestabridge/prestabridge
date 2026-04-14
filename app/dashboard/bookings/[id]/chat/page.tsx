import { redirect } from 'next/navigation'
import { RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { getBookingMessages, markBookingMessagesAsRead } from '@/app/actions/booking-messages'
import { BookingChatComposer } from '@/components/booking-chat-composer'
import Link from 'next/link'

function bookingStatusLabel(status: string) {
  if (status === 'accepted') return 'Accepté'
  if (status === 'pending_vendor_validation') return 'En attente de validation'
  if (status === 'pending') return 'En attente de validation'
  return status
}

export default async function BookingChatPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const data = await getBookingMessages(id)

  if (data.error || !data.booking) {
    redirect('/dashboard')
  }

  await markBookingMessagesAsRead(id)

  const status = data.booking.status
  const currentUserId = data.currentUserId
  const messages = data.messages ?? []

  return (
    <div className="min-h-screen bg-background p-0 md:p-6">
      <div className="mx-auto max-w-4xl h-screen md:h-[calc(100vh-3rem)] flex flex-col glass-gold border-gold/30 md:rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-gold/20 bg-background/90 backdrop-blur flex items-center justify-between">
          <div>
            <h1 className="text-lg md:text-xl font-serif font-semibold">Safe-Chat Réservation</h1>
            <p className="text-xs md:text-sm text-muted-foreground">
              Statut : <span className="text-gold">{bookingStatusLabel(status)}</span>
            </p>
          </div>
          <Link href={`/dashboard/bookings/${id}/chat`}>
            <Button variant="outline" size="sm" className="border-gold/30">
              <RefreshCw className="h-4 w-4 mr-2" />
              Rafraîchir
            </Button>
          </Link>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-12">
              Aucun message pour le moment. Lancez la conversation.
            </p>
          ) : (
            messages.map((m: any) => {
              const mine = m.sender_id === currentUserId
              return (
                <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[85%] md:max-w-[70%] rounded-2xl px-4 py-3 text-sm shadow-sm ${
                      mine
                        ? 'bg-gold-gradient text-background'
                        : 'bg-secondary border border-gold/20 text-foreground'
                    }`}
                  >
                    <p className="whitespace-pre-wrap break-words">{m.content}</p>
                    <p className={`mt-1 text-[10px] ${mine ? 'text-background/80' : 'text-muted-foreground'}`}>
                      {new Date(m.created_at).toLocaleString('fr-FR')}
                    </p>
                  </div>
                </div>
              )
            })
          )}
        </div>

        <BookingChatComposer bookingId={id} />
      </div>
    </div>
  )
}
