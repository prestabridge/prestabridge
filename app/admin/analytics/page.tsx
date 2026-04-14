import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

type ProviderMetric = {
  provider_id: string
  first_name: string | null
  last_name: string | null
  total_attempts: number
  responded_attempts: number
  response_rate_percent: number | null
  avg_response_time_minutes: number | null
}

export default async function AdminAnalyticsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login?redirect=/admin/analytics')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'admin') redirect('/dashboard')

  const { data: metrics } = await supabase
    .from('v_provider_response_metrics')
    .select('*')
    .order('response_rate_percent', { ascending: false })
    .limit(100)

  const rows = (metrics ?? []) as ProviderMetric[]

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <Card className="glass-gold border-gold/30">
          <CardHeader>
            <CardTitle>Analytics Prestataires</CardTitle>
            <CardDescription>
              Classement des prestataires par taux et vitesse de reponse.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {rows.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aucune donnee disponible pour le moment.</p>
            ) : (
              <div className="space-y-3">
                {rows.map((row, index) => {
                  const fullName = `${row.first_name ?? ''} ${row.last_name ?? ''}`.trim() || 'Prestataire'
                  return (
                    <div
                      key={row.provider_id}
                      className="rounded-xl border border-gold/20 p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3"
                    >
                      <div className="flex items-center gap-3">
                        <Badge variant="outline">#{index + 1}</Badge>
                        <div>
                          <p className="font-semibold">{fullName}</p>
                          <p className="text-xs text-muted-foreground">{row.provider_id}</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                        <div>
                          <p className="text-muted-foreground">Tentatives</p>
                          <p className="font-semibold">{row.total_attempts}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Reponses</p>
                          <p className="font-semibold">{row.responded_attempts}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Taux</p>
                          <p className="font-semibold">{row.response_rate_percent ?? 0}%</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Temps moyen</p>
                          <p className="font-semibold">{row.avg_response_time_minutes ?? '-'} min</p>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
