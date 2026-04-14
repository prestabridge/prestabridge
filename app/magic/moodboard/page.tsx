'use client'

import { useMemo, useState } from 'react'
import { UploadCloud, Sparkles } from 'lucide-react'
import { analyzeMoodboardImage } from '@/app/actions/ai-vision'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ServiceCard } from '@/components/service-card'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'

type MoodboardService = {
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

export default function MoodboardPage() {
  const router = useRouter()
  const [dragActive, setDragActive] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [tags, setTags] = useState<string[]>([])
  const [services, setServices] = useState<MoodboardService[]>([])

  const helperText = useMemo(() => {
    if (isLoading) return "L'IA analyse les textures et l'ambiance de votre image..."
    if (preview) return "Image prête. Cliquez pour lancer le matching IA."
    return "Glissez-déposez une image d'inspiration ou cliquez pour sélectionner un fichier."
  }, [isLoading, preview])

  const readFileAsDataUrl = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(String(reader.result || ''))
      reader.onerror = reject
      reader.readAsDataURL(file)
    })

  const handleFile = async (file?: File) => {
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setError('Veuillez sélectionner uniquement une image.')
      return
    }
    const dataUrl = await readFileAsDataUrl(file)
    setPreview(dataUrl)
    setError(null)
    setTags([])
    setServices([])
  }

  const runAnalysis = async () => {
    if (!preview) return
    setIsLoading(true)
    setError(null)
    const result = await analyzeMoodboardImage(preview)
    setIsLoading(false)

    if (result.error) {
      setError(result.error)
      setServices([])
      setTags([])
      return
    }

    setTags(result.tags ?? [])
    setServices(result.services ?? [])
  }

  const useStyleForConfigurator = () => {
    if (!tags.length) return
    sessionStorage.setItem('preferredMoodTags', JSON.stringify(tags))
    router.push(`/dashboard?moodTags=${encodeURIComponent(tags.join(','))}`)
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="text-center">
          <h1 className="text-3xl md:text-4xl font-serif font-bold">
            Instant <span className="text-gold-gradient">Moodboard</span>
          </h1>
          <p className="text-muted-foreground mt-2">
            Importez une image, laissez l'IA décoder son ADN visuel, puis découvrez les prestataires compatibles.
          </p>
        </div>

        <Card className="glass-gold border-gold/30">
          <CardHeader>
            <CardTitle>Upload d'inspiration</CardTitle>
            <CardDescription>{helperText}</CardDescription>
          </CardHeader>
          <CardContent>
            <label
              onDragOver={(e) => {
                e.preventDefault()
                setDragActive(true)
              }}
              onDragLeave={() => setDragActive(false)}
              onDrop={(e) => {
                e.preventDefault()
                setDragActive(false)
                void handleFile(e.dataTransfer.files?.[0])
              }}
              className={`block w-full rounded-2xl border-2 border-dashed p-8 text-center transition ${
                dragActive ? 'border-gold bg-gold/10' : 'border-gold/30 hover:border-gold/50'
              }`}
            >
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => void handleFile(e.target.files?.[0])}
              />
              <div className="flex flex-col items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-gold/15 flex items-center justify-center">
                  <UploadCloud className="h-6 w-6 text-gold" />
                </div>
                <p className="text-sm text-muted-foreground">PNG, JPG, WEBP - image de référence d'ambiance</p>
              </div>
            </label>

            {preview && (
              <div className="mt-4 space-y-4">
                <img src={preview} alt="Aperçu moodboard" className="w-full max-h-72 object-cover rounded-xl border border-gold/20" />
                <button
                  type="button"
                  onClick={runAnalysis}
                  disabled={isLoading}
                  className="w-full h-12 rounded-xl bg-gold-gradient text-background font-semibold hover:opacity-90 disabled:opacity-50"
                >
                  {isLoading ? "L'IA analyse votre style..." : 'Lancer le matching IA'}
                </button>
              </div>
            )}
          </CardContent>
        </Card>

        {tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <span key={tag} className="px-3 py-1 rounded-full text-xs border border-gold/40 text-gold bg-gold/10">
                #{tag}
              </span>
            ))}
          </div>
        )}

        {error && (
          <Card className="border-destructive/30 bg-destructive/5">
            <CardContent className="p-4 text-sm text-destructive">{error}</CardContent>
          </Card>
        )}

        {!isLoading && !error && preview && services.length === 0 && tags.length > 0 && (
          <Card className="glass-gold border-gold/30">
            <CardContent className="p-6 text-center text-muted-foreground">
              Votre style est si unique que nous cherchons encore la perle rare, essayez une autre image !
            </CardContent>
          </Card>
        )}

        {isLoading && (
          <Card className="glass-gold border-gold/30">
            <CardContent className="p-6 flex items-center justify-center gap-3 text-gold">
              <Sparkles className="h-5 w-5 animate-pulse" />
              L'IA analyse les textures et l'ambiance de votre image...
            </CardContent>
          </Card>
        )}

        {services.length > 0 && (
          <div className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {services.map((service) => (
                <ServiceCard key={service.id} {...service} />
              ))}
            </div>
            <Button onClick={useStyleForConfigurator} className="w-full h-12 bg-gold-gradient text-background hover:opacity-90">
              Créer mon événement avec ce style
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
