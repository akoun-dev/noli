import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { logger } from '@/lib/logger'
import { guaranteeService } from '@/features/tarification/services/guaranteeService'
import { tarificationSupabaseService } from '@/features/tarification/services/tarificationSupabaseService'
import { Guarantee, CalculationMethodType } from '@/types/tarification'
import {
  Plus,
  Edit,
  Trash2,
  Calculator,
  Shield,
  Layers,
  Zap,
  Package,
  Settings,
  TrendingUp,
  Sparkles,
  FileText,
  Database,
  Info,
  AlertTriangle,
  AlertCircle,
  CheckCircle,
  RefreshCw,
} from 'lucide-react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import { TarifRCForm } from './components/TarifRCForm'
import { GuaranteeForm } from './components/GuaranteeForm'

// ============================================
// COMPOSANTS UI
// ============================================

const StatCard: React.FC<{
  title: string
  value: string | number
  icon: React.ReactNode
  trend?: { value: number; isPositive: boolean }
  color?: 'blue' | 'green' | 'purple' | 'orange'
}> = ({ title, value, icon, trend, color = 'blue' }) => {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400',
    green: 'bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400',
    purple: 'bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400',
    orange: 'bg-orange-50 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400',
  }

  return (
    <Card>
      <CardContent className='p-6'>
        <div className='flex items-center justify-between'>
          <div>
            <p className='text-sm text-muted-foreground'>{title}</p>
            <p className='text-2xl font-bold mt-2'>{value}</p>
            {trend && (
              <p className={cn(
                'text-xs mt-1 flex items-center gap-1',
                trend.isPositive ? 'text-green-600' : 'text-red-600'
              )}>
                {trend.isPositive ? '+' : '-'}
                {trend.value}%
              </p>
            )}
          </div>
          <div className={cn('p-3 rounded-lg', colorClasses[color])}>
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// ============================================
// PAGE PRINCIPALE
// ============================================

export const AdminTarificationPageV2 = () => {
  const { user, isAuthenticated, isLoading } = useAuth()

  // États
  const [activeTab, setActiveTab] = useState<'guarantees' | 'tarifs-rc' | 'settings'>('guarantees')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Données
  const [guarantees, setGuarantees] = useState<Guarantee[]>([])
  const [tarifsRC, setTarifsRC] = useState<any[]>([])
  const [stats, setStats] = useState({
    totalGuarantees: 0,
    activeGuarantees: 0,
    totalTarifs: 0,
  })

  // Dialog states
  const [isGuaranteeDialogOpen, setIsGuaranteeDialogOpen] = useState(false)
  const [isTarifRCDialogOpen, setIsTarifRCDialogOpen] = useState(false)
  const [selectedGuarantee, setSelectedGuarantee] = useState<Guarantee | undefined>()
  const [guaranteeMode, setGuaranteeMode] = useState<'create' | 'edit'>('create')

  // Chargement des données
  useEffect(() => {
    loadData()
  }, [activeTab])

  const loadData = async () => {
    try {
      setLoading(true)
      setError(null)

      if (activeTab === 'guarantees') {
        await loadGuarantees()
      } else if (activeTab === 'tarifs-rc') {
        await loadTarifsRC()
      }
    } catch (err) {
      logger.error('Error loading data:', err)
      setError('Erreur lors du chargement des données')
    } finally {
      setLoading(false)
    }
  }

  const loadGuarantees = async () => {
    try {
      const data = await tarificationSupabaseService.listAdminCoverages()
      setGuarantees(data)
      setStats(prev => ({
        ...prev,
        totalGuarantees: data.length,
        activeGuarantees: data.filter(g => g.isActive).length,
      }))
    } catch (error) {
      logger.error('Error loading guarantees:', error)
      throw error
    }
  }

  const loadTarifsRC = async () => {
    try {
      const data = await guaranteeService.getTarificationRC()
      setTarifsRC(data)
      setStats(prev => ({ ...prev, totalTarifs: data.length }))
    } catch (error) {
      logger.error('Error loading RC tariffs:', error)
      throw error
    }
  }

  // Handlers pour les garanties
  const handleCreateGuarantee = () => {
    setSelectedGuarantee(undefined)
    setGuaranteeMode('create')
    setIsGuaranteeDialogOpen(true)
  }

  const handleEditGuarantee = (guarantee: Guarantee) => {
    setSelectedGuarantee(guarantee)
    setGuaranteeMode('edit')
    setIsGuaranteeDialogOpen(true)
  }

  const handleGuaranteeSuccess = () => {
    loadGuarantees()
  }

  // ============================================
  // RENDU
  // ============================================

  if (!isAuthenticated || isLoading) {
    return (
      <div className='flex items-center justify-center min-h-screen'>
        <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-primary' />
      </div>
    )
  }

  if (user?.role !== 'ADMIN') {
    return (
      <div className='flex items-center justify-center min-h-screen'>
        <Alert className='max-w-md'>
          <AlertCircle className='h-4 w-4' />
          <AlertDescription className='ml-2'>
            Accès réservé aux administrateurs
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className='space-y-4 sm:space-y-6 p-4 sm:p-6'>
      {/* Header */}
      <div className='flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4'>
        <div className='min-w-0 flex-1'>
          <h1 className='text-xl sm:text-2xl font-bold truncate'>Gestion de la Tarification</h1>
          <p className='text-sm sm:text-base text-muted-foreground line-clamp-2'>
            Configurez les garanties et tarifs RC pour vos produits d'assurance
          </p>
        </div>
        <div className='flex items-center gap-2 flex-shrink-0'>
          <Button variant='outline' size='sm' onClick={loadData} className='hidden sm:flex'>
            <RefreshCw className='h-4 w-4 mr-2' />
            Actualiser
          </Button>
          <Button size='sm' onClick={handleCreateGuarantee}>
            <Plus className='h-4 w-4 mr-2' />
            <span className='hidden sm:inline'>Nouvelle garantie</span>
            <span className='sm:hidden'>Nouvelle</span>
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4'>
        <StatCard
          title='Garanties actives'
          value={`${stats.activeGuarantees}/${stats.totalGuarantees}`}
          icon={<Shield className='h-4 w-4 sm:h-5 sm:w-5' />}
          color='blue'
        />
        <StatCard
          title='Tarifs RC'
          value={stats.totalTarifs}
          icon={<Calculator className='h-4 w-4 sm:h-5 sm:w-5' />}
          color='green'
        />
        <StatCard
          title='Formules configurées'
          value={0}
          icon={<Layers className='h-4 w-4 sm:h-5 sm:w-5' />}
          color='purple'
        />
      </div>

      {/* Onglets */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className='w-full'>
        <TabsList className='grid w-full max-w-md grid-cols-3 h-auto'>
          <TabsTrigger value='guarantees' className='text-xs sm:text-sm'>
            <Shield className='h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2' />
            <span className='hidden xs:inline'>Garanties</span>
            <span className='xs:hidden'>Gar.</span>
          </TabsTrigger>
          <TabsTrigger value='tarifs-rc' className='text-xs sm:text-sm'>
            <Calculator className='h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2' />
            <span className='hidden xs:inline'>Tarifs RC</span>
            <span className='xs:hidden'>RC</span>
          </TabsTrigger>
          <TabsTrigger value='settings' className='text-xs sm:text-sm'>
            <Settings className='h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2' />
            <span className='hidden xs:inline'>Paramètres</span>
            <span className='xs:hidden'>Params</span>
          </TabsTrigger>
        </TabsList>

        {/* Contenu Garanties */}
        <TabsContent value='guarantees' className='space-y-4'>
          {loading ? (
            <div className='flex justify-center py-12'>
              <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-primary' />
            </div>
          ) : error ? (
            <Alert variant='destructive'>
              <AlertCircle className='h-4 w-4' />
              <AlertDescription className='text-sm'>{error}</AlertDescription>
            </Alert>
          ) : guarantees.length === 0 ? (
            <div className='text-center py-8 sm:py-12 px-4 border-2 border-dashed rounded-lg'>
              <Package className='h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground mx-auto mb-4' />
              <p className='text-base sm:text-lg font-medium mb-2'>Aucune garantie configurée</p>
              <p className='text-xs sm:text-sm text-muted-foreground mb-4'>
                Commencez par créer votre première garantie
              </p>
              <Button onClick={handleCreateGuarantee} size='sm' className='w-full sm:w-auto'>
                <Plus className='h-4 w-4 mr-2' />
                Créer une garantie
              </Button>
            </div>
          ) : (
            <Card className='overflow-x-auto'>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className='hidden md:table-cell'>Code</TableHead>
                    <TableHead>Nom</TableHead>
                    <TableHead className='hidden sm:table-cell'>Catégorie</TableHead>
                    <TableHead className='hidden sm:table-cell'>Méthode</TableHead>
                    <TableHead>État</TableHead>
                    <TableHead className='text-right'>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {guarantees.map((guarantee) => (
                    <TableRow key={guarantee.id}>
                      <TableCell className='hidden md:table-cell'>
                        <code className='text-xs bg-muted px-2 py-1 rounded'>
                          {guarantee.code}
                        </code>
                      </TableCell>
                      <TableCell className='font-medium'>
                        <div className='flex flex-col'>
                          <span>{guarantee.name}</span>
                          <span className='md:hidden text-xs text-muted-foreground'>
                            {guarantee.code}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className='hidden sm:table-cell'>
                        <Badge variant='outline' className='text-xs'>{guarantee.category}</Badge>
                      </TableCell>
                      <TableCell className='hidden sm:table-cell'>
                        <Badge className='text-xs'>{guarantee.calculationMethod}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={guarantee.isActive ? 'default' : 'secondary'}
                          className='text-xs'
                        >
                          {guarantee.isActive ? 'Actif' : 'Inactif'}
                        </Badge>
                      </TableCell>
                      <TableCell className='text-right'>
                        <Button
                          variant='ghost'
                          size='sm'
                          onClick={() => handleEditGuarantee(guarantee)}
                        >
                          <Edit className='h-4 w-4' />
                          <span className='sr-only'>Modifier</span>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          )}
        </TabsContent>

        {/* Contenu Tarifs RC */}
        <TabsContent value='tarifs-rc' className='space-y-4'>
          {loading ? (
            <div className='flex justify-center py-12'>
              <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-primary' />
            </div>
          ) : error ? (
            <Alert variant='destructive'>
              <AlertCircle className='h-4 w-4' />
              <AlertDescription className='text-sm'>{error}</AlertDescription>
            </Alert>
          ) : (
            <>
              {tarifsRC.length === 0 ? (
                <div className='text-center py-8 sm:py-12 px-4 border-2 border-dashed rounded-lg'>
                  <Calculator className='h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground mx-auto mb-4' />
                  <p className='text-base sm:text-lg font-medium mb-2'>Aucun tarif RC configuré</p>
                  <p className='text-xs sm:text-sm text-muted-foreground mb-4'>
                    Configurez les tarifs de responsabilité civile
                  </p>
                  <Button onClick={() => setIsTarifRCDialogOpen(true)} size='sm' className='w-full sm:w-auto'>
                    <Plus className='h-4 w-4 mr-2' />
                    Configurer les tarifs
                  </Button>
                </div>
              ) : (
                <Card>
                  <CardHeader className='pb-4'>
                    <CardTitle className='text-lg sm:text-xl'>Tarifs par Type de Carburant</CardTitle>
                    <CardDescription className='text-sm'>
                      Tarifs de responsabilité civile selon la puissance fiscale
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className='space-y-4 sm:space-y-6'>
                      {['ESSENCE', 'DIESEL'].map((fuelType) => {
                        const fuelTariffs = tarifsRC.filter((t: any) => t.fuel_type === fuelType)
                        if (fuelTariffs.length === 0) return null

                        return (
                          <div key={fuelType} className='space-y-3'>
                            <h3 className='font-medium flex items-center gap-2 flex-wrap'>
                              <Badge
                                className={
                                  fuelType === 'ESSENCE'
                                    ? 'bg-red-100 text-red-700'
                                    : 'bg-blue-100 text-blue-700'
                                }
                              >
                                {fuelType === 'ESSENCE' ? '⛽' : '🛢️'} {fuelType}
                              </Badge>
                              <span className='text-xs sm:text-sm text-muted-foreground'>
                                ({fuelTariffs.length} tranche{fuelTariffs.length > 1 ? 's' : ''})
                              </span>
                            </h3>
                            <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3'>
                              {fuelTariffs.map((tarif, index) => (
                                <div
                                  key={index}
                                  className='p-3 sm:p-4 border rounded-lg hover:shadow-sm transition-shadow'
                                >
                                  <div className='flex justify-between items-start mb-2'>
                                    <span className='text-xs sm:text-sm font-mono'>
                                      {tarif.fiscal_power_min === tarif.fiscal_power_max
                                        ? `CV ${tarif.fiscal_power_min}`
                                        : `CV ${tarif.fiscal_power_min}-${tarif.fiscal_power_max}`
                                      }
                                    </span>
                                    <Badge variant='outline' className='text-xs'>
                                      {tarif.is_active ? 'Actif' : 'Inactif'}
                                    </Badge>
                                  </div>
                                  <p className='text-lg sm:text-2xl font-bold text-primary'>
                                    {tarif.prime?.toLocaleString() || 'N/A'} FCFA
                                  </p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </TabsContent>

        {/* Contenu Paramètres */}
        <TabsContent value='settings' className='space-y-4'>
          <Card>
            <CardHeader>
              <CardTitle>Paramètres globaux</CardTitle>
              <CardDescription>
                Configuration générale de la tarification
              </CardDescription>
            </CardHeader>
            <CardContent className='space-y-6'>
              <Alert>
                <Info className='h-4 w-4' />
                <AlertDescription className='ml-2'>
                  Cette section vous permet de configurer les paramètres globaux qui s'appliquent à tous les calculs de tarification.
                </AlertDescription>
              </Alert>

              <div className='space-y-4'>
                <div>
                  <h3 className='font-medium mb-2'>Taux de change</h3>
                  <p className='text-sm text-muted-foreground'>
                    Configurez les taux de change pour les calculs en devises.
                  </p>
                </div>

                <div>
                  <h3 className='font-medium mb-2'>Arrondis</h3>
                  <p className='text-sm text-muted-foreground'>
                    Définissez les règles d'arrondi pour l'affichage des primes.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialogues */}
      <GuaranteeForm
        open={isGuaranteeDialogOpen}
        onClose={() => setIsGuaranteeDialogOpen(false)}
        mode={guaranteeMode}
        initialData={selectedGuarantee}
        onSuccess={handleGuaranteeSuccess}
      />
      <TarifRCForm
        open={isTarifRCDialogOpen}
        onClose={() => setIsTarifRCDialogOpen(false)}
        mode='create'
        onSuccess={() => {
          loadTarifsRC()
        }}
      />
    </div>
  )
}

export default AdminTarificationPageV2
