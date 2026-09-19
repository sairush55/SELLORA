"use client";

import React, { useState } from "react";
import { Button } from "../ui/Button";
import { Badge } from "../ui/Badge";
import { Truck, Check, Plus, ArrowRight } from "lucide-react";
import { supplierService } from "@/services/supplierService";
import { useShop } from "@/hooks/useShop";

interface ConfigureSuppliersStepProps {
  onNext: () => void;
  onSkip: () => void;
}

export function ConfigureSuppliersStep({ onNext, onSkip }: ConfigureSuppliersStepProps) {
  const { shop } = useShop();
  const shopId = shop?.id || "shop-ravi-stores";
  const [suppliers] = useState(() => supplierService.getSuppliers(shopId));

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-sm font-bold text-zinc-900">
            Set Up Your Primary Vendors & Distributors
          </h4>
          <p className="text-xs text-zinc-500">
            SELLORA matches stock depletion rates to vendor lead times to trigger auto-reorders.
          </p>
        </div>
        <Badge variant="healthy" dot>
          {suppliers.length} active vendors
        </Badge>
      </div>

      <div className="space-y-2.5">
        {suppliers.map((s) => (
          <div
            key={s.id}
            className="flex items-center justify-between p-3.5 rounded-lg border border-zinc-200/80 bg-white hover:border-zinc-300 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-zinc-100 flex items-center justify-center text-zinc-700 font-mono text-xs font-bold">
                <Truck className="w-4 h-4 text-brand-600" />
              </div>
              <div>
                <p className="text-xs font-semibold text-zinc-900">{s.name}</p>
                <p className="text-[11px] text-zinc-400">
                  Phone: {s.phone} • {s.email}
                </p>
              </div>
            </div>

            <div className="text-right">
              <span className="text-[11px] font-mono text-zinc-600 bg-zinc-50 px-2 py-0.5 rounded border border-zinc-200">
                Lead: {s.leadTime} {s.leadTime === 1 ? "day" : "days"}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="pt-4 flex items-center justify-between">
        <button
          type="button"
          onClick={onSkip}
          className="text-xs font-semibold text-zinc-400 hover:text-zinc-600 transition-colors"
        >
          Skip for now
        </button>

        <Button onClick={onNext} variant="primary" size="md">
          Proceed to Ready Confirmation
          <ArrowRight className="w-4 h-4 ml-1.5" />
        </Button>
      </div>
    </div>
  );
}
