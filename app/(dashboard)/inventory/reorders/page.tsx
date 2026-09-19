"use client";

import React, { useState, useMemo } from "react";
import { useShop } from "@/hooks/useShop";
import { useDataRefresh } from "@/hooks/useDataRefresh";
import { stockIntelligenceService } from "@/services/stockIntelligenceService";
import { productService } from "@/services/productService";
import { supplierService } from "@/services/supplierService";
import { ReordersTable } from "@/components/intelligence/ReordersTable";
import { Button } from "@/components/ui/Button";
import { formatINR } from "@/lib/utils";
import {
  RotateCw,
  ShoppingBag,
  AlertTriangle,
  FileSpreadsheet,
  Truck,
  Sparkles,
  Wallet,
  Clock,
  CheckCircle2,
} from "lucide-react";

export default function ReordersQueuePage() {
  const { shop } = useShop();
  const shopId = shop?.id || "shop-1";
  const { refreshTick } = useDataRefresh();

  const [refreshKey, setRefreshKey] = useState(0);

  const products = useMemo(() => {
    return productService.getProducts(shopId);
  }, [shopId, refreshKey, refreshTick]);

  const suppliers = useMemo(() => {
    return supplierService.getSuppliers(shopId);
  }, [shopId, refreshTick]);

  const recommendations = useMemo(() => {
    return stockIntelligenceService.getRecommendations(shopId);
  }, [shopId, refreshKey, refreshTick]);

  // Executive KPI summary calculations
  const actionableOrders = recommendations.filter(
    (r) => r.priority === "ORDER_NOW" || r.priority === "ORDER_SOON"
  );
  const criticalCount = recommendations.filter(
    (r) => r.stockStatus === "CRITICAL" || r.stockStatus === "OUT_OF_STOCK"
  ).length;
  const totalProcurementCapital = actionableOrders.reduce(
    (sum, r) => sum + r.estimatedCost,
    0
  );
  const distinctSuppliersCount = new Set(
    actionableOrders.map((r) => r.supplierName)
  ).size;

  const handleExportPOCSV = () => {
    if (typeof window === "undefined") return;

    const headers = [
      "Product Name",
      "SKU",
      "Category",
      "Supplier",
      "Current Stock",
      "Daily Demand",
      "Days Left",
      "Lead Time (Days)",
      "Reorder Point",
      "Recommended Order Qty",
      "Unit Cost (INR)",
      "Estimated Cost (INR)",
      "Priority",
      "Why Reasoning",
    ];

    const escapeCSV = (val: string | number | undefined): string => {
      if (val === undefined || val === null) return "";
      const str = String(val);
      if (str.includes(",") || str.includes('"') || str.includes("\n")) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const rows = actionableOrders.map((r) => [
      escapeCSV(r.productName),
      escapeCSV(r.sku),
      escapeCSV(r.category),
      escapeCSV(r.supplierName),
      r.currentStock,
      r.demand.avgDailyDemand,
      r.daysRemaining,
      r.supplierLeadTime,
      r.reorderPoint,
      r.recommendedQuantity,
      r.costPrice,
      r.estimatedCost,
      escapeCSV(r.priority),
      escapeCSV(r.whyReasoning),
    ]);

    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\r\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `sellora_purchase_orders_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-200/80">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">
            Reorder List
          </h1>
          <p className="text-sm text-zinc-500 mt-0.5">
            Products you should reorder soon — based on your sales speed and current stock
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportPOCSV}
            disabled={actionableOrders.length === 0}
            className="text-xs font-semibold gap-1.5"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            Export to CSV
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setRefreshKey((k) => k + 1)}
            className="text-xs font-semibold gap-1"
          >
            <RotateCw className="w-3 h-3" />
            Refresh
          </Button>
        </div>
      </div>

      {/* 2. Executive Reorder Metrics Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Actionable Orders */}
        <div className="bg-white rounded-xl border border-zinc-200/80 p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
              Replenishments Needed
            </span>
            <div className="w-7 h-7 rounded-lg bg-brand-50 text-brand-700 flex items-center justify-center">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black font-mono text-charcoal-950 mt-2">
            {actionableOrders.length}{" "}
            <span className="text-xs font-normal text-zinc-400">SKUs</span>
          </div>
          <p className="text-[11px] text-zinc-500 mt-1">
            Products at or below their calculated Reorder Point
          </p>
        </div>

        {/* Critical Stockouts */}
        <div className="bg-white rounded-xl border border-zinc-200/80 p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
              Critical Lead-Time Risks
            </span>
            <div className="w-7 h-7 rounded-lg bg-red-50 text-red-700 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black font-mono text-red-700 mt-2">
            {criticalCount}{" "}
            <span className="text-xs font-normal text-zinc-400">SKUs</span>
          </div>
          <p className="text-[11px] text-zinc-500 mt-1">
            Days remaining is $\le$ supplier delivery lead time
          </p>
        </div>

        {/* Estimated Procurement Capital */}
        <div className="bg-white rounded-xl border border-zinc-200/80 p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
              Est. Procurement Capital
            </span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black font-mono text-charcoal-950 mt-2">
            {formatINR(totalProcurementCapital)}
          </div>
          <p className="text-[11px] text-zinc-500 mt-1">
            Total capital required for recommended order quantities
          </p>
        </div>

        {/* Suppliers to Dispatch */}
        <div className="bg-white rounded-xl border border-zinc-200/80 p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
              Vendors to Contact
            </span>
            <div className="w-7 h-7 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center">
              <Truck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black font-mono text-charcoal-950 mt-2">
            {distinctSuppliersCount}{" "}
            <span className="text-xs font-normal text-zinc-400">suppliers</span>
          </div>
          <p className="text-[11px] text-zinc-500 mt-1">
            Suppliers linked to pending procurement batches
          </p>
        </div>
      </div>

      {/* Interactive Recommendations Table */}
      <ReordersTable
        recommendations={recommendations}
        products={products}
        suppliers={suppliers}
        shopId={shopId}
        onDataRefresh={() => setRefreshKey((k) => k + 1)}
      />
    </div>
  );
}
