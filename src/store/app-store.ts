import { create } from "zustand";
import { persist } from "zustand/middleware";
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
  currentView: AppView;
  setView: (view: AppView) => void;
  authModal: AuthModal;
  setAuthModal: (modal: AuthModal) => void;
  user: {
    id?: string;
    email?: string;
    name?: string;
    role?: string;
    isLoggedIn: boolean;
  };
  setUser: (user: AppState["user"]) => void;
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
  sortBy: SortOption;
  setSortBy: (sort: SortOption) => void;
  selectedInsurerFilter: string;
  setSelectedInsurerFilter: (id: string) => void;
  userQuotes: QuoteRecord[];
  setUserQuotes: (quotes: QuoteRecord[]) => void;
  selectedOffer: InsurerOffer | null;
  setSelectedOffer: (offer: InsurerOffer | null) => void;
  offersToCompare: InsurerOffer[];
  setOffersToCompare: (offers: InsurerOffer[]) => void;
  comparisonModalOpen: boolean;
  setComparisonModalOpen: (v: boolean) => void;
  adminTab: string;
  setAdminTab: (tab: string) => void;
  userTab: string;
  setUserTab: (tab: string) => void;
  insurerTab: string;
  setInsurerTab: (tab: string) => void;
  resetComparison: () => void;
}

const defaultPersonalInfo: PersonalInfo = {
  lastName: "",
  firstName: "",
  email: "",
  phone: "",
  whatsappOptIn: true,
};

const defaultVehicleInfo: VehicleInfo = {
  fuelType: "essence",
  fiscalPower: "6",
  seats: "4",
  year: "",
  newValue: "",
  currentValue: "",
  usage: "personnel",
};

const defaultCoverageNeeds: CoverageNeeds = {
  guaranteeCategories: [],
  contractDuration: 12,
};

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      currentView: "landing",
      setView: (view) => set({ currentView: view }),
      authModal: "none",
      setAuthModal: (modal) => set({ authModal: modal }),
      user: { isLoggedIn: false },
      setUser: (user) => set({ user }),
      comparisonStep: 1,
      setComparisonStep: (step) => set({ comparisonStep: step }),
      personalInfo: { ...defaultPersonalInfo },
      setPersonalInfo: (info) =>
        set((state) => ({ personalInfo: { ...state.personalInfo, ...info } })),
      vehicleInfo: { ...defaultVehicleInfo },
      setVehicleInfo: (info) =>
        set((state) => ({ vehicleInfo: { ...state.vehicleInfo, ...info } })),
      coverageNeeds: { ...defaultCoverageNeeds },
      setCoverageNeeds: (info) =>
        set((state) => ({ coverageNeeds: { ...state.coverageNeeds, ...info } })),
      comparisonResults: [],
      setComparisonResults: (results) => set({ comparisonResults: results }),
      isComparing: false,
      setIsComparing: (v) => set({ isComparing: v }),
      sortBy: "price_asc",
      setSortBy: (sort) => set({ sortBy: sort }),
      selectedInsurerFilter: "all",
      setSelectedInsurerFilter: (id) => set({ selectedInsurerFilter: id }),
      userQuotes: [],
      setUserQuotes: (quotes) => set({ userQuotes: quotes }),
      selectedOffer: null,
      setSelectedOffer: (offer) => set({ selectedOffer: offer }),
      offersToCompare: [],
      setOffersToCompare: (offers) => set({ offersToCompare: offers }),
      comparisonModalOpen: false,
      setComparisonModalOpen: (v) => set({ comparisonModalOpen: v }),
      adminTab: "dashboard",
      setAdminTab: (tab) => set({ adminTab: tab }),
      userTab: "dashboard",
      setUserTab: (tab) => set({ userTab: tab }),
      insurerTab: "dashboard",
      setInsurerTab: (tab) => set({ insurerTab: tab }),
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
          offersToCompare: [],
          comparisonModalOpen: false,
        }),
    }),
    {
      name: "noli-store",
      partialize: (state) => ({
        // Persist auth
        user: state.user,
        currentView: state.currentView,
        // Persist tabs
        adminTab: state.adminTab,
        userTab: state.userTab,
        insurerTab: state.insurerTab,
        // Persist form data so it survives refresh
        personalInfo: state.personalInfo,
        vehicleInfo: state.vehicleInfo,
        coverageNeeds: state.coverageNeeds,
        comparisonStep: state.comparisonStep,
        // Transient data NOT persisted:
        // comparisonResults, isComparing, sortBy, selectedInsurerFilter,
        // userQuotes, selectedOffer, offersToCompare, comparisonModalOpen
      }),
    }
  )
);