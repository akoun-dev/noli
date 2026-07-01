import { create } from "zustand";
import type {
  AppView,
  AuthModal,
  PersonalInfo,
  VehicleInfo,
  CoverageNeeds,
  InsurerOffer,
  QuoteRecord,
  SortOption,
} from "@/types";

interface AppState {
  // Navigation
  currentView: AppView;
  setView: (view: AppView) => void;

  // Auth modal
  authModal: AuthModal;
  setAuthModal: (modal: AuthModal) => void;

  // User
  user: {
    id?: string;
    email?: string;
    name?: string;
    role?: string;
    isLoggedIn: boolean;
  };
  setUser: (user: AppState["user"]) => void;

  // Comparison flow
  comparisonStep: number;
  setComparisonStep: (step: number) => void;
  personalInfo: PersonalInfo;
  setPersonalInfo: (info: Partial<PersonalInfo>) => void;
  vehicleInfo: VehicleInfo;
  setVehicleInfo: (info: Partial<VehicleInfo>) => void;
  coverageNeeds: CoverageNeeds;
  setCoverageNeeds: (info: Partial<CoverageNeeds>) => void;
  comparisonResults: InsurerOffer[];
  setComparisonResults: (results: InsurerOffer[]) => void;
  isComparing: boolean;
  setIsComparing: (v: boolean) => void;

  // Results
  sortBy: SortOption;
  setSortBy: (sort: SortOption) => void;
  selectedInsurerFilter: string;
  setSelectedInsurerFilter: (id: string) => void;

  // Quotes
  userQuotes: QuoteRecord[];
  setUserQuotes: (quotes: QuoteRecord[]) => void;

  // Offer detail
  selectedOffer: InsurerOffer | null;
  setSelectedOffer: (offer: InsurerOffer | null) => void;

  // Reset comparison
  resetComparison: () => void;
}

const defaultPersonalInfo: PersonalInfo = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  dateOfBirth: "",
  licenseDate: "",
  hasClaims: false,
  claimsCount: 0,
  usage: "personnel",
  annualMileage: "10000",
};

const defaultVehicleInfo: VehicleInfo = {
  vehicleType: "",
  brand: "",
  model: "",
  year: "",
  fiscalPower: "",
  registration: "",
  newValue: "",
  currentValue: "",
  isImported: false,
};

const defaultCoverageNeeds: CoverageNeeds = {
  coverageType: "tiers",
  options: [],
  monthlyBudget: "",
  deductibleLevel: "medium",
};

export const useAppStore = create<AppState>((set) => ({
  // Navigation
  currentView: "landing",
  setView: (view) => set({ currentView: view }),

  // Auth modal
  authModal: "none",
  setAuthModal: (modal) => set({ authModal: modal }),

  // User
  user: { isLoggedIn: false },
  setUser: (user) => set({ user }),

  // Comparison
  comparisonStep: 1,
  setComparisonStep: (step) => set({ comparisonStep: step }),
  personalInfo: { ...defaultPersonalInfo },
  setPersonalInfo: (info) =>
    set((state) => ({
      personalInfo: { ...state.personalInfo, ...info },
    })),
  vehicleInfo: { ...defaultVehicleInfo },
  setVehicleInfo: (info) =>
    set((state) => ({
      vehicleInfo: { ...state.vehicleInfo, ...info },
    })),
  coverageNeeds: { ...defaultCoverageNeeds },
  setCoverageNeeds: (info) =>
    set((state) => ({
      coverageNeeds: { ...state.coverageNeeds, ...info },
    })),
  comparisonResults: [],
  setComparisonResults: (results) => set({ comparisonResults: results }),
  isComparing: false,
  setIsComparing: (v) => set({ isComparing: v }),

  // Results
  sortBy: "price_asc",
  setSortBy: (sort) => set({ sortBy: sort }),
  selectedInsurerFilter: "all",
  setSelectedInsurerFilter: (id) => set({ selectedInsurerFilter: id }),

  // Quotes
  userQuotes: [],
  setUserQuotes: (quotes) => set({ userQuotes: quotes }),

  // Offer detail
  selectedOffer: null,
  setSelectedOffer: (offer) => set({ selectedOffer: offer }),

  // Reset
  resetComparison: () =>
    set({
      comparisonStep: 1,
      personalInfo: { ...defaultPersonalInfo },
      vehicleInfo: { ...defaultVehicleInfo },
      coverageNeeds: { ...defaultCoverageNeeds },
      comparisonResults: [],
      isComparing: false,
      sortBy: "price_asc",
      selectedInsurerFilter: "all",
      selectedOffer: null,
    }),
}));