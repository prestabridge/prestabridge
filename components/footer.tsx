import Link from "next/link"

const footerLinks = {
  plateforme: [
    { label: "Explorer", href: "/#explorer" },
    { label: "Comment ça marche", href: "/#comment" },
    { label: "Devenir Prestataire", href: "/#devenir" },
    { label: "Espace Pro", href: "/dashboard/provider" },
  ],
  legal: [
    { label: "CGV", href: "/terms" },
    { label: "Confidentialité", href: "/privacy" },
  ],
}

export function Footer() {
  return (
    <footer className="bg-card border-t border-gold/30">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-10">
          {/* Brand */}
          <div>
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="h-8 w-8 rounded-lg bg-gold-gradient flex items-center justify-center glow-gold">
                <span className="text-background font-bold text-sm">PB</span>
              </div>
              <span className="text-xl font-serif font-semibold text-foreground">
                Presta<span className="text-gold-gradient">Bridge</span>
              </span>
            </Link>
            <p className="text-muted-foreground text-sm max-w-xs">
              La marketplace événementielle premium qui connecte organisateurs
              et prestataires d&apos;exception.
            </p>
          </div>

          {/* Plateforme */}
          <div>
            <h4 className="font-semibold text-foreground mb-4">Plateforme</h4>
            <ul className="space-y-1">
              {footerLinks.plateforme.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="block py-1.5 text-muted-foreground hover:text-gold transition-colors text-sm"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-semibold text-foreground mb-4">Légal</h4>
            <ul className="space-y-1">
              {footerLinks.legal.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="block py-1.5 text-muted-foreground hover:text-gold transition-colors text-sm"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-10 pt-6 border-t border-gold/20 text-center">
          <p className="text-muted-foreground text-sm">
            © {new Date().getFullYear()} PrestaBridge. Tous droits réservés.
          </p>
        </div>
      </div>
    </footer>
  )
}
