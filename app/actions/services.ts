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
  imageUrls?: string[]
}) {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return { error: 'Non authentifié' }
  }

  // Calculer price_start (le prix de départ = le plus petit prix disponible)
  const priceStart = formData.price_fixed 
    ? formData.price_fixed 
    : formData.price_per_day 
    ? formData.price_per_day 
    : formData.price_per_hour 
    ? formData.price_per_hour 
    : null

  // Créer le service avec UNIQUEMENT les colonnes confirmées
  const { data, error } = await supabase
    .from('services')
    .insert({
      provider_id: user.id,
      title: formData.title,
      description: formData.description,
      category: formData.category,
      city: formData.city,
      price_start: priceStart,
      price_per_hour: formData.price_per_hour || null,
      price_per_day: formData.price_per_day || null,
      price_fixed: formData.price_fixed || null,
      tags: [],
      images: formData.imageUrls || [],
      is_active: true,
    })
    .select()
    .single()

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/dashboard/provider')
  revalidatePath('/dashboard')
  revalidatePath('/')
  return { success: true, service: data }
}

export async function updateService(
  serviceId: string,
  formData: {
    title: string
    description: string
    category: ServiceCategory
    price_per_hour?: number
    price_per_day?: number
    price_fixed?: number
    city: string
    imageUrls?: string[]
  }
) {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return { error: 'Non authentifié' }
  }

  // Vérifier que l'utilisateur est bien le propriétaire du service
  const { data: service, error: serviceError } = await supabase
    .from('services')
    .select('provider_id, images')
    .eq('id', serviceId)
    .single()

  if (serviceError || !service) {
    return { error: 'Service introuvable' }
  }

  if (service.provider_id !== user.id) {
    return { error: 'Vous n\'êtes pas autorisé à modifier ce service' }
  }

  // Calculer price_start
  const priceStart = formData.price_fixed 
    ? formData.price_fixed 
    : formData.price_per_day 
    ? formData.price_per_day 
    : formData.price_per_hour 
    ? formData.price_per_hour 
    : null

  // Préparer les images (remplacer par les nouvelles si fournies)
  const images = formData.imageUrls || service.images || []

  // Limiter les images à 10 maximum (sécurité supplémentaire)
  const limitedImages = images.slice(0, 10)

  // Mettre à jour le service
  const { data, error } = await supabase
    .from('services')
    .update({
      title: formData.title,
      description: formData.description,
      category: formData.category,
      city: formData.city,
      price_start: priceStart,
      price_per_hour: formData.price_per_hour || null,
      price_per_day: formData.price_per_day || null,
      price_fixed: formData.price_fixed || null,
      images: limitedImages,
      updated_at: new Date().toISOString(),
    })
    .eq('id', serviceId)
    .select()
    .single()

  if (error) {
    console.error('Erreur Supabase update:', error)
    return { error: error.message || 'Erreur lors de la mise à jour du service' }
  }

  if (!data) {
    return { error: 'Aucune donnée retournée après la mise à jour' }
  }

  revalidatePath('/dashboard/provider')
  revalidatePath('/dashboard')
  revalidatePath('/')
  revalidatePath(`/service/${serviceId}`)
  return { success: true, service: data }
}

export async function deleteService(serviceId: string) {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return { error: 'Non authentifié' }
  }

  // Vérifier que l'utilisateur est bien le propriétaire du service
  const { data: service, error: serviceError } = await supabase
    .from('services')
    .select('provider_id, images')
    .eq('id', serviceId)
    .single()

  if (serviceError || !service) {
    return { error: 'Service introuvable' }
  }

  if (service.provider_id !== user.id) {
    return { error: 'Vous n\'êtes pas autorisé à supprimer ce service' }
  }

  // Supprimer les images du Storage si elles existent
  if (service.images && service.images.length > 0) {
    for (const imageUrl of service.images) {
      try {
        // Extraire le chemin du fichier depuis l'URL
        const url = new URL(imageUrl)
        const pathParts = url.pathname.split('/')
        const bucketIndex = pathParts.findIndex((part) => part === 'service-images')
        if (bucketIndex !== -1 && bucketIndex < pathParts.length - 1) {
          const filePath = pathParts.slice(bucketIndex + 1).join('/')
          await supabase.storage.from('service-images').remove([filePath])
        }
      } catch (err) {
        // Ignorer les erreurs de suppression d'image (le service sera quand même supprimé)
        console.error('Erreur lors de la suppression de l\'image:', err)
      }
    }
  }

  // Supprimer le service
  const { error: deleteError } = await supabase
    .from('services')
    .delete()
    .eq('id', serviceId)

  if (deleteError) {
    console.error('Erreur Supabase delete:', deleteError)
    return { error: deleteError.message }
  }

  // Revalider tous les chemins concernés
  revalidatePath('/dashboard/provider')
  revalidatePath('/dashboard')
  revalidatePath('/', 'layout')
  
  return { success: true }
}
