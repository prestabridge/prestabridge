'use client'

import { Suspense, useEffect, useState } from 'react'
import { updateUserRole } from '@/app/actions/auth'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Sparkles, User, Briefcase, ArrowRight, Check } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'

function OnboardingContent() {
  const [selectedRole, setSelectedRole] = useState<'client' | 'provider' | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const [quickPrefill, setQuickPrefill] = useState<{
    eventType: string
    location: string
    budget: string
    date: string
  } | null>(null)
  const [autoRouting, setAutoRouting] = useState(false)

  useEffect(() => {
    const prefill = {
      eventType: searchParams.get('eventType') || '',
      location: searchParams.get('location') || '',
      budget: searchParams.get('budget') || '',
      date: searchParams.get('date') || '',
    }
    const hasPrefill =
      Boolean(prefill.eventType) ||
      Boolean(prefill.location) ||
      Boolean(prefill.budget) ||
      Boolean(prefill.date)

    if (!hasPrefill) return

    setQuickPrefill(prefill)
    sessionStorage.setItem('quickConfiguratorPrefill', JSON.stringify(prefill))
    localStorage.setItem('quickConfiguratorPrefill', JSON.stringify(prefill))

    let mounted = true
    const routeAsClient = async () => {
      setAutoRouting(true)
      try {
        await updateUserRole('client')
      } finally {
        if (mounted) router.replace('/dashboard/configurator')
      }
    }
    void routeAsClient()

    return () => {
      mounted = false
    }
  }, [searchParams])

  const handleContinue = async () => {
    if (!selectedRole) return

    setLoading(true)
    try {
      const result = await updateUserRole(selectedRole)
      if (result.error) {
        alert(result.error)
      } else {
        // Redirection selon le rôle choisi
        if (selectedRole === 'client') {
          const params = new URLSearchParams()
          if (quickPrefill?.eventType) params.set('eventType', quickPrefill.eventType)
          if (quickPrefill?.location) params.set('location', quickPrefill.location)
          if (quickPrefill?.budget) params.set('budget', quickPrefill.budget)
          if (quickPrefill?.date) params.set('date', quickPrefill.date)
          router.push(`/dashboard/configurator${params.toString() ? `?${params.toString()}` : ''}`)
        } else {
          // Prestataire : rediriger vers la création de service
          router.push('/dashboard/provider/create-service')
        }
      }
    } catch (err) {
      alert('Une erreur est survenue')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 md:p-8">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gold/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gold/5 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-2xl">
        {autoRouting && (
          <div className="mb-4 rounded-xl border border-gold/30 bg-gold/5 p-4 text-sm text-muted-foreground">
            Nous préparons votre configurateur avec vos critères...
          </div>
        )}

        {/* Mobile: Full width */}
        <div className="md:hidden mb-8 text-center">
          <div className="inline-flex items-center justify-center mb-4">
            <div className="h-12 w-12 rounded-xl bg-gold-gradient flex items-center justify-center glow-gold">
              <Sparkles className="h-6 w-6 text-background" />
            </div>
          </div>
          <h1 className="text-3xl font-serif font-bold text-foreground mb-2">
            Choisissez votre rôle
          </h1>
          <p className="text-muted-foreground">
            Comment souhaitez-vous utiliser PrestaBridge ?
          </p>
        </div>

        {/* Desktop: Card with glassmorphism */}
        <Card className="hidden md:block glass-gold glow-gold-strong border-gold/30 mb-6">
          <CardHeader className="text-center pb-6">
            <div className="inline-flex items-center justify-center mb-4">
              <div className="h-16 w-16 rounded-xl bg-gold-gradient flex items-center justify-center glow-gold">
                <Sparkles className="h-8 w-8 text-background" />
              </div>
            </div>
            <CardTitle className="text-3xl font-serif font-bold">
              Choisissez votre rôle
            </CardTitle>
            <CardDescription className="text-base mt-2">
              Comment souhaitez-vous utiliser PrestaBridge ?
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Role selection cards */}
        {quickPrefill && (
          <div className="mb-6 rounded-xl border border-gold/30 bg-gold/5 p-4 text-sm text-muted-foreground">
            Pré-remplissage détecté : {quickPrefill.eventType || 'Type libre'} - {quickPrefill.location || 'Lieu libre'} - Budget {quickPrefill.budget || '?'} - {quickPrefill.date || 'Date libre'}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-6">
          {/* Client Card */}
          <Card
            className={`cursor-pointer transition-all hover-glow ${
              selectedRole === 'client'
                ? 'border-gold bg-gold/5 glow-gold'
                : 'border-border hover:border-gold/50'
            }`}
            onClick={() => setSelectedRole('client')}
          >
            <CardContent className="p-6 md:p-8">
              <div className="flex flex-col items-center text-center space-y-4">
                <div
                  className={`h-16 w-16 rounded-full flex items-center justify-center transition-all ${
                    selectedRole === 'client'
                      ? 'bg-gold-gradient glow-gold'
                      : 'bg-secondary'
                  }`}
                >
                  <User
                    className={`h-8 w-8 ${
                      selectedRole === 'client' ? 'text-background' : 'text-foreground'
                    }`}
                  />
                </div>
                <div>
                  <h3 className="text-xl font-serif font-bold mb-2">Client</h3>
                  <p className="text-sm text-muted-foreground">
                    Je cherche un service pour mon événement
                  </p>
                </div>
                {selectedRole === 'client' && (
                  <div className="flex items-center gap-2 text-gold">
                    <Check className="h-5 w-5" />
                    <span className="text-sm font-medium">Sélectionné</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Provider Card */}
          <Card
            className={`cursor-pointer transition-all hover-glow ${
              selectedRole === 'provider'
                ? 'border-gold bg-gold/5 glow-gold'
                : 'border-border hover:border-gold/50'
            }`}
            onClick={() => setSelectedRole('provider')}
          >
            <CardContent className="p-6 md:p-8">
              <div className="flex flex-col items-center text-center space-y-4">
                <div
                  className={`h-16 w-16 rounded-full flex items-center justify-center transition-all ${
                    selectedRole === 'provider'
                      ? 'bg-gold-gradient glow-gold'
                      : 'bg-secondary'
                  }`}
                >
                  <Briefcase
                    className={`h-8 w-8 ${
                      selectedRole === 'provider' ? 'text-background' : 'text-foreground'
                    }`}
                  />
                </div>
                <div>
                  <h3 className="text-xl font-serif font-bold mb-2">Prestataire</h3>
                  <p className="text-sm text-muted-foreground">
                    Je propose un service (DJ, Traiteur, Lieu...)
                  </p>
                </div>
                {selectedRole === 'provider' && (
                  <div className="flex items-center gap-2 text-gold">
                    <Check className="h-5 w-5" />
                    <span className="text-sm font-medium">Sélectionné</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Continue button */}
        <Button
          onClick={handleContinue}
          disabled={!selectedRole || loading}
          className="w-full h-12 md:h-11 bg-gold-gradient text-background hover:opacity-90 font-medium gold-shimmer glow-gold text-base disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            'Chargement...'
          ) : (
            <>
              Continuer
              <ArrowRight className="h-5 w-5 md:h-4 md:w-4 ml-2" />
            </>
          )}
        </Button>
      </div>
    </div>
  )
}

export default function OnboardingPage() {
  return (
    <Suspense fallback={<div>Chargement...</div>}>
      <OnboardingContent />
    </Suspense>
  )
}
