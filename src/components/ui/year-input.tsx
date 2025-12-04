import React, { useMemo } from 'react';
import { Input } from './input';
import { Label } from './label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './select';
import { cn } from '@/lib/utils';

interface YearInputProps {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  error?: string;
  className?: string;
  label?: string;
  id?: string;
  currentYear?: number;
  minYearsBack?: number;
  maxYearsBack?: number;
}

export const YearInput: React.FC<YearInputProps> = ({
  value = '',
  onChange,
  placeholder = 'Sélectionner une année',
  disabled = false,
  error,
  className,
  label,
  id,
  currentYear = new Date().getFullYear(),
  minYearsBack = 2, // Par défaut N-2 minimum
  maxYearsBack = 50, // Par défaut 50 ans en arrière maximum
}) => {
  // Générer la liste des années autorisées (N, N-1, N-2, etc.)
  const availableYears = useMemo(() => {
    const years = [];

    // Année N (année actuelle)
    years.push({
      value: currentYear.toString(),
      label: `${currentYear} (cette année)`,
      isCurrent: true,
    });

    // Années N-1 à N-maxYearsBack
    for (let i = 1; i <= maxYearsBack; i++) {
      const year = currentYear - i;
      years.push({
        value: year.toString(),
        label: year.toString(),
        isCurrent: false,
      });
    }

    return years;
  }, [currentYear, maxYearsBack]);

  // Validation de l'année sélectionnée
  const selectedYear = parseInt(value);
  const isValidYear = !isNaN(selectedYear) &&
    selectedYear <= currentYear && // Pas N+1 ou plus
    selectedYear >= currentYear - maxYearsBack; // Pas trop ancien

  const handleYearChange = (yearValue: string) => {
    onChange?.(yearValue);
  };

  return (
    <div className={cn("space-y-2", className)}>
      {label && (
        <Label htmlFor={id} className={cn(error && "text-destructive")}>
          {label}
        </Label>
      )}

      <Select
        value={value || ""}
        onValueChange={handleYearChange}
        disabled={disabled}
      >
        <SelectTrigger
          className={cn(
            error && "border-destructive focus:border-destructive",
            "w-full"
          )}
        >
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent className="max-h-60">
          {availableYears.map((year) => (
            <SelectItem
              key={year.value}
              value={year.value}
              className={cn(
                year.isCurrent && "font-semibold",
                !isValidYear && value === year.value && "text-muted-foreground"
              )}
            >
              <div className="flex items-center gap-2">
                <span>{year.label}</span>
                {year.isCurrent && (
                  <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
                    Actuelle
                  </span>
                )}
                {year.value === (currentYear - 1).toString() && (
                  <span className="text-xs text-muted-foreground">
                    N-1
                  </span>
                )}
                {year.value === (currentYear - 2).toString() && (
                  <span className="text-xs text-muted-foreground">
                    N-2
                  </span>
                )}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}

      {/* Message informatif sur la contrainte */}
      {value && !isValidYear && (
        <p className="text-sm text-muted-foreground">
          <span className="font-medium">Note :</span> Les années futures ne sont pas autorisées
        </p>
      )}

      {/* Guide visuel pour les années recommandées */}
      {!value && (
        <p className="text-sm text-muted-foreground">
          Années disponibles : {currentYear} (N), {currentYear - 1} (N-1), {currentYear - 2} (N-2)...
        </p>
      )}
    </div>
  );
};

export default YearInput;