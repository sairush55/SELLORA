"use client";

import React, { useState, useEffect } from "react";
import { Product, Supplier, RestockInput, ManualAdjustmentInput } from "@/types/inventory";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { formatINR } from "@/lib/utils";
import {
  X,
  PackagePlus,
  Sliders,
  IndianRupee,
  Calendar,
  Truck,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";

interface RestockModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  suppliers: Supplier[];
  preselectedProduct?: Product | null;
  initialMode?: "RESTOCK" | "MANUAL_ADJUSTMENT";
  onRestock: (input: RestockInput) => { success: boolean; error?: string };
  onAdjust: (input: ManualAdjustmentInput) => { success: boolean; error?: string };
}

export function RestockModal({
  isOpen,
  onClose,
  products,
  suppliers,
  preselectedProduct,
  initialMode = "RESTOCK",
  onRestock,
  onAdjust,
}: RestockModalProps) {
  const [activeTab, setActiveTab] = useState<"RESTOCK" | "MANUAL_ADJUSTMENT">(initialMode);
  const [selectedProductId, setSelectedProductId] = useState<string>(
    preselectedProduct?.id || products[0]?.id || ""
  );

  // Restock Form Fields
  const [restockQty, setRestockQty] = useState<number>(0);
  const [restockSupplierId, setRestockSupplierId] = useState<string>("");
  const [restockDate, setRestockDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [purchaseCost, setPurchaseCost] = useState<number>(0);
  const [restockNotes, setRestockNotes] = useState<string>("");

  // Adjustment Form Fields
  const [newStock, setNewStock] = useState<number>(0);
  const [adjustReason, setAdjustReason] = useState<string>("Physical Inventory Audit");
  const [adjustDate, setAdjustDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [adjustNotes, setAdjustNotes] = useState<string>("");

  const [error, setError] = useState<string | null>(null);

  // Sync selected product
  const activeProduct = products.find((p) => p.id === selectedProductId) || products[0];

  useEffect(() => {
    if (preselectedProduct) {
      setSelectedProductId(preselectedProduct.id);
    } else if (products.length > 0 && !selectedProductId) {
      setSelectedProductId(products[0].id);
    }
  }, [preselectedProduct, products, selectedProductId]);

  useEffect(() => {
    if (activeProduct) {
      setRestockSupplierId(activeProduct.supplierId || suppliers[0]?.id || "");
      setPurchaseCost(activeProduct.costPrice || 0);
      setNewStock(activeProduct.currentStock);
      setRestockQty(activeProduct.minOrderQuantity || 10);
    }
    setError(null);
  }, [activeProduct, suppliers, activeTab]);

  if (!isOpen || !activeProduct) return null;

  // Calculation for RESTOCK: Current + Restocked = New
  const currentStock = activeProduct.currentStock;
  const newStockAfterRestock = currentStock + (Number(restockQty) || 0);

  // Calculation for ADJUSTMENT: Current -> New (delta)
  const adjustmentDelta = (Number(newStock) || 0) - currentStock;

  const handleSubmitRestock = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (restockQty <= 0) {
      setError("Restock quantity must be greater than 0");
      return;
    }

    const result = onRestock({
      productId: activeProduct.id,
      quantity: Number(restockQty),
      supplierId: restockSupplierId,
      date: restockDate,
      purchaseCost: Number(purchaseCost) || activeProduct.costPrice,
      notes: restockNotes,
    });

    if (result.success) {
      onClose();
    } else {
      setError(result.error || "Failed to process restock");
    }
  };

  const handleSubmitAdjustment = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (newStock < 0) {
      setError("Stock cannot be negative");
      return;
    }

    const result = onAdjust({
      productId: activeProduct.id,
      newStock: Number(newStock),
      reason: adjustReason,
      date: adjustDate,
      notes: adjustNotes,
    });

    if (result.success) {
      onClose();
    } else {
      setError(result.error || "Failed to process stock adjustment");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 overflow-y-auto">
      <Card className="max-w-xl w-full my-8 bg-white shadow-2xl border-zinc-300">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-zinc-100">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-charcoal-900 text-brand-400 flex items-center justify-center">
              <PackagePlus className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-charcoal-950">
                Inventory Stock Operations
              </h2>
              <p className="text-xs text-zinc-500">
                Receive wholesale goods or record physical audit corrections
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-zinc-700 rounded-md hover:bg-zinc-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex border-b border-zinc-200 bg-zinc-50/70 p-1 text-xs font-semibold">
          <button
            onClick={() => {
              setActiveTab("RESTOCK");
              setError(null);
            }}
            className={`flex-1 py-2 rounded-md flex items-center justify-center gap-2 transition-all ${
              activeTab === "RESTOCK"
                ? "bg-white text-zinc-900 shadow-2xs font-bold"
                : "text-zinc-500 hover:text-zinc-900"
            }`}
          >
            <PackagePlus className="w-3.5 h-3.5 text-brand-600" />
            Receive Stock (Restock)
          </button>
          <button
            onClick={() => {
              setActiveTab("MANUAL_ADJUSTMENT");
              setError(null);
            }}
            className={`flex-1 py-2 rounded-md flex items-center justify-center gap-2 transition-all ${
              activeTab === "MANUAL_ADJUSTMENT"
                ? "bg-white text-zinc-900 shadow-2xs font-bold"
                : "text-zinc-500 hover:text-zinc-900"
            }`}
          >
            <Sliders className="w-3.5 h-3.5 text-amber-600" />
            Manual Stock Adjustment
          </button>
        </div>

        {error && (
          <div className="mx-6 mt-4 p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 font-medium">
            {error}
          </div>
        )}

        {/* Form Body */}
        <div className="p-6">
          {/* Target Product Selection */}
          <div className="mb-5">
            <Select
              label="Target Product"
              value={selectedProductId}
              onChange={(e) => setSelectedProductId(e.target.value)}
            >
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.sku}) — Current Stock: {p.currentStock} {p.unit}
                </option>
              ))}
            </Select>
          </div>

          {/* TAB 1: RESTOCK */}
          {activeTab === "RESTOCK" && (
            <form onSubmit={handleSubmitRestock} className="space-y-4">
              {/* Restock Calculation Card (Formula: 40 + 60 = 100) */}
              <div className="p-4 rounded-xl bg-brand-50/50 border border-brand-200/80 space-y-2">
                <span className="text-[10px] uppercase tracking-wider font-bold text-brand-800">
                  Stock Equation Preview
                </span>
                <div className="flex flex-wrap items-center justify-between text-xs sm:text-sm font-mono gap-2">
                  <div>
                    <span className="text-zinc-500 block text-[10px]">Current Stock</span>
                    <span className="font-bold text-zinc-800">
                      {currentStock} {activeProduct.unit}
                    </span>
                  </div>
                  <span className="text-brand-600 font-bold text-base">+</span>
                  <div>
                    <span className="text-zinc-500 block text-[10px]">Received Qty</span>
                    <span className="font-bold text-brand-700">
                      {restockQty || 0} {activeProduct.unit}
                    </span>
                  </div>
                  <span className="text-brand-600 font-bold text-base">=</span>
                  <div className="bg-white px-3 py-1.5 rounded-lg border border-brand-200 shadow-2xs">
                    <span className="text-zinc-400 block text-[10px]">New Inventory</span>
                    <span className="font-bold text-emerald-700 text-base">
                      {newStockAfterRestock} {activeProduct.unit}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Quantity Received"
                  type="number"
                  min="1"
                  value={restockQty}
                  onChange={(e) => setRestockQty(parseInt(e.target.value) || 0)}
                  helperText={`Supplier MOQ: ${activeProduct.minOrderQuantity || 1}`}
                  required
                />

                <Select
                  label="Receiving Supplier"
                  value={restockSupplierId}
                  onChange={(e) => setRestockSupplierId(e.target.value)}
                >
                  <option value="">-- Direct / Unspecified --</option>
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </Select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Receiving Date"
                  type="date"
                  prefixIcon={<Calendar className="w-3.5 h-3.5" />}
                  value={restockDate}
                  onChange={(e) => setRestockDate(e.target.value)}
                  required
                />

                <Input
                  label="Purchase Cost per Unit (₹ INR)"
                  type="number"
                  step="0.01"
                  min="0"
                  prefixIcon={<IndianRupee className="w-3.5 h-3.5" />}
                  value={purchaseCost}
                  onChange={(e) => setPurchaseCost(parseFloat(e.target.value) || 0)}
                  helperText={`Default Cost: ${formatINR(activeProduct.costPrice)}`}
                />
              </div>

              <Input
                label="Invoice / GRN Notes (Optional)"
                placeholder="e.g. GRN-9410, Invoice #APX-412"
                value={restockNotes}
                onChange={(e) => setRestockNotes(e.target.value)}
              />

              <div className="pt-4 border-t border-zinc-100 flex items-center justify-end gap-3">
                <Button type="button" variant="outline" size="md" onClick={onClose}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="md">
                  Confirm Receiving ({newStockAfterRestock} {activeProduct.unit})
                </Button>
              </div>
            </form>
          )}

          {/* TAB 2: MANUAL ADJUSTMENT */}
          {activeTab === "MANUAL_ADJUSTMENT" && (
            <form onSubmit={handleSubmitAdjustment} className="space-y-4">
              {/* Adjustment Calculation Card */}
              <div className="p-4 rounded-xl bg-amber-50/50 border border-amber-200/80 space-y-2">
                <span className="text-[10px] uppercase tracking-wider font-bold text-amber-800">
                  Adjustment Variance
                </span>
                <div className="flex items-center justify-between text-xs sm:text-sm font-mono">
                  <div>
                    <span className="text-zinc-500 block text-[10px]">Current Recorded</span>
                    <span className="font-bold text-zinc-800">
                      {currentStock} {activeProduct.unit}
                    </span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-zinc-400" />
                  <div>
                    <span className="text-zinc-500 block text-[10px]">Actual Physical Count</span>
                    <span className="font-bold text-zinc-900">
                      {newStock} {activeProduct.unit}
                    </span>
                  </div>
                  <div className="bg-white px-3 py-1.5 rounded-lg border border-amber-200 shadow-2xs">
                    <span className="text-zinc-400 block text-[10px]">Discrepancy</span>
                    <span
                      className={`font-bold ${
                        adjustmentDelta > 0
                          ? "text-emerald-700"
                          : adjustmentDelta < 0
                          ? "text-red-700"
                          : "text-zinc-700"
                      }`}
                    >
                      {adjustmentDelta > 0 ? `+${adjustmentDelta}` : adjustmentDelta}{" "}
                      {activeProduct.unit}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="New Actual Stock Count"
                  type="number"
                  min="0"
                  value={newStock}
                  onChange={(e) => setNewStock(parseInt(e.target.value) || 0)}
                  helperText="Enter physical counted stock"
                  required
                />

                <Select
                  label="Adjustment Reason"
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                >
                  <option value="Physical Inventory Audit">Physical Inventory Audit</option>
                  <option value="Damaged / Broken in Store">Damaged / Broken in Store</option>
                  <option value="Expired / Past Sell-By Date">Expired / Past Sell-By Date</option>
                  <option value="Customer Return / Exchange">Customer Return / Exchange</option>
                  <option value="Theft / Unaccounted Shrinkage">Theft / Shrinkage</option>
                  <option value="Supplier Discrepancy Correction">Supplier Discrepancy</option>
                </Select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Adjustment Date"
                  type="date"
                  prefixIcon={<Calendar className="w-3.5 h-3.5" />}
                  value={adjustDate}
                  onChange={(e) => setAdjustDate(e.target.value)}
                  required
                />

                <Input
                  label="Audit Notes (Optional)"
                  placeholder="e.g. Month-end count verification"
                  value={adjustNotes}
                  onChange={(e) => setAdjustNotes(e.target.value)}
                />
              </div>

              <div className="pt-4 border-t border-zinc-100 flex items-center justify-end gap-3">
                <Button type="button" variant="outline" size="md" onClick={onClose}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="md">
                  Apply Stock Adjustment
                </Button>
              </div>
            </form>
          )}
        </div>
      </Card>
    </div>
  );
}
