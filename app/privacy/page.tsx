import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-3xl mx-auto">
        <Button asChild variant="ghost" className="mb-4">
          <Link href="/"><ArrowLeft className="h-4 w-4 mr-2" />Accueil</Link>
        </Button>

        <Card className="glass-gold border-gold/30">
          <CardHeader>
            <CardTitle className="text-2xl font-serif">
              Politique de Confidentialité
            </CardTitle>
          </CardHeader>
          <CardContent className="prose prose-invert prose-sm max-w-none text-muted-foreground space-y-4">
            <p>
              PrestaBridge s&apos;engage à protéger la vie privée de ses utilisateurs.
              Cette politique décrit les données collectées, leur utilisation et
              vos droits conformément au RGPD.
            </p>
            <p>
              Cette page est en cours de rédaction. La politique complète sera
              disponible avant le lancement officiel de la plateforme.
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
