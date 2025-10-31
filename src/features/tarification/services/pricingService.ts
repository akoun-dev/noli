import {
  PricingCalculation,
  PricingResult,
  GuaranteePricing,
  Vehicle,
  Guarantee,
  InsurancePackage,
  TarificationGrids,
  TarifRC,
  TarifICIPT,
  TarifTCMTCL,
  TarifFixe
} from '@/types/tarification';
import { guaranteeService } from './guaranteeService';

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
    let guaranteeBreakdown: GuaranteePricing[] = [];
    let selectedPackage: InsurancePackage | undefined;

    // Déterminer les garanties à calculer
    let guaranteesToPrice: Guarantee[] = [];

    if (calculationMethod === 'PACK' && packageId) {
      selectedPackage = await guaranteeService.getPackage(packageId);
      if (!selectedPackage) {
        throw new Error('Package non trouvé');
      }

      // Récupérer les garanties du package
      guaranteesToPrice = await Promise.all(
        selectedPackage.guarantees.map(gId => guaranteeService.getGuarantee(gId))
      );
      guaranteesToPrice = guaranteesToPrice.filter(Boolean) as Guarantee[];

      totalBasePrice = selectedPackage.basePrice;
    } else {
      // Mode TAILOR_MADE
      guaranteesToPrice = await Promise.all(
        guaranteeIds.map(gId => guaranteeService.getGuarantee(gId))
      );
      guaranteesToPrice = guaranteesToPrice.filter(Boolean) as Guarantee[];
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

      case 'RATE_ON_SI':
        calculatedPrice = this.calculateRateOnSI(guarantee, vehicle);
        pricingMethod = 'Taux sur valeur assurée';
        calculationDetails = {
          rate: guarantee.rate,
          assuredValue: vehicle.values.venale,
          minPrice: guarantee.minValue,
          maxPrice: guarantee.maxValue
        };
        break;

      case 'RATE_ON_NEW_VALUE':
        calculatedPrice = this.calculateRateOnNewValue(guarantee, vehicle);
        pricingMethod = 'Taux sur valeur neuve';
        calculationDetails = {
          rate: guarantee.rate,
          newValue: vehicle.values.neuve,
          minPrice: guarantee.minValue,
          maxPrice: guarantee.maxValue
        };
        break;

      case 'MTPL_TARIFF':
        calculatedPrice = this.calculateMTPLTariff(vehicle);
        pricingMethod = 'Grille Responsabilité Civile';
        calculationDetails = {
          category: vehicle.categoryCode,
          energy: vehicle.energy,
          fiscalPower: vehicle.fiscalPower
        };
        break;

      case 'TCM_TCL_MATRIX':
        calculatedPrice = this.calculateTCMTCLMatrix(guarantee, vehicle, parameters);
        pricingMethod = 'Matrice Tierce';
        calculationDetails = {
          category: vehicle.categoryCode,
          guaranteeType: guarantee.category,
          newValue: vehicle.values.neuve,
          franchise: parameters.tierceFranchise
        };
        break;

      case 'IC_IPT_FORMULA':
        calculatedPrice = this.calculateICIPTFormula(guarantee, vehicle, parameters);
        pricingMethod = 'Formule IC/IPT';
        calculationDetails = {
          type: guarantee.category === 'INDIVIDUELLE_CONDUCTEUR' ? 'IC' : 'IPT',
          formula: parameters.icIptFormula,
          nbPlaces: vehicle.nbPlaces
        };
        break;

      case 'CONDITIONAL_RATE':
        calculatedPrice = this.calculateConditionalRate(guarantee, vehicle);
        pricingMethod = 'Taux conditionnel';
        calculationDetails = {
          condition: guarantee.parameters?.condition,
          venaleValue: vehicle.values.venale,
          appliedRate: calculatedPrice / vehicle.values.venale * 100
        };
        break;

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
    return guarantee.rate || 0;
  }

  // Méthode 2: Taux sur valeur assurée
  private static calculateRateOnSI(guarantee: Guarantee, vehicle: Vehicle): number {
    if (!guarantee.rate) return 0;
    return (guarantee.rate / 100) * vehicle.values.venale;
  }

  // Méthode 3: Taux sur valeur neuve
  private static calculateRateOnNewValue(guarantee: Guarantee, vehicle: Vehicle): number {
    if (!guarantee.rate) return 0;
    return (guarantee.rate / 100) * vehicle.values.neuve;
  }

  // Méthode 4: Grille Responsabilité Civile
  private static calculateMTPLTariff(vehicle: Vehicle): number {
    if (!this.grids) return 0;

    const rcEntry = this.grids.tarifRC.find(
      entry =>
        entry.category === vehicle.categoryCode &&
        entry.energy === vehicle.energy &&
        vehicle.fiscalPower >= entry.powerMin &&
        vehicle.fiscalPower <= entry.powerMax
    );

    return rcEntry ? rcEntry.prime : 0;
  }

  // Méthode 5: Matrice TCM/TCL
  private static calculateTCMTCLMatrix(guarantee: Guarantee, vehicle: Vehicle, parameters: any): number {
    if (!this.grids || !guarantee.rate) return 0;

    const guaranteeType = guarantee.category === 'TIERCE_COMPLETE' ? 'Tierce Complete' : 'Tierce Collision';
    const franchise = parameters.tierceFranchise || 0;

    const tcmEntry = this.grids.tarifTCMTCL.find(
      entry =>
        entry.category === vehicle.categoryCode &&
        entry.guaranteeType === guaranteeType &&
        vehicle.values.neuve >= entry.valueNeufMin &&
        vehicle.values.neuve <= entry.valueNeufMax &&
        entry.franchise === franchise
    );

    return tcmEntry ? (tcmEntry.rate / 100) * vehicle.values.neuve : 0;
  }

  // Méthode 6: Formule IC/IPT
  private static calculateICIPTFormula(guarantee: Guarantee, vehicle: Vehicle, parameters: any): number {
    if (!this.grids) return 0;

    const type = guarantee.category === 'INDIVIDUELLE_CONDUCTEUR' ? 'IC' : 'IPT';
    const formula = parameters.icIptFormula || 1;

    // Pour IPT, on utilise le nombre de places
    const nbPlaces = type === 'IPT' ? vehicle.nbPlaces : 0;

    const icIptEntry = this.grids.tarifICIPT.find(
      entry =>
        entry.type === type &&
        entry.formula === formula &&
        (entry.nbPlaces === 0 || entry.nbPlaces === nbPlaces)
    );

    return icIptEntry ? icIptEntry.prime : 0;
  }

  // Méthode 7: Taux conditionnel
  private static calculateConditionalRate(guarantee: Guarantee, vehicle: Vehicle): number {
    if (!guarantee.parameters) return 0;

    const { condition, rateIfTrue, rateIfFalse } = guarantee.parameters;

    // Évaluer la condition (ex: "venale <= 25000000")
    const conditionMet = this.evaluateCondition(condition, vehicle.values.venale);
    const rate = conditionMet ? (rateIfTrue || 1.1) : (rateIfFalse || 2.1);

    return (rate / 100) * vehicle.values.venale;
  }

  // Évaluer une condition simple
  private static evaluateCondition(condition: string, value: number): boolean {
    try {
      // Parser une condition simple comme "venale <= 25000000"
      const match = condition.match(/(\w+)\s*(<=|>=|<|>|=)\s*(\d+)/);
      if (match) {
        const [, field, operator, numberStr] = match;
        const numValue = parseInt(numberStr);

        switch (operator) {
          case '<=': return value <= numValue;
          case '>=': return value >= numValue;
          case '<': return value < numValue;
          case '>': return value > numValue;
          case '=': return value === numValue;
          default: return false;
        }
      }
    } catch (error) {
      logger.error('Error evaluating condition:', error);
    }
    return false;
  }

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
      case 'TCM_TCL_MATRIX':
        parameters.push('tierceFranchise');
        break;
      case 'IC_IPT_FORMULA':
        parameters.push('icIptFormula');
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