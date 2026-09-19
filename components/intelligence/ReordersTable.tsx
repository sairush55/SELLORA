"use client";

import React, { useState } from "react";
import { ReorderRecommendation, OrderPriority } from "@/types/stockIntelligence";
import { Product, Supplier, RestockInput } from "@/types/inventory";
import { RestockModal } from "@/components/inventory/RestockModal";
import { inventoryMovementService } from "@/services/inventoryMovementService";
import { Button } from "@/components/ui/Button";
import { formatINR } from "@/lib/utils";
import {
  RotateCw,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  HelpCircle,
  TrendingUp,
  TrendingDown,
  Minus,
  CheckCircle2,
  PackagePlus,
  Truck,
  Layers,
  Search,
  Check,
} from "lucide-react";

interface ReordersTableProps {
  recommendations: ReorderRecommendation[];
  products: Product[];
  suppliers: Supplier[];
  shopId: string;
  onDataRefresh?: () => void;
}

export function ReordersTable({
  recommendations,
  products,
  suppliers,
  shopId,
  onDataRefresh,
}: ReordersTableProps) {
  const [search, setSearch] = useState("");
  const [priorityFilter, setPriorityFilter] = useState<string>("ALL");
  const [expandedWhyId, setExpandedWhyId] = useState<string | null>(null);

  // Restock Modal state
  const [isRestockOpen, setIsRestockOpen] = useState(false);
  const [selectedProductForRestock, setSelectedProductForRestock] = useState<Product | null>(null);
  const [orderedProductIds, setOrderedProductIds] = useState<string[]>([]);

  // Filter recommendations
  const filtered = recommendations.filter((item) => {
    if (priorityFilter !== "ALL" && item.priority !== priorityFilter) {
      return false;
    }

    if (search.trim()) {
      const q = search.toLowerCase().trim();
      return (
        item.productName.toLowerCase().includes(q) ||
        item.sku.toLowerCase().includes(q) ||
        item.supplierName.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q)
      );
    }

    return true;
  });

  const handleOpenRestock = (item: ReorderRecommendation) => {
    const liveProd = products.find((p) => p.id === item.productId) || null;
    setSelectedProductForRestock(liveProd);
    setIsRestockOpen(true);
  };

  const handleRestockSubmit = (input: RestockInput) => {
    const res = inventoryMovementService.receiveStock(shopId, input);
    if (res.movement) {
      if (selectedProductForRestock) {
        setOrderedProductIds((prev) => [...prev, selectedProductForRestock.id]);
      }
      if (onDataRefresh) {
        onDataRefresh();
      }
      return { success: true };
    }
    return { success: false, error: res.error || "Restock failed" };
  };

  const renderPriorityBadge = (priority: OrderPriority) => {
    switch (priority) {
      case "ORDER_NOW":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-red-100 text-red-800 border border-red-200">
            <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse" />
            ORDER NOW
          </span>
        );
      case "ORDER_SOON":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-100 text-amber-800 border border-amber-200">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-600" />
            ORDER SOON
          </span>
        );
      case "MONITOR":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-medium bg-blue-50 text-blue-700 border border-blue-200">
            MONITOR
          </span>
        );
      case "NO_ACTION":
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-medium bg-zinc-100 text-zinc-600">
            NO ACTION
          </span>
        );
    }
  };

  const renderDaysBadge = (days: number, leadTime: number) => {
    if (days === 0) {
      return (
        <span className="font-mono font-bold text-red-700 bg-red-50 px-2 py-0.5 rounded border border-red-200">
          0 days (Empty)
        </span>
      );
    }

    if (days <= leadTime) {
      return (
        <span className="font-mono font-bold text-red-700 bg-red-50 px-2 py-0.5 rounded border border-red-200">
          {days}d (≤ Lead Time)
        </span>
      );
    }

    if (days <= leadTime + 7) {
      return (
        <span className="font-mono font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
          {days}d remaining
        </span>
      );
    }

    return (
      <span className="font-mono font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
        {days > 100 ? "100+ days" : `${days}d`}
      </span>
    );
  };

  return (
    <div className="bg-white rounded-xl border border-zinc-200/80 shadow-2xs overflow-hidden">
      {/* Search & Priority Filter Strip */}
      <div className="p-4 border-b border-zinc-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-zinc-50/50">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs font-semibold text-zinc-500 mr-1">Filter Priority:</span>
          {[
            { key: "ALL", label: `All (${recommendations.length})` },
            {
              key: "ORDER_NOW",
              label: `Order Now (${recommendations.filter((r) => r.priority === "ORDER_NOW").length})`,
            },
            {
              key: "ORDER_SOON",
              label: `Order Soon (${recommendations.filter((r) => r.priority === "ORDER_SOON").length})`,
            },
            {
              key: "MONITOR",
              label: `Monitor (${recommendations.filter((r) => r.priority === "MONITOR").length})`,
            },
          ].map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setPriorityFilter(tab.key)}
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                priorityFilter === tab.key
                  ? "bg-charcoal-900 text-white shadow-2xs"
                  : "bg-white text-zinc-600 hover:bg-zinc-100 border border-zinc-200/70"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search SKU, product, vendor..."
            className="w-full h-8 pl-8 pr-3 rounded-lg border border-zinc-200 text-xs bg-white focus:outline-hidden focus:border-brand-500 transition-colors"
          />
        </div>
      </div>

      {/* Main Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead className="bg-zinc-50 border-b border-zinc-200/80 text-[10px] uppercase font-bold text-zinc-500 font-mono tracking-wider">
            <tr>
              <th className="py-3 px-4">Product & Category</th>
              <th className="py-3 px-3 text-center">Current Stock</th>
              <th className="py-3 px-3 text-center">Avg Daily Demand</th>
              <th className="py-3 px-3 text-center">Days of Supply</th>
              <th className="py-3 px-3 text-center">Lead Time / MOQ</th>
              <th className="py-3 px-3 text-center">Reorder Point (ROP)</th>
              <th className="py-3 px-3 text-center">Recommended Qty</th>
              <th className="py-3 px-3 text-center">Priority</th>
              <th className="py-3 px-4 text-right">Procurement Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-8 text-center text-zinc-400 text-xs">
                  No products found matching the selected filters.
                </td>
              </tr>
            ) : (
              filtered.map((item) => {
                const isExpanded = expandedWhyId === item.productId;
                const isOrdered = orderedProductIds.includes(item.productId);

                return (
                  <React.Fragment key={item.productId}>
                    <tr
                      className={`hover:bg-zinc-50/70 transition-colors ${
                        item.priority === "ORDER_NOW" ? "bg-red-50/20" : ""
                      }`}
                    >
                      {/* Product & Category */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          {item.imageUrl ? (
                            <img
                              src={item.imageUrl}
                              alt={item.productName}
                              className="w-9 h-9 rounded-lg object-cover border border-zinc-200 shrink-0"
                            />
                          ) : (
                            <div className="w-9 h-9 rounded-lg bg-zinc-100 flex items-center justify-center text-zinc-400 shrink-0 font-bold">
                              {item.productName.charAt(0)}
                            </div>
                          )}
                          <div className="min-w-0">
                            <div className="font-semibold text-zinc-900 truncate max-w-[200px]">
                              {item.productName}
                            </div>
                            <div className="text-[11px] text-zinc-400 font-mono">
                              {item.sku} • {item.category}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Current Stock */}
                      <td className="py-3 px-3 text-center font-mono font-bold text-zinc-900">
                        {item.currentStock}{" "}
                        <span className="text-[10px] font-normal text-zinc-400">
                          {item.unit}
                        </span>
                      </td>

                      {/* Avg Daily Demand */}
                      <td className="py-3 px-3 text-center font-mono">
                        <div className="font-bold text-zinc-800">
                          {item.demand.avgDailyDemand} / day
                        </div>
                        <div className="flex items-center justify-center gap-1 text-[10px] text-zinc-400 mt-0.5">
                          {item.demand.salesTrend === "increasing" ? (
                            <span className="text-emerald-600 flex items-center">
                              <TrendingUp className="w-2.5 h-2.5 mr-0.5" /> 7d: {item.demand.avgDailyDemand7d}
                            </span>
                          ) : item.demand.salesTrend === "declining" ? (
                            <span className="text-rose-600 flex items-center">
                              <TrendingDown className="w-2.5 h-2.5 mr-0.5" /> 7d: {item.demand.avgDailyDemand7d}
                            </span>
                          ) : (
                            <span>7d: {item.demand.avgDailyDemand7d}</span>
                          )}
                        </div>
                        {item.demand.isLimitedData && (
                          <div
                            className="text-[9px] text-amber-600 underline decoration-dotted cursor-help"
                            title="Demand estimate based on limited sales history."
                          >
                            Limited history
                          </div>
                        )}
                      </td>

                      {/* Days of Supply */}
                      <td className="py-3 px-3 text-center text-xs">
                        {renderDaysBadge(item.daysRemaining, item.supplierLeadTime)}
                      </td>

                      {/* Supplier Lead Time & MOQ */}
                      <td className="py-3 px-3 text-center text-xs text-zinc-600 font-mono">
                        <div>{item.supplierLeadTime} days delivery</div>
                        <div className="text-[10px] text-zinc-400">
                          MOQ: {item.minOrderQuantity} {item.unit}
                        </div>
                      </td>

                      {/* Reorder Point */}
                      <td className="py-3 px-3 text-center font-mono font-bold text-zinc-900">
                        {item.reorderPoint}{" "}
                        <span className="text-[10px] font-normal text-zinc-400">
                          (LTD: {item.expectedLeadTimeDemand})
                        </span>
                      </td>

                      {/* Recommended Qty */}
                      <td className="py-3 px-3 text-center font-mono">
                        {item.recommendedQuantity > 0 ? (
                          <div>
                            <span className="font-bold text-brand-700 bg-brand-50 border border-brand-200 px-2 py-0.5 rounded text-xs inline-block">
                              +{item.recommendedQuantity} {item.unit}
                            </span>
                            <div className="text-[10px] text-zinc-400 mt-0.5">
                              {formatINR(item.estimatedCost)}
                            </div>
                            {item.moqApplied && (
                              <span className="text-[9px] text-indigo-700 block font-semibold">
                                MOQ applied
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-zinc-400 text-xs">0 (Healthy)</span>
                        )}
                      </td>

                      {/* Priority */}
                      <td className="py-3 px-3 text-center">
                        {renderPriorityBadge(item.priority)}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right space-x-1.5 whitespace-nowrap">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            setExpandedWhyId(isExpanded ? null : item.productId)
                          }
                          className="text-[11px] h-7 px-2 font-medium text-zinc-500 hover:text-zinc-900"
                        >
                          Why?
                          {isExpanded ? (
                            <ChevronUp className="w-3 h-3 ml-0.5" />
                          ) : (
                            <ChevronDown className="w-3 h-3 ml-0.5" />
                          )}
                        </Button>

                        <Button
                          variant={item.priority === "ORDER_NOW" ? "primary" : "outline"}
                          size="sm"
                          disabled={item.recommendedQuantity === 0 || isOrdered}
                          onClick={() => handleOpenRestock(item)}
                          className={`text-xs h-7 px-2.5 font-semibold gap-1 ${
                            isOrdered ? "bg-emerald-50 text-emerald-700 border-emerald-200" : ""
                          }`}
                        >
                          {isOrdered ? (
                            <>
                              <Check className="w-3 h-3" />
                              Ordered
                            </>
                          ) : (
                            <>
                              <PackagePlus className="w-3 h-3" />
                              Order Now
                            </>
                          )}
                        </Button>
                      </td>
                    </tr>

                    {/* Expandable "Why This Order?" Drawer */}
                    {isExpanded && (
                      <tr className="bg-zinc-50/80 border-b border-zinc-200">
                        <td colSpan={9} className="py-3 px-4 text-xs text-zinc-700">
                          <div className="p-3 bg-white rounded-lg border border-zinc-200/80 shadow-2xs space-y-2">
                            <div className="flex items-center gap-2 font-bold text-charcoal-950">
                              <HelpCircle className="w-4 h-4 text-brand-600" />
                              <span>Algorithmic Rationale & Math Breakdown:</span>
                            </div>
                            <p className="leading-relaxed text-zinc-600">
                              {item.whyReasoning}
                            </p>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-zinc-100 text-[11px] font-mono text-zinc-500">
                              <div>Expected Lead Demand: {item.expectedLeadTimeDemand} {item.unit}</div>
                              <div>Safety Buffer Stock: {item.safetyStock} {item.unit}</div>
                              <div>Target Stock Level: {item.reorderPoint} + 14d demand</div>
                              <div>Supplier: {item.supplierName} ({item.supplierLeadTime}d)</div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Restock Modal */}
      <RestockModal
        isOpen={isRestockOpen}
        onClose={() => setIsRestockOpen(false)}
        products={products}
        suppliers={suppliers}
        preselectedProduct={selectedProductForRestock}
        onRestock={handleRestockSubmit}
        onAdjust={() => ({ success: true })}
      />
    </div>
  );
}
