'use client'

import { Button } from '@/components/ui/button'
import { X, Trash2, AlertTriangle } from 'lucide-react'

interface DeleteServiceModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  serviceTitle: string
  isDeleting?: boolean
}

export function DeleteServiceModal({
  isOpen,
  onClose,
  onConfirm,
  serviceTitle,
  isDeleting = false,
}: DeleteServiceModalProps) {
  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />

      {/* Modal */}
      <div
        className="relative z-10 w-full max-w-md glass-gold border-2 border-gold/50 rounded-xl p-6 shadow-2xl glow-gold-strong"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
          disabled={isDeleting}
        >
          <X className="h-5 w-5" />
        </button>

        {/* Content */}
        <div className="space-y-6">
          {/* Icon */}
          <div className="flex justify-center">
            <div className="h-16 w-16 rounded-full bg-red-500/20 border-2 border-red-500/50 flex items-center justify-center">
              <AlertTriangle className="h-8 w-8 text-red-500" />
            </div>
          </div>

          {/* Title */}
          <div className="text-center">
            <h3 className="text-2xl font-serif font-bold text-foreground mb-2">
              Supprimer le service
            </h3>
            <p className="text-muted-foreground">
              Cette action est <span className="text-red-500 font-semibold">irréversible</span>
            </p>
          </div>

          {/* Service name */}
          <div className="p-4 rounded-lg bg-background/50 border border-gold/20">
            <p className="text-sm text-muted-foreground mb-1">Service concerné :</p>
            <p className="font-semibold text-foreground">{serviceTitle}</p>
          </div>

          {/* Warning message */}
          <div className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
            <p className="text-sm text-yellow-700 dark:text-yellow-400">
              Êtes-vous sûr de vouloir supprimer ce service ? Toutes les données associées seront
              définitivement perdues.
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isDeleting}
              className="flex-1 border-gold/30 hover:bg-background/80"
            >
              Annuler
            </Button>
            <Button
              variant="destructive"
              onClick={onConfirm}
              disabled={isDeleting}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white"
            >
              {isDeleting ? (
                'Suppression...'
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Supprimer
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
