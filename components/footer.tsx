"use client"

import React from "react"

import { useState } from "react"
import { Instagram, Linkedin, Twitter, Send } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

const footerLinks = {
  produit: [
    { label: "Explorer", href: "#explorer" },
    { label: "Comment ça marche", href: "#comment" },
    { label: "Tarifs", href: "#tarifs" },
    { label: "API", href: "#api" }
  ],
  prestataires: [
    { label: "Devenir Prestataire", href: "#devenir" },
    { label: "Espace Pro", href: "#pro" },
    { label: "Formations", href: "#formations" },
    { label: "Partenariats", href: "#partenariats" }
  ],
  legal: [
    { label: "Mentions Légales", href: "#mentions" },
    { label: "CGV", href: "#cgv" },
    { label: "Confidentialité", href: "#confidentialite" },
    { label: "Cookies", href: "#cookies" }
  ]
}

const socialLinks = [
  { icon: Instagram, href: "#", label: "Instagram" },
  { icon: Linkedin, href: "#", label: "LinkedIn" },
  { icon: Twitter, href: "#", label: "Twitter" }
]

export function Footer() {
  const [email, setEmail] = useState("")

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Handle newsletter signup
    setEmail("")
  }

  return (
    <footer className="bg-card border-t border-[oklch(0.45_0.12_85_/_0.3)]">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12">
          {/* Brand & Newsletter */}
          <div className="lg:col-span-2">
            <a href="#" className="flex items-center gap-2 mb-6">
              <div className="h-8 w-8 rounded-lg bg-gold-gradient flex items-center justify-center glow-gold">
                <span className="text-background font-bold text-sm">PB</span>
              </div>
              <span className="text-xl font-serif font-semibold text-foreground">
                Presta<span className="text-gold-gradient">Bridge</span>
              </span>
            </a>
            <p className="text-muted-foreground mb-6 max-w-sm">
              La marketplace événementielle premium qui connecte organisateurs 
              et prestataires d&apos;exception.
            </p>
            
            {/* Newsletter */}
            <div>
              <p className="text-sm font-medium text-foreground mb-3">
                Restez informé des nouveautés
              </p>
              <form onSubmit={handleNewsletterSubmit} className="flex gap-2">
                <Input
                  type="email"
                  placeholder="votre@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-secondary border-border focus:border-gold"
                  required
                />
                <Button type="submit" className="bg-gold-gradient text-background hover:opacity-90 shrink-0 glow-gold gold-shimmer">
                  <Send className="h-4 w-4" />
                  <span className="sr-only">S&apos;inscrire à la newsletter</span>
                </Button>
              </form>
            </div>
          </div>

          {/* Produit Links */}
          <div>
            <h4 className="font-semibold text-foreground mb-4">Produit</h4>
            <ul className="space-y-3">
              {footerLinks.produit.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-muted-foreground hover:text-gold transition-colors text-sm"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Prestataires Links */}
          <div>
            <h4 className="font-semibold text-foreground mb-4">Prestataires</h4>
            <ul className="space-y-3">
              {footerLinks.prestataires.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-muted-foreground hover:text-gold transition-colors text-sm"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal Links */}
          <div>
            <h4 className="font-semibold text-foreground mb-4">Légal</h4>
            <ul className="space-y-3">
              {footerLinks.legal.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-muted-foreground hover:text-gold transition-colors text-sm"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-muted-foreground text-sm">
            © {new Date().getFullYear()} PrestaBridge. Tous droits réservés.
          </p>
          
          {/* Social Links */}
          <div className="flex items-center gap-4">
            {socialLinks.map((social) => (
              <a
                key={social.label}
                href={social.href}
                className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-muted-foreground hover:text-gold hover:bg-[oklch(0.82_0.18_85_/_0.2)] hover:glow-gold transition-all"
                aria-label={social.label}
              >
                <social.icon className="h-5 w-5" />
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}
