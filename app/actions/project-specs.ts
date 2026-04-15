'use server'

import { createClient } from '@/lib/supabase/server'
import { Database } from '@/src/types/supabase'
type ServiceCategory = Database['public']['Enums']['service_category']
type EventType = Database['public']['Enums']['event_type']
type EventObjective = Database['public']['Enums']['event_objective']
type MusicVibe = Database['public']['Enums']['music_vibe']

export async function generateProjectDraft(formData: {
  budget_global: number
  event_date: string
  event_type: EventType
  event_objective: EventObjective
  audience: 'public' | 'private' | null
  ambiance: MusicVibe | null
  lieu: 'interieur' | 'plein-air' | 'hangar' | null
  restrictions: string[]
  mood_tags?: string[]
}) {
  const supabase = await createClient()
  try {
    const parsedDate = new Date(formData.event_date)
    if (!Number.isFinite(formData.budget_global) || formData.budget_global <= 0) {
      return { error: 'Le budget global doit être un nombre valide supérieur à 0.' }
    }
    if (!formData.event_date || Number.isNaN(parsedDate.getTime())) {
      return { error: "La date de l'événement est invalide." }
    }

    // Vérification de l'authentification
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      if (authError) {
        console.error('ERREUR SUPABASE:', authError)
      }
      return { error: "Vous devez être connecté pour utiliser le configurateur." }
    }

    // Vérification du profil lié (FK project_specs.user_id -> profiles.id)
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', user.id)
      .maybeSingle()

    if (profileError) {
      console.error('ERREUR SUPABASE:', profileError)
      return { error: profileError.message ?? 'Erreur de vérification du profil.' }
    }
    if (!profile) {
      return {
        error:
          'Profil introuvable pour cet utilisateur. Veuillez finaliser votre onboarding.',
      }
    }

    // 1. SAUVEGARDE DES CONTRAINTES DANS `project_specs`
    const restrictionFlags = {
      dietary_restrictions: formData.restrictions.includes('alimentaire'),
      pmr_access: formData.restrictions.includes('pmr'),
      acoustic_constraints: formData.restrictions.includes('acoustique'),
    }

    const specData: Record<string, unknown> = {
      user_id: user.id,
      budget_global: Number(formData.budget_global),
      event_date: formData.event_date,
      event_type: formData.event_type,
      event_objective: formData.event_objective,
      is_public: formData.audience === 'public',
      music_vibe: formData.ambiance,
      venue_outdoor: formData.lieu === 'plein-air',
      ai_extracted_tags: formData.mood_tags?.slice(0, 5) ?? [],
      is_completed: true,
      ...restrictionFlags,
    }

    const { data: spec, error: specError } = await supabase
      .from('project_specs')
      .insert(specData as never)
      .select()
      .single()

    if (specError) {
      console.error('ERREUR SUPABASE:', specError)
      return {
        error: specError.message ?? 'Erreur Supabase lors de la sauvegarde du projet.',
      }
    }

    // 2. CRÉATION DU BROUILLON "INVISIBLE" (Matching Cascade)
  // Détermination des catégories requises selon les règles métier du Masterfile
    const requiredCategories: ServiceCategory[] = []
  
  // Règle Lieu
    if (formData.lieu === 'plein-air') requiredCategories.push('plein_air')
    else if (formData.lieu === 'hangar') requiredCategories.push('hangar')
    else requiredCategories.push('salle')

  // Règle Sécurité (Imposé si public)
    if (formData.audience === 'public') requiredCategories.push('ssiap')

  // Règle Ambiance
    if (formData.ambiance === 'spectacle' || formData.ambiance === 'dansant') {
      requiredCategories.push('dj')
      requiredCategories.push('technicien_son')
    } else if (formData.ambiance === 'lounge' || formData.ambiance === 'ambiance_fond') {
      requiredCategories.push('musicien')
    }

  // Traiteur par défaut pour l'exemple
    requiredCategories.push('traiteur')

    const draft: Record<string, any> = {}
    let totalEstimated = 0

  // Recherche des prestataires pour chaque catégorie (1 principal + 2 backups)
    for (const category of requiredCategories) {
      const { data: services } = await supabase
        .from('services')
        .select(
          'id, title, description, category, city, price_fixed, price_per_day, price_per_hour, images, profiles(first_name, last_name)'
        )
        .eq('category', category)
        .eq('is_active', true)
        .limit(50)

      if (services && services.length > 0) {
        const rankedServices = [...services]
        if (formData.mood_tags && formData.mood_tags.length > 0) {
          const lowered = formData.mood_tags.map((t) => t.toLowerCase())
          rankedServices.sort((a: any, b: any) => {
            const hayA = `${a.title || ''} ${a.description || ''} ${a.category || ''}`.toLowerCase()
            const hayB = `${b.title || ''} ${b.description || ''} ${b.category || ''}`.toLowerCase()
            const scoreA = lowered.reduce((acc, t) => (hayA.includes(t) ? acc + 1 : acc), 0)
            const scoreB = lowered.reduce((acc, t) => (hayB.includes(t) ? acc + 1 : acc), 0)
            return scoreB - scoreA
          })
        }

        draft[category] = {
          main: rankedServices[0],
          backups: rankedServices.slice(1, 3), // Les 2 suivants en backup
        }
      
      // Calcul basique du budget estimé (on prend le prix fixe ou journalier du choix principal)
        const mainPrice =
          rankedServices[0].price_fixed ||
          rankedServices[0].price_per_day ||
          (rankedServices[0].price_per_hour ? rankedServices[0].price_per_hour * 5 : 0)
        totalEstimated += mainPrice
      }
    }

  // Option "Upgrade budget" si l'estimation dépasse le budget global
    const upgradeProposed = totalEstimated > formData.budget_global

    return {
      success: true,
      specId: spec.id,
      draft,
      totalEstimated,
      upgradeProposed,
      message: upgradeProposed
        ? `Votre budget est de ${formData.budget_global}€, mais la sélection idéale est estimée à ${totalEstimated}€. Souhaitez-vous upgrader votre budget ou utiliser les prestataires de backup ?`
        : 'Brouillon généré avec succès dans le respect de votre budget.',
    }
  } catch (error) {
    console.error('ERREUR SUPABASE:', error)
    return {
      error: error instanceof Error ? error.message : 'Erreur inconnue côté serveur.',
    }
  }
}
