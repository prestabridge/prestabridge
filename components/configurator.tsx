"use client"

import { useEffect, useState } from "react"
import { 
  Users, 
  Sofa, 
  Zap, 
  PartyPopper, 
  Building2, 
  Trees, 
  Warehouse,
  UtensilsCrossed,
  Accessibility,
  Volume2,
  ChevronRight,
  Euro,
  Calendar,
  Tag,
  Target
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { generateProjectDraft } from "@/app/actions/project-specs"
import { useRouter } from "next/navigation"

interface ConfiguratorProps {
  mode: "ai-pack" | "custom"
}

type OptionValue = {
  budget_global: string
  event_date: string
  event_type: string
  event_objective: string
  audience: "public" | "private" | null
  ambiance: "lounge" | "spectacle" | "party" | null
  lieu: "interieur" | "plein-air" | "hangar" | null
  restrictions: string[]
}

export function Configurator({ mode }: ConfiguratorProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [moodTags, setMoodTags] = useState<string[]>([])

  const [options, setOptions] = useState<OptionValue>({
    budget_global: "",
    event_date: "",
    event_type: "",
    event_objective: "",
    audience: null,
    ambiance: null,
    lieu: null,
    restrictions: []
  })

  const toggleRestriction = (restriction: string) => {
    setOptions(prev => ({
      ...prev,
      restrictions: prev.restrictions.includes(restriction)
        ? prev.restrictions.filter(r => r !== restriction)
        : [...prev.restrictions, restriction]
    }))
  }

  useEffect(() => {
    const raw = sessionStorage.getItem('preferredMoodTags')
    if (!raw) return
    try {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) {
        setMoodTags(parsed.map((v) => String(v)).slice(0, 5))
      }
    } catch {
      // ignore parsing issue
    }
  }, [])

  useEffect(() => {
    const raw = sessionStorage.getItem('quickConfiguratorPrefill')
    const fallbackRaw = localStorage.getItem('quickConfiguratorPrefill')
    const source = raw || fallbackRaw
    if (!source) return
    try {
      const parsed = JSON.parse(source)
      setOptions((prev) => ({
        ...prev,
        budget_global: parsed.budget || prev.budget_global,
        event_date: parsed.date || prev.event_date,
        event_type: parsed.eventType || prev.event_type,
      }))
    } catch {
      // ignore invalid prefill
    }
  }, [])

  const handleSubmit = async () => {
    setError(null)
    
    // Validation basique
    if (!options.budget_global || !options.event_date || !options.event_type || !options.event_objective) {
      setError("Veuillez remplir les informations de base (Budget, Date, Type, Objectif).")
      return
    }

    setLoading(true)

    try {
      const result = await generateProjectDraft({
        budget_global: parseFloat(options.budget_global),
        event_date: options.event_date,
        event_type: options.event_type as any,
        event_objective: options.event_objective as any,
        audience: options.audience,
        ambiance: options.ambiance as any,
        lieu: options.lieu,
        restrictions: options.restrictions,
        mood_tags: moodTags,
      })

      if (result.error) {
        setError(result.error)
        setLoading(false)
        return
      }

      // Succès ! On stocke le brouillon dans le localStorage ou un state global pour la page de résultats
      // Pour l'instant on le met dans le sessionStorage pour le récupérer sur la page /results
      sessionStorage.setItem('projectDraft', JSON.stringify({
        specId: result.specId,
        draft: result.draft,
        totalEstimated: result.totalEstimated,
        upgradeProposed: result.upgradeProposed,
        message: result.message
      }))

      // Redirection vers la page de résultats (Phase 4)
      router.push(`/results?specId=${result.specId}`)

    } catch (err) {
      setError("Une erreur inattendue s'est produite.")
      setLoading(false)
    }
  }

  // Date minimale = aujourd'hui
  const today = new Date().toISOString().split('T')[0]

  return (
    <div className="glass-gold rounded-2xl p-6 md:p-8 animate-in slide-in-from-top-4 duration-500 gold-border-glow">
      <div className="mb-8">
        <h3 className="text-2xl font-serif text-foreground mb-2">
          Configurateur de Détails
        </h3>
        <p className="text-muted-foreground">
          {mode === "ai-pack" 
            ? "Affinez les paramètres pour que notre IA génère la scène idéale."
            : "Définissez vos contraintes pour filtrer les prestataires disponibles."
          }
        </p>
        {moodTags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {moodTags.map((tag) => (
              <span key={tag} className="px-2 py-1 text-xs rounded-full border border-gold/40 text-gold bg-gold/10">
                Priorité style: #{tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
          {error}
        </div>
      )}

      {/* ÉTAPE 1 : LE CADRE */}
      <div className="mb-8 space-y-6">
        <h4 className="text-lg font-serif text-gold border-b border-gold/20 pb-2">Étape 1 : Le Cadre</h4>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          
          <div className="space-y-2">
            <Label className="text-sm font-medium flex items-center gap-2">
              <Euro className="h-4 w-4 text-gold" /> Budget Global (€)
            </Label>
            <Input 
              type="number" 
              placeholder="Ex: 5000" 
              value={options.budget_global}
              onChange={(e) => setOptions({...options, budget_global: e.target.value})}
              className="bg-secondary/50 border-gold/20 focus:border-gold"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium flex items-center gap-2">
              <Calendar className="h-4 w-4 text-gold" /> Date de l'événement
            </Label>
            <Input 
              type="date" 
              min={today}
              value={options.event_date}
              onChange={(e) => setOptions({...options, event_date: e.target.value})}
              className="bg-secondary/50 border-gold/20 focus:border-gold"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium flex items-center gap-2">
              <Tag className="h-4 w-4 text-gold" /> Type d'événement
            </Label>
            <Select value={options.event_type} onValueChange={(val) => setOptions({...options, event_type: val})}>
              <SelectTrigger className="bg-secondary/50 border-gold/20">
                <SelectValue placeholder="Sélectionnez..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="mariage">Mariage</SelectItem>
                <SelectItem value="festival">Festival</SelectItem>
                <SelectItem value="inauguration">Inauguration</SelectItem>
                <SelectItem value="anniversaire">Anniversaire</SelectItem>
                <SelectItem value="concert_prive">Concert Privé</SelectItem>
                <SelectItem value="soiree">Soirée</SelectItem>
                <SelectItem value="seminaire">Séminaire</SelectItem>
                <SelectItem value="autre">Autre</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium flex items-center gap-2">
              <Target className="h-4 w-4 text-gold" /> Objectif
            </Label>
            <Select value={options.event_objective} onValueChange={(val) => setOptions({...options, event_objective: val})}>
              <SelectTrigger className="bg-secondary/50 border-gold/20">
                <SelectValue placeholder="Sélectionnez..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="commercial">Commercial</SelectItem>
                <SelectItem value="culturel">Culturel</SelectItem>
                <SelectItem value="mixte">Mixte</SelectItem>
              </SelectContent>
            </Select>
          </div>

        </div>
      </div>

      {/* ÉTAPE 2 : LES DÉTAILS */}
      <div className="space-y-6">
        <h4 className="text-lg font-serif text-gold border-b border-gold/20 pb-2">Étape 2 : Les Détails</h4>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Audience */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium text-foreground">
              <Users className="h-4 w-4 text-gold" />
              Audience
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setOptions(prev => ({ ...prev, audience: "public" }))}
                className={cn(
                  "flex-1 py-3 px-4 rounded-lg border text-sm font-medium transition-all",
                  options.audience === "public"
                    ? "bg-gold-gradient text-background border-gold glow-gold"
                    : "bg-secondary border-border text-foreground hover:border-gold hover:bg-[oklch(0.78_0.11_65_/_0.1)]"
                )}
              >
                Public
              </button>
              <button
                type="button"
                onClick={() => setOptions(prev => ({ ...prev, audience: "private" }))}
                className={cn(
                  "flex-1 py-3 px-4 rounded-lg border text-sm font-medium transition-all",
                  options.audience === "private"
                    ? "bg-gold-gradient text-background border-gold glow-gold"
                    : "bg-secondary border-border text-foreground hover:border-gold hover:bg-[oklch(0.78_0.11_65_/_0.1)]"
                )}
              >
                Privé
              </button>
            </div>
          </div>

          {/* Ambiance */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium text-foreground">
              <Sofa className="h-4 w-4 text-gold" />
              Ambiance
            </div>
            <div className="flex flex-wrap gap-2">
              {[
                { id: "lounge", label: "Lounge", icon: Sofa },
                { id: "spectacle", label: "Spectacle", icon: Zap },
                { id: "party", label: "Party", icon: PartyPopper },
              ].map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setOptions(prev => ({ ...prev, ambiance: id as OptionValue["ambiance"] }))}
                  className={cn(
                    "flex items-center gap-2 py-2 px-3 rounded-lg border text-sm font-medium transition-all",
                    options.ambiance === id
                      ? "bg-gold-gradient text-background border-gold glow-gold"
                      : "bg-secondary border-border text-foreground hover:border-gold hover:bg-[oklch(0.78_0.11_65_/_0.1)]"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Lieu */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium text-foreground">
              <Building2 className="h-4 w-4 text-gold" />
              Lieu
            </div>
            <div className="flex flex-wrap gap-2">
              {[
                { id: "interieur", label: "Intérieur", icon: Building2 },
                { id: "plein-air", label: "Plein Air", icon: Trees },
                { id: "hangar", label: "Hangar", icon: Warehouse },
              ].map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setOptions(prev => ({ ...prev, lieu: id as OptionValue["lieu"] }))}
                  className={cn(
                    "flex items-center gap-2 py-2 px-3 rounded-lg border text-sm font-medium transition-all",
                    options.lieu === id
                      ? "bg-gold-gradient text-background border-gold glow-gold"
                      : "bg-secondary border-border text-foreground hover:border-gold hover:bg-[oklch(0.78_0.11_65_/_0.1)]"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Restrictions */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium text-foreground">
              <UtensilsCrossed className="h-4 w-4 text-gold" />
              Restrictions
            </div>
            <div className="flex flex-wrap gap-2">
              {[
                { id: "alimentaire", label: "Alimentaire", icon: UtensilsCrossed },
                { id: "pmr", label: "PMR", icon: Accessibility },
                { id: "acoustique", label: "Acoustique", icon: Volume2 },
              ].map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => toggleRestriction(id)}
                  className={cn(
                    "flex items-center gap-2 py-2 px-3 rounded-lg border text-sm font-medium transition-all",
                    options.restrictions.includes(id)
                      ? "bg-gold-gradient text-background border-gold glow-gold"
                      : "bg-secondary border-border text-foreground hover:border-gold hover:bg-[oklch(0.78_0.11_65_/_0.1)]"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Submit Button */}
      <div className="mt-8 flex justify-center">
        <Button 
          onClick={handleSubmit}
          disabled={loading}
          className="bg-gold-gradient text-background hover:opacity-90 font-semibold text-lg px-8 py-6 rounded-xl glow-gold-strong transition-all hover:scale-105 gold-shimmer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Génération en cours..." : (mode === "ai-pack" ? "Générer ma Scène IA" : "Voir les Prestataires")}
          {!loading && <ChevronRight className="ml-2 h-5 w-5" />}
        </Button>
      </div>
    </div>
  )
}
