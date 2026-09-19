"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useShop } from "@/hooks/useShop";
import { productService } from "@/services/productService";
import { dailySummaryService } from "@/services/dailySummaryService";
import { salesService } from "@/services/salesService";
import { Product } from "@/types/inventory";
import { DailySalesSummary, Sale } from "@/types/sales";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ReceiptModal } from "@/components/sales/ReceiptModal";
import { formatINR } from "@/lib/utils";
import {
  Calendar,
  Zap,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Edit2,
  Eye,
  ArrowRight,
  Boxes,
  Plus,
  Minus,
  Sparkles,
  History,
} from "lucide-react";
import Link from "next/link";

export default function DailySummaryPage() {
  const { shop } = useShop();
  const shopId = shop.id;

  const [products, setProducts] = useState<Product[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );

  // Form State: Map of productId -> quantitySold
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [notes, setNotes] = useState<string>("");

  // Duplicate Check & Mode
  const [existingSummary, setExistingSummary] = useState<DailySalesSummary | null>(null);
  const [isEditMode, setIsEditMode] = useState<boolean>(false);
  const [viewingSummary, setViewingSummary] = useState<DailySalesSummary | null>(null);
  const [linkedSale, setLinkedSale] = useState<Sale | null>(null);
  const [isReceiptOpen, setIsReceiptOpen] = useState<boolean>(false);

  // Status and feedback
  const [feedback, setFeedback] = useState<{ message: string; type: "success" | "error" | "warning" } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Past summaries ledger
  const [pastSummaries, setPastSummaries] = useState<DailySalesSummary[]>([]);

  const loadData = () => {
    const p = productService.getProducts(shopId);
    setProducts(p);
    const summaries = dailySummaryService.getSummaries(shopId);
    setPastSummaries(summaries);
  };

  useEffect(() => {
    loadData();
  }, [shopId]);

  // Check duplicate summary whenever date changes
  useEffect(() => {
    const summary = dailySummaryService.getSummaryByDate(shopId, selectedDate);
    setExistingSummary(summary);
    setIsEditMode(false);
    setFeedback(null);

    // If a summary already exists, pre-load previous quantities in case user edits
    if (summary) {
      const qMap: Record<string, number> = {};
      summary.items.forEach((item) => {
        qMap[item.productId] = item.quantitySold;
      });
      setQuantities(qMap);
      setNotes(summary.notes || "");
    } else {
      setQuantities({});
      setNotes("");
    }
  }, [selectedDate, shopId]);

  const handleQuantityChange = (productId: string, val: number) => {
    setFeedback(null);
    setQuantities((prev) => ({
      ...prev,
      [productId]: Math.max(0, val || 0),
    }));
  };

  const handleQuickAdd = (productId: string, addVal: number) => {
    setQuantities((prev) => ({
      ...prev,
      [productId]: Math.max(0, (prev[productId] || 0) + addVal),
    }));
  };

  // Computations
  const summaryCalculation = useMemo(() => {
    let totalItems = 0;
    let totalRev = 0;

    products.forEach((p) => {
      const qty = quantities[p.id] || 0;
      if (qty > 0) {
        totalItems += qty;
        totalRev += qty * p.sellingPrice;
      }
    });

    return { totalItems, totalRev };
  }, [products, quantities]);

  // Submit NEW Daily Summary
  const handleSubmitNewSummary = (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    const items = Object.entries(quantities)
      .filter(([_, qty]) => qty > 0)
      .map(([productId, quantitySold]) => ({
        productId,
        quantitySold,
      }));

    if (items.length === 0) {
      setFeedback({
        message: "Please enter sales quantity for at least one product.",
        type: "error",
      });
      return;
    }

    setIsSubmitting(true);
    const result = dailySummaryService.submitDailySummary(shopId, {
      date: selectedDate,
      items,
      notes,
    });
    setIsSubmitting(false);

    if (result.summary) {
      setFeedback({
        message: `Daily summary for ${selectedDate} submitted! Reduced inventory for ${result.summary.items.length} products.`,
        type: "success",
      });
      setExistingSummary(result.summary);
      loadData();
    } else if (result.isDuplicate) {
      setFeedback({
        message: "Sales summary already exists for this date.",
        type: "warning",
      });
      setExistingSummary(result.existingSummary || null);
    } else {
      setFeedback({
        message: result.error || "Failed to submit daily summary",
        type: "error",
      });
    }
  };

  // Submit EDIT of existing Daily Summary (Differential update)
  const handleUpdateSummary = (e: React.FormEvent) => {
    e.preventDefault();
    if (!existingSummary) return;

    setFeedback(null);
    const items = Object.entries(quantities).map(([productId, quantitySold]) => ({
      productId,
      quantitySold: quantitySold || 0,
    }));

    setIsSubmitting(true);
    const result = dailySummaryService.updateDailySummary(shopId, existingSummary.id, {
      date: selectedDate,
      items,
      notes,
    });
    setIsSubmitting(false);

    if (result.summary) {
      setFeedback({
        message: `Updated daily summary for ${selectedDate}. Inventory adjusted by difference!`,
        type: "success",
      });
      setExistingSummary(result.summary);
      setIsEditMode(false);
      loadData();
    } else {
      setFeedback({
        message: result.error || "Failed to update daily summary",
        type: "error",
      });
    }
  };

  const handleOpenReceipt = (summary: DailySalesSummary) => {
    if (summary.saleId) {
      const sale = salesService.getSaleById(shopId, summary.saleId);
      if (sale) {
        setLinkedSale(sale);
        setIsReceiptOpen(true);
        return;
      }
    }
    // Fallback if not linked directly
    setViewingSummary(summary);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-zinc-200/80">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-extrabold text-charcoal-950 tracking-tight">
              Busy Merchant Mode
            </h1>
            <Badge variant="healthy" dot>
              High-Velocity Reconciliation
            </Badge>
          </div>
          <p className="text-xs text-zinc-500 mt-0.5">
            Turn end-of-day sales counts into live inventory deductions and consolidated accounting
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link href="/sales/pos">
            <Button variant="outline" size="sm" className="text-xs gap-1.5">
              Switch to Counter POS
            </Button>
          </Link>
          <Link href="/sales/history">
            <Button variant="outline" size="sm" className="text-xs">
              View All Invoices
            </Button>
          </Link>
        </div>
      </div>

      {/* Purpose Callout Card */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-charcoal-950 to-charcoal-900 text-white shadow-card flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-brand-400">
            <Zap className="w-4 h-4" />
            TOO BUSY TO RECORD EVERY SALE?
          </div>
          <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
            Enter today&apos;s total sales in seconds.
          </h2>
          <p className="text-xs text-zinc-300 max-w-xl leading-relaxed">
            Record batch daily unit counts (e.g. Rice 42, Oil 25, Biscuits 67). SELLORA automatically
            reconciles inventory, creates invoice audit records, and prevents duplicate submissions.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="bg-charcoal-800/80 px-3.5 py-2 rounded-xl border border-zinc-700 text-right">
            <span className="text-[10px] text-zinc-400 font-mono block">SELECT SUMMARY DATE</span>
            <input
              type="date"
              value={selectedDate}
              max={new Date().toISOString().split("T")[0]}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent font-mono text-xs font-bold text-white focus:outline-none cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* DUPLICATE PROTECTION WARNING BANNER */}
      {existingSummary && !isEditMode && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <h3 className="text-xs font-bold text-amber-950">
                Sales summary already exists for this date.
              </h3>
              <p className="text-xs text-amber-800 mt-0.5">
                Summary for {selectedDate} has already been reconciled:{" "}
                <strong>{existingSummary.totalItemsSold} items sold</strong> totaling{" "}
                <strong>{formatINR(existingSummary.totalRevenue)}</strong> across{" "}
                {existingSummary.items.length} SKUs.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleOpenReceipt(existingSummary)}
              className="text-xs bg-white text-zinc-800 border-amber-300 hover:bg-amber-100"
            >
              <Eye className="w-3.5 h-3.5 mr-1" />
              View Summary
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsEditMode(true)}
              className="text-xs font-semibold"
            >
              <Edit2 className="w-3.5 h-3.5 mr-1" />
              Edit Summary
            </Button>
          </div>
        </div>
      )}

      {/* Feedback Notice */}
      {feedback && (
        <div
          className={`p-3 rounded-lg text-xs font-semibold flex items-center justify-between transition-all ${
            feedback.type === "success"
              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
              : feedback.type === "warning"
              ? "bg-amber-50 text-amber-800 border border-amber-200"
              : "bg-red-50 text-red-800 border border-red-200"
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-amber-600" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="text-zinc-400 hover:text-zinc-600 font-bold ml-2">
            ×
          </button>
        </div>
      )}

      {/* EDIT MODE BANNER */}
      {isEditMode && (
        <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Edit2 className="w-4 h-4 text-blue-600 shrink-0" />
            <span className="text-xs font-semibold">
              Editing Daily Summary for {selectedDate}. Inventory will only adjust by the difference (Δ).
            </span>
          </div>
          <button
            onClick={() => setIsEditMode(false)}
            className="text-xs font-semibold text-blue-700 hover:underline"
          >
            Cancel Edit
          </button>
        </div>
      )}

      {/* Main Entry Grid (Active if New OR Editing) */}
      {(!existingSummary || isEditMode) && (
        <form onSubmit={isEditMode ? handleUpdateSummary : handleSubmitNewSummary} className="space-y-4">
          <Card>
            <CardHeader className="pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <CardTitle>
                  {isEditMode ? `Edit Product Sales Counts (${selectedDate})` : `Enter Product Sales for ${selectedDate}`}
                </CardTitle>
                <CardDescription>
                  Enter quantity sold today. Stock will be adjusted accordingly.
                </CardDescription>
              </div>

              {/* Live calculations pill */}
              <div className="flex items-center gap-3 bg-zinc-50 px-3 py-1.5 rounded-lg border border-zinc-200 text-xs font-mono">
                <div>
                  <span className="text-zinc-400">Total Items:</span>{" "}
                  <span className="font-bold text-zinc-900">{summaryCalculation.totalItems}</span>
                </div>
                <span className="text-zinc-300">|</span>
                <div>
                  <span className="text-zinc-400">Gross Sales:</span>{" "}
                  <span className="font-bold text-brand-700">{formatINR(summaryCalculation.totalRev)}</span>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-zinc-50 border-b border-zinc-200/80 text-[11px] uppercase font-semibold text-zinc-500 font-mono">
                    <tr>
                      <th className="py-3 px-4">Product Name & SKU</th>
                      <th className="py-3 px-3 text-center">Available Stock</th>
                      <th className="py-3 px-3 text-right">Unit Price</th>
                      <th className="py-3 px-4 text-center w-52">Quantity Sold</th>
                      {isEditMode && <th className="py-3 px-3 text-center">Difference (Δ)</th>}
                      <th className="py-3 px-4 text-right">Row Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 font-normal">
                    {products.map((p) => {
                      const qty = quantities[p.id] || 0;
                      const rowSubtotal = qty * p.sellingPrice;

                      // If edit mode, compute difference vs original
                      let previousSold = 0;
                      if (isEditMode && existingSummary) {
                        const prevItem = existingSummary.items.find((i) => i.productId === p.id);
                        previousSold = prevItem ? prevItem.quantitySold : 0;
                      }
                      const delta = qty - previousSold;

                      return (
                        <tr key={p.id} className="hover:bg-zinc-50/70 transition-colors">
                          {/* Product */}
                          <td className="py-3 px-4">
                            <div className="font-semibold text-zinc-900">{p.name}</div>
                            <div className="text-[10px] font-mono text-zinc-400">
                              {p.sku} • {p.categoryName || "General"}
                            </div>
                          </td>

                          {/* Current Stock */}
                          <td className="py-3 px-3 text-center font-mono">
                            <span
                              className={`font-semibold ${
                                p.currentStock <= p.minStock ? "text-red-600 font-bold" : "text-zinc-700"
                              }`}
                            >
                              {p.currentStock} {p.unit}
                            </span>
                          </td>

                          {/* Unit Price */}
                          <td className="py-3 px-3 text-right font-mono text-zinc-700">
                            {formatINR(p.sellingPrice)}
                          </td>

                          {/* Quantity Sold Input + Quick Buttons */}
                          <td className="py-3 px-4 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <input
                                type="number"
                                min="0"
                                max={isEditMode ? p.currentStock + previousSold : p.currentStock}
                                value={qty || ""}
                                placeholder="0"
                                onChange={(e) => handleQuantityChange(p.id, parseInt(e.target.value) || 0)}
                                className="w-16 h-8 text-center font-mono text-xs font-bold rounded-lg border border-zinc-300 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                              />

                              {/* Quick increment helpers */}
                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => handleQuickAdd(p.id, 5)}
                                  className="h-7 px-1.5 text-[10px] font-mono font-semibold rounded bg-zinc-100 text-zinc-700 hover:bg-zinc-200"
                                >
                                  +5
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleQuickAdd(p.id, 10)}
                                  className="h-7 px-1.5 text-[10px] font-mono font-semibold rounded bg-zinc-100 text-zinc-700 hover:bg-zinc-200"
                                >
                                  +10
                                </button>
                              </div>
                            </div>
                          </td>

                          {/* Difference (Δ) for Edit Mode */}
                          {isEditMode && (
                            <td className="py-3 px-3 text-center font-mono font-bold">
                              {delta === 0 ? (
                                <span className="text-zinc-400">0</span>
                              ) : delta > 0 ? (
                                <span className="text-red-600">+{delta} (Deduct)</span>
                              ) : (
                                <span className="text-emerald-600">{delta} (Restore)</span>
                              )}
                            </td>
                          )}

                          {/* Row Subtotal */}
                          <td className="py-3 px-4 text-right font-mono font-bold text-zinc-900">
                            {formatINR(rowSubtotal)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Submission Bar */}
          <div className="p-4 rounded-xl bg-white border border-zinc-200/90 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-xs text-zinc-500">
              {isEditMode ? (
                <span>
                  Updating summary for <strong>{selectedDate}</strong>. Only delta counts will be deducted or restored.
                </span>
              ) : (
                <span>
                  Confirming this summary will immediately reduce inventory for <strong>{selectedDate}</strong>.
                </span>
              )}
            </div>

            <div className="flex items-center gap-3">
              {isEditMode && (
                <Button type="button" variant="outline" size="md" onClick={() => setIsEditMode(false)}>
                  Cancel Edit
                </Button>
              )}

              <Button
                type="submit"
                variant="accent"
                size="md"
                disabled={summaryCalculation.totalItems === 0 || isSubmitting}
                isLoading={isSubmitting}
                className="font-bold shadow-sm px-6"
              >
                {isEditMode ? "Save Summary Changes" : "Submit Daily Summary"}
              </Button>
            </div>
          </div>
        </form>
      )}

      {/* Past Daily Summaries Audit Log */}
      <Card>
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <div>
            <CardTitle>Previous Daily Summaries</CardTitle>
            <CardDescription>Consolidated ledger records submitted via Busy Merchant Mode</CardDescription>
          </div>
          <span className="text-xs font-mono text-zinc-400">{pastSummaries.length} summaries</span>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-50 border-b border-zinc-200/80 text-[11px] uppercase font-semibold text-zinc-500 font-mono">
                <tr>
                  <th className="py-2.5 px-4">Date</th>
                  <th className="py-2.5 px-4">SKUs Reported</th>
                  <th className="py-2.5 px-3 text-center">Total Units Sold</th>
                  <th className="py-2.5 px-4 text-right">Total Revenue</th>
                  <th className="py-2.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 font-normal">
                {pastSummaries.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-zinc-400 text-xs">
                      No past daily summaries submitted yet.
                    </td>
                  </tr>
                ) : (
                  pastSummaries.map((s) => (
                    <tr key={s.id} className="hover:bg-zinc-50/70 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-zinc-900">
                        {s.summaryDate}
                      </td>

                      <td className="py-3 px-4 text-zinc-600">
                        {s.items.length} product SKUs
                      </td>

                      <td className="py-3 px-3 text-center font-mono font-bold text-zinc-800">
                        {s.totalItemsSold} units
                      </td>

                      <td className="py-3 px-4 text-right font-mono font-extrabold text-brand-700">
                        {formatINR(s.totalRevenue)}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleOpenReceipt(s)}
                            className="text-[11px] h-7 px-2"
                          >
                            <Eye className="w-3 h-3 mr-1" />
                            View
                          </Button>

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedDate(s.summaryDate);
                              setIsEditMode(true);
                            }}
                            className="text-[11px] h-7 px-2"
                          >
                            <Edit2 className="w-3 h-3 mr-1" />
                            Edit
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Receipt Modal for viewing summary invoice */}
      <ReceiptModal
        isOpen={isReceiptOpen}
        onClose={() => {
          setIsReceiptOpen(false);
          setLinkedSale(null);
        }}
        sale={linkedSale}
      />
    </div>
  );
}
