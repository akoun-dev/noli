import {
  PricingCalculation,
  PricingResult,
  GuaranteePricing,
  Vehicle,
  Guarantee,
  InsurancePackage,
  TarificationGrids,
  TarifFixe,
  ICFormulaConfig,
  ICIPTConfig,
  IPTFormulaConfig,
  IPTConfig,
  IPTPlacesTariff,
  VariableBasedConfig,
  MatrixBasedConfig,
  VariableSourceType,
  MatrixTariff
} from '@/types/tarification';
import { guaranteeService } from './guaranteeService';
import { logger } from '@/lib/logger';

export class PricingService {
  // Grilles de tarification en mémoire
  private static grids: TarificationGrids | null = null;

  // Méthode principale de calcul
  static async calculatePrice(calculation: PricingCalculation): Promise<PricingResult> {
    const { vehicle, guaranteeIds, packageId, calculationMethod = 'TAILOR_MADE', parameters = {} } = calculation;

    // Récupérer les grilles de tarification
    if (!this.grids) {
      this.grids = await guaranteeService.getTarificationGrids();
    }

    let totalBasePrice = 0;
    let totalWithGuarantees = 0;
    const guaranteeBreakdown: GuaranteePricing[] = [];
    let selectedPackage: InsurancePackage | undefined;

    // Déterminer les garanties à calculer
    let guaranteesToPrice: Guarantee[] = [];

    if (calculationMethod === 'PACK' && packageId) {
      selectedPackage = await guaranteeService.getPackage(packageId) || undefined;
      if (!selectedPackage) {
        throw new Error('Package non trouvé');
      }

      // Récupérer les garanties du package
      guaranteesToPrice = (await Promise.all(
        selectedPackage.guarantees.map(gId => guaranteeService.getGuarantee(gId))
      )).filter((g): g is Guarantee => g !== null);

      totalBasePrice = selectedPackage.basePrice;
    } else {
      // Mode TAILOR_MADE
      guaranteesToPrice = (await Promise.all(
        guaranteeIds.map(gId => guaranteeService.getGuarantee(gId))
      )).filter((g): g is Guarantee => g !== null);
    }

    // Calculer chaque garantie
    for (const guarantee of guaranteesToPrice) {
      if (!guarantee.isActive) continue;

      const pricingResult = this.calculateGuaranteePrice(guarantee, vehicle, parameters, selectedPackage);
      guaranteeBreakdown.push(pricingResult);
      totalWithGuarantees += pricingResult.calculatedPrice;
    }

    // Ajouter le prix de base si c'est un package
    if (calculationMethod === 'PACK') {
      totalWithGuarantees += totalBasePrice;
    }

    return {
      totalBasePrice,
      totalWithGuarantees,
      guaranteeBreakdown,
      package: selectedPackage,
      calculationDate: new Date()
    };
  }

  // Calculer le prix d'une garantie spécifique
  private static calculateGuaranteePrice(
    guarantee: Guarantee,
    vehicle: Vehicle,
    parameters: any = {},
    selectedPackage?: InsurancePackage
  ): GuaranteePricing {
    let calculatedPrice = 0;
    let pricingMethod = '';
    let calculationDetails: any = {};

    console.log('[calculateGuaranteePrice] === START ===', {
      guaranteeId: guarantee.id,
      guaranteeName: guarantee.name,
      guaranteeCode: guarantee.code,
      guaranteeCategory: guarantee.category,
      calculationMethod: guarantee.calculationMethod,
      vehicle: {
        fiscalPower: vehicle?.fiscalPower,
        energy: vehicle?.energy,
        categoryCode: vehicle?.categoryCode,
        nbPlaces: vehicle?.nbPlaces
      },
      parameters
    });

    switch (guarantee.calculationMethod) {
      case 'FIXED_AMOUNT':
        calculatedPrice = this.calculateFixedAmount(guarantee, selectedPackage);
        pricingMethod = 'Montant fixe';
        calculationDetails = {
          basePrice: guarantee.rate,
          isPackage: !!selectedPackage,
          packagePriceReduced: selectedPackage ? guarantee.parameters?.packPriceReduced : null
        };
        break;

      case 'FREE':
        calculatedPrice = 0;
        pricingMethod = 'Gratuit';
        calculationDetails = {
          freeCoverage: true
        };
        break;

      case 'VARIABLE_BASED': {
        const { amount, details } = this.calculateVariableBasedAmount(guarantee, vehicle, parameters);
        calculatedPrice = amount;
        pricingMethod = details.pricingMethod || 'Basé sur une variable';
        calculationDetails = details;
        break;
      }

      case 'MATRIX_BASED': {
        const { amount, details } = this.calculateMatrixBasedAmount(guarantee, vehicle, parameters);
        calculatedPrice = amount;
        pricingMethod = details.pricingMethod || 'Basé sur une matrice';
        calculationDetails = details;
        break;
      }

      default:
        calculatedPrice = 0;
        pricingMethod = 'Non défini';
    }

    // Appliquer les limites min/max si définies
    if (guarantee.minValue && calculatedPrice < guarantee.minValue) {
      calculatedPrice = guarantee.minValue;
    }
    if (guarantee.maxValue && calculatedPrice > guarantee.maxValue) {
      calculatedPrice = guarantee.maxValue;
    }

    return {
      guarantee,
      basePrice: guarantee.rate || 0,
      calculatedPrice,
      pricingMethod,
      calculationDetails
    };
  }

  // Méthode 1: Montant fixe
  private static calculateFixedAmount(guarantee: Guarantee, selectedPackage?: InsurancePackage): number {
    // Si c'est un package et qu'il y a un prix réduit, l'utiliser
    if (selectedPackage && guarantee.parameters?.packPriceReduced) {
      return guarantee.parameters.packPriceReduced;
    }
    // Utiliser fixedAmount en priorité, sinon rate pour compatibilité
    return guarantee.fixedAmount || guarantee.rate || 0;
  }

  // Méthode 3: Basé sur une variable (VARIABLE_BASED)
  private static calculateVariableBasedAmount(
    config: { ratePercent?: number } | undefined,
    vehicle: Vehicle
  ): {
    amount: number;
    details: Record<string, any>;
  } {
    const newValue = vehicle?.values?.neuve ?? vehicle?.values?.venale ?? 0;
    if (!config || !newValue || newValue <= 0) {
      return {
        amount: 0,
        details: {
          missingConfig: !config,
          newValue,
        },
      };
    }

    // ratePercent est déjà en format pourcentage (ex: 0.42 = 0.42%)
    // Conversion directe en décimal pour le calcul
    const rate = config.ratePercent ?? 0;
    const amount = newValue * (rate / 100);
    return {
      amount,
      details: {
        newValue,
        ratePercent: rate,
        rateInDecimal: rate / 100,
      },
    };
  }

  // Méthode 4: Basé sur une matrice (MATRIX_BASED)
  private static calculateMatrixBasedAmount(
    guarantee: Guarantee,
    vehicle: Vehicle,
    parameters: any
  ): { amount: number; details: Record<string, any> } {
    // Utiliser soit le nouveau format, soit l'ancien pour compatibilité
    const config = (guarantee.parameters?.matrixBased ?? guarantee.parameters?.matrixBasedConfig) as MatrixBasedConfig | undefined;

    if (!config || !config.tariffs || config.tariffs.length === 0) {
      return {
        amount: 0,
        details: {
          error: 'Missing or invalid matrixBased config',
          pricingMethod: 'Configuration matrice manquante'
        }
      };
    }

    // Extraire les valeurs du véhicule
    const fiscalPower = vehicle?.fiscalPower ?? 0;
    const fuelType = (vehicle?.energy ?? '').toLowerCase();
    const categoryCode = vehicle?.categoryCode ?? '401';
    const seats = vehicle?.nbPlaces ?? 5;
    const formula = parameters?.formula_name ?? parameters?.formula ?? 1;

    // Rechercher le tarif applicable selon la dimension
    let matchedTariff: MatrixTariff | null = null;

    if (config.dimension === 'FISCAL_POWER') {
      // Recherche par puissance fiscale seulement
      matchedTariff = config.tariffs.find(tariff =>
        fiscalPower >= (tariff.fiscalPowerMin ?? 0) &&
        fiscalPower <= (tariff.fiscalPowerMax ?? 999)
      ) ?? null;
    } else if (config.dimension === 'FUEL_TYPE') {
      // Recherche par type de carburant seulement
      matchedTariff = config.tariffs.find(tariff =>
        tariff.fuelType?.toLowerCase() === fuelType
      ) ?? null;
    } else if (config.dimension === 'VEHICLE_CATEGORY') {
      // Recherche par catégorie de véhicule seulement
      matchedTariff = config.tariffs.find(tariff =>
        tariff.vehicleCategory === categoryCode
      ) ?? null;
    } else if (config.dimension === 'SEATS') {
      // Recherche par nombre de places seulement
      matchedTariff = config.tariffs.find(tariff =>
        tariff.seats === seats
      ) ?? null;
    } else if (config.dimension === 'FORMULA') {
      console.log('[calculateMatrixBasedAmount] FORMULA dimension processing:', {
        formula,
        seats,
        hasConfigFormulas: !!config.formulas,
        formulasCount: config.formulas?.length,
        hasConfigTariffs: !!config.tariffs,
        tariffsCount: config.tariffs?.length
      });

      // Pour la dimension FORMULA, on peut avoir deux structures :
      // 1. config.formulas : tableau de formules avec placesTariffs (pour IPT)
      // 2. config.tariffs : tableau de tarifs directs (pour IC simple)

      if (config.formulas && Array.isArray(config.formulas) && config.formulas.length > 0) {
        console.log('[calculateMatrixBasedAmount] Using config.formulas (IPT path)');
        // Cas IPT : formules avec placesTariffs
        const matchedFormula = config.formulas.find((f: any) => f.formula === formula);
        console.log('[calculateMatrixBasedAmount] Matched formula:', {
          formulaNumber: formula,
          found: !!matchedFormula,
          matchedFormulaLabel: matchedFormula?.label,
          hasPlacesTariffs: !!matchedFormula?.placesTariffs,
          placesTariffsCount: matchedFormula?.placesTariffs?.length
        });
        if (matchedFormula) {
          // La formule a-t-elle des placesTariffs ?
          if (matchedFormula.placesTariffs && Array.isArray(matchedFormula.placesTariffs) && matchedFormula.placesTariffs.length > 0) {
            // Trouver le tarif correspondant au nombre de places
            const placesTariffs = matchedFormula.placesTariffs;
            const applicableTariff = placesTariffs.find((pt: any) => pt.places >= seats)
              || placesTariffs[placesTariffs.length - 1]; // Fallback au plus élevé
            console.log('[calculateMatrixBasedAmount] Places tariff lookup:', {
              vehicleSeats: seats,
              placesTariffs,
              applicableTariff,
              finalPrime: applicableTariff?.prime
            });
            matchedTariff = {
              key: `formula_${formula}_${applicableTariff?.places || seats}`,
              prime: applicableTariff?.prime ?? matchedFormula.prime ?? 0
            };
          } else {
            // Pas de placesTariffs, utiliser prime directe de la formule
            console.log('[calculateMatrixBasedAmount] No placesTariffs, using direct prime:', matchedFormula.prime);
            matchedTariff = {
              key: `formula_${formula}`,
              prime: matchedFormula.prime ?? 0
            };
          }
        } else {
          console.log('[calculateMatrixBasedAmount] No matching formula found!');
        }
      } else if (config.tariffs && Array.isArray(config.tariffs) && config.tariffs.length > 0) {
        console.log('[calculateMatrixBasedAmount] Using config.tariffs (IC simple path)');
        // Cas classique : tarifs directs
        matchedTariff = config.tariffs.find((tariff: any) => tariff.formula === formula) ?? null;
        console.log('[calculateMatrixBasedAmount] Matched tariff from config.tariffs:', matchedTariff);
      } else {
        console.log('[calculateMatrixBasedAmount] No valid config found for FORMULA dimension');
      }
    }

    // Utiliser le tarif trouvé ou la valeur par défaut
    const amount = matchedTariff?.prime ?? config.defaultPrime ?? 0;

    // Construire les détails
    const details: Record<string, any> = {
      pricingMethod: matchedTariff
        ? `Matrice de tarification (${matchedTariff.key})`
        : 'Matrice de tarification (valeur par défaut)',
      dimension: config.dimension,
      matchedKey: matchedTariff?.key,
      amount,
      fiscalPower,
      fuelType,
      categoryCode,
      seats,
      formula
    };

    return { amount, details };
  }

  // Les méthodes complexes ont été supprimées avec la simplification

  // Simulation rapide pour l'affichage en temps réel
  static quickCalculate(basePrice: number, guarantees: { id: string; selected: boolean }[]): number {
    // Pour une simulation rapide, on applique un pourcentage forfaitaire
    const selectedCount = guarantees.filter(g => g.selected).length;
    const additionalCost = selectedCount * 15000; // 15K FCFA par garantie en moyenne

    return basePrice + additionalCost;
  }

  // Obtenir les paramètres requis pour une garantie
  static getRequiredParameters(guarantee: Guarantee): string[] {
    const parameters: string[] = [];

    switch (guarantee.calculationMethod) {
      case 'FIXED_AMOUNT':
      case 'FREE':
        // Aucun paramètre requis pour ces méthodes simplifiées
        break;
    }

    return parameters;
  }

  // Valider les paramètres fournis
  static validateParameters(calculation: PricingCalculation): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!calculation.vehicle) {
      errors.push('Véhicule non spécifié');
    }

    if (calculation.calculationMethod === 'PACK' && !calculation.packageId) {
      errors.push('Package non spécifié pour le calcul PACK');
    }

    if (calculation.calculationMethod === 'TAILOR_MADE' && (!calculation.guaranteeIds || calculation.guaranteeIds.length === 0)) {
      errors.push('Aucune garantie spécifiée pour le calcul TAILOR_MADE');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

export const pricingService = PricingService;
