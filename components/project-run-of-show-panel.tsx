'use client'

import { useState, useTransition } from 'react'
import jsPDF from 'jspdf'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { generateRunOfShow } from '@/app/actions/generate-run-of-show'

type TimelineItem = {
  time: string
  task: string
  description: string
}

type ServiceItem = {
  title: string
  status: string
  totalAmount: number
}

export function ProjectRunOfShowPanel({
  projectSpecId,
  eventDate,
  eventStartTime,
  timelineInitial,
  services,
}: {
  projectSpecId: string
  eventDate: string
  eventStartTime: string
  timelineInitial: TimelineItem[]
  services: ServiceItem[]
}) {
  const [timeline, setTimeline] = useState<TimelineItem[]>(timelineInitial)
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  const validatedStatuses = new Set(['accepted', 'validated', 'completed'])
  const validatedServices = services.filter((s) => validatedStatuses.has(s.status))
  const total = validatedServices.reduce((acc, s) => acc + Number(s.totalAmount || 0), 0)
  const canGenerate = validatedServices.length > 0

  const onGenerate = () => {
    setError(null)
    startTransition(async () => {
      const res = await generateRunOfShow({ projectSpecId, eventStartTime })
      if (res.error) {
        setError(res.error)
        return
      }
      setTimeline(res.timeline ?? [])
    })
  }

  const exportPdf = () => {
    const doc = new jsPDF()
    let y = 16

    doc.setFontSize(20)
    doc.text('PrestaBridge - Devis Professionnel', 14, y)
    y += 10

    doc.setFontSize(11)
    doc.text(`Date evenement: ${eventDate || '-'}`, 14, y)
    y += 6
    doc.text(`Heure debut: ${eventStartTime || '-'}`, 14, y)
    y += 8

    doc.setFontSize(13)
    doc.text('Services valides', 14, y)
    y += 7
    doc.setFontSize(10)
    validatedServices.forEach((s) => {
      doc.text(`- ${s.title} : ${Number(s.totalAmount || 0).toFixed(2)} EUR`, 16, y)
      y += 5
    })
    y += 3
    doc.setFontSize(11)
    doc.text(`Total: ${total.toFixed(2)} EUR`, 14, y)
    y += 10

    doc.setFontSize(13)
    doc.text('Run-of-Show IA', 14, y)
    y += 7
    doc.setFontSize(10)
    ;(timeline.length ? timeline : [{ time: '--:--', task: 'Aucun planning', description: 'Generez le planning IA.' }]).forEach((t) => {
      const line = `${t.time} - ${t.task}: ${t.description}`
      const wrapped = doc.splitTextToSize(line, 180)
      doc.text(wrapped, 16, y)
      y += 5 * wrapped.length
    })
    y += 6

    doc.setFontSize(9)
    doc.text('CGV simplifiees: Paiement securise PrestaBridge, execution sous validation prestataire, annulation selon conditions contractuelles.', 14, y, { maxWidth: 180 })

    doc.save(`devis-prestabridge-${projectSpecId}.pdf`)
  }

  return (
    <div className="space-y-6">
      <Card className="glass-gold border-gold/30">
        <CardHeader>
          <CardTitle>Smart Run-of-Show</CardTitle>
          <CardDescription>Timeline logistique générée par IA à partir des services validés.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!canGenerate && (
            <p className="text-sm text-muted-foreground">
              Le planning IA se débloque dès qu'au moins un service est validé.
            </p>
          )}
          <Button onClick={onGenerate} disabled={!canGenerate || pending} className="bg-gold-gradient text-background hover:opacity-90">
            {pending ? 'Génération en cours...' : 'Générer le planning IA'}
          </Button>
          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="space-y-3">
            {timeline.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aucune timeline générée pour le moment.</p>
            ) : (
              timeline.map((item, idx) => (
                <div key={`${item.time}-${idx}`} className="rounded-xl border border-gold/20 p-3">
                  <p className="text-sm text-gold font-semibold">{item.time} - {item.task}</p>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="glass-gold border-gold/30">
        <CardHeader>
          <CardTitle>Export Devis Professionnel</CardTitle>
          <CardDescription>Exportez un PDF propre avec services, total, planning et CGV simplifiées.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={exportPdf} className="bg-gold-gradient text-background hover:opacity-90">
            Exporter en PDF
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
