"use client";

import React, { useState } from "react";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { Badge } from "../ui/Badge";
import { Check, Plus, Package, ArrowRight } from "lucide-react";

interface AddProductsStepProps {
  onNext: () => void;
  onSkip: () => void;
}

const sampleCatalog = [
  { name: "Aashirvaad Shudh Chakki Atta 10kg", category: "Staples", cost: 380, price: 435, stock: 25 },
  { name: "Tata Salt Vacuum Evaporated 1kg", category: "Staples", cost: 23, price: 28, stock: 50 },
  { name: "Amul Butter Pasteurized 500g", category: "Dairy", cost: 235, price: 275, stock: 30 },
  { name: "Fortune Sunlite Refined Oil 1L", category: "Edible Oils", cost: 125, price: 145, stock: 40 },
  { name: "Tata Tea Gold 500g", category: "Beverages", cost: 240, price: 300, stock: 20 },
];

export function AddProductsStep({ onNext, onSkip }: AddProductsStepProps) {
  const [selectedItems, setSelectedItems] = useState<string[]>(
    sampleCatalog.map((item) => item.name)
  );

  const toggleItem = (name: string) => {
    setSelectedItems((prev) =>
      prev.includes(name) ? prev.filter((i) => i !== name) : [...prev, name]
    );
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-sm font-bold text-zinc-900">
            Seed Your Initial Inventory Catalog
          </h4>
          <p className="text-xs text-zinc-500">
            Select items to load into your live inventory or configure them later.
          </p>
        </div>
        <Badge variant="healthy" dot>
          {selectedItems.length} items selected
        </Badge>
      </div>

      <div className="space-y-2">
        {sampleCatalog.map((item) => {
          const isChecked = selectedItems.includes(item.name);
          return (
            <div
              key={item.name}
              onClick={() => toggleItem(item.name)}
              className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all ${
                isChecked
                  ? "border-brand-300 bg-brand-50/40"
                  : "border-zinc-200 hover:border-zinc-300 bg-white"
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-4 h-4 rounded flex items-center justify-center border transition-colors ${
                    isChecked
                      ? "bg-brand-600 border-brand-600 text-white"
                      : "border-zinc-300 bg-white"
                  }`}
                >
                  {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                </div>
                <div>
                  <p className="text-xs font-semibold text-zinc-900">{item.name}</p>
                  <p className="text-[11px] text-zinc-400">
                    Category: {item.category} • Cost: ₹{item.cost} • Selling: ₹{item.price}
                  </p>
                </div>
              </div>

              <div className="text-right">
                <span className="text-xs font-mono font-bold text-zinc-700 bg-white px-2 py-0.5 rounded border border-zinc-200">
                  {item.stock} in stock
                </span>
              </div>
            </div>
          );
        })}
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
          Save Catalog & Configure Suppliers
          <ArrowRight className="w-4 h-4 ml-1.5" />
        </Button>
      </div>
    </div>
  );
}
