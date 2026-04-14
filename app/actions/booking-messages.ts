'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { sanitizeMessage } from '@/lib/utils/safe-chat'

type BookingMessagePayload = {
  bookingId: string
  content: string
}

async function getAuthorizedBooking(bookingId: string) {
  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) return { error: 'Non authentifié' as const }

  const { data: booking, error } = await supabase
    .from('bookings')
    .select('id, client_id, provider_id, status')
    .eq('id', bookingId)
    .single()

  if (error || !booking) return { error: 'Booking introuvable' as const }
  if (booking.client_id !== user.id && booking.provider_id !== user.id) {
    return { error: 'Accès non autorisé' as const }
  }

  return { supabase, userId: user.id, booking }
}

export async function getBookingMessages(bookingId: string) {
  const access = await getAuthorizedBooking(bookingId)
  if ('error' in access) return { error: access.error }

  const { supabase, booking, userId } = access

  const { data: messages, error } = await supabase
    .from('booking_messages')
    .select('id, booking_id, sender_id, receiver_id, content, created_at, is_read')
    .eq('booking_id', bookingId)
    .order('created_at', { ascending: true })

  if (error) return { error: error.message }

  return {
    success: true,
    booking,
    currentUserId: userId,
    messages: messages ?? [],
  }
}

export async function sendBookingMessage(payload: BookingMessagePayload) {
  const content = payload.content?.trim()
  if (!content) return { error: 'Message vide' }

  const access = await getAuthorizedBooking(payload.bookingId)
  if ('error' in access) return { error: access.error }

  const { supabase, booking, userId } = access
  const receiverId = userId === booking.client_id ? booking.provider_id : booking.client_id
  const safeContent = sanitizeMessage(content, booking.status)

  const { error } = await supabase.from('booking_messages').insert({
    booking_id: booking.id,
    sender_id: userId,
    receiver_id: receiverId,
    content: safeContent,
    is_read: false,
  })

  if (error) return { error: error.message }

  revalidatePath(`/dashboard/bookings/${booking.id}/chat`)
  return { success: true }
}

export async function markBookingMessagesAsRead(bookingId: string) {
  const access = await getAuthorizedBooking(bookingId)
  if ('error' in access) return { error: access.error }

  const { supabase, userId } = access
  const { error } = await supabase
    .from('booking_messages')
    .update({ is_read: true })
    .eq('booking_id', bookingId)
    .eq('receiver_id', userId)
    .eq('is_read', false)

  if (error) return { error: error.message }
  return { success: true }
}
