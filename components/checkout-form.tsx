'use client'

import { useState } from 'react'
import { createBooking } from '@/app/actions/bookings'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Calendar, MessageSquare, ArrowRight } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface CheckoutFormProps {
  serviceId: string
}

export function CheckoutForm({ serviceId }: CheckoutFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const [formData, setFormData] = useState({
    booking_date: '',
    client_message: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    if (!formData.booking_date) {
      setError('Veuillez sélectionner une date')
      setLoading(false)
      return
    }

    // Vérifier que la date n'est pas dans le passé
    const selectedDate = new Date(formData.booking_date)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    if (selectedDate < today) {
      setError('La date ne peut pas être dans le passé')
      setLoading(false)
      return
    }

    try {
      const result = await createBooking({
        service_id: serviceId,
        booking_date: formData.booking_date,
        client_message: formData.client_message || undefined,
      })

      if (result.error) {
        setError(result.error)
      } else {
        // Rediriger vers le dashboard avec un message de succès
        router.push('/dashboard?booking=success')
      }
    } catch (err) {
      setError('Une erreur est survenue')
    } finally {
      setLoading(false)
    }
  }

  // Date minimale = aujourd'hui
  const today = new Date().toISOString().split('T')[0]

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
          {error}
        </div>
      )}

      {/* Date de l'événement */}
      <div className="space-y-2">
        <Label htmlFor="booking_date" className="text-base font-medium flex items-center gap-2">
          <Calendar className="h-4 w-4 text-gold" />
          Date de l'événement <span className="text-gold">*</span>
        </Label>
        <Input
          id="booking_date"
          type="date"
          value={formData.booking_date}
          onChange={(e) => setFormData({ ...formData, booking_date: e.target.value })}
          required
          min={today}
          className="h-12 text-base"
          disabled={loading}
        />
      </div>

      {/* Message au prestataire */}
      <div className="space-y-2">
        <Label htmlFor="client_message" className="text-base font-medium flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-gold" />
          Message au prestataire (optionnel)
        </Label>
        <Textarea
          id="client_message"
          placeholder="Décrivez votre événement, vos besoins spécifiques, le nombre d'invités..."
          value={formData.client_message}
          onChange={(e) => setFormData({ ...formData, client_message: e.target.value })}
          rows={6}
          className="text-base min-h-[120px]"
          disabled={loading}
        />
      </div>

      {/* Submit Button */}
      <Button
        type="submit"
        disabled={loading || !formData.booking_date}
        className="w-full h-12 bg-gold-gradient text-background hover:opacity-90 font-medium gold-shimmer glow-gold text-base disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? (
          'Envoi en cours...'
        ) : (
          <>
            Confirmer la demande
            <ArrowRight className="h-5 w-5 ml-2" />
          </>
        )}
      </Button>
    </form>
  )
}
