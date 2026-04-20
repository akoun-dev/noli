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
import { FileText, Calendar, DollarSign, User, ArrowRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { contractService } from '@/services/contractService'
import { supabase } from '@/lib/supabase'
import { logger } from '@/lib/logger'

export const InsurerContractsPage: React.FC = () => {
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

  const { data: contracts = [], isLoading } = useQuery({
    queryKey: ['insurer-contracts', insurerId],
    queryFn: () => contractService.getMyContracts(insurerId || ''),
    enabled: !!insurerId,
  })

  return (
    <div className='space-y-6'>
      <div className='flex justify-between items-center'>
        <div>
          <h1 className='text-2xl font-bold'>Gestion des Contrats</h1>
          <p className='text-muted-foreground'>Suivez et gérez les polices d'assurance actives</p>
        </div>
      </div>

      {loading || isLoading ? (
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Chargement des contrats...</p>
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Liste des Polices</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>N° Police</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Prime</TableHead>
                  <TableHead>Échéance</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className='text-right'>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {contracts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className='text-center'>
                    Chargement...
                  </TableCell>
                </TableRow>
              ) : contracts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className='text-center'>
                    Aucun contrat trouvé
                  </TableCell>
                </TableRow>
                ) : (
                  contracts.map((contract) => (
                    <TableRow key={contract.id}>
                      <TableCell className='font-medium'>{contract.policy_number}</TableCell>
                      <TableCell>
                        <div className='flex items-center gap-2'>
                          <User className='h-4 w-4 text-muted-foreground' />
                          <span>Client {contract.user_id.substring(0, 8)}...</span>
                        </div>
                      </TableCell>
                      <TableCell>{contract.premium_amount.toLocaleString()} FCFA</TableCell>
                      <TableCell>
                        <div className='flex items-center gap-2'>
                          <Calendar className='h-4 w-4 text-muted-foreground' />
                          {new Date(contract.end_date).toLocaleDateString()}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={contract.status === 'ACTIVE' ? 'default' : 'secondary'}>
                          {contract.status}
                        </Badge>
                      </TableCell>
                      <TableCell className='text-right'>
                        <Button
                          variant='outline'
                          size='sm'
                          onClick={() => navigate(`/assureur/contrats/${contract.id}`)}
                        >
                          Détails <ArrowRight className='ml-2 h-3 w-3' />
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

export default InsurerContractsPage
