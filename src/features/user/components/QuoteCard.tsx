import React from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FileText, Download, Eye } from 'lucide-react';
import { QuoteWithDetails } from '../types/quote';
import { cn } from '@/lib/utils';

interface QuoteCardProps {
  quote: QuoteWithDetails;
  onView: (quoteId: string) => void;
  onDownload: (quoteId: string) => void;
}

const getStatusColor = (status: QuoteWithDetails['status']) => {
  switch (status) {
    case 'approved':
      return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900 dark:text-green-200 dark:border-green-700';
    case 'pending':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900 dark:text-yellow-200 dark:border-yellow-700';
    case 'rejected':
      return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900 dark:text-red-200 dark:border-red-700';
    case 'expired':
      return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700';
  }
};

const getStatusLabel = (status: QuoteWithDetails['status']) => {
  switch (status) {
    case 'approved':
      return 'Approuvé';
    case 'pending':
      return 'En attente';
    case 'rejected':
      return 'Rejeté';
    case 'expired':
      return 'Expiré';
    default:
      return status;
  }
};

export const QuoteCard: React.FC<QuoteCardProps> = ({ quote, onView, onDownload }) => {
  const isExpired = new Date(quote.expiresAt) < new Date();

  return (
    <Card className="w-full hover:shadow-md transition-shadow">
      <CardHeader className="pb-2 sm:pb-3">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div className="space-y-1 sm:space-y-2">
            <CardTitle className="text-base sm:text-lg font-semibold">{quote.insurerName}</CardTitle>
            <div className="flex flex-wrap items-center gap-1 sm:gap-2">
              <Badge className={cn('text-xs', getStatusColor(quote.status))}>
                {getStatusLabel(quote.status)}
              </Badge>
              {isExpired && (
                <Badge variant="destructive" className="text-xs">
                  Expiré
                </Badge>
              )}
            </div>
          </div>
          <div className="text-left sm:text-right">
            <div className="text-xl sm:text-2xl font-bold text-primary">
              {quote.price.toLocaleString('fr-FR')} FCFA
            </div>
            <div className="text-xs sm:text-sm text-muted-foreground">/an</div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3 sm:space-y-4">
        {/* Vehicle Information */}
        <div className="bg-muted p-3 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <FileText className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium text-sm">Véhicule</span>
          </div>
          <div className="text-sm text-muted-foreground">
            <p className="break-words">{quote.vehicleInfo.brand} {quote.vehicleInfo.model} ({quote.vehicleInfo.year})</p>
            <p className="text-xs break-all">Immatriculation: {quote.vehicleInfo.registration}</p>
          </div>
        </div>

        {/* Coverage Information */}
        <div className="space-y-2">
          <div className="text-sm">
            <span className="font-medium">Couverture:</span>
            <span className="ml-2 block sm:inline">{quote.coverageName}</span>
          </div>
        </div>

        {/* Dates */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-sm text-muted-foreground">
          <div>
            <span className="font-medium">Créé le:</span>
            <p>{format(new Date(quote.createdAt), 'dd MMM yyyy', { locale: fr })}</p>
          </div>
          <div>
            <span className="font-medium">Expire le:</span>
            <p className={cn(isExpired ? 'text-red-600 font-medium' : '')}>
              {format(new Date(quote.expiresAt), 'dd MMM yyyy', { locale: fr })}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onView(quote.id)}
            className="flex-1"
          >
            <Eye className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Détails</span>
            <span className="sm:hidden">Voir</span>
          </Button>
          {quote.status === 'approved' && (
            <Button
              variant="default"
              size="sm"
              onClick={() => onDownload(quote.id)}
              className="px-3 sm:px-4"
            >
              <Download className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">PDF</span>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};