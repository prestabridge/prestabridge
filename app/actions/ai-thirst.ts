'use server'

type ThirstInput = {
  guests: number
  durationHours: number
  vibe: 'soft' | 'festive' | 'party-hard'
  weather: 'normal' | 'hot'
}

type ThirstOutput = {
  waterLiters: number
  softDrinksLiters: number
  juiceLiters: number
  beerLiters: number
  wineBottles: number
  spiritsBottles: number
  iceKg: number
}

export async function saveDrinksPlanToProject(drinksPlan: ThirstOutput) {
  const { createClient } = await import('@/lib/supabase/server')
  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) return { error: 'Non authentifié' }

  const { data: latest, error: fetchError } = await supabase
    .from('project_specs')
    .select('id')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (fetchError || !latest) {
    return { error: 'Aucun projet trouvé. Lancez d’abord le configurateur.' }
  }

  const { error: updateError } = await supabase
    .from('project_specs')
    .update({ drinks_plan: drinksPlan } as any)
    .eq('id', latest.id)

  if (updateError) {
    if (updateError.message.includes('drinks_plan')) {
      return { error: 'La colonne drinks_plan est absente. Exécutez la migration SQL Magic Hub.' }
    }
    return { error: updateError.message }
  }

  return { success: true, projectSpecId: latest.id }
}

function roundUp(value: number) {
  return Math.ceil(value)
}

export async function calculateThirstPlan(input: ThirstInput) {
  if (input.guests <= 0 || input.durationHours <= 0) {
    return { error: 'Entrées invalides pour le calcul.' }
  }

  const vibeMultiplier = input.vibe === 'soft' ? 0.9 : input.vibe === 'festive' ? 1.1 : 1.25
  const weatherMultiplier = input.weather === 'hot' ? 1.2 : 1
  const durationFactor = Math.max(1, input.durationHours / 4)

  const global = vibeMultiplier * weatherMultiplier * durationFactor

  // Base par invité (4h) - ajustée ensuite
  const waterPerGuestL = 0.75
  const softPerGuestL = 0.45
  const juicePerGuestL = 0.25
  const beerPerGuestL = 0.8
  const winePerGuestL = 0.35
  const spiritPerGuestL = 0.12
  const icePerGuestKg = 0.4

  const waterLiters = roundUp(input.guests * waterPerGuestL * global)
  const softDrinksLiters = roundUp(input.guests * softPerGuestL * global)
  const juiceLiters = roundUp(input.guests * juicePerGuestL * global)
  const beerLiters = roundUp(input.guests * beerPerGuestL * global)
  const wineLiters = input.guests * winePerGuestL * global
  const spiritsLiters = input.guests * spiritPerGuestL * global
  const iceKg = roundUp(input.guests * icePerGuestKg * global)

  const wineBottles = roundUp(wineLiters / 0.75)
  const spiritsBottles = roundUp(spiritsLiters / 0.7)

  const result: ThirstOutput = {
    waterLiters,
    softDrinksLiters,
    juiceLiters,
    beerLiters,
    wineBottles,
    spiritsBottles,
    iceKg,
  }

  return { success: true, result }
}
