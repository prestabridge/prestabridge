"use client"

import { useState } from "react"
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
  ChevronRight
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

interface ConfiguratorProps {
  mode: "ai-pack" | "custom"
}

type OptionValue = {
  audience: "public" | "private" | null
  ambiance: "lounge" | "spectacle" | "party" | null
  lieu: "interieur" | "plein-air" | "hangar" | null
  restrictions: string[]
}

export function Configurator({ mode }: ConfiguratorProps) {
  const [options, setOptions] = useState<OptionValue>({
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
      </div>

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

      {/* Submit Button */}
      <div className="mt-8 flex justify-center">
        <Button className="bg-gold-gradient text-background hover:opacity-90 font-semibold text-lg px-8 py-6 rounded-xl glow-gold-strong transition-all hover:scale-105 gold-shimmer">
          {mode === "ai-pack" ? "Générer ma Scène IA" : "Voir les Prestataires"}
          <ChevronRight className="ml-2 h-5 w-5" />
        </Button>
      </div>
    </div>
  )
}
