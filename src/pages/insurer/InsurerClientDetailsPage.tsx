import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  User, 
  Car, 
  FileText, 
  Shield, 
  AlertCircle, 
  Mail, 
  Phone, 
  MapPin, 
  ArrowLeft,
  Clock
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { contractService } from '@/services/contractService';
import { claimService } from '@/services/claimService';

export const InsurerClientDetailsPage: React.FC = () => {
  const { clientId } = useParams<{ clientId: string }>();
  const navigate = useNavigate();

  const { data: client, isLoading: isClientLoading } = useQuery({
    queryKey: ['insurer-client-detail', clientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', clientId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!clientId,
  });

  const { data: contracts, isLoading: isContractsLoading } = useQuery({
    queryKey: ['insurer-client-contracts', clientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('policies')
        .select('*')
        .eq('user_id', clientId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!clientId,
  });

  const { data: claims, isLoading: isClaimsLoading } = useQuery({
    queryKey: ['insurer-client-claims', clientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('claims')
        .select('*')
        .eq('user_id', clientId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!clientId,
  });

  if (isClientLoading) return <div className="p-6 text-center">Chargement du profil client...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Retour
        </Button>
        <h1 className="text-2xl font-bold">Fiche Client : {client?.first_name} {client?.last_name}</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Profile Info */}
        <Card className="lg:col-span-1">
          <CardHeader className="flex flex-col items-center text-center">
            <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <User className="h-10 w-10 text-primary" />
            </div>
            <CardTitle>{client?.first_name} {client?.last_name}</CardTitle>
            <Badge variant="outline" className="mt-2">Client Assuré</Badge>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3 text-sm">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span>{client?.email}</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <span>{client?.phone || 'Non renseigné'}</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span>{client?.address || 'Adresse non renseignée'}</span>
            </div>
            <div className="pt-4 border-t">
              <p className="text-xs text-muted-foreground mb-2">Dernière activité</p>
              <div className="flex items-center gap-2 text-xs">
                <Clock className="h-3 w-3" />
                {client?.last_login ? new Date(client?.last_login).toLocaleDateString() : 'Jamais connecté'}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Right Column: Activity Tabs */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Historique et Dossiers</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="contracts">
              <TabsList className="mb-4">
                <TabsTrigger value="contracts" className="flex items-center gap-2">
                  <Shield className="h-4 w-4" /> Contrats
                </TabsTrigger>
                <TabsTrigger value="claims" className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" /> Sinistres
                </TabsTrigger>
                <TabsTrigger value="quotes" className="flex items-center gap-2">
                  <FileText className="h-4 w-4" /> Devis
                </TabsTrigger>
              </TabsList>

              <TabsContent value="contracts">
                {isContractsLoading ? (
                  <p className="text-center py-4">Chargement...</p>
                ) : contracts?.length === 0 ? (
                  <p className="text-center py-4 text-muted-foreground">Aucun contrat actif</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>N° Police</TableHead>
                        <TableHead>Statut</TableHead>
                        <TableHead>Échéance</TableHead>
                        <TableHead className="text-right">Prime</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {contracts?.map((c) => (
                        <TableRow key={c.id}>
                          <TableCell className="font-medium">{c.policy_number}</TableCell>
                          <TableCell>
                            <Badge variant={c.status === 'ACTIVE' ? 'default' : 'secondary'}>
                              {c.status}
                            </Badge>
                          </TableCell>
                          <TableCell>{new Date(c.end_date).toLocaleDateString()}</TableCell>
                          <TableCell className="text-right">{c.premium_amount.toLocaleString()} FCFA</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </TabsContent>

              <TabsContent value="claims">
                {isClaimsLoading ? (
                  <p className="text-center py-4">Chargement...</p>
                ) : claims?.length === 0 ? (
                  <p className="text-center py-4 text-muted-foreground">Aucun sinistre déclaré</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Dossier</TableHead>
                        <TableHead>Titre</TableHead>
                        <TableHead>Statut</TableHead>
                        <TableHead className="text-right">Montant</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {claims?.map((cl) => (
                        <TableRow key={cl.id}>
                          <TableCell className="font-medium">{cl.claim_number}</TableCell>
                          <TableCell>{cl.title}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{cl.status}</Badge>
                          </TableCell>
                          <TableCell className="text-right">{cl.estimated_amount?.toLocaleString()} FCFA</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </TabsContent>

              <TabsContent value="quotes">
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="h-8 w-8 mx-auto mb-2 opacity-20" />
                  <p>L'historique des devis est disponible dans la gestion des devis.</p>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
