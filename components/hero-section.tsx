"use client"

import { useState } from "react"
import { CalendarDays, MapPin, Wallet, Sparkles, PartyPopper } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Link from "next/link"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export function HeroSection() {
  const [eventType, setEventType] = useState("")
  const [location, setLocation] = useState("")
  const [budget, setBudget] = useState("")
  const [date, setDate] = useState("")

  return (
    <section className="relative min-h-screen flex items-center justify-center pt-16 overflow-hidden">
      {/* Background gradient - Champagne Gold Luxury */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[oklch(0.78_0.11_65_/_0.18)] via-[oklch(0.78_0.11_65_/_0.04)] to-background" />
      
      {/* Decorative champagne gold orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[oklch(0.78_0.11_65_/_0.12)] rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-[oklch(0.78_0.11_65_/_0.10)] rounded-full blur-3xl animate-pulse" />
      <div className="absolute top-1/2 right-1/3 w-48 h-48 bg-[oklch(0.85_0.09_60_/_0.08)] rounded-full blur-2xl" />

      <div className="relative z-10 mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 text-center">
        {/* Subtitle */}
        <p className="text-gold-gradient uppercase tracking-[0.3em] text-sm mb-6 font-semibold">
          Marketplace Événementielle Premium
        </p>

        {/* Main Title */}
        <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-serif font-medium text-foreground mb-6 leading-tight text-balance">
          Votre Événement Sur-Mesure.
          <br />
          <span className="text-gold-gradient font-semibold">Sans Stress. Sans Erreur.</span>
        </h1>

        {/* Subtitle */}
        <p className="text-muted-foreground text-lg md:text-xl max-w-2xl mx-auto mb-12 text-pretty">
          Trouvez les meilleurs prestataires et créez des événements inoubliables 
          grâce à notre technologie intelligente.
        </p>

        {/* Magic Search Bar */}
        <div className="glass-gold rounded-2xl p-4 md:p-6 max-w-4xl mx-auto glow-gold-strong gold-border-glow">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Event Type */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm text-muted-foreground">
                <PartyPopper className="h-4 w-4 text-gold" />
                Type d&apos;événement
              </label>
              <Select value={eventType} onValueChange={setEventType}>
                <SelectTrigger className="bg-secondary border-border hover:border-gold transition-colors">
                  <SelectValue placeholder="Sélectionner..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mariage">Mariage</SelectItem>
                  <SelectItem value="anniversaire">Anniversaire</SelectItem>
                  <SelectItem value="corporate">Corporate</SelectItem>
                  <SelectItem value="gala">Gala</SelectItem>
                  <SelectItem value="concert">Concert</SelectItem>
                  <SelectItem value="festival">Festival</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Location */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4 text-gold" />
                Lieu / Ville
              </label>
              <Input
                type="text"
                placeholder="Paris, Lyon..."
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="bg-secondary border-border hover:border-gold focus:border-gold transition-colors"
              />
            </div>

            {/* Budget */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm text-muted-foreground">
                <Wallet className="h-4 w-4 text-gold" />
                Budget Global
              </label>
              <Select value={budget} onValueChange={setBudget}>
                <SelectTrigger className="bg-secondary border-border hover:border-gold transition-colors">
                  <SelectValue placeholder="Sélectionner..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5000">{"< 5 000 €"}</SelectItem>
                  <SelectItem value="10000">5 000 - 10 000 €</SelectItem>
                  <SelectItem value="25000">10 000 - 25 000 €</SelectItem>
                  <SelectItem value="50000">25 000 - 50 000 €</SelectItem>
                  <SelectItem value="100000">50 000 - 100 000 €</SelectItem>
                  <SelectItem value="unlimited">{"> 100 000 €"}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Date */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm text-muted-foreground">
                <CalendarDays className="h-4 w-4 text-gold" />
                Date
              </label>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="bg-secondary border-border hover:border-gold focus:border-gold transition-colors"
              />
            </div>
          </div>

          {/* CTA Button */}
          <div className="mt-6">
            <Button 
              asChild
              className="w-full md:w-auto bg-gold-gradient text-background hover:opacity-90 font-semibold text-lg px-8 py-6 rounded-xl glow-gold-strong transition-all hover:scale-105 gold-shimmer"
            >
              <Link href="/onboarding">
                <Sparkles className="mr-2 h-5 w-5" />
                Générer ma Scène
              </Link>
            </Button>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="mt-16 animate-bounce">
          <div className="w-6 h-10 border-2 border-gold rounded-full mx-auto flex items-start justify-center p-2 glow-gold">
            <div className="w-1 h-2 bg-gold-gradient rounded-full" />
          </div>
        </div>
      </div>
    </section>
  )
}
