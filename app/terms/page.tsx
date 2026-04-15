import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-3xl mx-auto">
        <Button asChild variant="ghost" className="mb-4">
          <Link href="/"><ArrowLeft className="h-4 w-4 mr-2" />Accueil</Link>
        </Button>

        <Card className="glass-gold border-gold/30">
          <CardHeader>
            <CardTitle className="text-2xl font-serif">
              Conditions Générales de Vente
            </CardTitle>
          </CardHeader>
          <CardContent className="prose prose-invert prose-sm max-w-none text-muted-foreground space-y-4">
            <p>
              Les présentes Conditions Générales de Vente régissent l&apos;utilisation
              de la plateforme PrestaBridge, marketplace événementielle premium
              connectant clients et prestataires.
            </p>
            <p>
              Cette page est en cours de rédaction. Les CGV complètes seront
              disponibles avant le lancement officiel de la plateforme.
            </p>
            <p className="text-xs text-muted-foreground/60">
              Dernière mise à jour : {new Date().toLocaleDateString('fr-FR')}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
