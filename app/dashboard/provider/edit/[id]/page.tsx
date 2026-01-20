'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { updateService } from '@/app/actions/services'
import { uploadMultipleServiceImages } from '@/app/actions/storage'
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
import { Sparkles, Briefcase, ArrowRight, Euro, Image as ImageIcon, X, ChevronLeft, ChevronRight } from 'lucide-react'
import { ServiceCategory } from '@/src/types/supabase'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import imageCompression from 'browser-image-compression'

// Mapping des catégories avec labels français
const categoryLabels: Record<ServiceCategory, string> = {
  salle: 'Salle',
  plein_air: 'Plein Air',
  hangar: 'Hangar',
  ssiap: 'Agent SSIAP',
  gardiennage: 'Gardiennage',
  maitre_chien: 'Maître-chien',
  musicien: 'Musicien',
  animateur: 'Animateur',
  humoriste: 'Humoriste',
  dj: 'DJ',
  technicien_son: 'Technicien Son',
  technicien_lumiere: 'Technicien Lumière',
  traiteur: 'Traiteur',
  serveur: 'Serveur',
  hotesse: 'Hôtesse',
  nettoyage: 'Nettoyage',
  decorateur: 'Décorateur',
  costumier: 'Costumier',
  coiffure: 'Coiffure',
  maquillage: 'Maquillage',
  location_materiel: 'Location Matériel',
  transport: 'Transport',
  tente: 'Tente',
  photographe: 'Photographe',
  videaste: 'Vidéaste',
  influenceur: 'Influenceur',
  publicite: 'Publicité',
}

const categoryGroups = {
  'Lieux': ['salle', 'plein_air', 'hangar'] as ServiceCategory[],
  'Sécurité': ['ssiap', 'gardiennage', 'maitre_chien'] as ServiceCategory[],
  'Artistes': ['musicien', 'animateur', 'humoriste', 'dj'] as ServiceCategory[],
  'Staff': ['technicien_son', 'technicien_lumiere', 'traiteur', 'serveur', 'hotesse', 'nettoyage'] as ServiceCategory[],
  'Esthétique': ['decorateur', 'costumier', 'coiffure', 'maquillage'] as ServiceCategory[],
  'Logistique': ['location_materiel', 'transport', 'tente'] as ServiceCategory[],
  'Média': ['photographe', 'videaste', 'influenceur', 'publicite'] as ServiceCategory[],
}

export default function EditServicePage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const [serviceId, setServiceId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadingImages, setUploadingImages] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedImages, setSelectedImages] = useState<File[]>([])
  const [imagePreviews, setImagePreviews] = useState<{ file: File; preview: string; compressing?: boolean }[]>([])
  const [uploadedImageUrls, setUploadedImageUrls] = useState<string[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const galleryScrollRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '' as ServiceCategory | '',
    price_per_hour: '',
    price_per_day: '',
    price_fixed: '',
    city: '',
  })

  // Charger les données du service
  useEffect(() => {
    const loadService = async () => {
      const resolvedParams = await params
      setServiceId(resolvedParams.id)

      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push('/login')
        return
      }

      const { data: service, error: serviceError } = await supabase
        .from('services')
        .select('*')
        .eq('id', resolvedParams.id)
        .eq('provider_id', user.id)
        .single()

      if (serviceError || !service) {
        setError('Service introuvable ou vous n\'êtes pas autorisé à le modifier')
        setLoading(false)
        return
      }

      // Pré-remplir le formulaire
      setFormData({
        title: service.title || '',
        description: service.description || '',
        category: service.category || '',
        price_per_hour: service.price_per_hour?.toString() || '',
        price_per_day: service.price_per_day?.toString() || '',
        price_fixed: service.price_fixed?.toString() || '',
        city: service.city || '',
      })

      // Charger les images existantes
      if (service.images && service.images.length > 0) {
        setUploadedImageUrls(service.images)
      }

      setLoading(false)
    }

    loadService()
  }, [params, router])

  // Gérer la sélection d'images multiples avec compression automatique
  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return

    // Calculer le total futur
    const currentTotal = selectedImages.length + uploadedImageUrls.length
    const totalFutur = currentTotal + files.length

    // Limite stricte : refuser tout si ça dépasse 10
    if (totalFutur > 10) {
      alert(`Maximum 10 photos autorisées. Vous essayez d'en mettre ${totalFutur}. Vous avez déjà ${currentTotal} photo(s).`)
      setError(`Maximum 10 photos autorisées. Vous avez déjà ${currentTotal} photo(s).`)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
      return
    }

    // Limiter les fichiers à ce qui permet d'atteindre exactement 10
    const maxToAdd = 10 - currentTotal
    const filesToProcess = files.slice(0, maxToAdd)

    const errors: string[] = []
    const compressedFiles: File[] = []
    const newPreviews: { file: File; preview: string; compressing?: boolean }[] = []

    // Traiter chaque fichier avec compression (seulement ceux autorisés)
    for (const file of filesToProcess) {
      if (!file.type.startsWith('image/')) {
        errors.push(`${file.name}: Le fichier doit être une image`)
        continue
      }

      // Ajouter une prévisualisation temporaire avec indicateur de compression
      const tempPreview: { file: File; preview: string; compressing: boolean } = {
        file,
        preview: URL.createObjectURL(file),
        compressing: true,
      }
      newPreviews.push(tempPreview)
      setImagePreviews((prev) => [...prev, tempPreview])

      try {
        // Compresser l'image automatiquement
        const options = {
          maxSizeMB: 1,
          maxWidthOrHeight: 1920,
          useWebWorker: true,
        }

        const compressedFile = await imageCompression(file, options)
        compressedFiles.push(compressedFile)

        // Mettre à jour la prévisualisation avec le fichier compressé
        const reader = new FileReader()
        reader.onloadend = () => {
          setImagePreviews((prev) =>
            prev.map((preview) =>
              preview.file === file
                ? { file: compressedFile, preview: reader.result as string, compressing: false }
                : preview
            )
          )
        }
        reader.readAsDataURL(compressedFile)
      } catch (error) {
        console.error('Erreur lors de la compression:', error)
        // Si la compression échoue, utiliser le fichier original
        compressedFiles.push(file)
        setImagePreviews((prev) =>
          prev.map((preview) =>
            preview.file === file ? { ...preview, compressing: false } : preview
          )
        )
      }
    }

    if (errors.length > 0) {
      setError(errors.join(', '))
    } else {
      setError(null)
    }

    setSelectedImages((prev) => [...prev, ...compressedFiles])

    // Réinitialiser l'input pour permettre de sélectionner les mêmes fichiers
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  // Upload des images (appelé uniquement au submit)
  // Les images sont déjà compressées lors de la sélection
  const uploadNewImages = async (): Promise<string[]> => {
    if (selectedImages.length === 0) {
      return []
    }

    const uploadFormData = new FormData()
    selectedImages.forEach((file) => {
      uploadFormData.append('files', file)
    })

    const result = await uploadMultipleServiceImages(uploadFormData)

    if (result.error) {
      throw new Error(result.error)
    }

    return result.urls || []
  }

  // Supprimer une image de la sélection
  const handleRemoveImage = (index: number) => {
    setSelectedImages((prev) => prev.filter((_, i) => i !== index))
    setImagePreviews((prev) => prev.filter((_, i) => i !== index))
  }

  // Supprimer une image uploadée
  const handleRemoveUploadedImage = (index: number) => {
    setUploadedImageUrls((prev) => prev.filter((_, i) => i !== index))
  }

  // Navigation de la galerie
  const scrollGallery = (direction: 'left' | 'right') => {
    if (!galleryScrollRef.current) return
    
    const scrollAmount = 200
    const currentScroll = galleryScrollRef.current.scrollLeft
    const maxScroll = galleryScrollRef.current.scrollWidth - galleryScrollRef.current.clientWidth
    
    if (direction === 'left') {
      galleryScrollRef.current.scrollTo({
        left: currentScroll - scrollAmount,
        behavior: 'smooth',
      })
    } else {
      galleryScrollRef.current.scrollTo({
        left: currentScroll + scrollAmount,
        behavior: 'smooth',
      })
    }
  }

  // Vérifier la position du scroll pour afficher/masquer les flèches
  const checkScrollPosition = () => {
    if (!galleryScrollRef.current) return
    
    const { scrollLeft, scrollWidth, clientWidth } = galleryScrollRef.current
    setCanScrollLeft(scrollLeft > 0)
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10) // 10px de marge
  }

  // Vérifier la position au chargement et après chaque changement
  useEffect(() => {
    checkScrollPosition()
    const gallery = galleryScrollRef.current
    if (gallery) {
      gallery.addEventListener('scroll', checkScrollPosition)
      return () => gallery.removeEventListener('scroll', checkScrollPosition)
    }
  }, [imagePreviews, uploadedImageUrls])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)

    if (!serviceId) {
      setError('ID du service manquant')
      setSaving(false)
      return
    }

    if (!formData.title || !formData.description || !formData.category || !formData.city) {
      setError('Veuillez remplir tous les champs obligatoires')
      setSaving(false)
      return
    }

    if (!formData.price_per_hour && !formData.price_per_day && !formData.price_fixed) {
      setError('Veuillez renseigner au moins un type de prix')
      setSaving(false)
      return
    }

    try {
      // Uploader les nouvelles images d'abord
      let finalImageUrls = [...uploadedImageUrls]
      
      if (selectedImages.length > 0) {
        setUploadingImages(true)
        try {
          // La compression se fait dans uploadNewImages
          const newImageUrls = await uploadNewImages()
          finalImageUrls = [...uploadedImageUrls, ...newImageUrls]
        } catch (uploadError: any) {
          setError(uploadError.message || 'Erreur lors de l\'upload des images')
          setSaving(false)
          setUploadingImages(false)
          return
        } finally {
          setUploadingImages(false)
        }
      }

      const result = await updateService(serviceId, {
        title: formData.title,
        description: formData.description,
        category: formData.category as ServiceCategory,
        price_per_hour: formData.price_per_hour ? parseFloat(formData.price_per_hour) : undefined,
        price_per_day: formData.price_per_day ? parseFloat(formData.price_per_day) : undefined,
        price_fixed: formData.price_fixed ? parseFloat(formData.price_fixed) : undefined,
        city: formData.city,
        imageUrls: finalImageUrls.length > 0 ? finalImageUrls : undefined,
      })

      if (result.error) {
        setError(result.error)
      } else {
        router.push('/dashboard')
      }
    } catch (err) {
      setError('Une erreur est survenue')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Sparkles className="h-12 w-12 text-gold mx-auto mb-4 animate-pulse" />
          <p className="text-muted-foreground">Chargement du service...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gold/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gold/5 rounded-full blur-3xl" />
      </div>

      <div className="max-w-4xl mx-auto relative">
        <div className="md:hidden mb-6 text-center">
          <div className="inline-flex items-center justify-center mb-4">
            <div className="h-12 w-12 rounded-xl bg-gold-gradient flex items-center justify-center glow-gold">
              <Briefcase className="h-6 w-6 text-background" />
            </div>
          </div>
          <h1 className="text-3xl font-serif font-bold text-foreground mb-2">
            Modifier votre service
          </h1>
          <p className="text-muted-foreground">Mettez à jour les informations de votre service</p>
        </div>

        <Card className="hidden md:block glass-gold glow-gold-strong border-gold/30 mb-6">
          <CardHeader className="text-center pb-6">
            <div className="inline-flex items-center justify-center mb-4">
              <div className="h-16 w-16 rounded-xl bg-gold-gradient flex items-center justify-center glow-gold">
                <Briefcase className="h-8 w-8 text-background" />
              </div>
            </div>
            <CardTitle className="text-3xl font-serif font-bold">Modifier votre service</CardTitle>
            <CardDescription className="text-base mt-2">
              Mettez à jour les informations de votre service
            </CardDescription>
          </CardHeader>
        </Card>

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
                  disabled={saving}
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
                  disabled={saving}
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
                  disabled={saving}
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
                  disabled={saving}
                />
              </div>

              {/* Upload d'images multiples */}
              <div className="space-y-2">
                <Label className="text-base font-medium flex items-center gap-2">
                  <ImageIcon className="h-4 w-4 text-gold" />
                  Photos du service (optionnel)
                </Label>
                
                <div className="space-y-3">
                  {/* Input file caché avec multiple */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageSelect}
                    className="hidden"
                    id="image-upload"
                    disabled={saving || uploadingImages}
                  />

                  {/* Bouton pour sélectionner les images */}
                  <label
                    htmlFor="image-upload"
                    className="flex items-center justify-center gap-2 w-full h-12 border-2 border-dashed border-gold/30 rounded-lg cursor-pointer hover:border-gold/50 transition-colors bg-background/50"
                  >
                    <ImageIcon className="h-5 w-5 text-gold" />
                    <span className="text-sm font-medium text-foreground">
                      📸 Ajouter des photos ({selectedImages.length + uploadedImageUrls.length} / 10)
                    </span>
                  </label>

                  {/* Galerie avec scroll horizontal */}
                  {(imagePreviews.length > 0 || uploadedImageUrls.length > 0) && (
                    <div className="space-y-2">
                      <p className="text-xs text-muted-foreground">
                        {imagePreviews.length + uploadedImageUrls.length} / 10 photo{imagePreviews.length + uploadedImageUrls.length > 1 ? 's' : ''}
                      </p>
                      <div className="relative">
                        {/* Bouton flèche gauche */}
                        {canScrollLeft && (
                          <button
                            type="button"
                            onClick={() => scrollGallery('left')}
                            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 h-8 w-8 rounded-full bg-background/80 backdrop-blur-sm border border-gold/30 hover:bg-background/90 flex items-center justify-center text-gold shadow-lg"
                            aria-label="Défiler vers la gauche"
                          >
                            <ChevronLeft className="h-5 w-5" />
                          </button>
                        )}
                        {/* Bouton flèche droite */}
                        {canScrollRight && (
                          <button
                            type="button"
                            onClick={() => scrollGallery('right')}
                            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 h-8 w-8 rounded-full bg-background/80 backdrop-blur-sm border border-gold/30 hover:bg-background/90 flex items-center justify-center text-gold shadow-lg"
                            aria-label="Défiler vers la droite"
                          >
                            <ChevronRight className="h-5 w-5" />
                          </button>
                        )}
                        <div 
                          ref={galleryScrollRef}
                          className="flex overflow-x-auto gap-3 py-2 scrollbar-hide"
                          onScroll={checkScrollPosition}
                        >
                        {/* Images sélectionnées (nouvelles, pas encore uploadées) */}
                        {imagePreviews.map((preview, index) => (
                          <div
                            key={`preview-${index}`}
                            className="relative group w-32 h-32 flex-shrink-0 rounded-lg overflow-hidden border border-gold/20 bg-background/50"
                          >
                            <Image
                              src={preview.preview}
                              alt={`Aperçu ${index + 1}`}
                              fill
                              className="object-cover"
                              sizes="128px"
                            />
                            {preview.compressing ? (
                              <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                                <div className="text-center">
                                  <div className="animate-spin rounded-full h-6 w-6 border-2 border-gold border-t-transparent mx-auto mb-1"></div>
                                  <p className="text-xs text-white">Traitement...</p>
                                </div>
                              </div>
                            ) : (
                              <div className="absolute top-1 left-1 bg-blue-500/90 text-white text-xs px-1.5 py-0.5 rounded">
                                Nouveau
                              </div>
                            )}
                            <button
                              type="button"
                              onClick={() => handleRemoveImage(index)}
                              disabled={uploadingImages || saving || preview.compressing}
                              className="absolute top-1 right-1 h-6 w-6 rounded-full bg-red-500/90 hover:bg-red-600 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-0"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        ))}
                        
                        {/* Images uploadées (existantes) */}
                        {uploadedImageUrls.map((url, index) => (
                          <div
                            key={`uploaded-${index}`}
                            className="relative group w-32 h-32 flex-shrink-0 rounded-lg overflow-hidden border-2 border-green-500/50 bg-background/50"
                          >
                            <Image
                              src={url}
                              alt={`Photo ${index + 1}`}
                              fill
                              className="object-cover"
                              sizes="128px"
                            />
                            <div className="absolute top-1 left-1 bg-green-500/90 text-white text-xs px-1.5 py-0.5 rounded">
                              ✓
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRemoveUploadedImage(index)}
                              disabled={saving || uploadingImages}
                              className="absolute top-1 right-1 h-6 w-6 rounded-full bg-red-500/90 hover:bg-red-600 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Prix */}
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
                      disabled={saving}
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
                      disabled={saving}
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
                      disabled={saving}
                    />
                  </div>
                </div>
              </div>

                  {/* Submit Button */}
              <div className="pt-4">
                <Button
                  type="submit"
                  disabled={saving || uploadingImages}
                  className="w-full h-12 md:h-11 bg-gold-gradient text-background hover:opacity-90 font-medium gold-shimmer glow-gold text-base disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {uploadingImages ? (
                    'Optimisation & Envoi des images...'
                  ) : saving ? (
                    'Mise à jour en cours...'
                  ) : (
                    <>
                      Mettre à jour le service
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
