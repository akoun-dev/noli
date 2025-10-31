import React from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface Step {
  number: number;
  title: string;
  description: string;
}

interface StepperProps {
  currentStep: number;
  steps: Step[];
}

const Stepper = ({ currentStep, steps }: StepperProps) => {
  return (
    <div className="w-full pt-6 md:pt-8 pb-16 md:pb-20">
      <div className="flex items-center justify-center gap-3 md:gap-6 max-w-3xl mx-auto px-4">
        {steps.map((step, index) => (
          <React.Fragment key={`step-fragment-${step.number}`}>
            <div className="relative flex flex-col items-center">
              <div
                className={cn(
                  "w-12 h-12 rounded-full flex items-center justify-center font-semibold transition-all duration-300 z-10",
                  currentStep > step.number
                    ? "bg-accent text-accent-foreground shadow-lg"
                    : currentStep === step.number
                    ? "bg-primary text-primary-foreground shadow-lg"
                    : "bg-muted text-muted-foreground border-2 border-border"
                )}
              >
                {currentStep > step.number ? (
                  <Check className="w-6 h-6" />
                ) : (
                  <span>{step.number}</span>
                )}
              </div>

              {/* Step Info - Hidden on mobile */}
              <div className="hidden md:flex flex-col items-center mt-3 absolute top-14 w-40 pointer-events-none">
                <span
                  className={cn(
                    "text-sm font-semibold text-center",
                    currentStep >= step.number
                      ? "text-foreground"
                      : "text-muted-foreground"
                  )}
                >
                  {step.title}
                </span>
                <span className="text-xs text-muted-foreground text-center mt-1">
                  {step.description}
                </span>
              </div>
            </div>

            {/* Connector Line */}
            {index < steps.length - 1 && (
              <div
                className={cn(
                  "h-1 w-10 sm:w-16 md:w-24 rounded-full transition-all duration-300",
                  currentStep > step.number ? "bg-accent" : "bg-border"
                )}
              />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Mobile Step Info */}
      <div className="md:hidden text-center mt-6">
        <h3 className="text-lg font-semibold text-foreground">
          {steps[currentStep - 1]?.title}
        </h3>
        <p className="text-sm text-muted-foreground mt-1">
          {steps[currentStep - 1]?.description}
        </p>
      </div>
    </div>
  );
};

export default Stepper;
