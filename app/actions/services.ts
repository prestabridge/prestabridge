'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { ServiceCategory } from '@/src/types/supabase'

export async function createService(formData: {
  title: string
  description: string
  category: ServiceCategory
  price_per_hour?: number
  price_per_day?: number
  price_fixed?: number
  city: string
}) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Non authentifié' }
  }

  // Vérifier que l'utilisateur est un prestataire
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, city')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'provider') {
    return { error: 'Vous devez être un prestataire pour créer un service' }
  }

  // Mettre à jour la ville du profil si fournie
  if (formData.city && formData.city !== profile.city) {
    await supabase
      .from('profiles')
      .update({ city: formData.city })
      .eq('id', user.id)
  }

  // Créer le service
  const { data, error } = await supabase
    .from('services')
    .insert({
      provider_id: user.id,
      title: formData.title,
      description: formData.description,
      category: formData.category,
      price_per_hour: formData.price_per_hour || null,
      price_per_day: formData.price_per_day || null,
      price_fixed: formData.price_fixed || null,
      technical_specs: {},
      tags: [],
      images: [],
      is_active: true,
    })
    .select()
    .single()

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/dashboard/provider')
  return { success: true, service: data }
}
