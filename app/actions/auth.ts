'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function signIn(email: string, password: string) {
  const supabase = await createClient()

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/', 'layout')
  return { success: true }
}

export async function signUp(email: string, password: string) {
  const supabase = await createClient()

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/callback`,
    },
  })

  if (error) {
    return { error: error.message }
  }

  return { success: true }
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect('/login')
}

export async function updateUserRole(role: 'client' | 'provider', providerType?: string) {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return { error: 'Non authentifié' }
  }

  const updateData: { role: string; provider_type?: string } = { role }

  if (role === 'provider' && providerType) {
    updateData.provider_type = providerType
  }

  // Mettre à jour le profil dans la table profiles
  const { error: updateError } = await supabase
    .from('profiles')
    .update(updateData)
    .eq('id', user.id)

  if (updateError) {
    console.error('Erreur lors de la mise à jour du rôle:', updateError)
    return { error: updateError.message }
  }

  // Vérifier que la mise à jour a bien été effectuée en relisant le profil
  const { data: updatedProfile, error: verifyError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (verifyError || !updatedProfile) {
    console.error('Erreur lors de la vérification du rôle:', verifyError)
    return { error: 'Erreur lors de la vérification de la mise à jour' }
  }

  if (updatedProfile.role !== role) {
    console.error('Le rôle n\'a pas été correctement mis à jour. Attendu:', role, 'Trouvé:', updatedProfile.role)
    return { error: 'Le rôle n\'a pas été correctement mis à jour' }
  }

  revalidatePath('/', 'layout')
  return { success: true }
}

export async function getUserProfile() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { profile: null }
  }

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (error) {
    return { profile: null, error: error.message }
  }

  return { profile }
}
