import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ProjectRunOfShowPanel } from '@/components/project-run-of-show-panel'

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: project, error: projectError } = await supabase
    .from('project_specs')
    .select('id, user_id, event_date, event_time_start, budget_global, run_of_show')
    .eq('id', id)
    .single()

  if (projectError || !project || project.user_id !== user.id) redirect('/dashboard')

  const { data: bookings } = await supabase
    .from('bookings')
    .select('id, status, total_amount, services(title, category)')
    .eq('project_spec_id', id)

  const serviceRows = (bookings ?? []).map((b: any) => {
    const service = Array.isArray(b.services) ? b.services[0] : b.services
    return {
      title: service?.title || 'Service',
      status: b.status,
      totalAmount: Number(b.total_amount || 0),
    }
  })

  const timeline = Array.isArray(project.run_of_show) ? (project.run_of_show as any[]) : []

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <Card className="glass-gold border-gold/30">
          <CardHeader>
            <CardTitle>Détail du Projet</CardTitle>
            <CardDescription>Vue logistique et export documentaire de votre événement.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
            <div className="rounded-lg border border-gold/20 p-3">
              <p className="text-muted-foreground">Date</p>
              <p className="font-semibold">{project.event_date}</p>
            </div>
            <div className="rounded-lg border border-gold/20 p-3">
              <p className="text-muted-foreground">Heure de début</p>
              <p className="font-semibold">{project.event_time_start || '--:--'}</p>
            </div>
            <div className="rounded-lg border border-gold/20 p-3">
              <p className="text-muted-foreground">Budget global</p>
              <p className="font-semibold">{Number(project.budget_global || 0).toFixed(2)} EUR</p>
            </div>
          </CardContent>
        </Card>

        <ProjectRunOfShowPanel
          projectSpecId={project.id}
          eventDate={String(project.event_date || '')}
          eventStartTime={String(project.event_time_start || '20:00')}
          timelineInitial={timeline as any}
          services={serviceRows}
        />
      </div>
    </div>
  )
}
