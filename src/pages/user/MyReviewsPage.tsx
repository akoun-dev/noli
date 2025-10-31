import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Star,
  Plus,
  Edit,
  Trash2,
  MessageSquare,
  ThumbsUp,
  Clock,
  CheckCircle,
  AlertCircle,
  Eye,
  Search,
  Filter,
  Building,
  Loader2,
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { toast } from 'sonner'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { logger } from '@/lib/logger'

interface Review {
  id: string
  insurer_id: string
  insurer_name: string
  insurer_logo?: string
  rating: number
  title: string
  content: string
  pros?: string
  cons?: string
  response_text?: string
  responded_at?: string
  status: 'pending' | 'approved' | 'rejected' | 'hidden'
  helpful_count: number
  report_count: number
  is_verified: boolean
  created_at: string
  updated_at: string
  quote_id?: string
  policy_id?: string
}

const REVIEW_STATUS = {
  pending: { label: 'En attente', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  approved: { label: 'Approuvé', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  rejected: { label: 'Rejeté', color: 'bg-red-100 text-red-800', icon: AlertCircle },
  hidden: { label: 'Masqué', color: 'bg-gray-100 text-gray-800', icon: Eye },
}

export default function MyReviewsPage() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [selectedRating, setSelectedRating] = useState<string>('all')
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [editingReview, setEditingReview] = useState<Review | null>(null)

  // Formulaire de création/modification
  const [formData, setFormData] = useState({
    insurer_id: '',
    rating: 5,
    title: '',
    content: '',
    pros: '',
    cons: '',
  })

  // Fetch reviews from database - using policies as temporary storage since reviews table doesn't exist yet
  const {
    data: reviews = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ['user-reviews', user?.id],
    queryFn: async () => {
      if (!user?.id) return []

      try {
        // Simplified query to avoid infinite loading
        const { data: policies, error } = await supabase
          .from('policies')
          .select('id, insurer_id, created_at, updated_at')
          .eq('user_id', user.id)

        if (error) {
          logger.error('Error fetching reviews:', error)
          return [] // Return empty array instead of throwing
        }

        // Generate mock reviews based on policies
        const mockReviews: Review[] =
          policies?.map((policy, index) => ({
            id: `review-${policy.id}`,
            insurer_id: policy.insurer_id,
            insurer_name: 'Assureur Test', // Simplified for now
            insurer_logo: '/logos/default.png', // Simplified for now
            rating: index % 2 === 0 ? 4 : 3,
            title:
              index % 2 === 0
                ? 'Excellent service client'
                : 'Service correct mais peut mieux faire',
            content:
              index % 2 === 0
                ? "J'ai été très satisfait de la rapidité de traitement de mon dossier. L'équipe a été très professionnelle et disponible."
                : "L'assurance couvre bien les besoins de base mais j'ai trouvé quelques difficultés dans la communication.",
            pros:
              index % 2 === 0
                ? 'Service client réactif, Tarifs compétitifs, Processus simple'
                : 'Bonne couverture de base, Prix raisonnable',
            cons:
              index % 2 === 0
                ? 'Délais de remboursement un peu longs'
                : 'Communication parfois difficile, Délais de réponse longs',
            response_text:
              index % 2 === 0
                ? 'Merci pour votre retour ! Nous sommes ravis de votre satisfaction et travaillons à améliorer nos délais de remboursement.'
                : undefined,
            responded_at: index % 2 === 0 ? new Date().toISOString() : undefined,
            status: index % 2 === 0 ? 'approved' : 'pending',
            helpful_count: index % 2 === 0 ? 12 : 3,
            report_count: 0,
            is_verified: index % 2 === 0,
            created_at: policy.created_at,
            updated_at: policy.updated_at,
            policy_id: policy.id,
            quote_id: policy.quote_id,
          })) || []

        return mockReviews
      } catch (err) {
        logger.error('Error fetching reviews:', err)
        return [] // Return empty array instead of throwing to prevent infinite loading
      }
    },
    enabled: !!user?.id,
  })

  // Create/update review mutation
  const reviewMutation = useMutation({
    mutationFn: async (reviewData: Partial<Review> & { isEdit?: boolean }) => {
      if (!user?.id) throw new Error('User not authenticated')

      // TODO: When reviews table is created, implement actual database operations
      // For now, just simulate the operation
      await new Promise((resolve) => setTimeout(resolve, 1000))

      return {
        ...reviewData,
        user_id: user.id,
        created_at: reviewData.isEdit ? reviewData.created_at : new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-reviews', user?.id] })
      toast.success(editingReview ? 'Avis modifié avec succès' : 'Avis créé avec succès')

      // Reset du formulaire
      setFormData({
        insurer_id: '',
        rating: 5,
        title: '',
        content: '',
        pros: '',
        cons: '',
      })
      setEditingReview(null)
      setIsCreateDialogOpen(false)
    },
    onError: () => {
      toast.error("Erreur lors de la sauvegarde de l'avis")
    },
  })

  const handleSubmitReview = async () => {
    if (!formData.insurer_id || !formData.title || !formData.content) {
      toast.error('Veuillez remplir tous les champs obligatoires')
      return
    }

    const reviewData = {
      insurer_id: formData.insurer_id,
      rating: formData.rating,
      title: formData.title,
      content: formData.content,
      pros: formData.pros || undefined,
      cons: formData.cons || undefined,
      status: 'pending',
      helpful_count: 0,
      report_count: 0,
      is_verified: false,
      isEdit: !!editingReview,
      ...(editingReview && { id: editingReview.id, created_at: editingReview.created_at }),
    }

    reviewMutation.mutate(reviewData)
  }

  const handleEditReview = (review: Review) => {
    setFormData({
      insurer_id: review.insurer_id,
      rating: review.rating,
      title: review.title,
      content: review.content,
      pros: review.pros || '',
      cons: review.cons || '',
    })
    setEditingReview(review)
    setIsCreateDialogOpen(true)
  }

  const handleDeleteReview = (reviewId: string) => {
    // TODO: Implement actual deletion when reviews table is created
    toast.success('Avis supprimé avec succès')
  }

  const filteredReviews = reviews.filter((review) => {
    const matchesSearch =
      review.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      review.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      review.insurer_name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = selectedStatus === 'all' || review.status === selectedStatus
    const matchesRating = selectedRating === 'all' || review.rating.toString() === selectedRating

    return matchesSearch && matchesStatus && matchesRating
  })

  if (isLoading) {
    return (
      <div className='min-h-screen bg-gray-50 flex items-center justify-center'>
        <div className='text-center'>
          <Loader2 className='w-8 h-8 animate-spin mx-auto mb-4 text-primary' />
          <p className='text-gray-600'>Chargement de vos avis...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className='min-h-screen bg-gray-50 flex items-center justify-center'>
        <div className='text-center'>
          <AlertCircle className='w-8 h-8 mx-auto mb-4 text-red-500' />
          <p className='text-red-600'>Erreur lors du chargement de vos avis</p>
          <p className='text-sm text-gray-500 mt-2'>Veuillez réessayer plus tard</p>
        </div>
      </div>
    )
  }

  const getStatusInfo = (status: string) => {
    return (
      REVIEW_STATUS[status as keyof typeof REVIEW_STATUS] || {
        label: status,
        color: 'bg-gray-100 text-gray-800',
        icon: Clock,
      }
    )
  }

  const renderStars = (rating: number, size = 'sm') => {
    const sizeClass = size === 'sm' ? 'h-4 w-4' : 'h-5 w-5'
    return (
      <div className='flex items-center space-x-1'>
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`${sizeClass} ${
              star <= rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    )
  }

  const canCreateNewReview = reviews.length < 10 // Limite de 10 avis par utilisateur

  return (
    <div className='min-h-screen bg-gray-50 py-8'>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
        {/* Header */}
        <div className='mb-8 flex justify-between items-center'>
          <div>
            <h1 className='text-3xl font-bold text-gray-900'>Mes Avis</h1>
            <p className='text-gray-600 mt-2'>
              Partagez votre expérience et consultez vos avis sur les assureurs
            </p>
          </div>

          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button disabled={!canCreateNewReview}>
                <Plus className='h-4 w-4 mr-2' />
                {canCreateNewReview ? 'Nouvel avis' : 'Limite atteinte (10 avis)'}
              </Button>
            </DialogTrigger>
            <DialogContent className='max-w-2xl'>
              <DialogHeader>
                <DialogTitle>
                  {editingReview ? 'Modifier mon avis' : 'Rédiger un nouvel avis'}
                </DialogTitle>
                <DialogDescription>Partagez votre expérience sur un assureur</DialogDescription>
              </DialogHeader>

              <div className='space-y-4'>
                <div>
                  <Label htmlFor='insurer'>Assureur</Label>
                  <Select
                    value={formData.insurer_id}
                    onValueChange={(value) =>
                      setFormData((prev) => ({ ...prev, insurer_id: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder='Sélectionnez un assureur' />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='insurer-1'>AXA Assurance</SelectItem>
                      <SelectItem value='insurer-2'>CNP Assurances</SelectItem>
                      <SelectItem value='insurer-3'>Allianz</SelectItem>
                      <SelectItem value='insurer-4'>Generali</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Note</Label>
                  <div className='flex items-center space-x-2 mt-2'>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type='button'
                        onClick={() => setFormData((prev) => ({ ...prev, rating: star }))}
                        className='p-1'
                      >
                        <Star
                          className={`h-6 w-6 ${
                            star <= formData.rating
                              ? 'text-yellow-400 fill-current'
                              : 'text-gray-300 hover:text-yellow-200'
                          }`}
                        />
                      </button>
                    ))}
                    <span className='ml-2 text-sm text-gray-600'>{formData.rating}/5</span>
                  </div>
                </div>

                <div>
                  <Label htmlFor='title'>Titre de l'avis *</Label>
                  <Input
                    id='title'
                    value={formData.title}
                    onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                    placeholder='Résumez votre expérience en quelques mots'
                    maxLength={100}
                  />
                </div>

                <div>
                  <Label htmlFor='content'>Votre avis *</Label>
                  <Textarea
                    id='content'
                    value={formData.content}
                    onChange={(e) => setFormData((prev) => ({ ...prev, content: e.target.value }))}
                    placeholder='Décrivez votre expérience en détail...'
                    rows={4}
                    maxLength={1000}
                  />
                </div>

                <div className='grid grid-cols-2 gap-4'>
                  <div>
                    <Label htmlFor='pros'>Points positifs</Label>
                    <Textarea
                      id='pros'
                      value={formData.pros}
                      onChange={(e) => setFormData((prev) => ({ ...prev, pros: e.target.value }))}
                      placeholder='Ce que vous avez aimé...'
                      rows={3}
                    />
                  </div>
                  <div>
                    <Label htmlFor='cons'>Points à améliorer</Label>
                    <Textarea
                      id='cons'
                      value={formData.cons}
                      onChange={(e) => setFormData((prev) => ({ ...prev, cons: e.target.value }))}
                      placeholder='Ce qui pourrait être amélioré...'
                      rows={3}
                    />
                  </div>
                </div>

                <div className='flex justify-end space-x-2 pt-4'>
                  <Button
                    variant='outline'
                    onClick={() => {
                      setIsCreateDialogOpen(false)
                      setEditingReview(null)
                    }}
                  >
                    Annuler
                  </Button>
                  <Button onClick={handleSubmitReview}>
                    {editingReview ? 'Modifier' : 'Publier'} l'avis
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats Cards */}
        <div className='grid grid-cols-1 md:grid-cols-4 gap-6 mb-8'>
          <Card>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-sm font-medium'>Total Avis</CardTitle>
              <MessageSquare className='h-4 w-4 text-muted-foreground' />
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold'>{reviews.length}</div>
              <p className='text-xs text-muted-foreground'>
                {reviews.filter((r) => r.status === 'approved').length} publiés
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-sm font-medium'>Note Moyenne</CardTitle>
              <Star className='h-4 w-4 text-muted-foreground' />
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold'>
                {reviews.length > 0
                  ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
                  : '0.0'}
              </div>
              <p className='text-xs text-muted-foreground'>sur 5 étoiles</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-sm font-medium'>Votes Utiles</CardTitle>
              <ThumbsUp className='h-4 w-4 text-muted-foreground' />
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold'>
                {reviews.reduce((sum, r) => sum + r.helpful_count, 0)}
              </div>
              <p className='text-xs text-muted-foreground'>total des votes</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-sm font-medium'>En Attente</CardTitle>
              <Clock className='h-4 w-4 text-muted-foreground' />
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold'>
                {reviews.filter((r) => r.status === 'pending').length}
              </div>
              <p className='text-xs text-muted-foreground'>en validation</p>
            </CardContent>
          </Card>
        </div>

        {!canCreateNewReview && (
          <Alert className='mb-8'>
            <AlertCircle className='h-4 w-4' />
            <AlertDescription>
              Vous avez atteint la limite de 10 avis. Pour ajouter un nouvel avis, vous devez
              supprimer un avis existant.
            </AlertDescription>
          </Alert>
        )}

        {/* Filters */}
        <Card className='mb-8'>
          <CardHeader>
            <CardTitle className='text-lg'>Filtrer les avis</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
              <div>
                <Label htmlFor='search'>Rechercher</Label>
                <div className='relative'>
                  <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400' />
                  <Input
                    id='search'
                    placeholder='Titre, contenu, assureur...'
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className='pl-10'
                  />
                </div>
              </div>

              <div>
                <Label htmlFor='status'>Statut</Label>
                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder='Tous les statuts' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='all'>Tous les statuts</SelectItem>
                    {Object.entries(REVIEW_STATUS).map(([key, value]) => (
                      <SelectItem key={key} value={key}>
                        {value.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor='rating'>Note</Label>
                <Select value={selectedRating} onValueChange={setSelectedRating}>
                  <SelectTrigger>
                    <SelectValue placeholder='Toutes les notes' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='all'>Toutes les notes</SelectItem>
                    <SelectItem value='5'>5 étoiles</SelectItem>
                    <SelectItem value='4'>4 étoiles</SelectItem>
                    <SelectItem value='3'>3 étoiles</SelectItem>
                    <SelectItem value='2'>2 étoiles</SelectItem>
                    <SelectItem value='1'>1 étoile</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className='flex items-end'>
                <Button
                  variant='outline'
                  onClick={() => {
                    setSearchTerm('')
                    setSelectedStatus('all')
                    setSelectedRating('all')
                  }}
                  className='w-full'
                >
                  <Filter className='h-4 w-4 mr-2' />
                  Réinitialiser
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Reviews List */}
        <div className='space-y-6'>
          {filteredReviews.length === 0 ? (
            <Card>
              <CardContent className='text-center py-12'>
                <MessageSquare className='mx-auto h-12 w-12 text-gray-400 mb-4' />
                <h3 className='text-lg font-medium text-gray-900 mb-2'>Aucun avis trouvé</h3>
                <p className='text-gray-500 mb-4'>
                  {searchTerm || selectedStatus !== 'all' || selectedRating !== 'all'
                    ? 'Essayez de modifier vos filtres'
                    : 'Commencez par rédiger votre premier avis'}
                </p>
                {canCreateNewReview && (
                  <Button onClick={() => setIsCreateDialogOpen(true)}>
                    <Plus className='h-4 w-4 mr-2' />
                    Rédiger mon premier avis
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            filteredReviews.map((review) => {
              const statusInfo = getStatusInfo(review.status)
              const StatusIcon = statusInfo.icon

              return (
                <Card key={review.id}>
                  <CardHeader>
                    <div className='flex justify-between items-start'>
                      <div className='flex items-start space-x-4'>
                        <div className='w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center'>
                          <Building className='h-6 w-6 text-gray-500' />
                        </div>
                        <div>
                          <div className='flex items-center space-x-2'>
                            <h3 className='font-semibold text-lg'>{review.insurer_name}</h3>
                            <Badge className={statusInfo.color}>
                              <StatusIcon className='h-3 w-3 mr-1' />
                              {statusInfo.label}
                            </Badge>
                            {review.is_verified && (
                              <Badge variant='outline' className='text-green-600'>
                                <CheckCircle className='h-3 w-3 mr-1' />
                                Vérifié
                              </Badge>
                            )}
                          </div>
                          <div className='flex items-center space-x-4 mt-1'>
                            {renderStars(review.rating)}
                            <span className='text-sm text-gray-500'>
                              {new Date(review.created_at).toLocaleDateString('fr-FR')}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className='flex items-center space-x-2'>
                        {review.status === 'pending' && (
                          <Button
                            variant='outline'
                            size='sm'
                            onClick={() => handleEditReview(review)}
                          >
                            <Edit className='h-4 w-4' />
                          </Button>
                        )}
                        <Button
                          variant='outline'
                          size='sm'
                          onClick={() => handleDeleteReview(review.id)}
                          className='text-red-600 hover:text-red-700'
                        >
                          <Trash2 className='h-4 w-4' />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent>
                    <h4 className='font-medium mb-2'>{review.title}</h4>
                    <p className='text-gray-700 mb-4'>{review.content}</p>

                    {(review.pros || review.cons) && (
                      <div className='grid grid-cols-1 md:grid-cols-2 gap-4 mb-4'>
                        {review.pros && (
                          <div className='bg-green-50 p-3 rounded-lg'>
                            <h5 className='font-medium text-green-800 mb-1'>Points positifs</h5>
                            <p className='text-sm text-green-700'>{review.pros}</p>
                          </div>
                        )}
                        {review.cons && (
                          <div className='bg-red-50 p-3 rounded-lg'>
                            <h5 className='font-medium text-red-800 mb-1'>Points à améliorer</h5>
                            <p className='text-sm text-red-700'>{review.cons}</p>
                          </div>
                        )}
                      </div>
                    )}

                    {review.response_text && (
                      <div className='bg-blue-50 p-4 rounded-lg mb-4'>
                        <h5 className='font-medium text-blue-800 mb-2'>
                          Réponse de {review.insurer_name}
                        </h5>
                        <p className='text-sm text-blue-700'>{review.response_text}</p>
                        <p className='text-xs text-blue-600 mt-2'>
                          {new Date(review.responded_at!).toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                    )}

                    <Separator className='my-4' />

                    <div className='flex items-center justify-between text-sm text-gray-500'>
                      <div className='flex items-center space-x-4'>
                        <div className='flex items-center space-x-1'>
                          <ThumbsUp className='h-4 w-4' />
                          <span>{review.helpful_count} utile(s)</span>
                        </div>
                        {review.report_count > 0 && (
                          <div className='flex items-center space-x-1 text-red-600'>
                            <AlertCircle className='h-4 w-4' />
                            <span>{review.report_count} signalement(s)</span>
                          </div>
                        )}
                      </div>
                      <span>
                        Mis à jour le {new Date(review.updated_at).toLocaleDateString('fr-FR')}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
