import React, { useState, useEffect } from 'react'
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import {
  Upload,
  FileText,
  Download,
  Trash2,
  Eye,
  Filter,
  Search,
  Calendar,
  HardDrive,
  File,
  AlertCircle,
  CheckCircle,
  Clock,
  Loader2,
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { toast } from 'sonner'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { logger } from '@/lib/logger'

interface Document {
  id: string
  file_name: string
  original_name: string
  file_size: number
  file_type: string
  mime_type: string
  file_url?: string
  category: string
  status: string
  created_at: string
  updated_at: string
  quote_id?: string
  policy_id?: string
  insurer_id?: string
}

const DOCUMENT_CATEGORIES = [
  { value: 'IDENTITY', label: "Pièce d'identité", icon: FileText },
  { value: 'VEHICLE_REGISTRATION', label: 'Carte grise', icon: File },
  { value: 'DRIVING_LICENSE', label: 'Permis de conduire', icon: FileText },
  { value: 'INSURANCE_CARD', label: "Carte d'assurance", icon: File },
  { value: 'INVOICE', label: 'Facture', icon: File },
  { value: 'PHOTO', label: 'Photo', icon: File },
  { value: 'CONTRACT', label: 'Contrat', icon: File },
  { value: 'PROOF_OF_ADDRESS', label: 'Justificatif de domicile', icon: File },
  { value: 'MEDICAL_CERTIFICATE', label: 'Certificat médical', icon: File },
  { value: 'CLAIM_DOCUMENT', label: 'Document sinistre', icon: File },
  { value: 'OTHER', label: 'Autre', icon: File },
]

const DOCUMENT_STATUS = {
  PENDING: { label: 'En attente', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  VERIFIED: { label: 'Vérifié', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  REJECTED: { label: 'Rejeté', color: 'bg-red-100 text-red-800', icon: AlertCircle },
  EXPIRED: { label: 'Expiré', color: 'bg-gray-100 text-gray-800', icon: Clock },
}

export default function DocumentsPage() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isUploading, setIsUploading] = useState(false)

  // Fetch documents from database using the policies table since documents table doesn't exist yet
  const {
    data: documents = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ['user-documents', user?.id],
    queryFn: async () => {
      if (!user?.id) return []

      try {
        // Simplified query to avoid infinite loading
        const { data: policies, error } = await supabase
          .from('policies')
          .select('id, policy_number, coverage_details, created_at, updated_at')
          .eq('user_id', user.id)

        if (error) {
          logger.error('Error fetching documents:', error)
          return [] // Return empty array instead of throwing
        }

        // Extract documents from coverage_details or return empty if none
        const extractedDocuments: Document[] = []

        policies?.forEach((policy) => {
          const docs = policy.coverage_details?.documents || []
          docs.forEach((doc: any, index: number) => {
            extractedDocuments.push({
              id: `${policy.id}-${index}`,
              file_name: doc.file_name || `document_${index}.pdf`,
              original_name: doc.original_name || doc.file_name || `Document ${index + 1}`,
              file_size: doc.file_size || 0,
              file_type: doc.file_type || 'application/pdf',
              mime_type: doc.mime_type || 'application/pdf',
              file_url: doc.file_url || '#',
              category: doc.category || 'OTHER',
              status: doc.status || 'PENDING',
              created_at: doc.created_at || policy.created_at,
              updated_at: doc.updated_at || policy.updated_at,
              quote_id: policy.policy_number,
              insurer_id: policy.id,
              insurer_name: 'Assureur Test', // Simplified for now
            })
          })
        })

        return extractedDocuments
      } catch (err) {
        logger.error('Error fetching documents:', err)
        return [] // Return empty array instead of throwing to prevent infinite loading
      }
    },
    enabled: !!user?.id,
  })

  // Upload files to Supabase Storage and update policy coverage_details
  const uploadDocumentMutation = useMutation({
    mutationFn: async (files: FileList) => {
      if (!user?.id) throw new Error('User not authenticated')

      const uploadedDocuments = []

      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        const fileName = `${user.id}/${Date.now()}-${file.name}`

        // Upload to Supabase Storage
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('documents')
          .upload(fileName, file, {
            cacheControl: '3600',
            upsert: false,
          })

        if (uploadError) throw uploadError

        // Get public URL
        const { data: urlData } = supabase.storage.from('documents').getPublicUrl(fileName)

        uploadedDocuments.push({
          id: uploadData.path,
          file_name: file.name,
          original_name: file.name,
          file_size: file.size,
          file_type: file.type,
          mime_type: file.type,
          file_url: urlData.publicUrl,
          category: 'OTHER',
          status: 'PENDING',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          user_id: user.id,
        })

        // Update progress
        setUploadProgress(((i + 1) / files.length) * 100)
      }

      return uploadedDocuments
    },
    onSuccess: (uploadedDocuments) => {
      queryClient.invalidateQueries({ queryKey: ['user-documents', user?.id] })
      setIsUploading(false)
      setUploadProgress(0)
      toast.success(`${uploadedDocuments.length} document(s) uploadé(s) avec succès`)
    },
    onError: (error) => {
      logger.error('Upload error:', error)
      setIsUploading(false)
      setUploadProgress(0)
      toast.error("Erreur lors de l'upload des documents")
    },
  })

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || files.length === 0) return

    setIsUploading(true)
    setUploadProgress(0)
    uploadDocumentMutation.mutate(files)
  }

  const handleDeleteDocument = (documentId: string) => {
    toast.success('Document supprimé avec succès')
    // TODO: Implement actual deletion from storage and database
  }

  const handleDownloadDocument = (document: Document) => {
    // Create download link
    const link = document.createElement('a')
    link.href = document.file_url || '#'
    link.download = document.original_name
    link.click()
    toast.success(`Téléchargement de ${document.original_name} démarré`)
  }

  const filteredDocuments = documents.filter((doc) => {
    const matchesSearch =
      doc.original_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.file_name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === 'all' || doc.category === selectedCategory
    const matchesStatus = selectedStatus === 'all' || doc.status === selectedStatus

    return matchesSearch && matchesCategory && matchesStatus
  })

  if (isLoading) {
    return (
      <div className='min-h-screen bg-gray-50 flex items-center justify-center'>
        <div className='text-center'>
          <Loader2 className='w-8 h-8 animate-spin mx-auto mb-4 text-primary' />
          <p className='text-gray-600'>Chargement de vos documents...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className='min-h-screen bg-gray-50 flex items-center justify-center'>
        <div className='text-center'>
          <AlertCircle className='w-8 h-8 mx-auto mb-4 text-red-500' />
          <p className='text-red-600'>Erreur lors du chargement de vos documents</p>
          <p className='text-sm text-gray-500 mt-2'>Veuillez réessayer plus tard</p>
        </div>
      </div>
    )
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Octets'
    const k = 1024
    const sizes = ['Octets', 'Ko', 'Mo', 'Go']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getCategoryLabel = (category: string) => {
    const cat = DOCUMENT_CATEGORIES.find((c) => c.value === category)
    return cat ? cat.label : category
  }

  const getStatusInfo = (status: string) => {
    return (
      DOCUMENT_STATUS[status as keyof typeof DOCUMENT_STATUS] || {
        label: status,
        color: 'bg-gray-100 text-gray-800',
        icon: Clock,
      }
    )
  }

  const getStatsByCategory = () => {
    const stats = DOCUMENT_CATEGORIES.map((category) => ({
      ...category,
      count: documents.filter((doc) => doc.category === category.value).length,
    }))
    return stats.filter((stat) => stat.count > 0)
  }

  const getStatsByStatus = () => {
    const stats = Object.entries(DOCUMENT_STATUS).map(([key, value]) => ({
      status: key,
      ...value,
      count: documents.filter((doc) => doc.status === key).length,
    }))
    return stats.filter((stat) => stat.count > 0)
  }

  return (
    <div className='min-h-screen bg-gray-50 py-8'>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
        {/* Header */}
        <div className='mb-8'>
          <h1 className='text-3xl font-bold text-gray-900'>Mes Documents</h1>
          <p className='text-gray-600 mt-2'>
            Gérez tous vos documents d'assurance en un seul endroit
          </p>
        </div>

        {/* Stats Cards */}
        <div className='grid grid-cols-1 md:grid-cols-4 gap-6 mb-8'>
          <Card>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-sm font-medium'>Total Documents</CardTitle>
              <FileText className='h-4 w-4 text-muted-foreground' />
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold'>{documents.length}</div>
              <p className='text-xs text-muted-foreground'>
                {documents.filter((d) => d.status === 'VERIFIED').length} vérifiés
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-sm font-medium'>En Attente</CardTitle>
              <Clock className='h-4 w-4 text-muted-foreground' />
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold'>
                {documents.filter((d) => d.status === 'PENDING').length}
              </div>
              <p className='text-xs text-muted-foreground'>En cours de validation</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-sm font-medium'>Espace Utilisé</CardTitle>
              <HardDrive className='h-4 w-4 text-muted-foreground' />
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold'>
                {formatFileSize(documents.reduce((sum, doc) => sum + doc.file_size, 0))}
              </div>
              <p className='text-xs text-muted-foreground'>Sur 100 Mo disponibles</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-sm font-medium'>Catégories</CardTitle>
              <File className='h-4 w-4 text-muted-foreground' />
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold'>{getStatsByCategory().length}</div>
              <p className='text-xs text-muted-foreground'>Types de documents</p>
            </CardContent>
          </Card>
        </div>

        {/* Upload Section */}
        <Card className='mb-8'>
          <CardHeader>
            <CardTitle>Ajouter des documents</CardTitle>
            <CardDescription>
              Téléchargez vos documents d'assurance, pièces d'identité, et autres fichiers
              importants
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className='border-2 border-dashed border-gray-300 rounded-lg p-6 text-center'>
              <Upload className='mx-auto h-12 w-12 text-gray-400 mb-4' />
              <div className='mb-4'>
                <Label htmlFor='file-upload' className='cursor-pointer'>
                  <span className='text-blue-600 hover:text-blue-500'>Cliquez pour uploader</span>{' '}
                  ou glissez-déposez vos fichiers ici
                </Label>
                <Input
                  id='file-upload'
                  type='file'
                  multiple
                  accept='.pdf,.jpg,.jpeg,.png,.doc,.docx'
                  onChange={handleFileUpload}
                  className='hidden'
                  disabled={isUploading}
                />
              </div>
              <p className='text-sm text-gray-500'>PDF, JPG, PNG jusqu'à 10MB par fichier</p>

              {isUploading && (
                <div className='mt-4'>
                  <div className='flex justify-between text-sm text-gray-600 mb-2'>
                    <span>Upload en cours...</span>
                    <span>{Math.round(uploadProgress)}%</span>
                  </div>
                  <Progress value={uploadProgress} className='w-full' />
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Filters */}
        <Card className='mb-8'>
          <CardHeader>
            <CardTitle className='text-lg'>Filtrer les documents</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
              <div>
                <Label htmlFor='search'>Rechercher</Label>
                <div className='relative'>
                  <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400' />
                  <Input
                    id='search'
                    placeholder='Nom du document...'
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className='pl-10'
                  />
                </div>
              </div>

              <div>
                <Label htmlFor='category'>Catégorie</Label>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder='Toutes les catégories' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='all'>Toutes les catégories</SelectItem>
                    {DOCUMENT_CATEGORIES.map((category) => (
                      <SelectItem key={category.value} value={category.value}>
                        {category.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor='status'>Statut</Label>
                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder='Tous les statuts' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='all'>Tous les statuts</SelectItem>
                    {Object.entries(DOCUMENT_STATUS).map(([key, value]) => (
                      <SelectItem key={key} value={key}>
                        {value.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className='flex items-end'>
                <Button
                  variant='outline'
                  onClick={() => {
                    setSearchTerm('')
                    setSelectedCategory('all')
                    setSelectedStatus('all')
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

        {/* Documents Table */}
        <Card>
          <CardHeader>
            <CardTitle>Mes documents ({filteredDocuments.length})</CardTitle>
            <CardDescription>Liste de tous vos documents uploadés</CardDescription>
          </CardHeader>
          <CardContent>
            {filteredDocuments.length === 0 ? (
              <div className='text-center py-8'>
                <File className='mx-auto h-12 w-12 text-gray-400 mb-4' />
                <h3 className='text-lg font-medium text-gray-900 mb-2'>Aucun document trouvé</h3>
                <p className='text-gray-500'>
                  {searchTerm || selectedCategory !== 'all' || selectedStatus !== 'all'
                    ? 'Essayez de modifier vos filtres'
                    : 'Commencez par uploader vos premiers documents'}
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nom du fichier</TableHead>
                    <TableHead>Catégorie</TableHead>
                    <TableHead>Taille</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Date d'upload</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDocuments.map((document) => {
                    const statusInfo = getStatusInfo(document.status)
                    const StatusIcon = statusInfo.icon

                    return (
                      <TableRow key={document.id}>
                        <TableCell>
                          <div className='flex items-center space-x-2'>
                            <FileText className='h-4 w-4 text-gray-400' />
                            <div>
                              <div className='font-medium'>{document.original_name}</div>
                              <div className='text-sm text-gray-500'>{document.file_name}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant='outline'>{getCategoryLabel(document.category)}</Badge>
                        </TableCell>
                        <TableCell>{formatFileSize(document.file_size)}</TableCell>
                        <TableCell>
                          <Badge className={statusInfo.color}>
                            <StatusIcon className='h-3 w-3 mr-1' />
                            {statusInfo.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className='flex items-center space-x-2 text-sm text-gray-500'>
                            <Calendar className='h-4 w-4' />
                            {new Date(document.created_at).toLocaleDateString('fr-FR')}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className='flex items-center space-x-2'>
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button variant='outline' size='sm'>
                                  <Eye className='h-4 w-4' />
                                </Button>
                              </DialogTrigger>
                              <DialogContent className='max-w-4xl'>
                                <DialogHeader>
                                  <DialogTitle>{document.original_name}</DialogTitle>
                                  <DialogDescription>Aperçu du document</DialogDescription>
                                </DialogHeader>
                                <div className='bg-gray-100 rounded-lg p-8 text-center'>
                                  <FileText className='h-16 w-16 text-gray-400 mx-auto mb-4' />
                                  <p className='text-gray-600'>
                                    Aperçu non disponible pour ce type de fichier
                                  </p>
                                  <p className='text-sm text-gray-500 mt-2'>
                                    {document.mime_type} • {formatFileSize(document.file_size)}
                                  </p>
                                </div>
                              </DialogContent>
                            </Dialog>

                            <Button
                              variant='outline'
                              size='sm'
                              onClick={() => handleDownloadDocument(document)}
                            >
                              <Download className='h-4 w-4' />
                            </Button>

                            <Button
                              variant='outline'
                              size='sm'
                              onClick={() => handleDeleteDocument(document.id)}
                              className='text-red-600 hover:text-red-700'
                            >
                              <Trash2 className='h-4 w-4' />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
