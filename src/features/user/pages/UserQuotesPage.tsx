import React, { useState } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useUserQuotes, useQuoteStats, useDownloadQuotePdf } from '../services/quoteService';
import { QuoteCard } from '../components/QuoteCard';
import { QuoteFilters } from '../components/QuoteFilters';
import { QuoteHistoryFilters } from '../types/quote';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileText, Clock, CheckCircle, XCircle, AlertCircle, Calendar, Search, Plus, TrendingUp, Shield, Car } from 'lucide-react';
import { toast } from 'sonner';

export const UserQuotesPage: React.FC = () => {
  const [filters, setFilters] = useState<QuoteHistoryFilters>({});
  const [sortBy, setSortBy] = useState<string>('date-desc');
  const { data: quotes, isLoading, error } = useUserQuotes(filters);
  const { data: stats, isLoading: statsLoading } = useQuoteStats();
  const { mutate: downloadPdf, isPending: isDownloading } = useDownloadQuotePdf();

  const handleViewQuote = (quoteId: string) => {
    // Navigate to quote details page (to be implemented)
    toast.info(`Navigation vers les détails du devis ${quoteId}`);
  };

  const handleDownloadPdf = (quoteId: string) => {
    downloadPdf(quoteId);
  };

  const handleClearFilters = () => {
    setFilters({});
  };

  const getStatCardColor = (value: number, total: number) => {
    const percentage = (value / total) * 100;
    if (percentage > 60) return 'text-green-600';
    if (percentage > 30) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getSortedQuotes = (quotes: QuoteWithDetails[]) => {
    if (!quotes) return [];

    return [...quotes].sort((a, b) => {
      switch (sortBy) {
        case 'date-desc':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'date-asc':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case 'price-desc':
          return b.price - a.price;
        case 'price-asc':
          return a.price - b.price;
        default:
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });
  };

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Erreur</h1>
          <p className="text-gray-600">Impossible de charger vos devis. Veuillez réessayer plus tard.</p>
        </div>
      </div>
    );
  }

  const sortedQuotes = getSortedQuotes(quotes || []);

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Erreur</h1>
          <p className="text-gray-600">Impossible de charger vos devis. Veuillez réessayer plus tard.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Mes Devis</h1>
          <p className="text-muted-foreground">Suivez toutes vos demandes d'assurance en un seul lieu</p>
        </div>
        <Button
          onClick={() => window.location.href = '/comparer'}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Nouveau devis
        </Button>
      </div>

      {/* Statistics Cards */}
      {!statsLoading && stats && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <FileText className="h-8 w-8 text-blue-600" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total</p>
                  <p className="text-2xl font-bold">{stats.totalQuotes}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <Clock className="h-8 w-8 text-yellow-600" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">En attente</p>
                  <p className="text-2xl font-bold">{stats.pendingQuotes}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <CheckCircle className="h-8 w-8 text-green-600" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Approuvés</p>
                  <p className="text-2xl font-bold">{stats.approvedQuotes}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <XCircle className="h-8 w-8 text-red-600" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Rejetés</p>
                  <p className="text-2xl font-bold">{stats.rejectedQuotes}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <TrendingUp className="h-8 w-8 text-purple-600" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Temps moyen</p>
                  <p className="text-2xl font-bold">{stats.averageProcessingTime.toFixed(1)}j</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters and Sort */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Liste des devis</CardTitle>
            <div className="flex items-center space-x-2">
              <QuoteFilters
                filters={filters}
                onFiltersChange={setFilters}
                onClearFilters={handleClearFilters}
              />
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Trier par" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="date-desc">Plus récents</SelectItem>
                  <SelectItem value="date-asc">Plus anciens</SelectItem>
                  <SelectItem value="price-desc">Prix décroissant</SelectItem>
                  <SelectItem value="price-asc">Prix croissant</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Quotes List */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold">Vos Devis</h3>
                <Badge variant="outline">
                  {isLoading ? 'Chargement...' : `${sortedQuotes.length} devis`}
                </Badge>
              </div>
              {sortedQuotes.length > 0 && (
                <Badge variant="secondary">
                  {sortedQuotes.filter(q => q.status === 'pending').length} en attente
                </Badge>
              )}
            </div>

            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[...Array(6)].map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <CardHeader>
                      <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="h-16 bg-gray-200 rounded"></div>
                      <div className="h-12 bg-gray-200 rounded"></div>
                      <div className="h-10 bg-gray-200 rounded"></div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : sortedQuotes.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {sortedQuotes.map((quote) => (
                  <QuoteCard
                    key={quote.id}
                    quote={quote}
                    onView={handleViewQuote}
                    onDownload={handleDownloadPdf}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Car className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">
                  {Object.keys(filters).length > 0
                    ? 'Aucun devis ne correspond à vos critères de recherche'
                    : 'Commencez votre comparaison d\'assurance'
                  }
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default UserQuotesPage;