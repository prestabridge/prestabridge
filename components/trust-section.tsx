import { Lock, BadgeCheck, ShieldCheck, Music } from "lucide-react"

const trustItems = [
  {
    icon: Lock,
    title: "Paiement Séquestre",
    description: "Stripe Escrow",
    detail: "Vos fonds sont sécurisés jusqu'à la réalisation"
  },
  {
    icon: BadgeCheck,
    title: "Pros Vérifiés",
    description: "KYC Complet",
    detail: "Identité et qualifications certifiées"
  },
  {
    icon: ShieldCheck,
    title: "Assurance Incluse",
    description: "RC Pro",
    detail: "Protection complète de vos événements"
  },
  {
    icon: Music,
    title: "SACEM Compliant",
    description: "Licences",
    detail: "Droits musicaux pré-négociés"
  }
]

export function TrustSection() {
  return (
    <section className="py-16 px-4 sm:px-6 lg:px-8 border-y border-[oklch(0.50_0.08_65_/_0.3)] bg-[oklch(0.10_0.015_65_/_0.25)]">
      <div className="mx-auto max-w-6xl">
        <div className="text-center mb-12">
          <p className="text-gold-gradient uppercase tracking-[0.3em] text-sm mb-4 font-semibold">
            Confiance & Sécurité
          </p>
          <h2 className="text-2xl sm:text-3xl font-serif text-foreground text-balance">
            Votre tranquillité, notre <span className="text-gold-gradient">priorité</span>
          </h2>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
          {trustItems.map((item) => (
            <div
              key={item.title}
              className="glass-gold rounded-xl p-6 text-center hover-glow transition-all group"
            >
              <div className="w-14 h-14 rounded-full bg-[oklch(0.78_0.11_65_/_0.2)] flex items-center justify-center mx-auto mb-4 group-hover:bg-[oklch(0.78_0.11_65_/_0.35)] transition-colors glow-gold">
                <item.icon className="h-7 w-7 text-gold" />
              </div>
              <h3 className="font-semibold text-foreground mb-1">{item.title}</h3>
              <p className="text-gold-gradient text-sm font-medium mb-2">{item.description}</p>
              <p className="text-muted-foreground text-xs">{item.detail}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
