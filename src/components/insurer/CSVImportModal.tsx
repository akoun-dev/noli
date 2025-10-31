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
  X
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

          // Validate each row
          data.forEach((row, index) => {
            const rowNum = index + 2; // Accounting for header row

            // Required fields validation
            if (!row.name) {
              newErrors.push(`Ligne ${rowNum}: Le nom de l'offre est requis`);
              return;
            }
            if (!row.type) {
              newErrors.push(`Ligne ${rowNum}: Le type d'assurance est requis`);
              return;
            }
            if (!row.price || isNaN(Number(row.price))) {
              newErrors.push(`Ligne ${rowNum}: Le prix doit être un nombre valide`);
              return;
            }
            if (!row.coverage) {
              newErrors.push(`Ligne ${rowNum}: La description de la couverture est requise`);
              return;
            }

            // Validate insurance type
            const validTypes = ['Tiers Simple', 'Tiers +', 'Tous Risques'];
            if (!validTypes.includes(row.type)) {
              newErrors.push(`Ligne ${rowNum}: Le type "${row.type}" n'est pas valide. Types valides: ${validTypes.join(', ')}`);
              return;
            }

            // Create offer object
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
          setErrors(['Erreur lors du traitement du fichier: ' + (error as Error).message]);
        } finally {
          setIsProcessing(false);
        }
      },
      error: (error) => {
        setErrors(['Erreur de lecture du fichier: ' + error.message]);
        setIsProcessing(false);
      },
    });
  }, []);

  const handleImport = () => {
    if (parsedData.length > 0) {
      onImport(parsedData);
      onClose();
      // Reset state
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
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Importer des offres depuis un fichier CSV
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Instructions */}
          <Alert>
            <FileText className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-2">
                <p><strong>Format requis:</strong> CSV avec en-têtes</p>
                <p><strong>Colonnes obligatoires:</strong> name, type, price, coverage, description</p>
                <p><strong>Colonnes optionnelles:</strong> deductible, maxCoverage, duration, features, conditions</p>
                <p><strong>Types valides:</strong> "Tiers Simple", "Tiers +", "Tous Risques"</p>
              </div>
            </AlertDescription>
          </Alert>

          {/* Sample Download */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <h4 className="font-medium">Besoin d'un modèle ?</h4>
              <p className="text-sm text-gray-500">Téléchargez notre exemple de fichier</p>
            </div>
            <Button onClick={downloadSample} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Télécharger le modèle
            </Button>
          </div>

          {/* File Upload */}
          <div className="space-y-4">
            <Label htmlFor="csv-file">Sélectionnez votre fichier CSV</Label>
            <Input
              id="csv-file"
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              disabled={isProcessing}
            />
          </div>

          {/* Progress */}
          {isProcessing && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Traitement du fichier...</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} />
            </div>
          )}

          {/* Errors */}
          {errors.length > 0 && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-1">
                  <p className="font-medium">Erreurs trouvées:</p>
                  {errors.map((error, index) => (
                    <p key={index} className="text-sm">• {error}</p>
                  ))}
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Success and Preview */}
          {parsedData.length > 0 && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-2">
                  <p className="font-medium">
                    {parsedData.length} offre(s) valides trouvées
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowPreview(!showPreview)}
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
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-3 py-2 text-left">Nom</th>
                      <th className="px-3 py-2 text-left">Type</th>
                      <th className="px-3 py-2 text-right">Prix</th>
                      <th className="px-3 py-2 text-left">Couverture</th>
                      <th className="px-3 py-2 text-left">Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parsedData.slice(0, 5).map((offer, index) => (
                      <tr key={index} className="border-b hover:bg-gray-50">
                        <td className="px-3 py-2 font-medium">{offer.name}</td>
                        <td className="px-3 py-2">
                          <Badge variant="outline">{offer.type}</Badge>
                        </td>
                        <td className="px-3 py-2 text-right">{offer.price.toLocaleString('fr-FR')} FCFA</td>
                        <td className="px-3 py-2">{offer.coverage}</td>
                        <td className="px-3 py-2 max-w-xs truncate">{offer.description}</td>
                      </tr>
                    ))}
                    {parsedData.length > 5 && (
                      <tr>
                        <td colSpan={5} className="px-3 py-2 text-center text-gray-500">
                          ... et {parsedData.length - 5} autres offres
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Annuler
          </Button>
          <Button
            onClick={handleImport}
            disabled={parsedData.length === 0 || errors.length > 0}
          >
            Importer {parsedData.length} offre(s)
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};