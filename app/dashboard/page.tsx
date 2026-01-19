import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { signOut } from '@/app/actions/auth'
import { Sparkles, User, Briefcase } from 'lucide-react'

export default async function DashboardPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-serif font-bold text-foreground mb-2">
                Bienvenue sur <span className="text-gold-gradient">PrestaBridge</span>
              </h1>
              <p className="text-muted-foreground">
                {profile?.role === 'client'
                  ? 'Explorez les services pour votre événement'
                  : 'Gérez vos services et réservations'}
              </p>
            </div>
            <form action={signOut}>
              <Button type="submit" variant="outline">
                Déconnexion
              </Button>
            </form>
          </div>
        </div>

        <Card className="glass-gold border-gold/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {profile?.role === 'client' ? (
                <User className="h-5 w-5 text-gold" />
              ) : (
                <Briefcase className="h-5 w-5 text-gold" />
              )}
              Mon Profil
            </CardTitle>
            <CardDescription>
              {profile?.role === 'client' ? 'Vous êtes un Client' : 'Vous êtes un Prestataire'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-sm">
                <span className="text-muted-foreground">Email :</span>{' '}
                <span className="text-foreground">{user.email}</span>
              </p>
              {profile?.first_name && (
                <p className="text-sm">
                  <span className="text-muted-foreground">Prénom :</span>{' '}
                  <span className="text-foreground">{profile.first_name}</span>
                </p>
              )}
              {profile?.last_name && (
                <p className="text-sm">
                  <span className="text-muted-foreground">Nom :</span>{' '}
                  <span className="text-foreground">{profile.last_name}</span>
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
