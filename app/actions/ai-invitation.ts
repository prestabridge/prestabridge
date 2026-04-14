'use server'

import { createClient } from '@/lib/supabase/server'
import { Resend } from 'resend'

type InvitationInput = {
  eventType: string
  eventName: string
  date: string
  time: string
  location: string
  vibe: 'chic' | 'boheme' | 'electro'
  extraNote?: string
}

const vibeStyles: Record<InvitationInput['vibe'], { title: string; subtitle: string }> = {
  chic: {
    title: 'Soiree Elegante',
    subtitle: 'Tenue de soiree recommandee',
  },
  boheme: {
    title: 'Ambiance Boheme',
    subtitle: 'Esprit libre, style naturel',
  },
  electro: {
    title: 'Nuit Electro',
    subtitle: 'Lumiere, rythme et energie',
  },
}

export async function generateInvitationContent(input: InvitationInput) {
  const key = process.env.OPENAI_API_KEY
  if (!key) return { error: 'OPENAI_API_KEY indisponible.' }

  try {
    const prompt = `
Tu es un copywriter premium evenementiel.
Genere un texte d'invitation court en francais, ton haut de gamme, chaleureux et moderne.
Retourne UNIQUEMENT un JSON:
{
  "headline": "...",
  "body": "...",
  "cta": "..."
}

Contexte:
- Type: ${input.eventType}
- Nom: ${input.eventName}
- Date: ${input.date}
- Heure: ${input.time}
- Lieu: ${input.location}
- Vibe: ${input.vibe}
- Note: ${input.extraNote || 'Aucune'}
`.trim()

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        temperature: 0.7,
        messages: [
          { role: 'system', content: "Tu reponds toujours en JSON valide uniquement." },
          { role: 'user', content: prompt },
        ],
      }),
    })

    if (!response.ok) return { error: "La generation de l'invitation a echoue." }
    const data = await response.json()
    const content = data?.choices?.[0]?.message?.content ?? '{}'

    let parsed: { headline?: string; body?: string; cta?: string } = {}
    try {
      parsed = JSON.parse(content)
    } catch {
      return { error: "Format de reponse IA invalide." }
    }

    const style = vibeStyles[input.vibe]
    return {
      success: true,
      invitation: {
        headline: parsed.headline || input.eventName,
        body: parsed.body || `Vous etes invite a ${input.eventName}.`,
        cta: parsed.cta || 'Confirmez votre presence',
        style,
      },
    }
  } catch {
    return { error: "Une erreur inattendue est survenue pendant la generation." }
  }
}

export async function sendInvitationTestEmail(input: {
  headline: string
  body: string
  cta: string
  date: string
  time: string
  location: string
}) {
  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) return { error: 'Non authentifié' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('email, first_name')
    .eq('id', user.id)
    .single()

  const recipient = profile?.email
  const resendKey = process.env.RESEND_API_KEY
  const from = process.env.RESEND_FROM_EMAIL

  if (!recipient) return { error: "Votre email n'est pas disponible sur votre profil." }
  if (!resendKey || !from) return { error: 'Configuration email indisponible.' }

  const resend = new Resend(resendKey)
  await resend.emails.send({
    from,
    to: [recipient],
    subject: `Invitation test - ${input.headline}`,
    html: `
      <div style="font-family:Arial,sans-serif;background:#0f0f0f;padding:24px;color:#f4f4f5;">
        <div style="max-width:640px;margin:0 auto;border:1px solid #d4af37;border-radius:16px;padding:24px;background:#181818;">
          <h1 style="margin:0 0 12px 0;color:#f6e27a;">${input.headline}</h1>
          <p style="margin:0 0 16px 0;color:#e5e7eb;">${input.body}</p>
          <p style="margin:0 0 4px 0;"><strong>Date:</strong> ${input.date || '-'}</p>
          <p style="margin:0 0 4px 0;"><strong>Heure:</strong> ${input.time || '-'}</p>
          <p style="margin:0 0 16px 0;"><strong>Lieu:</strong> ${input.location || '-'}</p>
          <div style="display:inline-block;border:1px solid #d4af37;border-radius:999px;padding:8px 14px;color:#f6e27a;">
            ${input.cta}
          </div>
        </div>
      </div>
    `,
  })

  return { success: true }
}
