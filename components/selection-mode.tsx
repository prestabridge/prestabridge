"use client"

import { useState } from "react"
import { Sparkles, Blocks, Home, UtensilsCrossed, Music, Shield, Check } from "lucide-react"
import { cn } from "@/lib/utils"
import { Configurator } from "./configurator"

type SelectionMode = "ai-pack" | "custom" | null

export function SelectionModeSection() {
  const [selectedMode, setSelectedMode] = useState<SelectionMode>(null)

  return (
    <section id="explorer" className="py-24 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        {/* Section Header */}
        <div className="text-center mb-16">
          <p className="text-gold-gradient uppercase tracking-[0.3em] text-sm mb-4 font-semibold">
            Créez Votre Vision
          </p>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-serif text-foreground mb-6 text-balance">
            Deux façons de créer votre{" "}
            <span className="text-gold-gradient">événement parfait</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto text-pretty">
            Laissez notre IA composer une scène complète ou prenez le contrôle total 
            avec notre configurateur avancé.
          </p>
        </div>

        {/* Selection Cards */}
        <div className="grid md:grid-cols-2 gap-8 mb-12">
          {/* AI Pack Card */}
          <button
            type="button"
            onClick={() => setSelectedMode(selectedMode === "ai-pack" ? null : "ai-pack")}
            className={cn(
              "relative glass-gold rounded-2xl p-8 text-left hover-glow transition-all duration-300 group cursor-pointer",
              selectedMode === "ai-pack" && "gold-border-glow glow-gold-strong"
            )}
          >
            {/* Recommended Badge */}
            <div className="absolute -top-3 left-6">
              <span className="bg-gold-gradient text-background text-xs font-semibold px-3 py-1 rounded-full glow-gold gold-shimmer">
                Recommandé
              </span>
            </div>

            {/* Icon Grid */}
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-[oklch(0.78_0.11_65_/_0.2)] flex items-center justify-center group-hover:bg-[oklch(0.78_0.11_65_/_0.35)] transition-colors glow-gold">
                <Sparkles className="h-6 w-6 text-gold" />
              </div>
              <span className="text-xl font-semibold text-gold-gradient">IA PACK</span>
            </div>

            {/* Title */}
            <h3 className="text-2xl font-serif text-foreground mb-4">
              Scènes Pré-remplies par l&apos;IA
            </h3>

            {/* Description */}
            <p className="text-muted-foreground mb-6">
              Notre intelligence artificielle analyse vos critères et compose 
              automatiquement une sélection optimale de prestataires.
            </p>

            {/* Visual Pack Icons */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-4 mb-6">
              <div className="flex items-center gap-1.5 text-xs sm:text-sm text-muted-foreground">
                <Home className="h-4 w-4 text-gold shrink-0" />
                <span>Lieu</span>
              </div>
              <span className="text-gold text-xs">+</span>
              <div className="flex items-center gap-1.5 text-xs sm:text-sm text-muted-foreground">
                <UtensilsCrossed className="h-4 w-4 text-gold shrink-0" />
                <span>Traiteur</span>
              </div>
              <span className="text-gold text-xs">+</span>
              <div className="flex items-center gap-1.5 text-xs sm:text-sm text-muted-foreground">
                <Music className="h-4 w-4 text-gold shrink-0" />
                <span>Animation</span>
              </div>
              <span className="text-gold text-xs">+</span>
              <div className="flex items-center gap-1.5 text-xs sm:text-sm text-muted-foreground">
                <Shield className="h-4 w-4 text-gold shrink-0" />
                <span>Sécurité</span>
              </div>
            </div>

            {/* Selection Indicator */}
            <div className={cn(
              "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors",
              selectedMode === "ai-pack" 
                ? "bg-gold-gradient border-gold glow-gold" 
                : "border-muted-foreground"
            )}>
              {selectedMode === "ai-pack" && (
                <Check className="h-4 w-4 text-background" />
              )}
            </div>
          </button>

          {/* Custom Card */}
          <button
            type="button"
            onClick={() => setSelectedMode(selectedMode === "custom" ? null : "custom")}
            className={cn(
              "relative glass-gold rounded-2xl p-8 text-left hover-glow transition-all duration-300 group cursor-pointer",
              selectedMode === "custom" && "gold-border-glow glow-gold-strong"
            )}
          >
            {/* Icon Grid */}
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-[oklch(0.78_0.11_65_/_0.2)] flex items-center justify-center group-hover:bg-[oklch(0.78_0.11_65_/_0.35)] transition-colors glow-gold">
                <Blocks className="h-6 w-6 text-gold" />
              </div>
              <span className="text-xl font-semibold text-gold-gradient">CUSTOM</span>
            </div>

            {/* Title */}
            <h3 className="text-2xl font-serif text-foreground mb-4">
              Personnalisation Totale
            </h3>

            {/* Description */}
            <p className="text-muted-foreground mb-6">
              Construisez votre événement bloc par bloc. Choisissez chaque 
              prestataire individuellement selon vos préférences exactes.
            </p>

            {/* Visual Blocks */}
            <div className="grid grid-cols-4 gap-2 mb-6">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="h-12 rounded-lg bg-secondary border border-border group-hover:border-gold/50 transition-colors flex items-center justify-center"
                >
                  <div className="w-4 h-4 rounded bg-gold/20" />
                </div>
              ))}
            </div>

            {/* Selection Indicator */}
            <div className={cn(
              "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors",
              selectedMode === "custom" 
                ? "bg-gold-gradient border-gold glow-gold" 
                : "border-muted-foreground"
            )}>
              {selectedMode === "custom" && (
                <Check className="h-4 w-4 text-background" />
              )}
            </div>
          </button>
        </div>

        {/* Configurator - Hidden until selection */}
        {selectedMode && <Configurator mode={selectedMode} />}
      </div>
    </section>
  )
}
