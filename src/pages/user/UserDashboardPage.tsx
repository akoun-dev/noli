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
    <div className="space-y-4 sm:space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg p-4 sm:p-6">
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-2">Bienvenue sur votre espace!</h1>
        <p className="text-blue-100 text-sm sm:text-base mb-4">Gérez vos assurances et suivez vos demandes</p>
        <Button className="bg-white text-blue-600 hover:bg-gray-100 w-full sm:w-auto">
          <Plus className="h-4 w-4 mr-2" />
          <span className="hidden sm:inline">Nouvelle comparaison</span>
          <span className="sm:hidden">Comparer</span>
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
        {quickStats.map((stat, index) => (
          <Card key={index}>
            <CardContent className="p-3 sm:p-4 lg:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4">
                <div className="text-center sm:text-left">
                  <p className="text-xs sm:text-sm font-medium text-muted-foreground">{stat.label}</p>
                  <p className="text-lg sm:text-xl lg:text-2xl font-bold text-foreground">{stat.value}</p>
                </div>
                <stat.icon className={`h-6 w-6 sm:h-8 sm:w-8 ${stat.color} flex-shrink-0 mx-auto sm:mx-0`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
        {/* Recent Quotes */}
        <Card>
          <CardHeader className="pb-3 sm:pb-4">
            <CardTitle className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4">
              <span className="text-lg sm:text-xl">Devis récents</span>
              <Button variant="outline" size="sm" className="w-full sm:w-auto">
                Voir tout
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 sm:space-y-4">
              {recentQuotes.map((quote) => (
                <div key={quote.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 border rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium text-sm sm:text-base">{quote.vehicle}</p>
                    <p className="text-xs sm:text-sm text-muted-foreground">{quote.date}</p>
                  </div>
                  <div className="flex flex-row sm:flex-col items-center sm:items-end gap-2 sm:gap-1">
                    <p className="font-medium text-sm sm:text-base whitespace-nowrap">{quote.price}</p>
                    <div className="scale-90 sm:scale-100">
                      {getStatusBadge(quote.status)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Active Policies */}
        <Card>
          <CardHeader className="pb-3 sm:pb-4">
            <CardTitle className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4">
              <span className="text-lg sm:text-xl">Mes contrats actifs</span>
              <Button variant="outline" size="sm" className="w-full sm:w-auto">
                Voir tout
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 sm:space-y-4">
              {activePolicies.map((policy) => (
                <div key={policy.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 border rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium text-sm sm:text-base">{policy.vehicle}</p>
                    <p className="text-xs sm:text-sm text-muted-foreground">{policy.insurer}</p>
                    <p className="text-xs text-orange-600">Expire le {policy.expiry}</p>
                  </div>
                  <div className="flex flex-row sm:flex-col items-center sm:items-end gap-2 sm:gap-1">
                    <p className="font-medium text-sm sm:text-base whitespace-nowrap">{policy.premium}</p>
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
        <CardHeader className="pb-3 sm:pb-4">
          <CardTitle className="text-lg sm:text-xl">Actions rapides</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            <Button className="h-16 sm:h-20 flex-col" variant="outline">
              <FileText className="h-5 w-5 sm:h-6 sm:w-6 mb-1 sm:mb-2" />
              <span className="text-xs sm:text-sm">Nouveau devis</span>
            </Button>
            <Button className="h-16 sm:h-20 flex-col" variant="outline">
              <Shield className="h-5 w-5 sm:h-6 sm:w-6 mb-1 sm:mb-2" />
              <span className="text-xs sm:text-sm">Renouveler</span>
            </Button>
            <Button className="h-16 sm:h-20 flex-col" variant="outline">
              <Car className="h-5 w-5 sm:h-6 sm:w-6 mb-1 sm:mb-2" />
              <span className="text-xs sm:text-sm">Ajouter véhicule</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default UserDashboardPage;
