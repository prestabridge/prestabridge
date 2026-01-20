'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createBooking(formData: {
  service_id: string
  booking_date: string
  client_message?: string
}) {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return { error: 'Non authentifié' }
  }

  // Récupérer le service pour obtenir le provider_id
  const { data: service, error: serviceError } = await supabase
    .from('services')
    .select('id, provider_id')
    .eq('id', formData.service_id)
    .single()

  if (serviceError || !service) {
    return { error: 'Service introuvable' }
  }

  // Essayer d'abord avec la version simplifiée (colonnes: date, message, status)
  // Si ça échoue, utiliser la version complète du schéma
  let data, error

  // Tentative 1 : Version simplifiée
  const { data: simpleData, error: simpleError } = await supabase
    .from('bookings')
    .insert({
      service_id: formData.service_id,
      client_id: user.id,
      provider_id: service.provider_id,
      date: formData.booking_date,
      message: formData.client_message || null,
      status: 'pending',
    })
    .select()
    .single()

  if (!simpleError) {
    // Version simplifiée fonctionne
    data = simpleData
  } else if (simpleError.code === '42703') {
    // Colonne "date" n'existe pas, utiliser "booking_date" (version complète)
    const { data: fullData, error: fullError } = await supabase
      .from('bookings')
      .insert({
        client_id: user.id,
        provider_id: service.provider_id,
        service_id: formData.service_id,
        booking_date: formData.booking_date,
        booking_time_start: '10:00:00',
        booking_time_end: '18:00:00',
        duration_hours: 8,
        base_price: 0,
        additional_fees: 0,
        total_amount: 0,
        escrow_amount: 0,
        currency: 'EUR',
        status: 'pending',
        client_message: formData.client_message || null,
      })
      .select()
      .single()

    if (fullError) {
      return { error: fullError.message }
    }
    data = fullData
  } else {
    return { error: simpleError.message }
  }

  revalidatePath('/dashboard')
  return { success: true, booking: data }
}

export async function updateBookingStatus(bookingId: string, status: 'accepted' | 'rejected') {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return { error: 'Non authentifié' }
  }

  // Vérifier que l'utilisateur est bien le prestataire de cette réservation
  const { data: booking, error: bookingError } = await supabase
    .from('bookings')
    .select('provider_id, status')
    .eq('id', bookingId)
    .single()

  if (bookingError || !booking) {
    return { error: 'Réservation introuvable' }
  }

  if (booking.provider_id !== user.id) {
    return { error: 'Vous n\'êtes pas autorisé à modifier cette réservation' }
  }

  // Vérifier que le statut actuel est 'pending'
  if (booking.status !== 'pending') {
    return { error: 'Cette réservation ne peut plus être modifiée' }
  }

  // Mettre à jour le statut
  // Gérer les deux versions possibles de la table
  const updateData: any = { status }

  // Mettre à jour le statut (fonctionne pour les deux versions)
  const { error: updateError } = await supabase
    .from('bookings')
    .update(updateData)
    .eq('id', bookingId)

  if (updateError) {
    console.error('Erreur lors de la mise à jour:', updateError)
    return { error: updateError.message || 'Erreur lors de la mise à jour du statut' }
  }

  // Revalider les chemins pour rafraîchir la page immédiatement
  revalidatePath('/dashboard/provider')
  revalidatePath('/dashboard')
  revalidatePath('/', 'layout') // Revalider aussi le layout pour forcer le refresh
  
  return { success: true }
}
