import {
  PricingCalculation,
  PricingResult,
  GuaranteePricing,
  Vehicle,
  Guarantee,
  InsurancePackage,
  TarificationGrids,
  TarifFixe
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

      case 'FIRE_THEFT':
      case 'THEFT_ARMED': {
        const { amount, details } = this.calculateFireTheftAmount(guarantee, vehicle);
        calculatedPrice = amount;
        pricingMethod =
          guarantee.calculationMethod === 'THEFT_ARMED'
            ? 'Vol + Vol à mains armées (valeur vénale)'
            : 'Incendie & Vol (valeur vénale)';
        calculationDetails = details;
        break;
      }

      case 'GLASS_ROOF': {
        const { amount, details } = this.calculateGlassCoverageAmount(guarantee.parameters?.glassRoofConfig, vehicle);
        calculatedPrice = amount;
        pricingMethod = 'Bris de glaces (toit ouvrant)';
        calculationDetails = details;
        break;
      }

      case 'GLASS_STANDARD': {
        const { amount, details } = this.calculateGlassCoverageAmount(guarantee.parameters?.glassStandardConfig, vehicle);
        calculatedPrice = amount;
        pricingMethod = 'Bris de glaces';
        calculationDetails = details;
        break;
      }

      case 'TIERCE_COMPLETE_CAP':
      case 'TIERCE_COLLISION_CAP': {
        const { amount, details } = this.calculateTierceCapAmount(guarantee, vehicle);
        calculatedPrice = amount;
        calculationDetails = details;
        pricingMethod =
          guarantee.calculationMethod === 'TIERCE_COMPLETE_CAP'
            ? 'Tierce complète plafonnée'
            : 'Tierce collision plafonnée';
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

  private static calculateFireTheftAmount(guarantee: Guarantee, vehicle: Vehicle): {
    amount: number;
    details: Record<string, any>;
  } {
    const config = guarantee.parameters?.fireTheftConfig;
    const venalValue = vehicle?.values?.venale ?? 0;

    if (!config || !venalValue || venalValue <= 0) {
      return {
        amount: 0,
        details: {
          missingConfig: !config,
          venalValue,
        },
      };
    }

    const threshold = config.sumInsuredThreshold ?? 25_000_000;
    const fireRate = (config.fireRatePercent ?? 0) / 100;
    const theftRateLow = (config.theftRateBelowThresholdPercent ?? 0) / 100;
    const theftRateHigh = (config.theftRateAboveThresholdPercent ?? 0) / 100;
    const armedRateLow = (config.armedTheftRateBelowThresholdPercent ?? 0) / 100;
    const armedRateHigh = (config.armedTheftRateAboveThresholdPercent ?? 0) / 100;
    const includeFire = config.includeFireComponent !== false;
    const includeBaseTheft = config.includeBaseTheftComponent !== false;
    const includeArmed = !!config.includeArmedTheftComponent;

    const baseTheftRate = venalValue <= threshold ? theftRateLow : theftRateHigh;
    const armedTheftRate = venalValue <= threshold ? armedRateLow : armedRateHigh;

    let totalRate = 0;
    if (includeFire && fireRate > 0) {
      totalRate += fireRate;
    }
    if (includeBaseTheft && baseTheftRate > 0) {
      totalRate += baseTheftRate;
    }
    if (includeArmed && armedTheftRate > 0) {
      totalRate += armedTheftRate;
    }

    const amount = venalValue * totalRate;

    return {
      amount,
      details: {
        venalValue,
        fireRate: includeFire ? fireRate : 0,
        theftRate: includeBaseTheft ? baseTheftRate : 0,
        armedTheftRate: includeArmed ? armedTheftRate : 0,
        threshold,
      },
    };
  }

  private static calculateGlassCoverageAmount(
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

    const rate = (config.ratePercent ?? 0) / 100;
    const amount = newValue * rate;
    return {
      amount,
      details: {
        newValue,
        rate,
      },
    };
  }

  private static calculateTierceCapAmount(guarantee: Guarantee, vehicle: Vehicle): {
    amount: number;
    details: Record<string, any>;
  } {
    const config = guarantee.parameters?.tierceCapConfig;
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

    const option =
      config.options.find(opt => opt.type === config.selectedOption) ?? config.options.find(opt => opt.type === 'NONE');
    if (!option) {
      return {
        amount: 0,
        details: {
          missingOption: true,
        },
      };
    }

    const baseRate = (option.ratePercent ?? 0) / 100;
    const deduction = (option.deductionPercent ?? 0) / 100;
    const amount = newValue * baseRate * (1 - deduction);

    return {
      amount,
      details: {
        newValue,
        option: option.label,
        rate: baseRate,
        deduction,
      },
    };
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
