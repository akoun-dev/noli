import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  FileText,
  Shield,
  Car,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  Plus
} from 'lucide-react';

export const UserDashboardPage: React.FC = () => {
  const recentQuotes = [
    { id: 1, vehicle: 'Toyota Yaris 2020', date: '2024-01-15', status: 'approved', price: '125,000 FCFA' },
    { id: 2, vehicle: 'Honda Civic 2019', date: '2024-01-10', status: 'pending', price: '98,000 FCFA' },
    { id: 3, vehicle: 'BMW X3 2021', date: '2024-01-05', status: 'rejected', price: '350,000 FCFA' },
  ];

  const activePolicies = [
    { id: 1, vehicle: 'Toyota Yaris 2020', insurer: 'NSIA Assurance', expiry: '2024-12-31', premium: '125,000 FCFA' },
    { id: 2, vehicle: 'Peugeot 208 2018', insurer: 'SUNU Assurances', expiry: '2024-06-30', premium: '95,000 FCFA' },
  ];

  const quickStats = [
    { label: 'Devis générés', value: '12', icon: FileText, color: 'text-blue-600' },
    { label: 'Contrats actifs', value: '2', icon: Shield, color: 'text-green-600' },
    { label: 'Économies réalisées', value: '45K FCFA', icon: TrendingUp, color: 'text-purple-600' },
    { label: 'Comparaisons', value: '8', icon: Car, color: 'text-orange-600' },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
          <CheckCircle className="h-3 w-3 mr-1" />
          Approuvé
        </span>;
      case 'pending':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
          <Clock className="h-3 w-3 mr-1" />
          En attente
        </span>;
      case 'rejected':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
          <AlertCircle className="h-3 w-3 mr-1" />
          Rejeté
        </span>;
      default:
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200">
          {status}
        </span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg p-6">
        <h1 className="text-3xl font-bold mb-2">Bienvenue sur votre espace!</h1>
        <p className="text-blue-100 mb-4">Gérez vos assurances et suivez vos demandes</p>
        <Button className="bg-white text-blue-600 hover:bg-gray-100">
          <Plus className="h-4 w-4 mr-2" />
          Nouvelle comparaison
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {quickStats.map((stat, index) => (
          <Card key={index}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                  <p className="text-2xl font-bold text-foreground">{stat.value}</p>
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
              <Button variant="outline" size="sm">Voir tout</Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentQuotes.map((quote) => (
                <div key={quote.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">{quote.vehicle}</p>
                    <p className="text-sm text-muted-foreground">{quote.date}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{quote.price}</p>
                    {getStatusBadge(quote.status)}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Active Policies */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Mes contrats actifs</span>
              <Button variant="outline" size="sm">Voir tout</Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {activePolicies.map((policy) => (
                <div key={policy.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">{policy.vehicle}</p>
                    <p className="text-sm text-muted-foreground">{policy.insurer}</p>
                    <p className="text-xs text-orange-600">Expire le {policy.expiry}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{policy.premium}</p>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                      Actif
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Actions rapides</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button className="h-20 flex-col" variant="outline">
              <FileText className="h-6 w-6 mb-2" />
              Nouveau devis
            </Button>
            <Button className="h-20 flex-col" variant="outline">
              <Shield className="h-6 w-6 mb-2" />
              Renouveler contrat
            </Button>
            <Button className="h-20 flex-col" variant="outline">
              <Car className="h-6 w-6 mb-2" />
              Ajouter véhicule
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default UserDashboardPage;
