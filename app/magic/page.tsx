import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Wand2, GlassWater, MailPlus, ArrowRight } from 'lucide-react'

export default function MagicHubPage() {
  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8 text-center">
          <h1 className="text-4xl md:text-5xl font-serif font-bold">
            Magic <span className="text-gold-gradient">Hub</span>
          </h1>
          <p className="text-muted-foreground mt-3">
            Trois outils IA pour transformer votre organisation événementielle.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <Link href="/magic/moodboard">
            <Card className="h-full glass-gold border-gold/30 hover-glow transition-all duration-300 cursor-pointer group">
              <CardHeader>
                <div className="h-12 w-12 rounded-xl bg-gold-gradient flex items-center justify-center mb-3 glow-gold">
                  <Wand2 className="h-6 w-6 text-background" />
                </div>
                <CardTitle>Instant Moodboard</CardTitle>
                <CardDescription>
                  Upload d'une image d'inspiration et matching automatique avec les prestataires.
                </CardDescription>
              </CardHeader>
              <CardContent className="text-sm text-gold flex items-center gap-2">
                Ouvrir l'outil
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </CardContent>
            </Card>
          </Link>

          <Link href="/magic/thirst">
            <Card className="h-full glass-gold border-gold/30 hover-glow transition-all duration-300 cursor-pointer group">
              <CardHeader>
                <div className="h-12 w-12 rounded-xl bg-gold-gradient flex items-center justify-center mb-3 glow-gold">
                  <GlassWater className="h-6 w-6 text-background" />
                </div>
                <CardTitle>Thirst Calculator</CardTitle>
                <CardDescription>Calcul intelligent des quantités de boissons.</CardDescription>
              </CardHeader>
              <CardContent className="text-sm text-gold flex items-center gap-2">
                Ouvrir l'outil
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </CardContent>
            </Card>
          </Link>

          <Link href="/magic/invit">
            <Card className="h-full glass-gold border-gold/30 hover-glow transition-all duration-300 cursor-pointer group">
              <CardHeader>
                <div className="h-12 w-12 rounded-xl bg-gold-gradient flex items-center justify-center mb-3 glow-gold">
                  <MailPlus className="h-6 w-6 text-background" />
                </div>
                <CardTitle>Invit'IA</CardTitle>
                <CardDescription>Création automatique d'invitations premium.</CardDescription>
              </CardHeader>
              <CardContent className="text-sm text-gold flex items-center gap-2">
                Ouvrir l'outil
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  )
}
