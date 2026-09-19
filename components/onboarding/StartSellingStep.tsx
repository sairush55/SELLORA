"use client";

import React from "react";
import { Button } from "../ui/Button";
import { useShop } from "@/hooks/useShop";
import { CheckCircle2, Store, Zap, ShieldCheck, ArrowRight } from "lucide-react";

interface StartSellingStepProps {
  onComplete: () => void;
}

export function StartSellingStep({ onComplete }: StartSellingStepProps) {
  const { shop } = useShop();

  return (
    <div className="space-y-6 text-center py-4">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-50 border border-brand-200 text-brand-600 shadow-sm">
        <CheckCircle2 className="w-8 h-8 stroke-[2.2]" />
      </div>

      <div>
        <h3 className="text-xl font-bold text-charcoal-950">
          Your Store is Configured & Ready
        </h3>
        <p className="mt-1 text-xs text-zinc-500 max-w-md mx-auto">
          SELLORA has initialized your point of sale terminal, real-time inventory engine, and stock radar.
        </p>
      </div>

      <div className="max-w-md mx-auto rounded-xl border border-zinc-200/90 bg-zinc-50/50 p-4 text-left space-y-2.5">
        <div className="flex items-center justify-between text-xs">
          <span className="text-zinc-500">Store Name:</span>
          <span className="font-semibold text-zinc-900">{shop.name}</span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-zinc-500">Proprietor:</span>
          <span className="font-semibold text-zinc-900">{shop.ownerName}</span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-zinc-500">Terminal Currency:</span>
          <span className="font-mono font-semibold text-brand-700">₹ INR</span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-zinc-500">Timezone:</span>
          <span className="font-mono text-zinc-700">{shop.timezone}</span>
        </div>
      </div>

      <div className="pt-2">
        <Button onClick={onComplete} size="lg" className="w-full max-w-md font-semibold">
          Launch SELLORA Dashboard
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}
