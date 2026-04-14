'use server'

import { createClient } from '@/lib/supabase/server'

type VisionMatch = {
  id: string
  title: string
  description: string
  category: string
  city: string
  price_per_hour: number | null
  price_per_day: number | null
  price_fixed: number | null
  images: string[] | null
}

function extractTags(raw: string): string[] {
  try {
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed)) {
      return parsed.map((v) => String(v).toLowerCase().trim()).filter(Boolean).slice(0, 5)
    }
  } catch {
    const match = raw.match(/\[[\s\S]*\]/)
    if (match) {
      try {
        const parsed = JSON.parse(match[0])
        if (Array.isArray(parsed)) {
          return parsed.map((v) => String(v).toLowerCase().trim()).filter(Boolean).slice(0, 5)
        }
      } catch {
        return []
      }
    }
  }
  return []
}

export async function analyzeMoodboardImage(imageBase64: string) {
  if (!imageBase64?.startsWith('data:image/')) {
    return { error: "Format d'image invalide." }
  }

  const openAiKey = process.env.OPENAI_API_KEY
  if (!openAiKey) {
    return { error: "Clé OpenAI indisponible." }
  }

  try {
    const aiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${openAiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content:
              "Tu es un expert événementiel. Analyse cette image et retourne UNIQUEMENT un tableau JSON de 5 tags techniques maximum (ex: ['guinguette', 'bois', 'champêtre', 'néon', 'dj-set']).",
          },
          {
            role: 'user',
            content: [
              { type: 'text', text: "Analyse cette image d'inspiration." },
              {
                type: 'image_url',
                image_url: {
                  url: imageBase64,
                },
              },
            ],
          },
        ],
        temperature: 0.2,
      }),
    })

    if (!aiResponse.ok) {
      return { error: "L'analyse IA n'a pas pu aboutir." }
    }

    const aiData = await aiResponse.json()
    const text = aiData?.choices?.[0]?.message?.content ?? ''
    const tags = extractTags(text)

    if (!tags.length) {
      return { error: "L'IA n'a pas extrait de tags exploitables." }
    }

    const supabase = await createClient()
    const { data: services, error } = await supabase
      .from('services')
      .select('id, title, description, category, city, price_per_hour, price_per_day, price_fixed, images, tags, is_active')
      .eq('is_active', true)
      .limit(200)

    if (error) return { error: 'Erreur de recherche des prestataires.' }

    const ranked = (services ?? [])
      .map((service: any) => {
        const haystack = [
          service.title ?? '',
          service.description ?? '',
          service.category ?? '',
          ...(service.tags ?? []),
        ]
          .join(' ')
          .toLowerCase()

        const score = tags.reduce((acc, t) => (haystack.includes(t) ? acc + 1 : acc), 0)
        return { service, score }
      })
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 12)
      .map((item) => {
        const s = item.service
        return {
          id: s.id,
          title: s.title,
          description: s.description ?? '',
          category: s.category,
          city: s.city ?? '',
          price_per_hour: s.price_per_hour ?? null,
          price_per_day: s.price_per_day ?? null,
          price_fixed: s.price_fixed ?? null,
          images: s.images ?? null,
        } satisfies VisionMatch
      })

    return { success: true, tags, services: ranked }
  } catch {
    return { error: "Une erreur inattendue s'est produite pendant l'analyse." }
  }
}
