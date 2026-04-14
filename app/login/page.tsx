'use client'

import { Suspense, useState, useEffect } from 'react'
import { signIn, signUp } from '@/app/actions/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Sparkles, Mail, Lock, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'

function LoginContent() {
  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [redirectPath, setRedirectPath] = useState<string | null>(null)
  const router = useRouter()
  const searchParams = useSearchParams()

  // Récupérer le paramètre redirect depuis l'URL
  useEffect(() => {
    const redirect = searchParams.get('redirect')
    if (redirect) {
      setRedirectPath(redirect)
    }
  }, [searchParams])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const result = isSignUp
        ? await signUp(email, password)
        : await signIn(email, password)

      if (result.error) {
        setError(result.error)
      } else {
        // Rediriger selon le contexte
        if (isSignUp) {
          router.push(redirectPath || '/onboarding')
        } else if (redirectPath) {
          router.push(redirectPath)
        } else {
          router.push('/dashboard')
        }
      }
    } catch (err) {
      setError('Une erreur est survenue')
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

      {/* Mobile: Full width form */}
      <div className="w-full max-w-md md:hidden">
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center mb-4">
            <div className="h-12 w-12 rounded-xl bg-gold-gradient flex items-center justify-center glow-gold">
              <Sparkles className="h-6 w-6 text-background" />
            </div>
          </div>
          <h1 className="text-3xl font-serif font-bold text-foreground mb-2">
            Presta<span className="text-gold-gradient">Bridge</span>
          </h1>
          <p className="text-muted-foreground">
            {isSignUp ? 'Créez votre compte' : 'Connectez-vous à votre compte'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium text-foreground flex items-center gap-2">
              <Mail className="h-4 w-4 text-gold" />
              Email
            </label>
            <Input
              id="email"
              type="email"
              placeholder="votre@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="h-12 text-base"
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium text-foreground flex items-center gap-2">
              <Lock className="h-4 w-4 text-gold" />
              Mot de passe
            </label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="h-12 text-base"
              disabled={loading}
            />
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full h-12 bg-gold-gradient text-background hover:opacity-90 font-medium gold-shimmer glow-gold text-base"
          >
            {loading ? (
              'Chargement...'
            ) : (
              <>
                {isSignUp ? 'Créer mon compte' : 'Se connecter'}
                <ArrowRight className="h-5 w-5 ml-2" />
              </>
            )}
          </Button>

          <div className="text-center pt-4">
            <button
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp)
                setError(null)
              }}
              className="text-sm text-muted-foreground hover:text-gold transition-colors"
            >
              {isSignUp ? (
                <>Déjà un compte ? <span className="text-gold font-medium">Se connecter</span></>
              ) : (
                <>Pas encore de compte ? <span className="text-gold font-medium">S'inscrire</span></>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Desktop: Centered card with glassmorphism */}
      <Card className="hidden md:block w-full max-w-md glass-gold glow-gold-strong border-gold/30">
        <CardHeader className="text-center pb-6">
          <div className="inline-flex items-center justify-center mb-4">
            <div className="h-16 w-16 rounded-xl bg-gold-gradient flex items-center justify-center glow-gold">
              <Sparkles className="h-8 w-8 text-background" />
            </div>
          </div>
          <CardTitle className="text-3xl font-serif font-bold">
            Presta<span className="text-gold-gradient">Bridge</span>
          </CardTitle>
          <CardDescription className="text-base mt-2">
            {isSignUp ? 'Créez votre compte premium' : 'Bienvenue, connectez-vous'}
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <label htmlFor="email-desktop" className="text-sm font-medium text-foreground flex items-center gap-2">
                <Mail className="h-4 w-4 text-gold" />
                Email
              </label>
              <Input
                id="email-desktop"
                type="email"
                placeholder="votre@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-11"
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="password-desktop" className="text-sm font-medium text-foreground flex items-center gap-2">
                <Lock className="h-4 w-4 text-gold" />
                Mot de passe
              </label>
              <Input
                id="password-desktop"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="h-11"
                disabled={loading}
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-11 bg-gold-gradient text-background hover:opacity-90 font-medium gold-shimmer glow-gold"
            >
              {loading ? (
                'Chargement...'
              ) : (
                <>
                  {isSignUp ? 'Créer mon compte' : 'Se connecter'}
                  <ArrowRight className="h-4 w-4 ml-2" />
                </>
              )}
            </Button>

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => {
                  setIsSignUp(!isSignUp)
                  setError(null)
                }}
                className="text-sm text-muted-foreground hover:text-gold transition-colors"
              >
                {isSignUp ? (
                  <>Déjà un compte ? <span className="text-gold font-medium">Se connecter</span></>
                ) : (
                  <>Pas encore de compte ? <span className="text-gold font-medium">S'inscrire</span></>
                )}
              </button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div>Chargement...</div>}>
      <LoginContent />
    </Suspense>
  )
}
