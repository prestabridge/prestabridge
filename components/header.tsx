"use client"

import { useState } from "react"
import { Menu, X } from "lucide-react"
import { Button } from "@/components/ui/button"

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <header className="fixed top-0 left-0 right-0 z-50 glass-gold">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center">
            <a href="/" className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-gold-gradient flex items-center justify-center glow-gold">
                <span className="text-background font-bold text-sm">PB</span>
              </div>
              <span className="text-xl font-serif font-semibold text-foreground">
                Presta<span className="text-gold-gradient">Bridge</span>
              </span>
            </a>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            <a
              href="#explorer"
              className="text-sm text-muted-foreground hover:text-gold transition-colors"
            >
              Explorer
            </a>
            <a
              href="#comment"
              className="text-sm text-muted-foreground hover:text-gold transition-colors"
            >
              Comment ça marche
            </a>
            <a
              href="#devenir"
              className="text-sm text-muted-foreground hover:text-gold transition-colors"
            >
              Devenir Prestataire
            </a>
          </nav>

          {/* CTA Button */}
          <div className="hidden md:flex items-center">
            <Button 
              asChild
              className="bg-gold-gradient text-background hover:opacity-90 font-medium gold-shimmer glow-gold"
            >
              <a href="/login">Connexion / Dashboard</a>
            </Button>
          </div>

          {/* Mobile menu button */}
          <button
            type="button"
            className="md:hidden p-2 text-foreground"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? "Fermer le menu" : "Ouvrir le menu"}
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-border">
            <nav className="flex flex-col gap-4">
              <a
                href="#explorer"
                className="text-sm text-muted-foreground hover:text-gold transition-colors"
              >
                Explorer
              </a>
              <a
                href="#comment"
                className="text-sm text-muted-foreground hover:text-gold transition-colors"
              >
                Comment ça marche
              </a>
              <a
                href="#devenir"
                className="text-sm text-muted-foreground hover:text-gold transition-colors"
              >
                Devenir Prestataire
              </a>
              <Button 
                asChild
                className="bg-gold-gradient text-background hover:opacity-90 font-medium w-full mt-2 glow-gold"
              >
                <a href="/login">Connexion / Dashboard</a>
              </Button>
            </nav>
          </div>
        )}
      </div>
    </header>
  )
}
