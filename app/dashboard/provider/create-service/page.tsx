'use client'

import { useState } from 'react'
import { createService } from '@/app/actions/services'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Sparkles, Briefcase, ArrowRight, Euro } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { ServiceCategory } from '@/src/types/supabase'

// Mapping des catégories avec labels français
const categoryLabels: Record<ServiceCategory, string> = {
  // Lieux
  salle: 'Salle',
  plein_air: 'Plein Air',
  hangar: 'Hangar',
  // Sécurité
  ssiap: 'Agent SSIAP',
  gardiennage: 'Gardiennage',
  maitre_chien: 'Maître-chien',
  // Artistes
  musicien: 'Musicien',
  animateur: 'Animateur',
  humoriste: 'Humoriste',
  dj: 'DJ',
  // Staff
  technicien_son: 'Technicien Son',
  technicien_lumiere: 'Technicien Lumière',
  traiteur: 'Traiteur',
  serveur: 'Serveur',
  hotesse: 'Hôtesse',
  nettoyage: 'Nettoyage',
  // Esthétique
  decorateur: 'Décorateur',
  costumier: 'Costumier',
  coiffure: 'Coiffure',
  maquillage: 'Maquillage',
  // Logistique
  location_materiel: 'Location Matériel',
  transport: 'Transport',
  tente: 'Tente',
  // Média
  photographe: 'Photographe',
  videaste: 'Vidéaste',
  influenceur: 'Influenceur',
  publicite: 'Publicité',
}

// Groupes de catégories pour organisation
const categoryGroups = {
  'Lieux': ['salle', 'plein_air', 'hangar'] as ServiceCategory[],
  'Sécurité': ['ssiap', 'gardiennage', 'maitre_chien'] as ServiceCategory[],
  'Artistes': ['musicien', 'animateur', 'humoriste', 'dj'] as ServiceCategory[],
  'Staff': ['technicien_son', 'technicien_lumiere', 'traiteur', 'serveur', 'hotesse', 'nettoyage'] as ServiceCategory[],
  'Esthétique': ['decorateur', 'costumier', 'coiffure', 'maquillage'] as ServiceCategory[],
  'Logistique': ['location_materiel', 'transport', 'tente'] as ServiceCategory[],
  'Média': ['photographe', 'videaste', 'influenceur', 'publicite'] as ServiceCategory[],
}

export default function CreateServicePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '' as ServiceCategory | '',
    price_per_hour: '',
    price_per_day: '',
    price_fixed: '',
    city: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    // Validation
    if (!formData.title || !formData.description || !formData.category || !formData.city) {
      setError('Veuillez remplir tous les champs obligatoires')
      setLoading(false)
      return
    }

    // Au moins un prix doit être renseigné
    if (!formData.price_per_hour && !formData.price_per_day && !formData.price_fixed) {
      setError('Veuillez renseigner au moins un type de prix')
      setLoading(false)
      return
    }

    try {
      const result = await createService({
        title: formData.title,
        description: formData.description,
        category: formData.category as ServiceCategory,
        price_per_hour: formData.price_per_hour ? parseFloat(formData.price_per_hour) : undefined,
        price_per_day: formData.price_per_day ? parseFloat(formData.price_per_day) : undefined,
        price_fixed: formData.price_fixed ? parseFloat(formData.price_fixed) : undefined,
        city: formData.city,
      })

      if (result.error) {
        setError(result.error)
      } else {
        // Rediriger vers le dashboard prestataire
        router.push('/dashboard/provider')
      }
    } catch (err) {
      setError('Une erreur est survenue')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gold/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gold/5 rounded-full blur-3xl" />
      </div>

      <div className="max-w-4xl mx-auto relative">
        {/* Mobile: Full width header */}
        <div className="md:hidden mb-6 text-center">
          <div className="inline-flex items-center justify-center mb-4">
            <div className="h-12 w-12 rounded-xl bg-gold-gradient flex items-center justify-center glow-gold">
              <Briefcase className="h-6 w-6 text-background" />
            </div>
          </div>
          <h1 className="text-3xl font-serif font-bold text-foreground mb-2">
            Créer votre service
          </h1>
          <p className="text-muted-foreground">
            Remplissez les informations pour publier votre annonce
          </p>
        </div>

        {/* Desktop: Card with glassmorphism */}
        <Card className="hidden md:block glass-gold glow-gold-strong border-gold/30 mb-6">
          <CardHeader className="text-center pb-6">
            <div className="inline-flex items-center justify-center mb-4">
              <div className="h-16 w-16 rounded-xl bg-gold-gradient flex items-center justify-center glow-gold">
                <Briefcase className="h-8 w-8 text-background" />
              </div>
            </div>
            <CardTitle className="text-3xl font-serif font-bold">
              Créer votre service
            </CardTitle>
            <CardDescription className="text-base mt-2">
              Remplissez les informations pour publier votre annonce
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Form Card */}
        <Card className="glass-gold border-gold/30">
          <CardContent className="p-6 md:p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
                  {error}
                </div>
              )}

              {/* Nom du service */}
              <div className="space-y-2">
                <Label htmlFor="title" className="text-base font-medium">
                  Nom du service <span className="text-gold">*</span>
                </Label>
                <Input
                  id="title"
                  type="text"
                  placeholder="Ex: DJ Mariage, Traiteur Bio, Photographe Événement..."
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                  className="h-12 text-base"
                  disabled={loading}
                />
              </div>

              {/* Catégorie */}
              <div className="space-y-2">
                <Label htmlFor="category" className="text-base font-medium">
                  Catégorie <span className="text-gold">*</span>
                </Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData({ ...formData, category: value as ServiceCategory })}
                  required
                  disabled={loading}
                >
                  <SelectTrigger className="h-12 w-full text-base">
                    <SelectValue placeholder="Sélectionnez une catégorie" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(categoryGroups).map(([groupName, categories]) => (
                      <div key={groupName}>
                        <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                          {groupName}
                        </div>
                        {categories.map((category) => (
                          <SelectItem key={category} value={category}>
                            {categoryLabels[category]}
                          </SelectItem>
                        ))}
                      </div>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description" className="text-base font-medium">
                  Description <span className="text-gold">*</span>
                </Label>
                <Textarea
                  id="description"
                  placeholder="Décrivez votre service, vos spécialités, votre expérience..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  required
                  rows={6}
                  className="text-base min-h-[120px]"
                  disabled={loading}
                />
              </div>

              {/* Ville */}
              <div className="space-y-2">
                <Label htmlFor="city" className="text-base font-medium">
                  Ville <span className="text-gold">*</span>
                </Label>
                <Input
                  id="city"
                  type="text"
                  placeholder="Ex: Paris, Lyon, Marseille..."
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  required
                  className="h-12 text-base"
                  disabled={loading}
                />
              </div>

              {/* Prix - Desktop: 2 colonnes, Mobile: 1 colonne */}
              <div className="space-y-4">
                <Label className="text-base font-medium flex items-center gap-2">
                  <Euro className="h-4 w-4 text-gold" />
                  Tarification (au moins un champ requis)
                </Label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="price_per_hour" className="text-sm text-muted-foreground">
                      Prix par heure (€)
                    </Label>
                    <Input
                      id="price_per_hour"
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="Ex: 150"
                      value={formData.price_per_hour}
                      onChange={(e) => setFormData({ ...formData, price_per_hour: e.target.value })}
                      className="h-12 text-base"
                      disabled={loading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="price_per_day" className="text-sm text-muted-foreground">
                      Prix par jour (€)
                    </Label>
                    <Input
                      id="price_per_day"
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="Ex: 1000"
                      value={formData.price_per_day}
                      onChange={(e) => setFormData({ ...formData, price_per_day: e.target.value })}
                      className="h-12 text-base"
                      disabled={loading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="price_fixed" className="text-sm text-muted-foreground">
                      Prix fixe (€)
                    </Label>
                    <Input
                      id="price_fixed"
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="Ex: 2500"
                      value={formData.price_fixed}
                      onChange={(e) => setFormData({ ...formData, price_fixed: e.target.value })}
                      className="h-12 text-base"
                      disabled={loading}
                    />
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-4">
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full h-12 md:h-11 bg-gold-gradient text-background hover:opacity-90 font-medium gold-shimmer glow-gold text-base disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    'Publication en cours...'
                  ) : (
                    <>
                      Publier mon service
                      <ArrowRight className="h-5 w-5 md:h-4 md:w-4 ml-2" />
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
