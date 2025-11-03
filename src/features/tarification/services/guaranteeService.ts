import {
  Guarantee,
  GuaranteeCategory,
  InsurancePackage,
  TarifRC,
  TarifICIPT,
  TarifTCMTCL,
  TarifFixe,
  TarificationGrids,
  GuaranteeFormData,
  PackageFormData,
  TarificationStats,
  CalculationMethodType
} from '@/types/tarification';

// Grilles de tarification initiales basées sur le document
const initialTarifRC: TarifRC[] = [
  { id: 'rc-1', category: '401', energy: 'Essence', powerMin: 1, powerMax: 2, prime: 68675 },
  { id: 'rc-2', category: '401', energy: 'Diesel', powerMin: 2, powerMax: 4, prime: 87885 },
  { id: 'rc-3', category: '401', energy: 'Essence', powerMin: 3, powerMax: 6, prime: 87885 },
  { id: 'rc-4', category: '401', energy: 'Diesel', powerMin: 5, powerMax: 6, prime: 102345 },
  { id: 'rc-5', category: '401', energy: 'Essence', powerMin: 7, powerMax: 9, prime: 102345 },
  { id: 'rc-6', category: '402', energy: 'Essence', powerMin: 1, powerMax: 2, prime: 58900 },
  { id: 'rc-7', category: '402', energy: 'Diesel', powerMin: 2, powerMax: 4, prime: 78500 },
];

const initialTarifICIPT: TarifICIPT[] = [
  { id: 'ic-1', type: 'IC', formula: 1, nbPlaces: 0, prime: 5500 },
  { id: 'ic-2', type: 'IC', formula: 2, nbPlaces: 0, prime: 8400 },
  { id: 'ic-3', type: 'IC', formula: 3, nbPlaces: 0, prime: 15900 },
  { id: 'ipt-1', type: 'IPT', formula: 1, nbPlaces: 3, prime: 8400 },
  { id: 'ipt-2', type: 'IPT', formula: 1, nbPlaces: 4, prime: 10200 },
  { id: 'ipt-3', type: 'IPT', formula: 2, nbPlaces: 3, prime: 10000 },
  { id: 'ipt-4', type: 'IPT', formula: 2, nbPlaces: 4, prime: 12000 },
];

const initialTarifTCMTCL: TarifTCMTCL[] = [
  { id: 'tcm-1', category: '401', guaranteeType: 'Tierce Complete', valueNeufMin: 0, valueNeufMax: 12000000, franchise: 0, rate: 4.40 },
  { id: 'tcm-2', category: '401', guaranteeType: 'Tierce Complete', valueNeufMin: 0, valueNeufMax: 12000000, franchise: 250000, rate: 3.52 },
  { id: 'tcm-3', category: '401', guaranteeType: 'Tierce Complete', valueNeufMin: 12000001, valueNeufMax: 25000000, franchise: 250000, rate: 3.828 },
  { id: 'tcm-4', category: '401', guaranteeType: 'Tierce Collision', valueNeufMin: 0, valueNeufMax: 40000000, franchise: 50000, rate: 4.311 },
  { id: 'tcm-5', category: '402', guaranteeType: 'Tierce Complete', valueNeufMin: 0, valueNeufMax: 12000000, franchise: 250000, rate: 2.255 },
];

const initialTarifFixes: TarifFixe[] = [
  { id: 'fix-1', guaranteeName: 'Defense et Recours', prime: 7950, conditions: '*', packPriceReduced: 4240 },
  { id: 'fix-2', guaranteeName: 'Avance sur recours', prime: 15000, conditions: '*', packPriceReduced: 15000 },
  { id: 'fix-3', guaranteeName: 'Vol des accessoires', prime: 15000, conditions: '*', packPriceReduced: 15000 },
  { id: 'fix-4', guaranteeName: 'Assistance Bronze', prime: 48000, conditions: 'Uniquement pickups', packPriceReduced: undefined },
  { id: 'fix-5', guaranteeName: 'Assistance Silver', prime: 65000, conditions: 'Uniquement pickups', packPriceReduced: undefined },
  { id: 'fix-6', guaranteeName: 'Individuelle Conducteur Formule 1', prime: 5500, conditions: '*' },
  { id: 'fix-7', guaranteeName: 'Individuelle Conducteur Formule 2', prime: 8400, conditions: '*' },
  { id: 'fix-8', guaranteeName: 'Individuelle Conducteur Formule 3', prime: 15900, conditions: '*' },
];

// Garanties initiales basées sur le document
const initialGuarantees: Guarantee[] = [
  {
    id: 'guar-1',
    name: 'Responsabilité Civile',
    code: 'RC',
    category: 'RESPONSABILITE_CIVILE',
    description: 'Couverture des dommages causés à autrui',
    calculationMethod: 'MTPL_TARIFF',
    isOptional: false,
    isActive: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    createdBy: 'admin'
  },
  {
    id: 'guar-2',
    name: 'Défense et Recours',
    code: 'DR',
    category: 'DEFENSE_RECOURS',
    description: 'Prise en charge des frais de justice et honoraires d\'avocat',
    calculationMethod: 'FIXED_AMOUNT',
    isOptional: true,
    isActive: true,
    rate: 7950,
    parameters: { packPriceReduced: 4240 },
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    createdBy: 'admin'
  },
  {
    id: 'guar-3',
    name: 'Individuelle Conducteur',
    code: 'IC',
    category: 'INDIVIDUELLE_CONDUCTEUR',
    description: 'Protection du conducteur en cas d\'accident',
    calculationMethod: 'IC_IPT_FORMULA',
    isOptional: true,
    isActive: true,
    conditions: 'Choix de formule (1, 2 ou 3)',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    createdBy: 'admin'
  },
  {
    id: 'guar-4',
    name: 'Individuelle Passagers',
    code: 'IPT',
    category: 'INDIVIDUELLE_PASSAGERS',
    description: 'Protection des passagers en cas d\'accident',
    calculationMethod: 'IC_IPT_FORMULA',
    isOptional: true,
    isActive: true,
    conditions: 'Choix de formule (1 ou 2)',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    createdBy: 'admin'
  },
  {
    id: 'guar-5',
    name: 'Incendie',
    code: 'INC',
    category: 'INCENDIE',
    description: 'Dommages par incendie ou explosion',
    calculationMethod: 'RATE_ON_SI',
    isOptional: true,
    isActive: true,
    rate: 0.8,
    minValue: 50000,
    maxValue: 500000,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    createdBy: 'admin'
  },
  {
    id: 'guar-6',
    name: 'Vol',
    code: 'VOL',
    category: 'VOL',
    description: 'Vol ou tentative de vol du véhicule',
    calculationMethod: 'CONDITIONAL_RATE',
    isOptional: true,
    isActive: true,
    parameters: {
      condition: 'venale <= 25000000',
      rateIfTrue: 1.1,
      rateIfFalse: 2.1
    },
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    createdBy: 'admin'
  },
  {
    id: 'guar-7',
    name: 'Vol à mains armées',
    code: 'VMA',
    category: 'VOL_MAINS_ARMEES',
    description: 'Vol avec violence ou intimidation',
    calculationMethod: 'RATE_ON_SI',
    isOptional: true,
    isActive: true,
    rate: 0.3,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    createdBy: 'admin'
  },
  {
    id: 'guar-8',
    name: 'Bris de glaces',
    code: 'BDG',
    category: 'BRIS_GLACES',
    description: 'Réparation ou remplacement des glaces endommagées',
    calculationMethod: 'RATE_ON_NEW_VALUE',
    isOptional: true,
    isActive: true,
    rate: 0.35,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    createdBy: 'admin'
  },
  {
    id: 'guar-9',
    name: 'Tierce Complète',
    code: 'TDC',
    category: 'TIERCE_COMPLETE',
    description: 'Indemnisation en cas de sinistre avec tiers identifié ou non',
    calculationMethod: 'TCM_TCL_MATRIX',
    isOptional: true,
    isActive: true,
    franchiseOptions: [0, 250000, 500000],
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    createdBy: 'admin'
  },
  {
    id: 'guar-10',
    name: 'Tierce Collision',
    code: 'TCL',
    category: 'TIERCE_COLLISION',
    description: 'Indemnisation en cas de collision avec un tiers identifié',
    calculationMethod: 'TCM_TCL_MATRIX',
    isOptional: true,
    isActive: true,
    franchiseOptions: [50000],
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    createdBy: 'admin'
  },
  {
    id: 'guar-11',
    name: 'Assistance',
    code: 'ASSIST',
    category: 'ASSISTANCE',
    description: 'Assistance routière 24/7',
    calculationMethod: 'FIXED_AMOUNT',
    isOptional: true,
    isActive: true,
    rate: 48000,
    conditions: 'Uniquement pickups',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    createdBy: 'admin'
  },
  {
    id: 'guar-12',
    name: 'Avance sur recours',
    code: 'ASR',
    category: 'AVANCE_RECOURS',
    description: 'Avance de fonds en attente du recours contre le tiers responsable',
    calculationMethod: 'FIXED_AMOUNT',
    isOptional: true,
    isActive: true,
    rate: 15000,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    createdBy: 'admin'
  }
];

// Packages initiaux
const initialPackages: InsurancePackage[] = [
  {
    id: 'pack-1',
    name: 'Plan Essentiel',
    code: 'ESSENTIEL',
    description: 'Couverture de base avec garanties essentielles',
    guarantees: ['guar-1', 'guar-2'],
    basePrice: 80000,
    totalPrice: 85000,
    isActive: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    createdBy: 'admin'
  },
  {
    id: 'pack-2',
    name: 'Plan Évolution',
    code: 'EVOLUTION',
    description: 'Couverture complète équilibrée',
    guarantees: ['guar-1', 'guar-2', 'guar-3', 'guar-4', 'guar-5', 'guar-8'],
    basePrice: 150000,
    totalPrice: 180000,
    isPopular: true,
    isActive: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    createdBy: 'admin'
  },
  {
    id: 'pack-3',
    name: 'Plan Premium',
    code: 'PREMIUM',
    description: 'Couverture tous risques premium',
    guarantees: ['guar-1', 'guar-2', 'guar-3', 'guar-4', 'guar-5', 'guar-6', 'guar-7', 'guar-8', 'guar-9', 'guar-12'],
    basePrice: 250000,
    totalPrice: 320000,
    isActive: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    createdBy: 'admin'
  },
  {
    id: 'pack-4',
    name: 'Plan Pick-up Pro',
    code: 'PICKUP_PRO',
    description: 'Package spécialisé pour véhicules utilitaires',
    guarantees: ['guar-1', 'guar-2', 'guar-3', 'guar-5', 'guar-9', 'guar-11', 'guar-12'],
    basePrice: 200000,
    totalPrice: 240000,
    vehicleTypeRestrictions: ['Pickup', 'Utilitaire'],
    isActive: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    createdBy: 'admin'
  }
];

class GuaranteeService {
  private storageKey = 'noli_guarantees';
  private packagesStorageKey = 'noli_packages';
  private gridsStorageKey = 'noli_tarification_grids';

  constructor() {
    this.initializeData();
  }

  private initializeData() {
    const enableMocks = (import.meta as any).env?.VITE_MOCK_DATA === 'true'

    // En mode non-demo, on s'assure de ne pas injecter de données locales
    if (!enableMocks) {
      try {
        localStorage.removeItem(this.storageKey)
        localStorage.removeItem(this.packagesStorageKey)
        localStorage.removeItem(this.gridsStorageKey)
      } catch (_) {}
      return
    }

    if (!localStorage.getItem(this.storageKey)) {
      localStorage.setItem(this.storageKey, JSON.stringify(initialGuarantees));
    }
    if (!localStorage.getItem(this.packagesStorageKey)) {
      localStorage.setItem(this.packagesStorageKey, JSON.stringify(initialPackages));
    }
    if (!localStorage.getItem(this.gridsStorageKey)) {
      const grids: TarificationGrids = {
        tarifRC: initialTarifRC,
        tarifICIPT: initialTarifICIPT,
        tarifTCMTCL: initialTarifTCMTCL,
        tarifFixes: initialTarifFixes
      };
      localStorage.setItem(this.gridsStorageKey, JSON.stringify(grids));
    }
  }

  // Gestion des garanties
  async getGuarantees(): Promise<Guarantee[]> {
    const data = localStorage.getItem(this.storageKey);
    return data ? JSON.parse(data) : [];
  }

  async getGuarantee(id: string): Promise<Guarantee | null> {
    const guarantees = await this.getGuarantees();
    return guarantees.find(g => g.id === id) || null;
  }

  async getGuaranteesByCategory(category: GuaranteeCategory): Promise<Guarantee[]> {
    const guarantees = await this.getGuarantees();
    return guarantees.filter(g => g.category === category && g.isActive);
  }

  async createGuarantee(data: GuaranteeFormData): Promise<Guarantee> {
    const guarantees = await this.getGuarantees();
    const newGuarantee: Guarantee = {
      ...data,
      // Catégorie par défaut (plus utilisée dans le formulaire)
      category: 'RESPONSABILITE_CIVILE',
      id: Math.random().toString(36).substr(2, 9),
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: 'current-user'
    };

    guarantees.push(newGuarantee);
    localStorage.setItem(this.storageKey, JSON.stringify(guarantees));
    return newGuarantee;
  }

  async updateGuarantee(id: string, data: Partial<GuaranteeFormData>): Promise<Guarantee> {
    const guarantees = await this.getGuarantees();
    const index = guarantees.findIndex(g => g.id === id);
    if (index === -1) {
      throw new Error('Garantie non trouvée');
    }

    guarantees[index] = {
      ...guarantees[index],
      ...data,
      updatedAt: new Date()
    };

    localStorage.setItem(this.storageKey, JSON.stringify(guarantees));
    return guarantees[index];
  }

  async deleteGuarantee(id: string): Promise<void> {
    const guarantees = await this.getGuarantees();
    const index = guarantees.findIndex(g => g.id === id);
    if (index === -1) {
      throw new Error('Garantie non trouvée');
    }

    guarantees.splice(index, 1);
    localStorage.setItem(this.storageKey, JSON.stringify(guarantees));
  }

  async toggleGuarantee(id: string): Promise<Guarantee> {
    const guarantee = await this.getGuarantee(id);
    if (!guarantee) {
      throw new Error('Garantie non trouvée');
    }

    return this.updateGuarantee(id, { isActive: !guarantee.isActive });
  }

  // Gestion des packages
  async getPackages(): Promise<InsurancePackage[]> {
    const data = localStorage.getItem(this.packagesStorageKey);
    return data ? JSON.parse(data) : [];
  }

  async getPackage(id: string): Promise<InsurancePackage | null> {
    const packages = await this.getPackages();
    return packages.find(p => p.id === id) || null;
  }

  async createPackage(data: PackageFormData): Promise<InsurancePackage> {
    const packages = await this.getPackages();
    const newPackage: InsurancePackage = {
      ...data,
      id: Math.random().toString(36).substr(2, 9),
      totalPrice: data.basePrice,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: 'current-user'
    };

    packages.push(newPackage);
    localStorage.setItem(this.packagesStorageKey, JSON.stringify(packages));
    return newPackage;
  }

  async updatePackage(id: string, data: Partial<PackageFormData>): Promise<InsurancePackage> {
    const packages = await this.getPackages();
    const index = packages.findIndex(p => p.id === id);
    if (index === -1) {
      throw new Error('Package non trouvé');
    }

    packages[index] = {
      ...packages[index],
      ...data,
      updatedAt: new Date()
    };

    localStorage.setItem(this.packagesStorageKey, JSON.stringify(packages));
    return packages[index];
  }

  async deletePackage(id: string): Promise<void> {
    const packages = await this.getPackages();
    const index = packages.findIndex(p => p.id === id);
    if (index === -1) {
      throw new Error('Package non trouvé');
    }

    packages.splice(index, 1);
    localStorage.setItem(this.packagesStorageKey, JSON.stringify(packages));
  }

  async togglePackage(id: string): Promise<InsurancePackage> {
    const pkg = await this.getPackage(id);
    if (!pkg) {
      throw new Error('Package non trouvé');
    }

    return this.updatePackage(id, { isActive: !pkg.isActive });
  }

  // Gestion des grilles de tarification
  async getTarificationGrids(): Promise<TarificationGrids> {
    const data = localStorage.getItem(this.gridsStorageKey);
    return data ? JSON.parse(data) : {
      tarifRC: [],
      tarifICIPT: [],
      tarifTCMTCL: [],
      tarifFixes: []
    };
  }

  async updateTarifRC(data: TarifRC[]): Promise<void> {
    const grids = await this.getTarificationGrids();
    grids.tarifRC = data;
    localStorage.setItem(this.gridsStorageKey, JSON.stringify(grids));
  }

  async updateTarifICIPT(data: TarifICIPT[]): Promise<void> {
    const grids = await this.getTarificationGrids();
    grids.tarifICIPT = data;
    localStorage.setItem(this.gridsStorageKey, JSON.stringify(grids));
  }

  async updateTarifTCMTCL(data: TarifTCMTCL[]): Promise<void> {
    const grids = await this.getTarificationGrids();
    grids.tarifTCMTCL = data;
    localStorage.setItem(this.gridsStorageKey, JSON.stringify(grids));
  }

  async updateTarifFixes(data: TarifFixe[]): Promise<void> {
    const grids = await this.getTarificationGrids();
    grids.tarifFixes = data;
    localStorage.setItem(this.gridsStorageKey, JSON.stringify(grids));
  }

  // Statistiques
  async getTarificationStats(): Promise<TarificationStats> {
    const guarantees = await this.getGuarantees();
    const packages = await this.getPackages();

    const activeGuarantees = guarantees.filter(g => g.isActive).length;
    const activePackages = packages.filter(p => p.isActive).length;

    // Simuler les garanties les plus utilisées
    const mostUsedGuarantees = guarantees.slice(0, 5).map(g => ({
      guaranteeId: g.id,
      guaranteeName: g.name,
      usageCount: Math.floor(Math.random() * 100) + 10
    }));

    const averagePackagePrice = packages.length > 0
      ? packages.reduce((sum, p) => sum + p.totalPrice, 0) / packages.length
      : 0;

    const prices = packages.map(p => p.totalPrice);
    const priceRange = {
      min: prices.length > 0 ? Math.min(...prices) : 0,
      max: prices.length > 0 ? Math.max(...prices) : 0
    };

    return {
      totalGuarantees: guarantees.length,
      activeGuarantees,
      totalPackages: packages.length,
      activePackages,
      mostUsedGuarantees,
      averagePackagePrice,
      priceRange
    };
  }

  // Catégories de garanties
  getGuaranteeCategories(): { value: GuaranteeCategory; label: string }[] {
    return [
      { value: 'RESPONSABILITE_CIVILE', label: 'Responsabilité Civile' },
      { value: 'DEFENSE_RECOURS', label: 'Défense et Recours' },
      { value: 'INDIVIDUELLE_CONDUCTEUR', label: 'Individuelle Conducteur' },
      { value: 'INDIVIDUELLE_PASSAGERS', label: 'Individuelle Passagers' },
      { value: 'INCENDIE', label: 'Incendie' },
      { value: 'VOL', label: 'Vol' },
      { value: 'VOL_MAINS_ARMEES', label: 'Vol à mains armées' },
      { value: 'BRIS_GLACES', label: 'Bris de glaces' },
      { value: 'TIERCE_COMPLETE', label: 'Tierce Complète' },
      { value: 'TIERCE_COLLISION', label: 'Tierce Collision' },
      { value: 'ASSISTANCE', label: 'Assistance' },
      { value: 'AVANCE_RECOURS', label: 'Avance sur recours' },
      { value: 'ACCESSOIRES', label: 'Accessoires' }
    ];
  }

  // Méthodes de calcul
  getCalculationMethods(): { value: CalculationMethodType; label: string; description: string }[] {
    return [
      {
        value: 'FREE',
        label: 'Gratuit',
        description: 'Prime nulle (gratuite)'
      },
      {
        value: 'FIXED_AMOUNT',
        label: 'Montant Fixe',
        description: 'Prime fixe indépendante du véhicule'
      },
      {
        value: 'RATE_ON_SI',
        label: 'Taux sur Valeur Assurée',
        description: 'Pourcentage appliqué sur la valeur vénale'
      },
      {
        value: 'RATE_ON_NEW_VALUE',
        label: 'Taux sur Valeur Neuve',
        description: 'Pourcentage appliqué sur la valeur neuve'
      },
      {
        value: 'MTPL_TARIFF',
        label: 'Grille Responsabilité Civile',
        description: 'Basé sur la grille officielle RC'
      },
      {
        value: 'TCM_TCL_MATRIX',
        label: 'Matrice Tierce',
        description: 'Basé sur la grille TCM/TCL'
      },
      {
        value: 'IC_IPT_FORMULA',
        label: 'Formule IC/IPT',
        description: 'Basé sur la grille IC/IPT'
      },
      {
        value: 'CONDITIONAL_RATE',
        label: 'Taux Conditionnel',
        description: 'Taux variable selon conditions'
      }
    ];
  }
}

export const guaranteeService = new GuaranteeService();

// Fournit les garanties par défaut intégrées (sans utiliser le stockage local)
// Utile comme repli d'affichage en environnement de dev si la base est vide
export function getBuiltinDefaultGuarantees(): Guarantee[] {
  return initialGuarantees;
}
