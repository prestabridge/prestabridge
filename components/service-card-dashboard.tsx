'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { MapPin, Euro, Sparkles, Edit, Trash2 } from 'lucide-react'
import Image from 'next/image'
import { deleteService } from '@/app/actions/services'
import { useRouter } from 'next/navigation'
import { DeleteServiceModal } from '@/components/delete-service-modal'

interface ServiceCardDashboardProps {
  id: string
  title: string
  description: string
  category: string
  city: string
  price_per_hour?: number | null
  price_per_day?: number | null
  price_fixed?: number | null
  price_start?: number | null
  images?: string[] | null
  is_active?: boolean
}

export function ServiceCardDashboard({
  id,
  title,
  description,
  category,
  city,
  price_per_hour,
  price_per_day,
  price_fixed,
  price_start,
  images,
  is_active,
}: ServiceCardDashboardProps) {
  const router = useRouter()
  const [deleting, setDeleting] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)

  // Déterminer le prix à afficher
  const displayPrice = price_fixed
    ? `${price_fixed}€`
    : price_per_day
    ? `${price_per_day}€/jour`
    : price_per_hour
    ? `${price_per_hour}€/h`
    : price_start
    ? `À partir de ${price_start}€`
    : 'Prix sur demande'

  // Image par défaut si aucune image n'est fournie
  const imageUrl = images && images.length > 0 ? images[0] : null

  // Formater la catégorie pour l'affichage
  const formatCategory = (cat: string) => {
    return cat
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      const result = await deleteService(id)
      
      if (result.error) {
        alert(`Erreur : ${result.error}`)
        setDeleting(false)
        return
      }
      
      // Fermer la modale immédiatement
      setShowDeleteModal(false)
      
      // Rediriger vers le dashboard pour forcer le rechargement
      router.push('/dashboard')
      router.refresh()
    } catch (err) {
      console.error('Erreur lors de la suppression:', err)
      alert('Une erreur est survenue lors de la suppression')
      setDeleting(false)
    }
  }

  return (
    <Card className="border-gold/20 hover-glow transition-all duration-300 overflow-hidden h-full flex flex-col relative">
      {/* Boutons d'action en haut à droite */}
      <div className="absolute top-2 right-2 z-10 flex gap-2">
        <Button
          size="sm"
          variant="secondary"
          className="h-8 w-8 p-0 bg-background/80 backdrop-blur-sm hover:bg-background"
          onClick={(e) => {
            e.preventDefault()
            router.push(`/dashboard/provider/edit/${id}`)
          }}
          disabled={deleting}
          title="Modifier"
        >
          <Edit className="h-4 w-4" />
        </Button>
        <Button
          size="sm"
          variant="destructive"
          className="h-8 w-8 p-0 bg-destructive/80 backdrop-blur-sm hover:bg-destructive"
          onClick={(e) => {
            e.preventDefault()
            setShowDeleteModal(true)
          }}
          disabled={deleting}
          title="Supprimer"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      {/* Modale de suppression */}
      <DeleteServiceModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        serviceTitle={title}
        isDeleting={deleting}
      />

      {/* Image */}
      <div className="relative w-full h-48 md:h-56 overflow-hidden bg-gradient-to-br from-gold/20 to-gold/5">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={title}
            fill
            className="object-cover object-center"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[oklch(0.78_0.11_65_/_0.15)] to-[oklch(0.78_0.11_65_/_0.05)]">
            <div className="text-center">
              <Sparkles className="h-12 w-12 text-gold mx-auto mb-2 opacity-50" />
              <p className="text-xs text-muted-foreground">Image à venir</p>
            </div>
          </div>
        )}
        {/* Badge Catégorie */}
        <div className="absolute top-3 left-3">
          <span className="bg-gold-gradient text-background text-xs font-semibold px-2 py-1 rounded-full glow-gold">
            {formatCategory(category)}
          </span>
        </div>
      </div>

      {/* Content */}
      <CardHeader className="pb-3">
        <CardTitle className="text-lg line-clamp-1">{title}</CardTitle>
        <CardDescription className="line-clamp-1">{formatCategory(category)}</CardDescription>
      </CardHeader>
      <CardContent className="pt-0 flex-1 flex flex-col">
        <p className="text-sm text-muted-foreground line-clamp-2 mb-4 flex-1">
          {description}
        </p>

        {/* Footer */}
        <div className="space-y-3 pt-3 border-t border-gold/20">
          <div className="flex items-center justify-between">
            <div className="text-sm">
              {price_fixed && (
                <span className="text-gold font-medium">{price_fixed}€</span>
              )}
              {price_per_day && (
                <span className="text-gold font-medium">{price_per_day}€/jour</span>
              )}
              {price_per_hour && (
                <span className="text-gold font-medium">{price_per_hour}€/h</span>
              )}
            </div>
            <span
              className={`text-xs px-2 py-1 rounded ${
                is_active
                  ? 'bg-green-500/20 text-green-400'
                  : 'bg-gray-500/20 text-gray-400'
              }`}
            >
              {is_active ? 'Actif' : 'Inactif'}
            </span>
          </div>
          {city && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4 text-gold" />
              <span>{city}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
