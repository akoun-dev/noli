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
  IPTPlacesTariff
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

      case 'MTPL_TARIFF': {
        const { amount, details } = this.calculateMTPLTariffAmount(vehicle, guarantee);
        calculatedPrice = amount;
        pricingMethod = 'Responsabilité Civile (grille tarification)';
        calculationDetails = details;
        break;
      }

      case 'IC_IPT_FORMULA': {
        const { amount, details } = this.calculateICIPTFormulaAmount(guarantee, parameters);
        calculatedPrice = amount;
        pricingMethod = 'Individuelle Conducteur / Passagers (formules)';
        calculationDetails = details;
        break;
      }

      case 'IPT_PLACES_FORMULA': {
        const { amount, details } = this.calculateIPTPlacesFormulaAmount(vehicle, guarantee, parameters);
        calculatedPrice = amount;
        pricingMethod = 'Individuelle Personnes Transportées (formules par places)';
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

  private static calculateMTPLTariffAmount(vehicle: Vehicle, guarantee?: Guarantee): {
    amount: number;
    details: Record<string, any>;
  } {
    const fiscalPower = vehicle?.fiscalPower ?? 0;
    const energy = vehicle?.energy ?? '';
    const category = vehicle?.categoryCode ?? '401';

    if (!fiscalPower || fiscalPower <= 0 || !energy) {
      return {
        amount: 0,
        details: {
          missingData: true,
          fiscalPower,
          energy,
          category,
        },
      };
    }

    // Vérifier d'abord s'il y a des tarifs personnalisés dans les parameters de la garantie
    const customTarifs = guarantee?.parameters?.mtplTariffConfig;
    if (customTarifs) {
      // Tarifs personnalisés disponibles
      const defaultTarifs = {
        essence_1_2: 68675,
        essence_3_6: 87885,
        essence_7_9: 102345,
        essence_10_11: 124693,
        essence_12_plus: 137058,
        diesel_1: 68675,
        diesel_2_4: 87885,
        diesel_5_6: 102345,
        diesel_7_8: 124693,
        diesel_9_plus: 137058,
      };

      let tarifKey = '';
      let tarifRange = '';

      // Déterminer la clé du tarif applicable
      const energyLower = energy.toLowerCase();
      if (energyLower.includes('essence')) {
        if (fiscalPower >= 1 && fiscalPower <= 2) {
          tarifKey = 'essence_1_2';
          tarifRange = '1-2 CV';
        } else if (fiscalPower >= 3 && fiscalPower <= 6) {
          tarifKey = 'essence_3_6';
          tarifRange = '3-6 CV';
        } else if (fiscalPower >= 7 && fiscalPower <= 9) {
          tarifKey = 'essence_7_9';
          tarifRange = '7-9 CV';
        } else if (fiscalPower >= 10 && fiscalPower <= 11) {
          tarifKey = 'essence_10_11';
          tarifRange = '10-11 CV';
        } else if (fiscalPower >= 12) {
          tarifKey = 'essence_12_plus';
          tarifRange = '12+ CV';
        }
      } else if (energyLower.includes('diesel')) {
        if (fiscalPower === 1) {
          tarifKey = 'diesel_1';
          tarifRange = '1 CV';
        } else if (fiscalPower >= 2 && fiscalPower <= 4) {
          tarifKey = 'diesel_2_4';
          tarifRange = '2-4 CV';
        } else if (fiscalPower >= 5 && fiscalPower <= 6) {
          tarifKey = 'diesel_5_6';
          tarifRange = '5-6 CV';
        } else if (fiscalPower >= 7 && fiscalPower <= 8) {
          tarifKey = 'diesel_7_8';
          tarifRange = '7-8 CV';
        } else if (fiscalPower >= 9) {
          tarifKey = 'diesel_9_plus';
          tarifRange = '9+ CV';
        }
      }

      if (tarifKey && customTarifs[tarifKey]) {
        return {
          amount: customTarifs[tarifKey],
          details: {
            fiscalPower,
            energy,
            category,
            tarifRange,
            isCustomTarif: true,
            prime: customTarifs[tarifKey],
          },
        };
      }
    }

    // Si pas de tarif personnalisé ou non trouvé, utiliser les grilles par défaut
    const grids = this.grids;
    if (!grids || !grids.tarifRC || grids.tarifRC.length === 0) {
      return {
        amount: 0,
        details: {
          missingGrille: true,
          fiscalPower,
          energy,
          category,
        },
      };
    }

    // Rechercher la tarification applicable
    const applicableTarif = grids.tarifRC.find(tarif =>
      tarif.category === category &&
      tarif.energy.toLowerCase() === energy.toLowerCase() &&
      fiscalPower >= tarif.powerMin &&
      fiscalPower <= tarif.powerMax
    );

    if (!applicableTarif) {
      return {
        amount: 0,
        details: {
          noTarifFound: true,
          fiscalPower,
          energy,
          category,
          availableTarifs: grids.tarifRC.length,
        },
      };
    }

    return {
      amount: applicableTarif.prime,
      details: {
        fiscalPower,
        energy,
        category,
        powerMin: applicableTarif.powerMin,
        powerMax: applicableTarif.powerMax,
        prime: applicableTarif.prime,
        tarifId: applicableTarif.id,
        isDefaultTarif: true,
      },
    };
  }

  private static calculateICIPTFormulaAmount(guarantee?: Guarantee, parameters?: any): {
    amount: number;
    details: Record<string, any>;
  } {
    // Formules par défaut basées sur les spécifications
    const defaultFormulas: ICFormulaConfig[] = [
      {
        formula: 1,
        capitalDeces: 1000000,
        capitalInvalidite: 2000000,
        fraisMedicaux: 100000,
        prime: 5500,
        label: 'Formule 1'
      },
      {
        formula: 2,
        capitalDeces: 3000000,
        capitalInvalidite: 6000000,
        fraisMedicaux: 400000,
        prime: 8400,
        label: 'Formule 2'
      },
      {
        formula: 3,
        capitalDeces: 5000000,
        capitalInvalidite: 10000000,
        fraisMedicaux: 500000,
        prime: 15900,
        label: 'Formule 3'
      }
    ];

    // Obtenir la configuration depuis les parameters ou utiliser les valeurs par défaut
    const icIptConfig: ICIPTConfig = guarantee?.parameters?.icIptConfig ?? {
      defaultFormula: 1,
      formulas: defaultFormulas
    };

    // Utiliser les formules personnalisées si elles existent, sinon utiliser les défauts
    const formulas = icIptConfig.formulas && icIptConfig.formulas.length > 0
      ? icIptConfig.formulas
      : defaultFormulas;

    // Obtenir la formule sélectionnée (depuis les parameters ou la formule par défaut)
    const selectedFormula = parameters?.formula_name
      ? parseInt(parameters.formula_name.replace('formula_', ''))
      : icIptConfig.defaultFormula ?? 1;

    // Trouver la formule correspondante
    const formula = formulas.find(f => f.formula === selectedFormula) || formulas[0];

    if (!formula) {
      return {
        amount: 0,
        details: {
          error: 'No formula found',
          selectedFormula,
          availableFormulas: formulas.length
        }
      };
    }

    return {
      amount: formula.prime,
      details: {
        selectedFormula: formula.formula,
        formulaLabel: formula.label,
        capitalDeces: formula.capitalDeces,
        capitalInvalidite: formula.capitalInvalidite,
        fraisMedicaux: formula.fraisMedicaux,
        prime: formula.prime,
        isCustomConfig: !!guarantee?.parameters?.icIptConfig?.formulas
      }
    };
  }

  private static calculateIPTPlacesFormulaAmount(vehicle: Vehicle, guarantee?: Guarantee, parameters?: any): {
    amount: number;
    details: Record<string, any>;
  } {
    // Formules par défaut basées sur les spécifications
    const defaultFormulas: IPTFormulaConfig[] = [
      {
        formula: 1,
        capitalDeces: 1000000,
        capitalInvalidite: 2000000,
        fraisMedicaux: 100000,
        prime: 0, // Sera déterminé par le nombre de places
        label: 'Formule 1',
        placesTariffs: [
          { places: 3, prime: 8400, label: '3 places' },
          { places: 4, prime: 10200, label: '4 places' },
          { places: 5, prime: 16000, label: '5 places' },
          { places: 6, prime: 17800, label: '6 places' },
          { places: 7, prime: 19600, label: '7 places' },
          { places: 8, prime: 25400, label: '8 places' }
        ]
      },
      {
        formula: 2,
        capitalDeces: 3000000,
        capitalInvalidite: 6000000,
        fraisMedicaux: 400000,
        prime: 0, // Sera déterminé par le nombre de places
        label: 'Formule 2',
        placesTariffs: [
          { places: 3, prime: 10000, label: '3 places' },
          { places: 4, prime: 11000, label: '4 places' },
          { places: 5, prime: 17000, label: '5 places' },
          { places: 6, prime: 18000, label: '6 places' },
          { places: 7, prime: 27000, label: '7 places' },
          { places: 8, prime: 32000, label: '8 places' }
        ]
      },
      {
        formula: 3,
        capitalDeces: 5000000,
        capitalInvalidite: 10000000,
        fraisMedicaux: 500000,
        prime: 0, // Sera déterminé par le nombre de places
        label: 'Formule 3',
        placesTariffs: [
          { places: 3, prime: 18000, label: '3 places' },
          { places: 4, prime: 16000, label: '4 places' },
          { places: 5, prime: 30800, label: '5 places' },
          { places: 6, prime: 32000, label: '6 places' },
          { places: 7, prime: 33000, label: '7 places' },
          { places: 8, prime: 35000, label: '8 places' }
        ]
      }
    ];

    // Obtenir la configuration depuis les parameters ou utiliser les valeurs par défaut
    const iptConfig: IPTConfig = guarantee?.parameters?.iptConfig ?? {
      defaultFormula: 1,
      formulas: defaultFormulas
    };

    // Utiliser les formules personnalisées si elles existent, sinon utiliser les défauts
    const formulas = iptConfig.formulas && iptConfig.formulas.length > 0
      ? iptConfig.formulas
      : defaultFormulas;

    const normalizeFormulaNumber = (value: any, fallback: number) => {
      if (typeof value === 'number' && Number.isFinite(value)) {
        return value;
      }
      if (typeof value === 'string') {
        const match = value.match(/\d+/);
        if (match) {
          const parsed = parseInt(match[0], 10);
          if (Number.isFinite(parsed)) {
            return parsed;
          }
        }
      }
      return fallback;
    };

    const parseTariffNumber = (value: any) => {
      if (typeof value === 'number' && Number.isFinite(value)) {
        return value;
      }
      if (typeof value === 'string') {
        const cleaned = value.replace(/[^\d.-]/g, '');
        const parsed = parseFloat(cleaned);
        return Number.isFinite(parsed) ? parsed : 0;
      }
      return 0;
    };

    const normalizePlacesTariffs = (tariffs: any[]) =>
      tariffs
        .map((tariff) => ({
          ...tariff,
          places: parseTariffNumber(tariff?.places),
          prime: parseTariffNumber(tariff?.prime),
        }))
        .filter((tariff) => tariff.places > 0 && tariff.prime >= 0)
        .sort((a, b) => a.places - b.places);

    // Obtenir le nombre de places du véhicule
    const vehiclePlaces = parseTariffNumber(vehicle?.seats ?? parameters?.seats ?? vehicle?.passengerSeats ?? 5) || 5;

    // Obtenir la formule sélectionnée (depuis les parameters ou la formule par défaut)
    const selectedFormula = parameters?.formula_name
      ? normalizeFormulaNumber(parameters.formula_name, iptConfig.defaultFormula ?? 1)
      : iptConfig.defaultFormula ?? 1;

    // Trouver la formule correspondante
    const normalizedFormulas = formulas.map((formula) => ({
      ...formula,
      formula: normalizeFormulaNumber((formula as any).formula, selectedFormula),
      placesTariffs: Array.isArray((formula as any).placesTariffs) ? (formula as any).placesTariffs : [],
    }));
    const formula = normalizedFormulas.find(f => f.formula === selectedFormula) || normalizedFormulas[0];

    if (!formula) {
      return {
        amount: 0,
        details: {
          error: 'No formula found',
          selectedFormula,
          availableFormulas: formulas.length,
          vehiclePlaces
        }
      };
    }

    // Utiliser les tarifs personnalisés ou les défauts
    const defaultTariffs = defaultFormulas.find(f => f.formula === selectedFormula)?.placesTariffs ?? [];
    const rawPlacesTariffs = (formula as IPTFormulaConfig).placesTariffs?.length
      ? (formula as IPTFormulaConfig).placesTariffs
      : defaultTariffs;
    const placesTariffs = normalizePlacesTariffs(rawPlacesTariffs);

    // Trouver le tarif correspondant au nombre de places
    const applicableTariff = placesTariffs.find(tariff => tariff.places >= vehiclePlaces)
      || placesTariffs[placesTariffs.length - 1]; // Utiliser le tarif le plus élevé si aucune correspondance exacte

    if (!applicableTariff) {
      return {
        amount: 0,
        details: {
          error: 'No tariff found for vehicle places',
          selectedFormula,
          vehiclePlaces,
          availableTariffs: placesTariffs.length
        }
      };
    }

    return {
      amount: applicableTariff.prime,
      details: {
        selectedFormula: formula.formula,
        formulaLabel: formula.label,
        vehiclePlaces,
        appliedTariffPlaces: applicableTariff.places,
        capitalDeces: formula.capitalDeces,
        capitalInvalidite: formula.capitalInvalidite,
        fraisMedicaux: formula.fraisMedicaux,
        prime: applicableTariff.prime,
        isCustomConfig: !!guarantee?.parameters?.iptConfig?.formulas,
        availableTariffs: placesTariffs.length
      }
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
