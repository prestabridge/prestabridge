'use server'

import { createClient } from '@/lib/supabase/server'

type TimelineItem = {
  time: string
  task: string
  description: string
}

function normalizeTimeline(raw: string): TimelineItem[] {
  try {
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed
      .map((item) => ({
        time: String(item?.time ?? '').trim(),
        task: String(item?.task ?? '').trim(),
        description: String(item?.description ?? '').trim(),
      }))
      .filter((x) => x.time && x.task)
  } catch {
    return []
  }
}

export async function generateRunOfShow(input: { projectSpecId: string; eventStartTime?: string }) {
  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()
  if (authError || !user) return { error: 'Non authentifié' }

  const { data: project, error: projectError } = await supabase
    .from('project_specs')
    .select('id, user_id, event_time_start')
    .eq('id', input.projectSpecId)
    .single()
  if (projectError || !project || project.user_id !== user.id) {
    return { error: 'Projet introuvable ou accès refusé.' }
  }

  const { data: bookings, error: bookingsError } = await supabase
    .from('bookings')
    .select('id, status, services(title, category)')
    .eq('project_spec_id', input.projectSpecId)

  if (bookingsError) return { error: bookingsError.message }

  const validatedStatuses = new Set(['accepted', 'validated', 'completed'])
  const validatedServices = (bookings ?? []).filter((b: any) => validatedStatuses.has(String(b.status)))
  if (validatedServices.length === 0) {
    return { error: 'Le Run-of-Show nécessite au moins un service validé.' }
  }

  const eventStartTime = input.eventStartTime || project.event_time_start || '20:00'
  const serviceLabels = validatedServices
    .map((b: any) => {
      const s = Array.isArray(b.services) ? b.services[0] : b.services
      return `${s?.title || 'Service'} (${s?.category || 'catégorie'})`
    })
    .join(', ')

  const key = process.env.OPENAI_API_KEY
  if (!key) return { error: 'OPENAI_API_KEY indisponible.' }

  const prompt = `
Tu es directeur de production evenementielle.
Genere UNIQUEMENT un tableau JSON de timeline avec le format:
[{"time":"18:30","task":"Arrivee DJ","description":"Installation et balance son"}]

Contexte:
- Heure debut evenement: ${eventStartTime}
- Services valides: ${serviceLabels}

Regles:
- 6 a 12 lignes max
- Horaires croissants
- Ton professionnel et concret
`.trim()

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      temperature: 0.4,
      messages: [
        { role: 'system', content: 'Tu reponds uniquement en JSON valide.' },
        { role: 'user', content: prompt },
      ],
    }),
  })

  if (!response.ok) return { error: "L'IA n'a pas pu générer le planning." }
  const data = await response.json()
  const content = data?.choices?.[0]?.message?.content ?? '[]'
  const timeline = normalizeTimeline(content)
  if (!timeline.length) return { error: 'Planning IA invalide, réessayez.' }

  await supabase
    .from('project_specs')
    .update({ run_of_show: timeline } as any)
    .eq('id', input.projectSpecId)

  return { success: true, timeline }
}
