import React, { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
import { AlertCircle, Clock, CheckCircle, DollarSign } from 'lucide-react'
import { claimService } from '@/services/claimService'
import { supabase } from '@/lib/supabase'
import { logger } from '@/lib/logger'
import { useNavigate } from 'react-router-dom'

export const InsurerClaimsPage: React.FC = () => {
  const navigate = useNavigate()
  const [insurerId, setInsurerId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadInsurerId()
  }, [])

  const loadInsurerId = async () => {
    try {
      const { data, error } = await supabase.rpc('get_current_insurer_id')
      if (error || !data || data.length === 0) {
        logger.error('No insurer account found')
        navigate('/assureur/configuration', { replace: true })
        return
      }
      setInsurerId(data[0].insurer_id)
    } catch (error) {
      logger.error('Error loading insurer ID:', error)
    } finally {
      setLoading(false)
    }
  }

  const { data: claims = [], isLoading } = useQuery({
    queryKey: ['insurer-claims', insurerId],
    queryFn: () => claimService.getMyClaims(insurerId || ''),
    enabled: !!insurerId,
  })

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'SUBMITTED':
        return <Badge variant='outline'>Soumis</Badge>
      case 'UNDER_REVIEW':
        return <Badge variant='secondary'>En cours</Badge>
      case 'APPROVED':
        return (
          <Badge variant='default' className='bg-green-500'>
            Approuvé
          </Badge>
        )
      case 'REJECTED':
        return <Badge variant='destructive'>Rejeté</Badge>
      case 'PAID':
        return (
          <Badge variant='default' className='bg-blue-500'>
            Payé
          </Badge>
        )
      default:
        return <Badge variant='outline'>{status}</Badge>
    }
  }

  return (
    <div className='space-y-6'>
      <div>
        <h1 className='text-2xl font-bold'>Gestion des Sinistres</h1>
        <p className='text-muted-foreground'>
          Traitez les déclarations de sinistres de vos clients
        </p>
      </div>

      {loading || isLoading ? (
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Chargement des sinistres...</p>
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Dossiers de Sinistres</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>N° Dossier</TableHead>
                  <TableHead>Titre</TableHead>
                  <TableHead>Date Incident</TableHead>
                  <TableHead>Montant Est.</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className='text-right'>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading || isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className='text-center'>
                      Chargement...
                    </TableCell>
                  </TableRow>
                ) : claims.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className='text-center'>
                      Aucun sinistre déclaré
                    </TableCell>
                  </TableRow>
                ) : (
                  claims.map((claim) => (
                    <TableRow key={claim.id}>
                      <TableCell className='font-medium'>{claim.claim_number}</TableCell>
                      <TableCell>{claim.title}</TableCell>
                      <TableCell>{new Date(claim.incident_date).toLocaleDateString()}</TableCell>
                      <TableCell>{claim.estimated_amount?.toLocaleString()} FCFA</TableCell>
                      <TableCell>{getStatusBadge(claim.status)}</TableCell>
                      <TableCell className='text-right'>
                        <Button variant='outline' size='sm'>
                          Gérer
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default InsurerClaimsPage
