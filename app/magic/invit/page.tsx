'use client'

import { useRef, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { generateInvitationContent, sendInvitationTestEmail } from '@/app/actions/ai-invitation'
import { toPng } from 'html-to-image'

type Invitation = {
  headline: string
  body: string
  cta: string
  style: { title: string; subtitle: string }
}

export default function InvitIAPage() {
  const [form, setForm] = useState({
    eventType: 'Soiree privee',
    eventName: 'PrestaBridge Night',
    date: '',
    time: '',
    location: '',
    vibe: 'chic' as 'chic' | 'boheme' | 'electro',
    extraNote: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [invitation, setInvitation] = useState<Invitation | null>(null)
  const [emailStatus, setEmailStatus] = useState<string | null>(null)
  const invitationRef = useRef<HTMLDivElement | null>(null)

  const onGenerate = async () => {
    setLoading(true)
    setError(null)
    setInvitation(null)
    setEmailStatus(null)
    const res = await generateInvitationContent(form)
    setLoading(false)
    if (res.error) return setError(res.error)
    setInvitation(res.invitation ?? null)
  }

  const onDownloadImage = async () => {
    if (!invitationRef.current) return
    try {
      const dataUrl = await toPng(invitationRef.current, { cacheBust: true, pixelRatio: 2 })
      const link = document.createElement('a')
      link.download = `invitation-${Date.now()}.png`
      link.href = dataUrl
      link.click()
    } catch {
      setError("Le téléchargement de l'image a échoué.")
    }
  }

  const onSendTest = async () => {
    if (!invitation) return
    setEmailStatus(null)
    const res = await sendInvitationTestEmail({
      headline: invitation.headline,
      body: invitation.body,
      cta: invitation.cta,
      date: form.date,
      time: form.time,
      location: form.location,
    })
    setEmailStatus(res.error ? res.error : 'Invitation test envoyée sur votre email.')
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-4">
        <Button asChild variant="ghost" className="mb-0">
          <Link href="/magic"><ArrowLeft className="h-4 w-4 mr-2" />Magic Hub</Link>
        </Button>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="glass-gold border-gold/30">
          <CardHeader>
            <CardTitle>Invit'IA</CardTitle>
            <CardDescription>Générez une invitation premium en quelques secondes.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Nom de l'événement</Label>
              <Input value={form.eventName} onChange={(e) => setForm({ ...form, eventName: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Type d'événement</Label>
              <Input value={form.eventType} onChange={(e) => setForm({ ...form, eventType: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Date</Label>
                <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Heure</Label>
                <Input type="time" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Lieu</Label>
              <Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Ambiance visuelle</Label>
              <Select value={form.vibe} onValueChange={(value) => setForm({ ...form, vibe: value as any })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="chic">Chic</SelectItem>
                  <SelectItem value="boheme">Bohème</SelectItem>
                  <SelectItem value="electro">Electro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Note additionnelle</Label>
              <Textarea value={form.extraNote} onChange={(e) => setForm({ ...form, extraNote: e.target.value })} />
            </div>
            <Button className="w-full h-12 bg-gold-gradient text-background hover:opacity-90" onClick={onGenerate} disabled={loading}>
              {loading ? "L'IA compose votre invitation..." : "Générer mon invitation"}
            </Button>
            {error && <p className="text-sm text-destructive">{error}</p>}
          </CardContent>
        </Card>

        <Card className="glass-gold border-gold/30 overflow-hidden">
          <CardHeader>
            <CardTitle>Aperçu carte invitation</CardTitle>
            <CardDescription>Template Dark Luxury prêt à partager.</CardDescription>
          </CardHeader>
          <CardContent>
            <div ref={invitationRef} className="rounded-2xl border border-gold/30 bg-gradient-to-br from-[#111111] via-[#1a1a1a] to-[#0f0f0f] p-6 md:p-8 text-center min-h-[420px] flex flex-col justify-center">
              {invitation ? (
                <>
                  <p className="text-xs uppercase tracking-[0.2em] text-gold/80 mb-2">{invitation.style.title}</p>
                  <h2 className="text-3xl font-serif text-white mb-2">{invitation.headline}</h2>
                  <p className="text-gold/80 text-sm mb-6">{invitation.style.subtitle}</p>
                  <p className="text-muted-foreground leading-relaxed mb-6">{invitation.body}</p>
                  <div className="text-sm text-muted-foreground mb-6">
                    {form.date || 'Date'} - {form.time || 'Heure'}<br />
                    {form.location || 'Lieu'}
                  </div>
                  <div className="inline-flex mx-auto px-4 py-2 rounded-full border border-gold/40 text-gold text-sm">
                    {invitation.cta}
                  </div>
                </>
              ) : (
                <p className="text-muted-foreground">
                  L'aperçu apparaîtra ici après génération de votre invitation.
                </p>
              )}
            </div>
            {invitation && (
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                <Button variant="outline" className="border-gold/40 text-gold hover:bg-gold/10" onClick={onDownloadImage}>
                  Télécharger en Image
                </Button>
                <Button className="bg-gold-gradient text-background hover:opacity-90" onClick={onSendTest}>
                  M'envoyer un test
                </Button>
              </div>
            )}
            {emailStatus && <p className="text-sm text-muted-foreground mt-3">{emailStatus}</p>}
          </CardContent>
        </Card>
        </div>
      </div>
    </div>
  )
}
