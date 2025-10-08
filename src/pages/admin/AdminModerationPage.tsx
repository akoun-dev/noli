import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Shield,
  MessageSquare,
  Star,
  Flag,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Eye,
  Edit,
  Trash2,
  Search,
  Filter,
  Calendar,
  User,
  Building,
  FileText,
  Image,
  Video,
  Ban,
  ThumbsUp,
  ThumbsDown,
  MessageCircle,
  Download,
  Upload,
  Settings,
  TrendingUp,
  Clock,
  Users
} from 'lucide-react';

interface Review {
  id: string;
  user: {
    name: string;
    avatar: string;
    email: string;
  };
  insurer: string;
  rating: number;
  title: string;
  content: string;
  status: 'pending' | 'approved' | 'rejected';
  flagged: boolean;
  flaggedReason?: string;
  createdAt: string;
  helpfulCount: number;
  reportCount: number;
}

interface Report {
  id: string;
  type: 'review' | 'user' | 'insurer' | 'content';
  target: string;
  reporter: string;
  reason: string;
  description: string;
  status: 'pending' | 'investigating' | 'resolved' | 'dismissed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  createdAt: string;
  assignedTo?: string;
}

interface ContentItem {
  id: string;
  type: 'insurer_description' | 'offer_content' | 'blog_post' | 'page_content';
  title: string;
  author: string;
  content: string;
  status: 'published' | 'draft' | 'pending_review' | 'rejected';
  lastModified: string;
  wordCount: number;
  issues?: string[];
}

interface AuditLog {
  id: string;
  action: string;
  target: string;
  user: string;
  timestamp: string;
  details: string;
  ipAddress: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
}

export const AdminModerationPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('reviews');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [moderationNote, setModerationNote] = useState('');

  // Mock data
  const reviews: Review[] = [
    {
      id: '1',
      user: {
        name: 'Jean Kouadio',
        avatar: 'JK',
        email: 'jean.kouadio@email.com'
      },
      insurer: 'NSIA Assurance',
      rating: 5,
      title: 'Excellent service',
      content: 'Très satisfait du service proposé. Le processus est simple et les tarifs sont compétitifs. Je recommande vivement !',
      status: 'pending',
      flagged: false,
      createdAt: '2024-01-20 14:30',
      helpfulCount: 12,
      reportCount: 0
    },
    {
      id: '2',
      user: {
        name: 'Marie Amani',
        avatar: 'MA',
        email: 'marie.amani@email.com'
      },
      insurer: 'AXA Côte d\'Ivoire',
      rating: 2,
      title: 'Service décevant',
      content: 'Attente très longue pour obtenir un devis et le personnel n\'est pas professionnel. Je ne recommande pas.',
      status: 'pending',
      flagged: true,
      flaggedReason: 'Contenu offensant',
      createdAt: '2024-01-20 10:15',
      helpfulCount: 3,
      reportCount: 2
    },
    {
      id: '3',
      user: {
        name: 'Kouakou Yao',
        avatar: 'KY',
        email: 'kouakou.yao@email.com'
      },
      insurer: 'SUNU Assurances',
      rating: 4,
      title: 'Bon service',
      content: 'Service correct avec un bon rapport qualité-prix. La seule amélioration possible serait la rapidité de traitement.',
      status: 'approved',
      flagged: false,
      createdAt: '2024-01-19 16:45',
      helpfulCount: 8,
      reportCount: 0
    }
  ];

  const reports: Report[] = [
    {
      id: '1',
      type: 'review',
      target: 'Avis sur AXA Côte d\'Ivoire',
      reporter: 'Admin',
      reason: 'Contenu inapproprié',
      description: 'L\'avis contient des propos diffamatoires et non vérifiés sur l\'assureur.',
      status: 'investigating',
      priority: 'high',
      createdAt: '2024-01-20 11:00',
      assignedTo: 'Admin Principal'
    },
    {
      id: '2',
      type: 'user',
      target: 'jean.spammeur@email.com',
      reporter: 'Système',
      reason: 'Compte suspect',
      description: 'Le compte a créé plusieurs avis frauduleux avec des adresses email temporaires.',
      status: 'pending',
      priority: 'urgent',
      createdAt: '2024-01-20 09:30'
    },
    {
      id: '3',
      type: 'insurer',
      target: 'Fake Assurance',
      reporter: 'Utilisateur',
      reason: 'Assureur non légitime',
      description: 'Cet assureur demande des paiements directs et n\'a pas de licence valide.',
      status: 'investigating',
      priority: 'high',
      createdAt: '2024-01-19 15:20'
    }
  ];

  const contentItems: ContentItem[] = [
    {
      id: '1',
      type: 'insurer_description',
      title: 'Description NSIA Assurance',
      author: 'NSIA Assurance',
      content: 'NSIA Assurance est un leader...',
      status: 'published',
      lastModified: '2024-01-20 10:00',
      wordCount: 245,
      issues: ['Liens cassés', 'Informations obsolètes']
    },
    {
      id: '2',
      type: 'offer_content',
      title: 'Assurance Auto Premium',
      author: 'AXA Côte d\'Ivoire',
      content: 'Notre offre premium...',
      status: 'pending_review',
      lastModified: '2024-01-20 09:15',
      wordCount: 180
    },
    {
      id: '3',
      type: 'blog_post',
      title: 'Comment choisir son assurance auto',
      author: 'Rédaction',
      content: 'Choisir la bonne assurance...',
      status: 'draft',
      lastModified: '2024-01-19 16:30',
      wordCount: 1200
    }
  ];

  const auditLogs: AuditLog[] = [
    {
      id: '1',
      action: 'AVIS_SUPPRIME',
      target: 'Avis #123',
      user: 'Admin',
      timestamp: '2024-01-20 14:35',
      details: 'Suppression d\'un avis pour contenu inapproprié',
      ipAddress: '192.168.1.100',
      severity: 'warning'
    },
    {
      id: '2',
      action: 'UTILISATEUR_BLOQUE',
      target: 'jean.spammeur@email.com',
      user: 'Système',
      timestamp: '2024-01-20 11:20',
      details: 'Blocage automatique pour activité suspecte',
      ipAddress: '203.0.113.1',
      severity: 'critical'
    },
    {
      id: '3',
      action: 'CONTENU_APPROUVE',
      target: 'Description assureur NSIA',
      user: 'Admin',
      timestamp: '2024-01-20 10:15',
      details: 'Approbation du contenu après vérification',
      ipAddress: '192.168.1.100',
      severity: 'info'
    }
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
      case 'published':
      case 'resolved':
        return <Badge className="bg-green-100 text-green-800">Approuvé</Badge>;
      case 'pending':
      case 'pending_review':
        return <Badge className="bg-yellow-100 text-yellow-800">En attente</Badge>;
      case 'rejected':
      case 'dismissed':
        return <Badge className="bg-red-100 text-red-800">Rejeté</Badge>;
      case 'investigating':
        return <Badge className="bg-blue-100 text-blue-800">En cours</Badge>;
      case 'draft':
        return <Badge className="bg-gray-100 text-gray-800">Brouillon</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return <Badge className="bg-red-100 text-red-800">Urgent</Badge>;
      case 'high':
        return <Badge className="bg-orange-100 text-orange-800">Haute</Badge>;
      case 'medium':
        return <Badge className="bg-yellow-100 text-yellow-800">Moyenne</Badge>;
      case 'low':
        return <Badge className="bg-green-100 text-green-800">Basse</Badge>;
      default:
        return <Badge>{priority}</Badge>;
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <Badge className="bg-red-100 text-red-800">Critique</Badge>;
      case 'error':
        return <Badge className="bg-red-100 text-red-800">Erreur</Badge>;
      case 'warning':
        return <Badge className="bg-yellow-100 text-yellow-800">Avertissement</Badge>;
      case 'info':
        return <Badge className="bg-blue-100 text-blue-800">Info</Badge>;
      default:
        return <Badge>{severity}</Badge>;
    }
  };

  const handleModerationAction = (action: string, reviewId: string) => {
    console.log(`${action} review ${reviewId}`);
    // Implement moderation action logic
  };

  const handleReportAction = (action: string, reportId: string) => {
    console.log(`${action} report ${reportId}`);
    // Implement report action logic
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
      />
    ));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Modération</h1>
          <p className="text-gray-600">Gestion des avis, signalements et contenus</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Exporter rapports
          </Button>
          <Button variant="outline">
            <Settings className="h-4 w-4 mr-2" />
            Paramètres
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avis en attente</p>
                <p className="text-2xl font-bold text-yellow-600">24</p>
                <div className="flex items-center space-x-1">
                  <TrendingUp className="h-3 w-3 text-red-600" />
                  <span className="text-xs text-red-600">+15%</span>
                </div>
              </div>
              <MessageSquare className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Signalements</p>
                <p className="text-2xl font-bold text-red-600">12</p>
                <div className="flex items-center space-x-1">
                  <TrendingUp className="h-3 w-3 text-red-600" />
                  <span className="text-xs text-red-600">+8%</span>
                </div>
              </div>
              <Flag className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Contenus à vérifier</p>
                <p className="text-2xl font-bold text-blue-600">8</p>
                <div className="flex items-center space-x-1">
                  <TrendingUp className="h-3 w-3 text-blue-600" />
                  <span className="text-xs text-blue-600">+3</span>
                </div>
              </div>
              <FileText className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Actions aujourd\'hui</p>
                <p className="text-2xl font-bold text-green-600">45</p>
                <div className="flex items-center space-x-1">
                  <TrendingUp className="h-3 w-3 text-green-600" />
                  <span className="text-xs text-green-600">+12%</span>
                </div>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="reviews">Avis clients</TabsTrigger>
          <TabsTrigger value="reports">Signalements</TabsTrigger>
          <TabsTrigger value="content">Contenus</TabsTrigger>
          <TabsTrigger value="audit">Audit logs</TabsTrigger>
        </TabsList>

        {/* Reviews Tab */}
        <TabsContent value="reviews" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Modération des avis</span>
                <div className="flex space-x-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Rechercher un avis..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 w-64"
                    />
                  </div>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous</SelectItem>
                      <SelectItem value="pending">En attente</SelectItem>
                      <SelectItem value="approved">Approuvés</SelectItem>
                      <SelectItem value="rejected">Rejetés</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {reviews.map((review) => (
                  <div key={review.id} className="p-4 border rounded-lg">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-start space-x-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center font-medium text-blue-600">
                          {review.user.avatar}
                        </div>
                        <div>
                          <div className="font-medium">{review.user.name}</div>
                          <div className="text-sm text-gray-500">{review.user.email}</div>
                          <div className="flex items-center space-x-2 mt-1">
                            <div className="flex items-center space-x-1">
                              {renderStars(review.rating)}
                            </div>
                            <span className="text-sm text-gray-500">•</span>
                            <span className="text-sm text-gray-500">{review.insurer}</span>
                            <span className="text-sm text-gray-500">•</span>
                            <span className="text-sm text-gray-500">{review.createdAt}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {review.flagged && (
                          <Badge className="bg-red-100 text-red-800">
                            <Flag className="h-3 w-3 mr-1" />
                            Signalé
                          </Badge>
                        )}
                        {getStatusBadge(review.status)}
                      </div>
                    </div>

                    <div className="mb-3">
                      <h4 className="font-medium mb-1">{review.title}</h4>
                      <p className="text-gray-700">{review.content}</p>
                    </div>

                    {review.flagged && review.flaggedReason && (
                      <Alert className="mb-3">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                          <strong>Raison du signalement:</strong> {review.flaggedReason}
                        </AlertDescription>
                      </Alert>
                    )}

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <div className="flex items-center space-x-1">
                          <ThumbsUp className="h-4 w-4" />
                          <span>{review.helpfulCount} utile</span>
                        </div>
                        {review.reportCount > 0 && (
                          <div className="flex items-center space-x-1 text-red-600">
                            <Flag className="h-4 w-4" />
                            <span>{review.reportCount} signalements</span>
                          </div>
                        )}
                      </div>
                      <div className="flex space-x-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm">
                              <Eye className="h-3 w-3 mr-1" />
                              Détails
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle>Détails de l'avis</DialogTitle>
                            </DialogHeader>
                            <ReviewDetails review={review} />
                          </DialogContent>
                        </Dialog>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleModerationAction('approve', review.id)}
                          disabled={review.status === 'approved'}
                        >
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Approuver
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleModerationAction('reject', review.id)}
                          disabled={review.status === 'rejected'}
                        >
                          <XCircle className="h-3 w-3 mr-1" />
                          Rejeter
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Reports Tab */}
        <TabsContent value="reports" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Signalements à traiter</span>
                <div className="flex space-x-2">
                  <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Toutes priorités</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                      <SelectItem value="high">Haute</SelectItem>
                      <SelectItem value="medium">Moyenne</SelectItem>
                      <SelectItem value="low">Basse</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {reports.map((report) => (
                  <div key={report.id} className="p-4 border rounded-lg">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <span className="font-medium capitalize">{report.type}</span>
                          <span className="text-gray-500">•</span>
                          <span className="text-gray-700">{report.target}</span>
                          {getPriorityBadge(report.priority)}
                          {getStatusBadge(report.status)}
                        </div>
                        <div className="text-sm text-gray-600 mb-2">
                          <strong>Raison:</strong> {report.reason}
                        </div>
                        <p className="text-gray-700 mb-2">{report.description}</p>
                        <div className="text-xs text-gray-500">
                          Signalé par {report.reporter} • {report.createdAt}
                          {report.assignedTo && ` • Assigné à ${report.assignedTo}`}
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end space-x-2">
                      <Button variant="outline" size="sm">
                        <Eye className="h-3 w-3 mr-1" />
                        Voir détails
                      </Button>
                      {report.status === 'pending' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleReportAction('investigate', report.id)}
                        >
                          Enquêter
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleReportAction('resolve', report.id)}
                        disabled={report.status === 'resolved'}
                      >
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Résoudre
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleReportAction('dismiss', report.id)}
                        disabled={report.status === 'dismissed'}
                      >
                        <XCircle className="h-3 w-3 mr-1" />
                        Rejeter
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Content Tab */}
        <TabsContent value="content" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Modération des contenus</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {contentItems.map((item) => (
                  <div key={item.id} className="p-4 border rounded-lg">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="flex items-center space-x-3 mb-2">
                          <span className="font-medium">{item.title}</span>
                          <Badge className="bg-gray-100 text-gray-800 capitalize">
                            {item.type.replace('_', ' ')}
                          </Badge>
                          {getStatusBadge(item.status)}
                        </div>
                        <div className="text-sm text-gray-600 mb-2">
                          Par {item.author} • Modifié le {item.lastModified} • {item.wordCount} mots
                        </div>
                      </div>
                    </div>

                    {item.issues && item.issues.length > 0 && (
                      <Alert className="mb-3">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                          <strong>Problèmes détectés:</strong> {item.issues.join(', ')}
                        </AlertDescription>
                      </Alert>
                    )}

                    <div className="flex justify-end space-x-2">
                      <Button variant="outline" size="sm">
                        <Eye className="h-3 w-3 mr-1" />
                        Aperçu
                      </Button>
                      <Button variant="outline" size="sm">
                        <Edit className="h-3 w-3 mr-1" />
                        Modifier
                      </Button>
                      {item.status === 'pending_review' && (
                        <Button size="sm">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Approuver
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Audit Tab */}
        <TabsContent value="audit" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Journal d'audit</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {auditLogs.map((log) => (
                  <div key={log.id} className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-gray-50">
                    <div className="flex-shrink-0 mt-1">
                      {getSeverityBadge(log.severity)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium">{log.action}</span>
                        <span className="text-xs text-gray-500">{log.timestamp}</span>
                      </div>
                      <div className="text-sm text-gray-700 mb-1">{log.details}</div>
                      <div className="text-xs text-gray-500">
                        Cible: {log.target} • Par {log.user} • IP: {log.ipAddress}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

// Review Details Component
const ReviewDetails: React.FC<{ review: any }> = ({ review }) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-3">
        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center font-medium text-blue-600 text-lg">
          {review.user.avatar}
        </div>
        <div>
          <h3 className="font-semibold">{review.user.name}</h3>
          <p className="text-gray-600">{review.user.email}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <span className="font-medium">Assureur:</span>
          <p>{review.insurer}</p>
        </div>
        <div>
          <span className="font-medium">Note:</span>
          <div className="flex items-center space-x-1">
            {Array.from({ length: 5 }, (_, i) => (
              <Star
                key={i}
                className={`h-4 w-4 ${i < review.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
              />
            ))}
            <span className="ml-1">({review.rating}/5)</span>
          </div>
        </div>
        <div>
          <span className="font-medium">Date:</span>
          <p>{review.createdAt}</p>
        </div>
        <div>
          <span className="font-medium">Statut:</span>
          <p className="capitalize">{review.status}</p>
        </div>
      </div>

      <div>
        <h4 className="font-medium mb-1">{review.title}</h4>
        <p className="text-gray-700">{review.content}</p>
      </div>

      <div className="flex items-center space-x-4 text-sm text-gray-600">
        <div className="flex items-center space-x-1">
          <ThumbsUp className="h-4 w-4" />
          <span>{review.helpfulCount} personnes ont trouvé cet avis utile</span>
        </div>
        {review.reportCount > 0 && (
          <div className="flex items-center space-x-1 text-red-600">
            <Flag className="h-4 w-4" />
            <span>{review.reportCount} signalements</span>
          </div>
        )}
      </div>

      {review.flagged && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Cet avis a été signalé pour: {review.flaggedReason}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default AdminModerationPage;