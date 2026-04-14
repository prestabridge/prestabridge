import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { MapPin, Euro, Sparkles } from 'lucide-react'
import Image from 'next/image'

interface ServiceCardProps {
  id: string
  provider_id?: string
  title: string
  description: string
  category: string
  city: string
  price_per_hour?: number | null
  price_per_day?: number | null
  price_fixed?: number | null
  price_start?: number | null
  images?: string[] | null
}

export function ServiceCard({
  id,
  provider_id,
  title,
  description,
  category,
  city,
  price_per_hour,
  price_per_day,
  price_fixed,
  price_start,
  images,
}: ServiceCardProps) {
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

  const cardHref = provider_id ? `/vendor/${provider_id}` : `/service/${id}`

  return (
    <Link href={cardHref}>
      <Card className="glass-gold border-gold/30 hover-glow transition-all duration-300 group cursor-pointer overflow-hidden h-full flex flex-col">
        {/* Image */}
        <div className="relative w-full h-48 md:h-56 overflow-hidden bg-gradient-to-br from-gold/20 to-gold/5">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={title}
              fill
              className="object-cover object-center group-hover:scale-105 transition-transform duration-300"
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
        <CardContent className="p-4 flex-1 flex flex-col">
          <h3 className="font-serif font-semibold text-lg mb-2 line-clamp-1 group-hover:text-gold transition-colors">
            {title}
          </h3>
          <p className="text-sm text-muted-foreground line-clamp-2 mb-4 flex-1">
            {description}
          </p>

          {/* Footer */}
          <div className="flex items-center justify-between pt-4 border-t border-gold/20">
            {city && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4 text-gold" />
                <span>{city}</span>
              </div>
            )}
            <div className={`flex items-center gap-1 text-gold font-semibold ${!city ? 'ml-auto' : ''}`}>
              <Euro className="h-4 w-4" />
              <span className="text-sm">{displayPrice}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
