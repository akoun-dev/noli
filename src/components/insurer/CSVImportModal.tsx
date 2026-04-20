import React, { useState, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  Upload,
  Download,
  FileText,
  CheckCircle,
  AlertCircle,
  Eye,
} from 'lucide-react';
import Papa from 'papaparse';
import { ParsedOffer, CSVRowData } from '@/types/insurance';

interface CSVImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (offers: ParsedOffer[]) => void;
}

const SAMPLE_CSV_DATA = [
  {
    name: 'Assurance Tiers Simple',
    type: 'Tiers Simple',
    price: '45000',
    coverage: 'Responsabilité civile de base',
    description: 'Couverture minimale obligatoire',
    deductible: '50000',
    maxCoverage: '1000000',
    duration: '12',
    features: 'Assistance 24/7, Protection juridique',
    conditions: 'Âge minimum 18 ans'
  },
  {
    name: 'Tiers + Premium',
    type: 'Tiers +',
    price: '85000',
    coverage: 'RC + Vol + Incendie',
    description: 'Protection étendue avec garanties additionnelles',
    deductible: '75000',
    maxCoverage: '3000000',
    duration: '12',
    features: 'Véhicule de remplacement, Défense pénale, Conducteur étendu',
    conditions: 'Véhicule de moins de 5 ans'
  }
];

export const CSVImportModal: React.FC<CSVImportModalProps> = ({
  isOpen,
  onClose,
  onImport,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<ParsedOffer[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showPreview, setShowPreview] = useState(false);

  const downloadSample = () => {
    const csv = Papa.unparse(SAMPLE_CSV_DATA);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'modele_import_offres.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = event.target.files?.[0];
    if (!uploadedFile) return;

    setFile(uploadedFile);
    setIsProcessing(true);
    setProgress(0);

    Papa.parse(uploadedFile, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        try {
          const data = results.data as CSVRowData[];
          const newErrors: string[] = [];
          const validOffers: ParsedOffer[] = [];

          data.forEach((row, index) => {
            const rowNum = index + 2;

            if (!row.name) {
              newErrors.push(`Ligne ${rowNum}: Le nom est requis`);
              return;
            }
            if (!row.type) {
              newErrors.push(`Ligne ${rowNum}: Le type est requis`);
              return;
            }
            if (!row.price || isNaN(Number(row.price))) {
              newErrors.push(`Ligne ${rowNum}: Prix invalide`);
              return;
            }
            if (!row.coverage) {
              newErrors.push(`Ligne ${rowNum}: Couverture requise`);
              return;
            }

            const validTypes = ['Tiers Simple', 'Tiers +', 'Tous Risques'];
            if (!validTypes.includes(row.type)) {
              newErrors.push(`Ligne ${rowNum}: Type invalide`);
              return;
            }

            const offer: ParsedOffer = {
              name: row.name.trim(),
              type: row.type.trim(),
              price: Number(row.price),
              coverage: row.coverage.trim(),
              description: row.description?.trim() || '',
              deductible: row.deductible ? Number(row.deductible) : 0,
              maxCoverage: row.maxCoverage ? Number(row.maxCoverage) : 0,
              duration: row.duration ? Number(row.duration) : 12,
              features: row.features?.trim() || '',
              conditions: row.conditions?.trim() || '',
            };

            validOffers.push(offer);
          });

          setParsedData(validOffers);
          setErrors(newErrors);
          setProgress(100);
        } catch (error) {
          setErrors(['Erreur: ' + (error as Error).message]);
        } finally {
          setIsProcessing(false);
        }
      },
      error: (error) => {
        setErrors(['Erreur de lecture: ' + error.message]);
        setIsProcessing(false);
      },
    });
  }, []);

  const handleImport = () => {
    if (parsedData.length > 0) {
      onImport(parsedData);
      onClose();
      setFile(null);
      setParsedData([]);
      setErrors([]);
      setProgress(0);
      setShowPreview(false);
    }
  };

  const resetModal = () => {
    setFile(null);
    setParsedData([]);
    setErrors([]);
    setProgress(0);
    setShowPreview(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && (onClose(), resetModal())}>
      <DialogContent className="max-w-[95vw] sm:max-w-4xl max-h-[90vh] overflow-y-auto p-3 sm:p-6">
        <DialogHeader className="sm:space-y-1 space-y-2 px-1 sm:px-0 pt-1 sm:pt-0">
          <DialogTitle className="text-lg sm:text-xl flex items-center gap-2">
            <Upload className="h-4 w-4 sm:h-5 sm:w-5" />
            Importer des offres depuis CSV
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3 sm:space-y-6 px-1 sm:px-0 pb-1 sm:pb-0">
          {/* Instructions */}
          <Alert>
            <FileText className="h-4 w-4" />
            <AlertDescription className="text-xs sm:text-sm">
              <div className="space-y-1 sm:space-y-2">
                <p><strong>Format:</strong> CSV avec en-têtes</p>
                <p><strong>Obligatoires:</strong> name, type, price, coverage</p>
                <p><strong>Optionnelles:</strong> deductible, maxCoverage, duration, features</p>
              </div>
            </AlertDescription>
          </Alert>

          {/* Sample Download */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4 p-3 sm:p-4 border rounded-lg">
            <div>
              <h4 className="text-sm sm:text-base font-medium">Besoin d'un modèle ?</h4>
              <p className="text-xs sm:text-sm text-gray-500">Téléchargez notre exemple</p>
            </div>
            <Button onClick={downloadSample} variant="outline" className="w-full sm:w-auto">
              <Download className="h-4 w-4 mr-2" />
              Télécharger
            </Button>
          </div>

          {/* File Upload */}
          <div className="space-y-2 sm:space-y-4">
            <Label htmlFor="csv-file" className="text-sm">Sélectionnez votre fichier CSV</Label>
            <Input
              id="csv-file"
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              disabled={isProcessing}
              className="text-sm"
            />
          </div>

          {/* Progress */}
          {isProcessing && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs sm:text-sm">
                <span>Traitement...</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} />
            </div>
          )}

          {/* Errors */}
          {errors.length > 0 && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-xs sm:text-sm">
                <div className="space-y-1">
                  <p className="font-medium">Erreurs:</p>
                  {errors.slice(0, 5).map((error, index) => (
                    <p key={index} className="text-xs sm:text-sm">• {error}</p>
                  ))}
                  {errors.length > 5 && (
                    <p className="text-xs">... et {errors.length - 5} autres erreurs</p>
                  )}
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Success */}
          {parsedData.length > 0 && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription className="text-xs sm:text-sm">
                <div className="space-y-2">
                  <p className="font-medium">
                    {parsedData.length} offre(s) valide(s)
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowPreview(!showPreview)}
                    className="w-full sm:w-auto"
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    {showPreview ? 'Cacher' : 'Voir'} l'aperçu
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Preview Table */}
          {showPreview && parsedData.length > 0 && (
            <div className="border rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-xs sm:text-sm">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-2 sm:px-3 py-2 text-left">Nom</th>
                      <th className="px-2 sm:px-3 py-2 text-left">Type</th>
                      <th className="px-2 sm:px-3 py-2 text-right">Prix</th>
                      <th className="hidden sm:table-cell px-3 py-2 text-left">Couverture</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parsedData.slice(0, 5).map((offer, index) => (
                      <tr key={index} className="border-b hover:bg-gray-50">
                        <td className="px-2 sm:px-3 py-2 font-medium truncate max-w-[80px] sm:max-w-none">{offer.name}</td>
                        <td className="px-2 sm:px-3 py-2">
                          <Badge variant="outline" className="text-[10px] sm:text-xs">{offer.type}</Badge>
                        </td>
                        <td className="px-2 sm:px-3 py-2 text-right">{offer.price.toLocaleString('fr-FR')} FCFA</td>
                        <td className="hidden sm:table-cell px-3 py-2 truncate max-w-xs">{offer.coverage}</td>
                      </tr>
                    ))}
                    {parsedData.length > 5 && (
                      <tr>
                        <td colSpan={4} className="px-2 sm:px-3 py-2 text-center text-gray-500 text-xs">
                          ... et {parsedData.length - 5} autres
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex-col-reverse sm:flex-row gap-2 sm:gap-2 px-1 sm:px-0 pb-1 sm:pb-0">
          <Button variant="outline" onClick={onClose} className="w-full sm:w-auto">
            Annuler
          </Button>
          <Button
            onClick={handleImport}
            disabled={parsedData.length === 0 || errors.length > 0}
            className="w-full sm:w-auto"
          >
            Importer {parsedData.length} offre(s)
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
