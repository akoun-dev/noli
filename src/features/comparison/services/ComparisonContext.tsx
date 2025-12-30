import React, { createContext, useContext, useState, ReactNode, useCallback, useMemo } from 'react';

export interface PersonalInfo {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  isWhatsapp?: boolean;
}

export interface VehicleInfo {
  fuel: string;
  fiscalPower: string;
  seats: string;
  circulationYear: string;
  newValue: string;
  currentValue: string;
  vehicleUsage: 'personnel' | 'professionnel' | 'taxi' | 'autre';
}

export interface InsuranceNeeds {
  coverageType: 'tiers' | 'vol_incendie' | 'tous_risques';
  effectiveDate: string;
  contractDuration: string;
  options: string[];
}

export interface CompareFormData {
  personalInfo: Partial<PersonalInfo>;
  vehicleInfo: Partial<VehicleInfo>;
  insuranceNeeds: Partial<InsuranceNeeds>;
  currentStep: number;
}

interface CompareContextType {
  formData: CompareFormData;
  updatePersonalInfo: (data: Partial<PersonalInfo>) => void;
  updateVehicleInfo: (data: Partial<VehicleInfo>) => void;
  updateInsuranceNeeds: (data: Partial<InsuranceNeeds>) => void;
  setCurrentStep: (step: number) => void;
  resetForm: () => void;
}

const CompareContext = createContext<CompareContextType | undefined>(undefined);

const initialFormData: CompareFormData = {
  personalInfo: {},
  vehicleInfo: {},
  insuranceNeeds: {},
  currentStep: 1,
};

export const CompareProvider = ({ children }: { children: ReactNode }) => {
  const [formData, setFormData] = useState<CompareFormData>(initialFormData);

  const updatePersonalInfo = useCallback((data: Partial<PersonalInfo>) => {
    setFormData(prev => ({
      ...prev,
      personalInfo: { ...prev.personalInfo, ...data }
    }));
  }, []);

  const updateVehicleInfo = useCallback((data: Partial<VehicleInfo>) => {
    setFormData(prev => ({
      ...prev,
      vehicleInfo: { ...prev.vehicleInfo, ...data }
    }));
  }, []);

  const updateInsuranceNeeds = useCallback((data: Partial<InsuranceNeeds>) => {
    setFormData(prev => ({
      ...prev,
      insuranceNeeds: { ...prev.insuranceNeeds, ...data }
    }));
  }, []);

  const setCurrentStep = useCallback((step: number) => {
    console.log('setCurrentStep called with:', step);
    setFormData(prev => {
      console.log('setCurrentStep updating from', prev.currentStep, 'to', step);
      return { ...prev, currentStep: step };
    });
  }, []);

  const resetForm = useCallback(() => {
    setFormData(initialFormData);
  }, []);

  const contextValue = useMemo(() => ({
    formData,
    updatePersonalInfo,
    updateVehicleInfo,
    updateInsuranceNeeds,
    setCurrentStep,
    resetForm,
  }), [formData, updatePersonalInfo, updateVehicleInfo, updateInsuranceNeeds, setCurrentStep, resetForm]);

  return (
    <CompareContext.Provider value={contextValue}>
      {children}
    </CompareContext.Provider>
  );
};

export const useCompare = () => {
  const context = useContext(CompareContext);
  if (!context) {
    throw new Error('useCompare must be used within CompareProvider');
  }
  return context;
};
