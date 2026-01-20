'use client'

import { useEffect, useState } from 'react'
import { CheckCircle2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function BookingSuccessBanner() {
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    // Masquer automatiquement après 5 secondes
    const timer = setTimeout(() => {
      setIsVisible(false)
    }, 5000)

    return () => clearTimeout(timer)
  }, [])

  if (!isVisible) return null

  return (
    <div className="mb-6 p-4 rounded-lg bg-green-500/10 border border-green-500/20 flex items-center justify-between animate-in slide-in-from-top">
      <div className="flex items-center gap-3">
        <CheckCircle2 className="h-5 w-5 text-green-500" />
        <p className="text-sm font-medium text-green-700 dark:text-green-400">
          Votre demande a bien été envoyée !
        </p>
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsVisible(false)}
        className="h-8 w-8 p-0"
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  )
}
