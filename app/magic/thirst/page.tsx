'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { calculateThirstPlan, saveDrinksPlanToProject } from '@/app/actions/ai-thirst'

type ThirstResult = {
  waterLiters: number
  softDrinksLiters: number
  juiceLiters: number
  beerLiters: number
  wineBottles: number
  spiritsBottles: number
  iceKg: number
}

export default function ThirstPage() {
  const [guests, setGuests] = useState('100')
  const [durationHours, setDurationHours] = useState('6')
  const [vibe, setVibe] = useState<'soft' | 'festive' | 'party-hard'>('festive')
  const [weather, setWeather] = useState<'normal' | 'hot'>('normal')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<ThirstResult | null>(null)
  const [saveMessage, setSaveMessage] = useState<string | null>(null)

  const onCalculate = async () => {
    setLoading(true)
    setError(null)
    setSaveMessage(null)
    setResult(null)
    const res = await calculateThirstPlan({
      guests: Number(guests),
      durationHours: Number(durationHours),
      vibe,
      weather,
    })
    setLoading(false)
    if (res.error) return setError(res.error)
    setResult(res.result ?? null)
  }

  const onSaveToProject = async () => {
    if (!result) return
    setSaveMessage(null)
    const res = await saveDrinksPlanToProject(result)
    if (res.error) {
      setSaveMessage(res.error)
      return
    }
    setSaveMessage('Plan boissons ajouté à votre projet avec succès.')
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center">
          <h1 className="text-3xl md:text-4xl font-serif font-bold">
            Thirst <span className="text-gold-gradient">Calculator</span>
          </h1>
          <p className="text-muted-foreground mt-2">
            Estimation intelligente des quantités de boissons pour éviter le gaspillage... et la panne de stock.
          </p>
        </div>

        <Card className="glass-gold border-gold/30">
          <CardHeader>
            <CardTitle>Paramètres de l'événement</CardTitle>
            <CardDescription>Renseignez les données clés puis lancez le calcul.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Nombre d'invités</Label>
              <Input type="number" min="1" value={guests} onChange={(e) => setGuests(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Durée (heures)</Label>
              <Input type="number" min="1" value={durationHours} onChange={(e) => setDurationHours(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Vibe</Label>
              <Select value={vibe} onValueChange={(v) => setVibe(v as any)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="soft">Calme</SelectItem>
                  <SelectItem value="festive">Festive</SelectItem>
                  <SelectItem value="party-hard">Party hard</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Météo</Label>
              <Select value={weather} onValueChange={(v) => setWeather(v as any)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="normal">Normale</SelectItem>
                  <SelectItem value="hot">Chaude</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-2">
              <Button
                className="w-full h-12 bg-gold-gradient text-background hover:opacity-90"
                onClick={onCalculate}
                disabled={loading}
              >
                {loading ? 'Calcul intelligent en cours...' : 'Calculer mes quantités'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {error && (
          <Card className="border-destructive/30 bg-destructive/5">
            <CardContent className="p-4 text-sm text-destructive">{error}</CardContent>
          </Card>
        )}

        {result && (
          <Card className="glass-gold border-gold/30">
            <CardHeader>
              <CardTitle>Plan de boissons recommandé</CardTitle>
              <CardDescription>Projection IA basée sur vos paramètres.</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
              <div className="rounded-lg border border-gold/20 p-3"><strong>{result.waterLiters}L</strong><p className="text-muted-foreground">Eau</p></div>
              <div className="rounded-lg border border-gold/20 p-3"><strong>{result.softDrinksLiters}L</strong><p className="text-muted-foreground">Softs</p></div>
              <div className="rounded-lg border border-gold/20 p-3"><strong>{result.juiceLiters}L</strong><p className="text-muted-foreground">Jus</p></div>
              <div className="rounded-lg border border-gold/20 p-3"><strong>{result.beerLiters}L</strong><p className="text-muted-foreground">Bière</p></div>
              <div className="rounded-lg border border-gold/20 p-3"><strong>{result.wineBottles}</strong><p className="text-muted-foreground">Bouteilles vin</p></div>
              <div className="rounded-lg border border-gold/20 p-3"><strong>{result.spiritsBottles}</strong><p className="text-muted-foreground">Bouteilles spiritueux</p></div>
              <div className="rounded-lg border border-gold/20 p-3 col-span-2 md:col-span-3"><strong>{result.iceKg}kg</strong><p className="text-muted-foreground">Glaçons</p></div>
            </CardContent>
            <div className="px-6 pb-6">
              <Button onClick={onSaveToProject} className="w-full h-12 bg-gold-gradient text-background hover:opacity-90">
                Ajouter à mon projet
              </Button>
              {saveMessage && <p className="text-sm mt-3 text-muted-foreground">{saveMessage}</p>}
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}
