import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Search,
  UserPlus,
  Mail,
  Phone,
  FileText,
  TrendingUp,
  MessageCircle,
  Eye,
  Download,
  Users,
  Target,
} from 'lucide-react';
import { logger } from '@/lib/logger';
import { supabase } from '@/lib/supabase';
import { useNavigate } from 'react-router-dom';

interface Client {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  status: 'active' | 'prospect' | 'inactive';
  totalQuotes: number;
  convertedQuotes: number;
  totalRevenue: number;
  lastContact?: Date;
  createdAt: Date;
}

interface ClientStats {
  totalClients: number;
  activeClients: number;
  prospectClients: number;
  inactiveClients: number;
  conversionRate: number;
  averageRevenue: number;
}

export const InsurerClientsPage: React.FC = () => {
  const navigate = useNavigate();
  const [clients, setClients] = useState<Client[]>([]);
  const [stats, setStats] = useState<ClientStats>({
    totalClients: 0,
    activeClients: 0,
    prospectClients: 0,
    inactiveClients: 0,
    conversionRate: 0,
    averageRevenue: 0,
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'prospect' | 'inactive'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'revenue' | 'quotes' | 'date'>('date');

  useEffect(() => {
    loadInsurerData();
  }, []);

  const loadInsurerData = async () => {
    try {
      const { data: insurerData, error } = await supabase.rpc('get_current_insurer_id');

      if (error || !insurerData || insurerData.length === 0) {
        logger.error('No insurer account found');
        navigate('/assureur/configuration', { replace: true });
        return;
      }

      await loadClients(insurerData[0].insurer_id);
    } catch (error) {
      logger.error('Error loading insurer data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadClients = async (id: string) => {
    try {
      const { data: offersData, error } = await supabase
        .from('quote_offers')
        .select(`
          id,
          status,
          price,
          created_at,
          quotes:quote_id (
            id,
            created_at,
            status,
            personal_data
          )
        `)
        .eq('insurer_id', id);

      if (error) {
        logger.error('Error loading clients:', error);
        return;
      }

      const clientMap = new Map<string, Client>();

      offersData?.forEach((offer) => {
        if (!offer.quotes) return;

        const personalData = offer.quotes.personal_data as any || {};
        const firstName = personalData.firstName || personalData.first_name || '';
        const lastName = personalData.lastName || personalData.last_name || '';
        const email = personalData.email || personalData.email || '';
        const phone = personalData.phone || personalData.phoneNumber || personalData.phone_number || '';

        const name = `${firstName} ${lastName}`.trim() || 'Client inconnu';
        const clientKey = email || name;

        if (!clientMap.has(clientKey)) {
          clientMap.set(clientKey, {
            id: clientKey,
            name,
            email,
            phone,
            status: offer.status === 'APPROVED' ? 'active' : 'prospect',
            totalQuotes: 0,
            convertedQuotes: 0,
            totalRevenue: 0,
            createdAt: new Date(offer.created_at),
          });
        }

        const client = clientMap.get(clientKey)!;
        client.totalQuotes++;
        if (offer.status === 'APPROVED') {
          client.convertedQuotes++;
          client.totalRevenue += offer.price || 0;
          client.status = 'active';
        }
      });

      const clientsArray = Array.from(clientMap.values());

      const totalClients = clientsArray.length;
      const activeClients = clientsArray.filter(c => c.status === 'active').length;
      const prospectClients = clientsArray.filter(c => c.status === 'prospect').length;
      const totalConverted = clientsArray.reduce((sum, c) => sum + c.convertedQuotes, 0);
      const totalQuotes = clientsArray.reduce((sum, c) => sum + c.totalQuotes, 0);
      const totalRevenue = clientsArray.reduce((sum, c) => sum + c.totalRevenue, 0);

      setStats({
        totalClients,
        activeClients,
        prospectClients,
        inactiveClients: 0,
        conversionRate: totalQuotes > 0 ? totalConverted / totalQuotes : 0,
        averageRevenue: totalClients > 0 ? totalRevenue / totalClients : 0,
      });

      setClients(clientsArray);
    } catch (error) {
      logger.error('Error loading clients:', error);
    }
  };

  const filteredClients = clients
    .filter(client => {
      const matchesSearch =
        client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.phone?.includes(searchTerm);

      const matchesStatus = statusFilter === 'all' || client.status === statusFilter;

      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'revenue':
          return b.totalRevenue - a.totalRevenue;
        case 'quotes':
          return b.totalQuotes - a.totalQuotes;
        case 'date':
          return b.createdAt.getTime() - a.createdAt.getTime();
        default:
          return 0;
      }
    });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800">Actif</Badge>;
      case 'prospect':
        return <Badge className="bg-blue-100 text-blue-800">Prospect</Badge>;
      case 'inactive':
        return <Badge className="bg-gray-100 text-gray-800">Inactif</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const handleContactClient = (client: Client) => {
    logger.info('Contact client:', client);
  };

  const handleViewDetails = (client: Client) => {
    logger.info('View client details:', client);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Chargement des clients...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Clients</h1>
          <p className="text-muted-foreground">
            Gérez vos clients et prospects
          </p>
        </div>
        <Button onClick={() => navigate('/assureur/offers/create')}>
          <UserPlus className="h-4 w-4 mr-2" />
          Nouveau client
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total clients</p>
                <p className="text-2xl font-bold">{stats.totalClients}</p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Clients actifs</p>
                <p className="text-2xl font-bold text-green-600">{stats.activeClients}</p>
              </div>
              <Target className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Prospects</p>
                <p className="text-2xl font-bold text-blue-600">{stats.prospectClients}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Taux conversion</p>
                <p className="text-2xl font-bold text-purple-600">
                  {Math.round(stats.conversionRate * 100)}%
                </p>
              </div>
              <FileText className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher par nom, email, téléphone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <Select value={statusFilter} onValueChange={(v: any) => setStatusFilter(v)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="active">Actifs</SelectItem>
                <SelectItem value="prospect">Prospects</SelectItem>
                <SelectItem value="inactive">Inactifs</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={(v: any) => setSortBy(v)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Trier par" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date">Plus récents</SelectItem>
                <SelectItem value="name">Nom</SelectItem>
                <SelectItem value="revenue">Revenu</SelectItem>
                <SelectItem value="quotes">Devis</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Exporter
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Liste des clients</CardTitle>
          <CardDescription>
            {filteredClients.length} client{filteredClients.length > 1 ? 's' : ''}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredClients.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground">Aucun client trouvé</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredClients.map((client) => (
                <div
                  key={client.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                        <span className="text-primary font-semibold">
                          {client.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium">{client.name}</h4>
                          {getStatusBadge(client.status)}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                          {client.email && (
                            <div className="flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              {client.email}
                            </div>
                          )}
                          {client.phone && (
                            <div className="flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {client.phone}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-6 mt-3 ml-14 text-sm">
                      <div>
                        <span className="text-muted-foreground">Devis: </span>
                        <span className="font-medium">{client.totalQuotes}</span>
                        <span className="text-muted-foreground ml-1">
                          ({client.convertedQuotes} convertis)
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Revenu: </span>
                        <span className="font-medium">
                          {client.totalRevenue > 0
                            ? `${client.totalRevenue.toLocaleString('fr-FR')} FCFA`
                            : 'N/A'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleContactClient(client)}
                    >
                      <MessageCircle className="h-4 w-4 mr-1" />
                      Contacter
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleViewDetails(client)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default InsurerClientsPage;
