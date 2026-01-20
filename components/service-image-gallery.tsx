'use client'

import { useState } from 'react'
import Image from 'next/image'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ServiceImageGalleryProps {
  images: string[]
  title: string
}

export function ServiceImageGallery({ images, title }: ServiceImageGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0)

  if (!images || images.length === 0) {
    return null
  }

  const currentImage = images[selectedIndex]
  const hasMultipleImages = images.length > 1

  const goToPrevious = () => {
    setSelectedIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1))
  }

  const goToNext = () => {
    setSelectedIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1))
  }

  return (
    <div className="space-y-4">
      {/* Image principale */}
      <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-gradient-to-br from-gold/20 to-gold/5 border border-gold/20">
        <Image
          src={currentImage}
          alt={`${title} - Image ${selectedIndex + 1}`}
          fill
          className="object-cover"
          priority={selectedIndex === 0}
          sizes="(max-width: 768px) 100vw, 50vw"
        />

        {/* Navigation si plusieurs images */}
        {hasMultipleImages && (
          <>
            <Button
              variant="secondary"
              size="icon"
              className="absolute left-4 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-background/80 backdrop-blur-sm hover:bg-background border border-gold/30"
              onClick={goToPrevious}
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <Button
              variant="secondary"
              size="icon"
              className="absolute right-4 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-background/80 backdrop-blur-sm hover:bg-background border border-gold/30"
              onClick={goToNext}
            >
              <ChevronRight className="h-5 w-5" />
            </Button>

            {/* Indicateur de position */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
              {images.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedIndex(index)}
                  className={`h-2 rounded-full transition-all ${
                    index === selectedIndex
                      ? 'w-8 bg-gold'
                      : 'w-2 bg-background/50 hover:bg-background/80'
                  }`}
                  aria-label={`Aller à l'image ${index + 1}`}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Miniatures */}
      {hasMultipleImages && (
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {images.map((image, index) => (
            <button
              key={index}
              onClick={() => setSelectedIndex(index)}
              className={`relative flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                index === selectedIndex
                  ? 'border-gold scale-105'
                  : 'border-gold/20 hover:border-gold/50'
              }`}
            >
              <Image
                src={image}
                alt={`${title} - Miniature ${index + 1}`}
                fill
                className="object-cover"
                sizes="80px"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
