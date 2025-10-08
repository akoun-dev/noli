import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  FileText,
  Users,
  TrendingUp,
  DollarSign,
  Car,
  CheckCircle,
  Clock,
  AlertTriangle,
  Eye,
  Download
} from 'lucide-react';

export const InsurerDashboardPage: React.FC = () => {
  const stats = [
    { label: 'Devis reçus', value: '156', change: '+23%', icon: FileText, color: 'text-blue-600' },
    { label: 'Taux conversion', value: '89%', change: '+5%', icon: TrendingUp, color: 'text-green-600' },
    { label: 'CA mensuel', value: '2.4M', change: '+12%', icon: DollarSign, color: 'text-purple-600' },
    { label: 'Clients actifs', value: '1,245', change: '+45', icon: Users, color: 'text-orange-600' },
  ];

  const recentQuotes = [
    { id: 1, customer: 'Jean Kouadio', vehicle: 'Toyota Yaris 2020', amount: '125,000 FCFA', date: '2024-01-15', status: 'pending' },
    { id: 2, customer: 'Marie Amani', vehicle: 'Honda Civic 2019', amount: '98,000 FCFA', date: '2024-01-14', status: 'approved' },
    { id: 3, customer: 'Koffi Yao', vehicle: 'BMW X3 2021', amount: '350,000 FCFA', date: '2024-01-13', status: 'pending' },
    { id: 4, customer: 'Fatou Sylla', vehicle: 'Peugeot 208 2018', amount: '85,000 FCFA', date: '2024-01-12', status: 'approved' },
  ];

  const topOffers = [
    { name: 'Assurance Tiers Simple', customers: 456, conversion: '92%', revenue: '1.2M FCFA' },
    { name: 'Tiers +', customers: 234, conversion: '87%', revenue: '980K FCFA' },
    { name: 'Tous Risques', customers: 123, conversion: '78%', revenue: '2.1M FCFA' },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          <CheckCircle className="h-3 w-3 mr-1" />
          Approuvé
        </span>;
      case 'pending':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
          <Clock className="h-3 w-3 mr-1" />
          En attente
        </span>;
      default:
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
          {status}
        </span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Performance Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <Card key={index}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                  <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                  <p className="text-xs text-green-600 flex items-center">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    {stat.change}
                  </p>
                </div>
                <stat.icon className={`h-8 w-8 ${stat.color}`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Quotes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Devis récents</span>
              <div className="flex space-x-2">
                <Button variant="outline" size="sm">
                  <Download className="h-3 w-3 mr-1" />
                  Exporter
                </Button>
                <Button variant="outline" size="sm">Voir tout</Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentQuotes.map((quote) => (
                <div key={quote.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent">
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className="font-medium">{quote.customer}</p>
                      {getStatusBadge(quote.status)}
                    </div>
                    <p className="text-sm text-muted-foreground">{quote.vehicle}</p>
                    <p className="text-xs text-muted-foreground/70">{quote.date}</p>
                  </div>
                  <div className="text-right ml-4">
                    <p className="font-medium">{quote.amount}</p>
                    <Button variant="ghost" size="sm">
                      <Eye className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top Performing Offers */}
        <Card>
          <CardHeader>
            <CardTitle>Offres les plus performantes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topOffers.map((offer, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium">{offer.name}</p>
                    <div className="flex space-x-4 text-sm text-muted-foreground mt-1">
                      <span>{offer.customers} clients</span>
                      <span>{offer.conversion} conversion</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{offer.revenue}</p>
                    <div className="text-xs text-green-600">Top {index + 1}</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="bg-blue-100 p-3 rounded-lg">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
              <div className="flex-1">
                <p className="font-medium">Devis en attente</p>
                <p className="text-2xl font-bold text-blue-600">12</p>
              </div>
              <Button variant="outline" size="sm">
                Voir
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="bg-green-100 p-3 rounded-lg">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div className="flex-1">
                <p className="font-medium">Devis approuvés</p>
                <p className="text-2xl font-bold text-green-600">144</p>
              </div>
              <Button variant="outline" size="sm">
                Voir
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="bg-purple-100 p-3 rounded-lg">
                <Car className="h-6 w-6 text-purple-600" />
              </div>
              <div className="flex-1">
                <p className="font-medium">Nouvelles offres</p>
                <p className="text-2xl font-bold text-purple-600">3</p>
              </div>
              <Button variant="outline" size="sm">
                Créer
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alert for Low Performance */}
      <Card className="border-orange-200 bg-orange-50">
        <CardContent className="p-4">
          <div className="flex items-center">
            <AlertTriangle className="h-5 w-5 text-orange-600 mr-2" />
            <div className="flex-1">
              <p className="text-sm font-medium text-orange-800">
                Attention: Taux de conversion en baisse
              </p>
              <p className="text-xs text-orange-600">
                Votre taux de conversion a baissé de 5% cette semaine. Considérez revoir vos offres.
              </p>
            </div>
            <Button variant="outline" size="sm">
              Analyser
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default InsurerDashboardPage;
