import { useState, useEffect } from 'react';
import {
  Send,
  Users,
  Mail,
  MessageCircle,
  Phone,
  Calendar,
  Clock,
  BarChart3,
  Target,
  Plus,
  Edit,
  Trash2,
  Eye,
  Play,
  Pause,
  Archive,
  Filter,
  Search,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useClientCommunication } from '../hooks/useClientCommunication';
import { Client, CommunicationTemplate } from '../services/clientCommunicationService';

export interface Campaign {
  id: string;
  name: string;
  description: string;
  type: 'email' | 'whatsapp' | 'sms' | 'mixed';
  status: 'draft' | 'scheduled' | 'active' | 'completed' | 'paused';
  templateId: string;
  targetAudience: {
    segment?: string;
    clientIds?: string[];
    criteria: {
      registrationDateRange?: { start: Date; end: Date };
      lastActivityRange?: { start: Date; end: Date };
      status?: Client['status'][];
      location?: string[];
      totalQuotesRange?: { min: number; max: number };
    };
  };
  scheduling: {
    sendAt?: Date;
    isRecurring?: boolean;
    recurringPattern?: 'daily' | 'weekly' | 'monthly';
    recurringEndDate?: Date;
  };
  performance: {
    sent: number;
    delivered: number;
    read: number;
    clicked: number;
    converted: number;
    failed: number;
  };
  createdAt: Date;
  createdBy: string;
  modifiedAt?: Date;
}

export const CampaignManager: React.FC = () => {
  const { clients, templates, sendBulkCommunication } = useClientCommunication('insurer-1');
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [isCreatingCampaign, setIsCreatingCampaign] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  useEffect(() => {
    loadCampaigns();
  }, []);

  const loadCampaigns = () => {
    // Simuler le chargement des campagnes
    const mockCampaigns: Campaign[] = [
      {
        id: 'campaign-1',
        name: 'Suivi des devis expirants',
        description: 'Relance automatique des clients avec des devis expirant dans 7 jours',
        type: 'email',
        status: 'active',
        templateId: 'template-2',
        targetAudience: {
          criteria: {
            status: ['prospect'],
          },
        },
        scheduling: {
          isRecurring: true,
          recurringPattern: 'daily',
        },
        performance: {
          sent: 245,
          delivered: 238,
          read: 156,
          clicked: 89,
          converted: 34,
          failed: 7,
        },
        createdAt: new Date('2024-01-15'),
        createdBy: 'Marie Konaté',
      },
      {
        id: 'campaign-2',
        name: 'Promotion spéciale Tous Risques',
        description: 'Campagne promotionnelle pour l\'offre Tous Risques avec 15% de réduction',
        type: 'mixed',
        status: 'scheduled',
        templateId: 'template-1',
        targetAudience: {
          clientIds: ['client-1', 'client-3'],
        },
        scheduling: {
          sendAt: new Date(Date.now() + 86400000), // Demain
        },
        performance: {
          sent: 0,
          delivered: 0,
          read: 0,
          clicked: 0,
          converted: 0,
          failed: 0,
        },
        createdAt: new Date('2024-01-18'),
        createdBy: 'Yao Bamba',
      },
      {
        id: 'campaign-3',
        name: 'Bienvenue nouveaux clients',
        description: 'Série de bienvenue pour les nouveaux clients inscrits',
        type: 'whatsapp',
        status: 'completed',
        templateId: 'template-3',
        targetAudience: {
          criteria: {
            registrationDateRange: {
              start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
              end: new Date(),
            },
          },
        },
        scheduling: {
          isRecurring: true,
          recurringPattern: 'daily',
        },
        performance: {
          sent: 89,
          delivered: 87,
          read: 76,
          clicked: 45,
          converted: 23,
          failed: 2,
        },
        createdAt: new Date('2024-01-10'),
        createdBy: 'Aminata Touré',
        modifiedAt: new Date('2024-01-16'),
      },
    ];

    setCampaigns(mockCampaigns);
  };

  const filteredCampaigns = campaigns.filter(campaign => {
    const matchesSearch = campaign.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         campaign.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || campaign.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: Campaign['status']) => {
    switch (status) {
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      case 'scheduled':
        return 'bg-blue-100 text-blue-800';
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-purple-100 text-purple-800';
      case 'paused':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: Campaign['status']) => {
    switch (status) {
      case 'draft':
        return <Edit className="h-4 w-4" />;
      case 'scheduled':
        return <Calendar className="h-4 w-4" />;
      case 'active':
        return <Play className="h-4 w-4" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4" />;
      case 'paused':
        return <Pause className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  const getTypeIcon = (type: Campaign['type']) => {
    switch (type) {
      case 'email':
        return <Mail className="h-4 w-4" />;
      case 'whatsapp':
        return <MessageCircle className="h-4 w-4" />;
      case 'sms':
        return <Phone className="h-4 w-4" />;
      case 'mixed':
        return <Users className="h-4 w-4" />;
      default:
        return <Send className="h-4 w-4" />;
    }
  };

  const calculatePerformanceMetrics = (campaign: Campaign) => {
    const { performance } = campaign;
    if (performance.sent === 0) return { deliveryRate: 0, readRate: 0, clickRate: 0, conversionRate: 0 };

    return {
      deliveryRate: (performance.delivered / performance.sent) * 100,
      readRate: (performance.read / performance.sent) * 100,
      clickRate: (performance.clicked / performance.sent) * 100,
      conversionRate: (performance.converted / performance.sent) * 100,
    };
  };

  const handleLaunchCampaign = async (campaignId: string) => {
    const campaign = campaigns.find(c => c.id === campaignId);
    if (!campaign) return;

    try {
      // Simuler le lancement de la campagne
      const result = await sendBulkCommunication(
        campaign.targetAudience.clientIds || [],
        campaign.templateId
      );

      // Mettre à jour la campagne
      setCampaigns(prev => prev.map(c =>
        c.id === campaignId
          ? {
              ...c,
              status: 'active',
              performance: {
                ...c.performance,
                sent: result.success.length,
                failed: result.failed.length,
              },
            }
          : c
      ));
    } catch (error) {
      logger.error('Erreur lancement campagne:', error);
    }
  };

  const handlePauseCampaign = (campaignId: string) => {
    setCampaigns(prev => prev.map(c =>
      c.id === campaignId ? { ...c, status: 'paused' } : c
    ));
  };

  const handleResumeCampaign = (campaignId: string) => {
    setCampaigns(prev => prev.map(c =>
      c.id === campaignId ? { ...c, status: 'active' } : c
    ));
  };

  const handleArchiveCampaign = (campaignId: string) => {
    setCampaigns(prev => prev.filter(c => c.id !== campaignId));
  };

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Gestion des Campagnes</h1>
          <p className="text-muted-foreground">
            Créez et gérez vos campagnes de communication client
          </p>
        </div>

        <Button onClick={() => setIsCreatingCampaign(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nouvelle campagne
        </Button>
      </div>

      <Tabs defaultValue="campaigns" className="space-y-6">
        <TabsList>
          <TabsTrigger value="campaigns">Campagnes ({campaigns.length})</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
        </TabsList>

        <TabsContent value="campaigns" className="space-y-6">
          {/* Filtres */}
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher une campagne..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="draft">Brouillons</SelectItem>
                <SelectItem value="scheduled">Programmées</SelectItem>
                <SelectItem value="active">Actives</SelectItem>
                <SelectItem value="completed">Terminées</SelectItem>
                <SelectItem value="paused">En pause</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Liste des campagnes */}
          <div className="grid gap-4">
            {filteredCampaigns.length === 0 ? (
              <Card className="p-12 text-center">
                <Send className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">Aucune campagne trouvée</h3>
                <p className="text-muted-foreground mb-4">
                  {searchTerm || filterStatus !== 'all'
                    ? 'Essayez de modifier vos filtres de recherche.'
                    : 'Créez votre première campagne pour commencer.'}
                </p>
                <Button onClick={() => setIsCreatingCampaign(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Créer une campagne
                </Button>
              </Card>
            ) : (
              filteredCampaigns.map((campaign) => {
                const metrics = calculatePerformanceMetrics(campaign);
                const template = templates.find(t => t.id === campaign.templateId);

                return (
                  <Card key={campaign.id} className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold">{campaign.name}</h3>
                          <Badge className={getStatusColor(campaign.status)}>
                            <div className="flex items-center gap-1">
                              {getStatusIcon(campaign.status)}
                              <span className="capitalize">{campaign.status}</span>
                            </div>
                          </Badge>
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            {getTypeIcon(campaign.type)}
                            <span className="capitalize">{campaign.type}</span>
                          </div>
                        </div>

                        <p className="text-muted-foreground mb-3">{campaign.description}</p>

                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            <span>Créée le {campaign.createdAt.toLocaleDateString('fr-FR')}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Users className="h-4 w-4" />
                            <span>Par {campaign.createdBy}</span>
                          </div>
                          {template && (
                            <div className="flex items-center gap-1">
                              <Mail className="h-4 w-4" />
                              <span>{template.name}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4 mr-1" />
                          Voir
                        </Button>

                        {campaign.status === 'draft' && (
                          <Button
                            size="sm"
                            onClick={() => handleLaunchCampaign(campaign.id)}
                          >
                            <Play className="h-4 w-4 mr-1" />
                            Lancer
                          </Button>
                        )}

                        {campaign.status === 'active' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handlePauseCampaign(campaign.id)}
                          >
                            <Pause className="h-4 w-4 mr-1" />
                            Pause
                          </Button>
                        )}

                        {campaign.status === 'paused' && (
                          <Button
                            size="sm"
                            onClick={() => handleResumeCampaign(campaign.id)}
                          >
                            <Play className="h-4 w-4 mr-1" />
                            Reprendre
                          </Button>
                        )}

                        {campaign.status === 'completed' && (
                          <Button variant="outline" size="sm">
                            <Archive className="h-4 w-4 mr-1" />
                            Archiver
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Métriques de performance */}
                    {campaign.performance.sent > 0 && (
                      <div className="border-t pt-4">
                        <h4 className="font-medium mb-3 flex items-center gap-2">
                          <BarChart3 className="h-4 w-4" />
                          Performance
                        </h4>
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                          <div className="text-center">
                            <div className="text-2xl font-bold">{campaign.performance.sent}</div>
                            <div className="text-sm text-muted-foreground">Envoyés</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-green-600">
                              {metrics.deliveryRate.toFixed(1)}%
                            </div>
                            <div className="text-sm text-muted-foreground">Livrés</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-blue-600">
                              {metrics.readRate.toFixed(1)}%
                            </div>
                            <div className="text-sm text-muted-foreground">Lus</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-purple-600">
                              {metrics.clickRate.toFixed(1)}%
                            </div>
                            <div className="text-sm text-muted-foreground">Cliqués</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-orange-600">
                              {metrics.conversionRate.toFixed(1)}%
                            </div>
                            <div className="text-sm text-muted-foreground">Convertis</div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Planning */}
                    {campaign.scheduling.sendAt && (
                      <div className="border-t pt-4 mt-4">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Clock className="h-4 w-4" />
                          <span>
                            Programmée pour le {campaign.scheduling.sendAt.toLocaleDateString('fr-FR')} à{' '}
                            {campaign.scheduling.sendAt.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                    )}
                  </Card>
                );
              })
            )}
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-muted-foreground">Total campagnes</h3>
                <Target className="h-5 w-5 text-blue-600" />
              </div>
              <div className="text-2xl font-bold">{campaigns.length}</div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-muted-foreground">Campagnes actives</h3>
                <Play className="h-5 w-5 text-green-600" />
              </div>
              <div className="text-2xl font-bold text-green-600">
                {campaigns.filter(c => c.status === 'active').length}
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-muted-foreground">Total messages envoyés</h3>
                <Send className="h-5 w-5 text-purple-600" />
              </div>
              <div className="text-2xl font-bold">
                {campaigns.reduce((sum, c) => sum + c.performance.sent, 0)}
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-muted-foreground">Taux conversion moyen</h3>
                <BarChart3 className="h-5 w-5 text-orange-600" />
              </div>
              <div className="text-2xl font-bold">
                {campaigns.length > 0
                  ? (campaigns.reduce((sum, c) => {
                      const metrics = calculatePerformanceMetrics(c);
                      return sum + metrics.conversionRate;
                    }, 0) / campaigns.length).toFixed(1)
                  : 0}%
              </div>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="templates" className="space-y-6">
          <div className="grid gap-4">
            {templates.map((template) => (
              <Card key={template.id} className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold">{template.name}</h3>
                      <Badge variant={template.isActive ? 'default' : 'secondary'}>
                        {template.isActive ? 'Actif' : 'Inactif'}
                      </Badge>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        {template.type === 'email' && <Mail className="h-4 w-4" />}
                        {template.type === 'whatsapp' && <MessageCircle className="h-4 w-4" />}
                        {template.type === 'sms' && <Phone className="h-4 w-4" />}
                        <span className="capitalize">{template.type}</span>
                      </div>
                    </div>
                    <p className="text-muted-foreground mb-3">
                      Catégorie: <span className="capitalize">{template.category.replace('_', ' ')}</span>
                    </p>
                    <div className="text-sm">
                      <strong>Variables:</strong> {template.variables.join(', ')}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      <Eye className="h-4 w-4 mr-1" />
                      Aperçu
                    </Button>
                    <Button variant="outline" size="sm">
                      <Edit className="h-4 w-4 mr-1" />
                      Modifier
                    </Button>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h4 className="font-medium mb-2">Contenu:</h4>
                  <div className="bg-muted p-3 rounded text-sm max-h-32 overflow-y-auto">
                    {template.content}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};