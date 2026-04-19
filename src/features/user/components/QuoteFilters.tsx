import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Search, X, Filter } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { QuoteHistoryFilters } from '../types/quote';
import { cn } from '@/lib/utils';

interface QuoteFiltersProps {
  filters: QuoteHistoryFilters;
  onFiltersChange: (filters: QuoteHistoryFilters) => void;
  onClearFilters: () => void;
}

export const QuoteFilters: React.FC<QuoteFiltersProps> = ({
  filters,
  onFiltersChange,
  onClearFilters,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const hasActiveFilters = filters.status || filters.dateRange || filters.insurer;

  const handleStatusChange = (status: string) => {
    onFiltersChange({
      ...filters,
      status: status === 'all' ? undefined : status as QuoteHistoryFilters['status'],
    });
  };

  const handleInsurerChange = (insurer: string) => {
    onFiltersChange({
      ...filters,
      insurer: insurer || undefined,
    });
  };

  const handleDateRangeChange = (range: { from?: Date; to?: Date }) => {
    if (range.from && range.to) {
      onFiltersChange({
        ...filters,
        dateRange: {
          start: range.from,
          end: range.to,
        },
      });
    } else {
      const { dateRange, ...rest } = filters;
      onFiltersChange(rest);
    }
  };

  const clearDateRange = () => {
    const { dateRange, ...rest } = filters;
    onFiltersChange(rest);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtres
          </CardTitle>
          <div className="flex items-center gap-2">
            {hasActiveFilters && (
              <Button variant="outline" size="sm" onClick={onClearFilters} className="text-xs sm:text-sm">
                <X className="h-4 w-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Effacer</span>
                <span className="sm:hidden">Effacer</span>
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-xs sm:text-sm"
            >
              {isExpanded ? 'Masquer' : 'Afficher'}
            </Button>
          </div>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="space-y-3 sm:space-y-4">
          {/* Search by Insurer */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Assureur</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher par assureur..."
                value={filters.insurer || ''}
                onChange={(e) => handleInsurerChange(e.target.value)}
                className="pl-10 text-sm"
              />
            </div>
          </div>

          {/* Status Filter */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Statut</label>
            <Select
              value={filters.status || 'all'}
              onValueChange={handleStatusChange}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner un statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="pending">En attente</SelectItem>
                <SelectItem value="approved">Approuvé</SelectItem>
                <SelectItem value="rejected">Rejeté</SelectItem>
                <SelectItem value="expired">Expiré</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Date Range Filter */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Période</label>
            <div className="flex items-center gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'w-full justify-start text-left font-normal text-sm',
                      !filters.dateRange && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {filters.dateRange ? (
                      <>
                        {format(filters.dateRange.start, 'dd MMM yyyy', { locale: fr })} -{' '}
                        {format(filters.dateRange.end, 'dd MMM yyyy', { locale: fr })}
                      </>
                    ) : (
                      'Sélectionner une période'
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={filters.dateRange?.start}
                    selected={{
                      from: filters.dateRange?.start,
                      to: filters.dateRange?.end,
                    }}
                    onSelect={(range) => {
                      if (range?.from && range?.to) {
                        handleDateRangeChange(range);
                      }
                    }}
                    numberOfMonths={1}
                    locale={fr}
                    className="text-xs sm:text-sm"
                  />
                </PopoverContent>
              </Popover>
              {filters.dateRange && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearDateRange}
                  className="p-2 h-8 w-8 sm:h-10 sm:w-10 flex-shrink-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          {/* Active Filters Display */}
          {hasActiveFilters && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Filtres actifs</label>
              <div className="flex flex-wrap gap-1 sm:gap-2">
                {filters.status && (
                  <Badge variant="secondary" className="text-xs">
                    Statut: {filters.status === 'pending' ? 'En attente' : filters.status === 'approved' ? 'Approuvé' : filters.status === 'rejected' ? 'Rejeté' : 'Expiré'}
                  </Badge>
                )}
                {filters.insurer && (
                  <Badge variant="secondary" className="text-xs">
                    Assureur: {filters.insurer}
                  </Badge>
                )}
                {filters.dateRange && (
                  <Badge variant="secondary" className="text-xs">
                    Période: {format(filters.dateRange.start, 'dd/MM/yyyy')} - {format(filters.dateRange.end, 'dd/MM/yyyy')}
                  </Badge>
                )}
              </div>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
};