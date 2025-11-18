import { useState } from "react";
import { Shield } from "lucide-react";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { ComparisonBreadcrumb } from "@/components/common/BreadcrumbRenderer";
import { CompareProvider, useCompare } from "../services/ComparisonContext";
import Stepper from "../components/Stepper";
import Step1Personal from "../components/Step1Personal";
import Step2Vehicle from "../components/Step2Vehicle";
import Step3Needs from "../components/Step3Needs";

const steps = [
  { number: 1, title: "Profil de l'assuré", description: "Vos informations" },
  { number: 2, title: "Informations véhicule", description: "Caractéristiques" },
  { number: 3, title: "Options", description: "Couverture et options" },
];

const CompareForm = () => {
  const { formData, setCurrentStep } = useCompare();
  const [direction, setDirection] = useState<'next' | 'prev'>('next');
  const currentStep = formData.currentStep;

  const handleNext = () => {
    if (currentStep < 3) {
      setDirection('next');
      setCurrentStep(currentStep + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setDirection('prev');
      setCurrentStep(currentStep - 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-primary/5">
      {/* Header */}
      <div className="border-b border-border bg-background/80 backdrop-blur-md">
        <div className="container mx-auto px-4 py-4">
          <Link to="/" className="flex items-center gap-2 w-fit">
            <img
              src="/img/noli vertical sans fond.png"
              alt="NOLI Assurance"
              className="h-10 w-auto"
            />
            <div className="flex flex-col">
              <span className="font-bold text-xl">NOLI</span>
              <span className="text-xs text-muted-foreground">Assurance Auto</span>
            </div>
          </Link>
        </div>
      </div>

      {/* Breadcrumb */}
      <div className="container mx-auto px-4 py-4">
        <ComparisonBreadcrumb />
      </div>

      {/* Stepper */}
      <div className="container mx-auto px-4">
        <Stepper currentStep={currentStep} steps={steps} />
      </div>

      {/* Form Content */}
      <div className="container mx-auto px-4 pb-16">
        <Card className="max-w-3xl mx-auto p-6 md:p-8 shadow-xl">
          <div key={currentStep} className={direction === 'next' ? 'animate-step-next' : 'animate-step-prev'}>
            {currentStep === 1 && <Step1Personal onNext={handleNext} />}
            {currentStep === 2 && <Step2Vehicle onNext={handleNext} onBack={handleBack} />}      
            {currentStep === 3 && <Step3Needs onBack={handleBack} />}
          </div>
        </Card>
      </div>
    </div>
  );
};

const Compare = () => {
  return (
    <CompareProvider>
      <CompareForm />
    </CompareProvider>
  );
};

export default Compare;
