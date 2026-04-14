import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Configurator } from '@/components/configurator'

export default async function DashboardConfiguratorPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login?redirect=/dashboard/configurator')
  }

  return (
    <div className="min-h-screen bg-background px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex items-center justify-between gap-3">
          <h1 className="text-2xl font-serif font-bold text-foreground">
            Configurateur <span className="text-gold-gradient">Événement</span>
          </h1>
          <Button asChild variant="outline" className="border-gold/40 hover:border-gold">
            <Link href="/dashboard">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Retour au Dashboard
            </Link>
          </Button>
        </div>

        <Configurator mode="ai-pack" />
      </div>
    </div>
  )
}
