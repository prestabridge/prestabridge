'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Sparkles, ArrowRight, RefreshCw, CheckCircle2, AlertTriangle, Euro, Calendar, MapPin } from 'lucide-react'
import { createManualPaymentIntentForScene } from '@/app/actions/payments'

// Types pour le draft
type Service = {
  id: string
  title: string
  description: string
  category: string
  city: string
  price_fixed: number | null
  price_per_day: number | null
  price_per_hour: number | null
  images: string[] | null
  profiles: { first_name: string; last_name: string }
}

type DraftCategory = {
  main: Service
  backups: Service[]
}

type ProjectDraft = {
  specId: string
  draft: Record<string, DraftCategory>
  totalEstimated: number
  upgradeProposed: boolean
  message: string
}

function ResultsContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const specId = searchParams.get('specId')
  
  const [projectDraft, setProjectDraft] = useState<ProjectDraft | null>(null)
  const [selectedServices, setSelectedServices] = useState<Record<string, Service>>({})
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [validating, setValidating] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  // Budget global simulé (puisqu'il n'est pas dans le retour direct, on pourrait le stocker ou le déduire, 
  // mais on va le passer via le sessionStorage ou le récupérer de la DB plus tard. 
  // Pour l'instant on utilise une valeur par défaut ou on le déduit si on peut)
  const [budgetGlobal, setBudgetGlobal] = useState<number>(5000)

  useEffect(() => {
    const storedDraft = sessionStorage.getItem('projectDraft')
    if (storedDraft) {
      try {
        const parsed: ProjectDraft = JSON.parse(storedDraft)
        setProjectDraft(parsed)
        
        // Initialiser les services sélectionnés avec les "main"
        const initialSelections: Record<string, Service> = {}
        let initialTotal = 0
        Object.entries(parsed.draft).forEach(([category, data]) => {
          initialSelections[category] = data.main
          // Calcul basique du prix
          const price = data.main.price_fixed || data.main.price_per_day || (data.main.price_per_hour ? data.main.price_per_hour * 5 : 0)
          initialTotal += price
        })
        setSelectedServices(initialSelections)
        
        // Si upgradeProposed est vrai, on déduit que le budget global était inférieur au total estimé
        // Pour l'UI on va juste utiliser le total initial estimé pour la barre de progression
        if (parsed.upgradeProposed) {
          setBudgetGlobal(parsed.totalEstimated * 0.8) // Approximation du budget initial
        } else {
          setBudgetGlobal(parsed.totalEstimated * 1.2) // Approximation
        }

      } catch (e) {
        console.error("Erreur de parsing du draft", e)
      }
    }
    setLoading(false)
  }, [])

  // Calcul dynamique du total actuel basé sur les sélections
  const currentTotal = Object.values(selectedServices).reduce((acc, service) => {
    const price = service.price_fixed || service.price_per_day || (service.price_per_hour ? service.price_per_hour * 5 : 0)
    return acc + price
  }, 0)

  const budgetPercentage = Math.min((currentTotal / budgetGlobal) * 100, 100)
  const isOverBudget = currentTotal > budgetGlobal

  const handleSwapService = (category: string, newService: Service) => {
    setSelectedServices(prev => ({
      ...prev,
      [category]: newService
    }))
    setExpandedCategory(null) // Fermer le panneau de swap
  }

  const handleValidateScene = async () => {
    setValidating(true)
    setSubmitError(null)
    try {
      if (!projectDraft?.specId) {
        setSubmitError('Projet invalide, veuillez relancer le configurateur.')
        setValidating(false)
        return
      }

      const result = await createManualPaymentIntentForScene({
        projectSpecId: projectDraft.specId,
        selectedServices: Object.values(selectedServices).map((s) => ({
          id: s.id,
          title: s.title,
          category: s.category,
          price_fixed: s.price_fixed,
          price_per_day: s.price_per_day,
          price_per_hour: s.price_per_hour,
        })),
        cascadeByCategory: Object.fromEntries(
          Object.entries(projectDraft.draft).map(([category, data]) => [
            category,
            [data.main.id, ...data.backups.map((b) => b.id)],
          ])
        ),
      })

      if (result.error || !result.paymentIntentId) {
        setSubmitError(result.error ?? 'Impossible de lancer le paiement.')
        setValidating(false)
        return
      }

      sessionStorage.removeItem('quickConfiguratorPrefill')
      localStorage.removeItem('quickConfiguratorPrefill')

      router.push(`/checkout?pi=${encodeURIComponent(result.paymentIntentId)}`)
    } catch (error) {
      console.error("Erreur lors de la validation", error)
      setSubmitError("Une erreur est survenue lors de l'initialisation du paiement.")
      setValidating(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-gold border-t-transparent"></div>
      </div>
    )
  }

  if (!projectDraft) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
        <h2 className="text-2xl font-serif font-bold mb-2">Aucun projet trouvé</h2>
        <p className="text-muted-foreground mb-6">Veuillez repasser par le configurateur.</p>
        <Button onClick={() => router.push('/')} className="bg-gold-gradient text-background">
          Retour à l'accueil
        </Button>
      </div>
    )
  }

  const formatCategory = (cat: string) => {
    return cat.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Background decorative elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-gold/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-gold/5 rounded-full blur-3xl" />
      </div>

      <div className="max-w-5xl mx-auto px-4 pt-12 relative z-10">
        
        {/* 1. L'ENTÊTE (RÉSUMÉ & BUDGET) */}
        <div className="mb-10 text-center space-y-4">
          <div className="inline-flex items-center justify-center mb-2">
            <div className="h-16 w-16 rounded-2xl bg-gold-gradient flex items-center justify-center glow-gold shadow-xl">
              <Sparkles className="h-8 w-8 text-background" />
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-foreground">
            Votre Scène <span className="text-gold-gradient">Idéale</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Notre IA a composé l'équipe parfaite pour votre événement. Vous pouvez ajuster les prestataires selon vos préférences.
          </p>
        </div>

        <Card className="glass-gold border-gold/30 mb-8 glow-gold-strong">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row justify-between items-center gap-6">
              <div className="space-y-1 text-center md:text-left">
                <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Budget Estimé</h3>
                <div className="text-3xl font-bold text-foreground flex items-center gap-2">
                  {currentTotal} €
                  {isOverBudget && <AlertTriangle className="h-5 w-5 text-destructive" />}
                </div>
                <p className="text-sm text-muted-foreground">sur {budgetGlobal} € prévus</p>
              </div>
              
              <div className="w-full md:w-1/2 space-y-2">
                <div className="flex justify-between text-sm font-medium">
                  <span className={isOverBudget ? "text-destructive" : "text-gold"}>
                    {budgetPercentage.toFixed(0)}%
                  </span>
                  <span className="text-muted-foreground">100%</span>
                </div>
                <Progress 
                  value={budgetPercentage} 
                  className="h-3 bg-secondary"
                  indicatorClassName={isOverBudget ? "bg-destructive" : "bg-gold-gradient"}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 3. MODULE UPGRADE BUDGET */}
        {projectDraft.upgradeProposed && (
          <Alert className="mb-8 border-gold/50 bg-gold/10 text-foreground">
            <Sparkles className="h-5 w-5 text-gold" />
            <AlertTitle className="text-lg font-serif font-bold text-gold flex items-center gap-2">
              Proposition Premium
            </AlertTitle>
            <AlertDescription className="mt-2 text-sm leading-relaxed">
              {projectDraft.message}
              <div className="mt-4 flex gap-3">
                <Button variant="outline" className="border-gold text-gold hover:bg-gold/10">
                  Rester dans mon budget (Backups)
                </Button>
                <Button className="bg-gold-gradient text-background glow-gold">
                  Valider l'Upgrade
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* 2. SCENE ORGANIZER (HYBRIDE & MANIPULABLE) */}
        <div className="space-y-8 mb-12">
          <h2 className="text-2xl font-serif font-bold border-b border-gold/20 pb-2">
            Les Prestataires Sélectionnés
          </h2>
          
          <div className="grid gap-6">
            {Object.entries(projectDraft.draft).map(([category, data]) => {
              const currentService = selectedServices[category]
              const isExpanded = expandedCategory === category
              
              return (
                <div key={category} className="relative">
                  {/* Label de la catégorie */}
                  <div className="absolute -top-3 left-4 z-20">
                    <span className="bg-background border border-gold/30 text-gold text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-sm">
                      {formatCategory(category)}
                    </span>
                  </div>

                  <Card className={`glass-gold border-gold/30 overflow-hidden transition-all duration-300 ${isExpanded ? 'ring-2 ring-gold/50 shadow-xl' : 'hover:border-gold/50'}`}>
                    <div className="flex flex-col md:flex-row">
                      {/* Affichage du service sélectionné (style horizontal) */}
                      <div className="flex-1 p-6 pt-8 flex flex-col md:flex-row gap-6 items-start md:items-center">
                        <div className="w-full md:w-48 h-32 relative rounded-lg overflow-hidden bg-secondary flex-shrink-0">
                          {currentService.images && currentService.images.length > 0 ? (
                            <img src={currentService.images[0]} alt={currentService.title} className="object-cover w-full h-full" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Sparkles className="h-8 w-8 text-gold/50" />
                            </div>
                          )}
                        </div>
                        
                        <div className="flex-1 space-y-2">
                          <h3 className="text-xl font-bold font-serif">{currentService.title}</h3>
                          <p className="text-sm text-muted-foreground line-clamp-2">{currentService.description}</p>
                          <div className="flex items-center gap-4 pt-2">
                            <span className="flex items-center gap-1 text-sm text-muted-foreground">
                              <MapPin className="h-4 w-4 text-gold" /> {currentService.city}
                            </span>
                            <span className="flex items-center gap-1 text-sm font-bold text-gold">
                              <Euro className="h-4 w-4" /> 
                              {currentService.price_fixed || currentService.price_per_day || currentService.price_per_hour}
                              {currentService.price_per_hour ? '€/h' : '€'}
                            </span>
                          </div>
                        </div>

                        <div className="w-full md:w-auto flex justify-end">
                          <Button 
                            variant="outline" 
                            className="w-full md:w-auto border-gold/50 text-foreground hover:bg-gold/10 hover:text-gold transition-colors"
                            onClick={() => setExpandedCategory(isExpanded ? null : category)}
                          >
                            <RefreshCw className={`h-4 w-4 mr-2 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
                            {isExpanded ? 'Fermer' : 'Remplacer'}
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* Panneau des Backups (Disponibilité en cascade) */}
                    {isExpanded && data.backups.length > 0 && (
                      <div className="bg-secondary/30 border-t border-gold/20 p-6 animate-in slide-in-from-top-2 duration-300">
                        <h4 className="text-sm font-medium text-muted-foreground mb-4 uppercase tracking-wider">
                          Alternatives Disponibles
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* On inclut aussi le "main" original s'il n'est plus sélectionné */}
                          {[data.main, ...data.backups].filter(s => s.id !== currentService.id).map((backup) => (
                            <Card key={backup.id} className="bg-background border-border hover:border-gold/50 transition-colors cursor-pointer group" onClick={() => handleSwapService(category, backup)}>
                              <CardContent className="p-4 flex gap-4 items-center">
                                <div className="w-16 h-16 relative rounded-md overflow-hidden bg-secondary flex-shrink-0">
                                  {backup.images && backup.images.length > 0 ? (
                                    <img src={backup.images[0]} alt={backup.title} className="object-cover w-full h-full" />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                      <Sparkles className="h-4 w-4 text-gold/50" />
                                    </div>
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h5 className="font-bold text-sm truncate group-hover:text-gold transition-colors">{backup.title}</h5>
                                  <p className="text-xs text-muted-foreground truncate">{backup.city}</p>
                                  <p className="text-sm font-semibold text-gold mt-1">
                                    {backup.price_fixed || backup.price_per_day || backup.price_per_hour}
                                    {backup.price_per_hour ? '€/h' : '€'}
                                  </p>
                                </div>
                                <div className="flex-shrink-0">
                                  <Button size="sm" variant="ghost" className="text-gold hover:text-gold hover:bg-gold/10">
                                    Choisir
                                  </Button>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </div>
                    )}
                  </Card>
                </div>
              )
            })}
          </div>
        </div>

        {/* 4. ACTION FINALE */}
        <div className="sticky bottom-6 z-50">
          <div className="glass-gold border border-gold/30 rounded-2xl p-4 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-4 glow-gold-strong">
            <div className="text-center md:text-left">
              <p className="text-sm text-muted-foreground">Total de votre scène</p>
              <p className="text-2xl font-bold text-foreground">{currentTotal} €</p>
            </div>
            <Button 
              size="lg"
              onClick={handleValidateScene}
              disabled={validating}
              className="w-full md:w-auto bg-gold-gradient text-background hover:opacity-90 font-bold text-lg px-8 py-6 rounded-xl glow-gold transition-all hover:scale-105 gold-shimmer"
            >
              {validating ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-background border-t-transparent mr-2"></div>
                  Validation en cours...
                </>
              ) : (
                <>
                  Valider et Contacter les Prestataires
                  <CheckCircle2 className="ml-2 h-6 w-6" />
                </>
              )}
            </Button>
          </div>
          {submitError && (
            <p className="mt-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg p-3">
              {submitError}
            </p>
          )}
        </div>

      </div>
    </div>
  )
}

export default function ResultsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-gold border-t-transparent"></div>
      </div>
    }>
      <ResultsContent />
    </Suspense>
  )
}
