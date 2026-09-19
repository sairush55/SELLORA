"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useShop } from "@/hooks/useShop";
import { ShopSetupForm } from "./ShopSetupForm";
import { AddProductsStep } from "./AddProductsStep";
import { ConfigureSuppliersStep } from "./ConfigureSuppliersStep";
import { StartSellingStep } from "./StartSellingStep";
import { ShopSetupInput } from "@/types/shop";
import { Card, CardContent } from "../ui/Card";
import { Check, Store, Boxes, Truck, Rocket } from "lucide-react";

export function StepWizard() {
  const router = useRouter();
  const { shop, updateShop, completeOnboarding } = useShop();
  const [currentStep, setCurrentStep] = useState<number>(1);

  const steps = [
    { number: 1, title: "Create Shop", icon: Store },
    { number: 2, title: "Add Products", icon: Boxes },
    { number: 3, title: "Configure Suppliers", icon: Truck },
    { number: 4, title: "Start Selling", icon: Rocket },
  ];

  const handleShopSetupSubmit = (data: ShopSetupInput) => {
    updateShop({
      name: data.name,
      ownerName: data.ownerName,
      businessType: data.businessType,
      phone: data.phone,
      email: data.email,
      currency: data.currency || "INR",
      timezone: data.timezone || "Asia/Kolkata",
    });
    setCurrentStep(2);
  };

  const handleFinish = () => {
    completeOnboarding();
    router.push("/dashboard");
  };

  const handleSkipAll = () => {
    completeOnboarding();
    router.push("/dashboard");
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Top Stepper Indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {steps.map((s, idx) => {
            const isCompleted = currentStep > s.number;
            const isCurrent = currentStep === s.number;

            return (
              <React.Fragment key={s.number}>
                <div className="flex flex-col items-center">
                  <div
                    className={`flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold transition-all ${
                      isCompleted
                        ? "bg-brand-600 text-white"
                        : isCurrent
                        ? "bg-charcoal-900 text-white ring-4 ring-zinc-200"
                        : "bg-zinc-100 text-zinc-400 border border-zinc-200"
                    }`}
                  >
                    {isCompleted ? <Check className="w-4 h-4 stroke-[3]" /> : s.number}
                  </div>
                  <span
                    className={`mt-2 text-[11px] font-semibold tracking-tight ${
                      isCurrent
                        ? "text-charcoal-900 font-bold"
                        : isCompleted
                        ? "text-zinc-600"
                        : "text-zinc-400"
                    }`}
                  >
                    {s.title}
                  </span>
                </div>

                {idx < steps.length - 1 && (
                  <div
                    className={`h-[2px] flex-1 mx-3 mb-6 transition-colors ${
                      currentStep > s.number ? "bg-brand-500" : "bg-zinc-200"
                    }`}
                  />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Wizard Form Container */}
      <Card className="border-zinc-200/90 shadow-card">
        <CardContent className="p-6 sm:p-8">
          {currentStep === 1 && (
            <ShopSetupForm
              initialData={{
                name: shop.name,
                ownerName: shop.ownerName,
                businessType: shop.businessType,
                phone: shop.phone,
                email: shop.email,
                currency: shop.currency,
                timezone: shop.timezone,
              }}
              onSubmit={handleShopSetupSubmit}
              onSkip={handleSkipAll}
            />
          )}

          {currentStep === 2 && (
            <AddProductsStep
              onNext={() => setCurrentStep(3)}
              onSkip={() => setCurrentStep(3)}
            />
          )}

          {currentStep === 3 && (
            <ConfigureSuppliersStep
              onNext={() => setCurrentStep(4)}
              onSkip={() => setCurrentStep(4)}
            />
          )}

          {currentStep === 4 && <StartSellingStep onComplete={handleFinish} />}
        </CardContent>
      </Card>
    </div>
  );
}
