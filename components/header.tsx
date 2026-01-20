"use client"

import { useState, useEffect } from "react"
import { Menu, X, LogOut, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { signOut } from "@/app/actions/auth"
import { useRouter } from "next/navigation"

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const supabase = createClient()
    
    // Vérifier l'état de connexion
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
      if (user) {
        // Récupérer le profil
        supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()
          .then(({ data }) => {
            setProfile(data)
            setLoading(false)
          })
      } else {
        setLoading(false)
      }
    })

    // Écouter les changements d'auth
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single()
          .then(({ data }) => setProfile(data))
      } else {
        setProfile(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const handleSignOut = async () => {
    await signOut()
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-50 glass-gold">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-gold-gradient flex items-center justify-center glow-gold">
                <span className="text-background font-bold text-sm">PB</span>
              </div>
              <span className="text-xl font-serif font-semibold text-foreground">
                Presta<span className="text-gold-gradient">Bridge</span>
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            <Link
              href="#explorer"
              className="text-sm text-muted-foreground hover:text-gold transition-colors"
            >
              Explorer
            </Link>
            <Link
              href="#comment"
              className="text-sm text-muted-foreground hover:text-gold transition-colors"
            >
              Comment ça marche
            </Link>
            <Link
              href="#devenir"
              className="text-sm text-muted-foreground hover:text-gold transition-colors"
            >
              Devenir Prestataire
            </Link>
          </nav>

          {/* CTA Buttons - Desktop */}
          <div className="hidden md:flex items-center gap-3">
            {loading ? (
              <div className="h-9 w-20 bg-secondary animate-pulse rounded-md" />
            ) : user ? (
              <>
                <Button 
                  asChild
                  variant="outline"
                  className="border-gold/30 hover:border-gold"
                >
                  <Link href="/dashboard">
                    <User className="h-4 w-4 mr-2" />
                    Dashboard
                  </Link>
                </Button>
                {profile?.role === 'provider' && (
                  <Button 
                    asChild
                    className="bg-gold-gradient text-background hover:opacity-90 font-medium gold-shimmer glow-gold"
                  >
                    <Link href="/dashboard/provider/create-service">
                      Créer un service
                    </Link>
                  </Button>
                )}
                <form action={handleSignOut}>
                  <Button 
                    type="submit"
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground hover:text-gold"
                  >
                    <LogOut className="h-4 w-4" />
                  </Button>
                </form>
              </>
            ) : (
              <>
                <Button 
                  asChild
                  variant="outline"
                  className="border-gold/30 hover:border-gold"
                >
                  <Link href="/login">Connexion</Link>
                </Button>
                <Button 
                  asChild
                  className="bg-gold-gradient text-background hover:opacity-90 font-medium gold-shimmer glow-gold"
                >
                  <Link href="/login">Inscription</Link>
                </Button>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            type="button"
            className="md:hidden p-2 text-foreground"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? "Fermer le menu" : "Ouvrir le menu"}
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-border">
            <nav className="flex flex-col gap-4">
              <Link
                href="#explorer"
                className="text-sm text-muted-foreground hover:text-gold transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Explorer
              </Link>
              <Link
                href="#comment"
                className="text-sm text-muted-foreground hover:text-gold transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Comment ça marche
              </Link>
              <Link
                href="#devenir"
                className="text-sm text-muted-foreground hover:text-gold transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Devenir Prestataire
              </Link>
              {loading ? (
                <div className="h-12 w-full bg-secondary animate-pulse rounded-md" />
              ) : user ? (
                <>
                  <Button 
                    asChild
                    variant="outline"
                    className="w-full border-gold/30 hover:border-gold"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Link href="/dashboard">
                      <User className="h-4 w-4 mr-2" />
                      Dashboard
                    </Link>
                  </Button>
                  {profile?.role === 'provider' && (
                    <Button 
                      asChild
                      className="bg-gold-gradient text-background hover:opacity-90 font-medium w-full glow-gold"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <Link href="/dashboard/provider/create-service">
                        Créer un service
                      </Link>
                    </Button>
                  )}
                  <form action={handleSignOut} className="w-full">
                    <Button 
                      type="submit"
                      variant="outline"
                      className="w-full"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      Déconnexion
                    </Button>
                  </form>
                </>
              ) : (
                <>
                  <Button 
                    asChild
                    variant="outline"
                    className="w-full border-gold/30 hover:border-gold"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Link href="/login">Connexion</Link>
                  </Button>
                  <Button 
                    asChild
                    className="bg-gold-gradient text-background hover:opacity-90 font-medium w-full glow-gold"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Link href="/login">Inscription</Link>
                  </Button>
                </>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  )
}
