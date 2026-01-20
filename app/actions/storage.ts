'use server'

import { createClient } from '@/lib/supabase/server'

export async function uploadServiceImage(formData: FormData) {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return { error: 'Non authentifié' }
  }

  const file = formData.get('file') as File | null

  if (!file) {
    return { error: 'Aucun fichier fourni' }
  }

  // Vérifier le type de fichier
  if (!file.type.startsWith('image/')) {
    return { error: 'Le fichier doit être une image' }
  }

  // Vérifier la taille (max 5MB)
  const maxSize = 5 * 1024 * 1024 // 5MB
  if (file.size > maxSize) {
    return { error: 'Le fichier est trop volumineux (max 5MB)' }
  }

  // Nettoyer le nom de fichier (enlever accents, espaces, caractères spéciaux)
  const cleanFileName = (name: string): string => {
    // Enlever l'extension
    const ext = name.split('.').pop() || ''
    const nameWithoutExt = name.substring(0, name.lastIndexOf('.')) || name
    
    // Normaliser et nettoyer
    return nameWithoutExt
      .normalize('NFD') // Décompose les caractères accentués
      .replace(/[\u0300-\u036f]/g, '') // Enlève les accents
      .replace(/[^a-zA-Z0-9_-]/g, '_') // Remplace les caractères spéciaux par _
      .replace(/_+/g, '_') // Remplace les multiples _ par un seul
      .replace(/^_|_$/g, '') // Enlève les _ au début et à la fin
      .toLowerCase()
      .substring(0, 50) // Limite la longueur
  }

  // Générer un nom de fichier unique et propre
  const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg'
  const cleanName = cleanFileName(file.name) || 'image'
  const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(7)}-${cleanName}.${fileExt}`
  const filePath = fileName

  // Convertir le File en Buffer pour l'upload (côté serveur Node.js)
  const arrayBuffer = await file.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)

  // Upload vers Supabase Storage
  const { data, error } = await supabase.storage
    .from('service-images')
    .upload(filePath, buffer, {
      contentType: file.type,
      upsert: false,
    })

  if (error) {
    console.error('Erreur upload:', error)
    return { error: error.message || 'Erreur lors de l\'upload de l\'image' }
  }

  // Récupérer l'URL publique
  const {
    data: { publicUrl },
  } = supabase.storage.from('service-images').getPublicUrl(data.path)

  return { success: true, url: publicUrl, path: data.path }
}

export async function uploadMultipleServiceImages(formData: FormData) {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return { error: 'Non authentifié' }
  }

  const files = formData.getAll('files') as File[]

  if (!files || files.length === 0) {
    return { error: 'Aucun fichier fourni' }
  }

  const maxSize = 5 * 1024 * 1024 // 5MB
  const uploadedUrls: string[] = []
  const errors: string[] = []

  for (const file of files) {
    // Vérifier le type de fichier
    if (!file.type.startsWith('image/')) {
      errors.push(`${file.name}: Le fichier doit être une image`)
      continue
    }

    // Vérifier la taille
    if (file.size > maxSize) {
      errors.push(`${file.name}: Fichier trop volumineux (max 5MB)`)
      continue
    }

      try {
        // Nettoyer le nom de fichier
        const cleanFileName = (name: string): string => {
          const ext = name.split('.').pop() || ''
          const nameWithoutExt = name.substring(0, name.lastIndexOf('.')) || name
          return nameWithoutExt
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-zA-Z0-9_-]/g, '_')
            .replace(/_+/g, '_')
            .replace(/^_|_$/g, '')
            .toLowerCase()
            .substring(0, 50)
        }

        // Générer un nom de fichier unique et propre
        const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg'
        const cleanName = cleanFileName(file.name) || 'image'
        const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(7)}-${cleanName}.${fileExt}`
        const filePath = fileName

      // Convertir le File en Buffer
      const arrayBuffer = await file.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)

      // Upload vers Supabase Storage
      const { data, error } = await supabase.storage
        .from('service-images')
        .upload(filePath, buffer, {
          contentType: file.type,
          upsert: false,
        })

      if (error) {
        errors.push(`${file.name}: ${error.message}`)
        continue
      }

      // Récupérer l'URL publique
      const {
        data: { publicUrl },
      } = supabase.storage.from('service-images').getPublicUrl(data.path)

      uploadedUrls.push(publicUrl)
    } catch (err) {
      errors.push(`${file.name}: Erreur lors de l'upload`)
    }
  }

  if (uploadedUrls.length === 0) {
    return { error: errors.join(', ') || 'Aucune image n\'a pu être uploadée' }
  }

  return {
    success: true,
    urls: uploadedUrls,
    errors: errors.length > 0 ? errors : undefined,
  }
}
