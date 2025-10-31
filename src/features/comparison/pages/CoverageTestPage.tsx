import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Shield, Calculator, CheckCircle, AlertTriangle, Loader2 } from 'lucide-react';
import { coverageTarificationService, type VehicleData, type CoverageOption } from '@/services/coverageTarificationService';
import { useAuth } from '@/contexts/AuthContext';

export default function CoverageTestPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Vehicle data
  const [vehicleData, setVehicleData] = useState<VehicleData>({
    category: '401',
    fiscal_power: 6,
    fuel_type: 'essence',
    sum_insured: 5000000,
    new_value: 8000000,
  });

  // Available coverages
  const [availableCoverages, setAvailableCoverages] = useState<CoverageOption[]>([]);
  const [selectedCoverages, setSelectedCoverages] = useState<Record<string, boolean>>({});
  const [totalPremium, setTotalPremium] = useState(0);
  const [premiumBreakdown, setPremiumBreakdown] = useState<Record<string, number>>({});

  // Test quote
  const [testQuoteId, setTestQuoteId] = useState<string | null>(null);
  const [quotePremiums, setQuotePremiums] = useState<any[]>([]);

  // Load available coverages
  useEffect(() => {
    loadAvailableCoverages();
  }, []);

  const loadAvailableCoverages = async () => {
    try {
      setLoading(true);
      setError(null);
      const coverages = await coverageTarificationService.getAvailableCoverages(vehicleData.category);
      setAvailableCoverages(coverages);
    } catch (err) {
      setError('Erreur lors du chargement des garanties');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Calculate single coverage premium
  const calculateSingleCoverage = async (coverageId: string) => {
    if (!user) {
      setError('Utilisateur non connecté');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const premium = await coverageTarificationService.calculateCoveragePremium(
        coverageId,
        vehicleData
      );

      setSuccess(`Prime calculée pour ${coverageId}: ${premium.toLocaleString('fr-FR')} FCFA`);
    } catch (err) {
      setError('Erreur lors du calcul de la prime');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Create test quote
  const createTestQuote = async () => {
    if (!user) {
      setError('Utilisateur non connecté');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      const quoteData = {
        user_id: user.id,
        category_id: 'AUTO',
        personal_data: {
          firstName: 'Test',
          lastName: 'User',
          email: user.email || 'test@example.com',
          phone: '+22500000000',
        },
        vehicle_data: vehicleData,
        coverage_requirements: {
          test_mode: true,
        },
      };

      const response = await fetch('/api/quotes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(quoteData),
      });

      if (!response.ok) {
        throw new Error('Failed to create test quote');
      }

      const quote = await response.json();
      setTestQuoteId(quote.id);
      setSuccess(`Devis test créé: ${quote.id}`);
    } catch (err) {
      setError('Erreur lors de la création du devis test');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Add coverage to test quote
  const addCoverageToQuote = async (coverageId: string) => {
    if (!testQuoteId) {
      setError('Veuillez d\'abord créer un devis test');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      await coverageTarificationService.addCoverageToQuote(
        testQuoteId,
        coverageId,
        vehicleData,
        selectedCoverages[coverageId] || false
      );

      // Reload quote premiums
      await loadQuotePremiums();
      setSuccess(`Garantie ${coverageId} ${selectedCoverages[coverageId] ? 'ajoutée' : 'retirée'} du devis`);
    } catch (err) {
      setError('Erreur lors de la mise à jour du devis');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Load quote premiums
  const loadQuotePremiums = async () => {
    if (!testQuoteId) return;

    try {
      const premiums = await coverageTarificationService.getQuoteCoveragePremiums(testQuoteId);
      setQuotePremiums(premiums);

      // Calculate totals
      const selected = premiums.filter(p => p.is_included);
      const total = selected.reduce((sum, p) => sum + p.premium_amount, 0);
      setTotalPremium(total);

      const breakdown: Record<string, number> = {};
      selected.forEach(p => {
        breakdown[p.coverage_id] = p.premium_amount;
      });
      setPremiumBreakdown(breakdown);
    } catch (err) {
      console.error('Error loading quote premiums:', err);
    }
  };

  // Test comprehensive calculation
  const testComprehensiveCalculation = async () => {
    if (!testQuoteId) {
      setError('Veuillez d\'abord créer un devis test');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const selectedCoverageData = Object.entries(selectedCoverages)
        .filter(([_, included]) => included)
        .map(([coverageId]) => ({
          coverageId,
          isIncluded: true,
        }));

      const result = await coverageTarificationService.calculateComprehensivePremium(
        testQuoteId,
        vehicleData,
        selectedCoverageData
      );

      setTotalPremium(result.totalPremium);
      setPremiumBreakdown(result.breakdown);
      setSuccess(`Calcul complet effectué: ${result.totalPremium.toLocaleString('fr-FR')} FCFA`);
    } catch (err) {
      setError('Erreur lors du calcul complet');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Validate vehicle data
  const validateVehicleData = () => {
    const validation = coverageTarificationService.validateVehicleData(vehicleData);
    if (!validation.isValid) {
      setError(`Erreurs de validation: ${validation.errors.join(', ')}`);
      return false;
    }
    if (validation.warnings.length > 0) {
      setSuccess(`Avertissements: ${validation.warnings.join(', ')}`);
    }
    return true;
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Test du Système de Tarification par Garantie</h1>
        <p className="text-muted-foreground">
          Test complet du nouveau système de calcul des primes d'assurance automobile
        </p>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="mb-6">
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="vehicle" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="vehicle">Données Véhicule</TabsTrigger>
          <TabsTrigger value="coverages">Garanties</TabsTrigger>
          <TabsTrigger value="calculation">Calcul</TabsTrigger>
          <TabsTrigger value="results">Résultats</TabsTrigger>
        </TabsList>

        {/* Vehicle Data Tab */}
        <TabsContent value="vehicle" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Données du Véhicule
              </CardTitle>
              <CardDescription>
                Configuration du véhicule pour les calculs de prime
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="category">Catégorie</Label>
                  <Select value={vehicleData.category} onValueChange={(value) => setVehicleData(prev => ({ ...prev, category: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="401">401</SelectItem>
                      <SelectItem value="402">402</SelectItem>
                      <SelectItem value="403">403</SelectItem>
                      <SelectItem value="404">404</SelectItem>
                      <SelectItem value="405">405</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="fiscal_power">Puissance fiscale</Label>
                  <Input
                    id="fiscal_power"
                    type="number"
                    value={vehicleData.fiscal_power}
                    onChange={(e) => setVehicleData(prev => ({ ...prev, fiscal_power: parseInt(e.target.value) || 0 }))}
                  />
                </div>
                <div>
                  <Label htmlFor="fuel_type">Type de carburant</Label>
                  <Select value={vehicleData.fuel_type} onValueChange={(value) => setVehicleData(prev => ({ ...prev, fuel_type: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="essence">Essence</SelectItem>
                      <SelectItem value="diesel">Diesel</SelectItem>
                      <SelectItem value="hybride">Hybride</SelectItem>
                      <SelectItem value="electrique">Électrique</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="sum_insured">Valeur assurée (FCFA)</Label>
                  <Input
                    id="sum_insured"
                    type="number"
                    value={vehicleData.sum_insured}
                    onChange={(e) => setVehicleData(prev => ({ ...prev, sum_insured: parseInt(e.target.value) || 0 }))}
                  />
                </div>
                <div>
                  <Label htmlFor="new_value">Valeur à neuf (FCFA)</Label>
                  <Input
                    id="new_value"
                    type="number"
                    value={vehicleData.new_value}
                    onChange={(e) => setVehicleData(prev => ({ ...prev, new_value: parseInt(e.target.value) || 0 }))}
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <Button onClick={validateVehicleData} variant="outline">
                  Valider les données
                </Button>
                <Button onClick={loadAvailableCoverages} disabled={loading}>
                  {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Shield className="h-4 w-4 mr-2" />}
                  Recharger les garanties
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Coverages Tab */}
        <TabsContent value="coverages" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Garanties Disponibles</CardTitle>
              <CardDescription>
                {availableCoverages.length} garanties trouvées pour la catégorie {vehicleData.category}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {availableCoverages.map((coverage) => (
                  <Card key={coverage.coverage_id} className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-semibold">{coverage.name}</h4>
                          <Badge variant="outline">{coverage.calculation_type}</Badge>
                          {coverage.is_mandatory && <Badge variant="destructive">Obligatoire</Badge>}
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">{coverage.description}</p>
                        {coverage.estimated_min_premium && (
                          <p className="text-sm">
                            Prime estimée: {coverage.estimated_min_premium.toLocaleString('fr-FR')} - {coverage.estimated_max_premium?.toLocaleString('fr-FR')} FCFA
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => calculateSingleCoverage(coverage.coverage_id)}
                          disabled={loading}
                        >
                          <Calculator className="h-4 w-4 mr-1" />
                          Calculer
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => {
                            setSelectedCoverages(prev => ({ ...prev, [coverage.coverage_id]: !prev[coverage.coverage_id] }));
                            if (testQuoteId) {
                              addCoverageToQuote(coverage.coverage_id);
                            }
                          }}
                          disabled={loading || coverage.is_mandatory}
                          variant={selectedCoverages[coverage.coverage_id] ? "default" : "outline"}
                        >
                          {selectedCoverages[coverage.coverage_id] ? 'Sélectionnée' : 'Sélectionner'}
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Calculation Tab */}
        <TabsContent value="calculation" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Tests de Calcul</CardTitle>
              <CardDescription>
                Exécution des différents tests de calcul
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Button onClick={createTestQuote} disabled={loading || !user}>
                  {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Shield className="h-4 w-4 mr-2" />}
                  Créer un devis test
                </Button>
                <Button onClick={loadQuotePremiums} disabled={loading || !testQuoteId}>
                  <Calculator className="h-4 w-4 mr-2" />
                  Charger les primes du devis
                </Button>
                <Button onClick={testComprehensiveCalculation} disabled={loading || !testQuoteId}>
                  <Calculator className="h-4 w-4 mr-2" />
                  Calcul complet
                </Button>
                <Button onClick={() => {
                  setSelectedCoverages({});
                  setTotalPremium(0);
                  setPremiumBreakdown({});
                  setTestQuoteId(null);
                  setQuotePremiums([]);
                }} variant="outline">
                  Réinitialiser
                </Button>
              </div>

              {testQuoteId && (
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm font-medium">ID du devis test: {testQuoteId}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Results Tab */}
        <TabsContent value="results" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Résultats du Calcul</CardTitle>
              <CardDescription>
                Détail des primes calculées
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Total Premium */}
              <div className="p-6 bg-gradient-to-r from-primary/5 to-accent/5 rounded-lg border">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold">Prime totale</h3>
                    <p className="text-sm text-muted-foreground">
                      {Object.keys(selectedCoverages).filter(k => selectedCoverages[k]).length} garantie(s) sélectionnée(s)
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-primary">
                      {totalPremium.toLocaleString('fr-FR')} FCFA
                    </div>
                    <p className="text-xs text-muted-foreground">
                      /an ({Math.round(totalPremium / 12).toLocaleString('fr-FR')} FCFA/mois)
                    </p>
                  </div>
                </div>
              </div>

              {/* Premium Breakdown */}
              {Object.keys(premiumBreakdown).length > 0 && (
                <div>
                  <h4 className="font-semibold mb-3">Détail par garantie</h4>
                  <div className="space-y-2">
                    {Object.entries(premiumBreakdown).map(([coverageId, amount]) => (
                      <div key={coverageId} className="flex justify-between items-center p-3 bg-muted rounded">
                        <span className="font-medium">{coverageId}</span>
                        <span className="font-bold">{amount.toLocaleString('fr-FR')} FCFA</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Quote Premiums */}
              {quotePremiums.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-3">Primes du devis ({quotePremiums.length})</h4>
                  <div className="space-y-2">
                    {quotePremiums.map((premium) => (
                      <div key={premium.id} className={`flex justify-between items-center p-3 rounded ${premium.is_included ? 'bg-green-50 border border-green-200' : 'bg-gray-50'}`}>
                        <div>
                          <span className="font-medium">{premium.coverage?.name || premium.coverage_id}</span>
                          <p className="text-xs text-muted-foreground">{premium.coverage?.calculation_type}</p>
                        </div>
                        <div className="text-right">
                          <span className="font-bold">{premium.premium_amount.toLocaleString('fr-FR')} FCFA</span>
                          <p className="text-xs text-muted-foreground">
                            {premium.is_included ? 'Inclus' : 'Exclus'}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}