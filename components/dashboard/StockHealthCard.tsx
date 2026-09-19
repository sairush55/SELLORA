"use client";

import React, { useMemo } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../ui/Card";
import { useShop } from "@/hooks/useShop";
import { stockIntelligenceService } from "@/services/stockIntelligenceService";
import { CheckCircle2, AlertTriangle, AlertOctagon, PackageCheck } from "lucide-react";
import Link from "next/link";

export function StockHealthCard() {
  const { shop } = useShop();
  const shopId = shop?.id || "shop-1";

  const recommendations = useMemo(() => {
    return stockIntelligenceService.getRecommendations(shopId);
  }, [shopId]);

  const totalSkus = recommendations.length;
  const healthyCount = recommendations.filter((r) => r.stockStatus === "HEALTHY").length;
  const lowStockCount = recommendations.filter(
    (r) => r.stockStatus === "LOW" || r.stockStatus === "CRITICAL"
  ).length;
  const outOfStockCount = recommendations.filter((r) => r.stockStatus === "OUT_OF_STOCK").length;
  const overstockedCount = recommendations.filter((r) => r.stockStatus === "OVERSTOCK").length;

  const total = totalSkus > 0 ? totalSkus : 1;
  const healthyPct = Math.round((healthyCount / total) * 100);
  const lowStockPct = Math.round((lowStockCount / total) * 100);
  const outOfStockPct = Math.round((outOfStockCount / total) * 100);
  const overstockedPct = Math.max(0, 100 - healthyPct - lowStockPct - outOfStockPct);
  const healthyPercentage = healthyPct;

  return (
    <Card className="flex flex-col justify-between">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle>Stock Health & Catalog Radar</CardTitle>
          </div>
          <span className="font-mono text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
            {healthyPercentage}% Stable
          </span>
        </div>
        <CardDescription>
          Real-time inventory equilibrium across {totalSkus} store items
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Multi-segment Progress Bar */}
        <div className="space-y-1.5">
          <div className="h-3 w-full rounded-full bg-zinc-100 flex overflow-hidden p-0.5 border border-zinc-200/80">
            <div
              style={{ width: `${healthyPct}%` }}
              className="h-full bg-emerald-500 rounded-l-full transition-all"
              title={`Healthy: ${healthyCount} SKUs (${healthyPct}%)`}
            />
            <div
              style={{ width: `${lowStockPct}%` }}
              className="h-full bg-amber-500 transition-all"
              title={`Low Stock: ${lowStockCount} SKUs (${lowStockPct}%)`}
            />
            <div
              style={{ width: `${outOfStockPct}%` }}
              className="h-full bg-red-500 transition-all"
              title={`Out of Stock: ${outOfStockCount} SKUs (${outOfStockPct}%)`}
            />
            <div
              style={{ width: `${overstockedPct}%` }}
              className="h-full bg-blue-400 rounded-r-full transition-all"
              title={`Overstocked: ${overstockedCount} SKUs (${overstockedPct}%)`}
            />
          </div>

          <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400">
            <span>Critical (0)</span>
            <span>Balanced Zone</span>
            <span>Surplus</span>
          </div>
        </div>

        {/* 4 Status Quadrants */}
        <div className="grid grid-cols-2 gap-2.5 pt-1">
          {/* Healthy */}
          <div className="p-3 rounded-lg border border-emerald-100 bg-emerald-50/30 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <div>
                <p className="text-xs font-semibold text-zinc-800">Healthy</p>
                <p className="text-[10px] text-zinc-500">In ideal stock range</p>
              </div>
            </div>
            <span className="font-mono text-sm font-bold text-emerald-700">
              {healthyCount}
            </span>
          </div>

          {/* Low Stock */}
          <Link
            href="/inventory/stock-alerts"
            className="p-3 rounded-lg border border-amber-200/80 bg-amber-50/40 hover:bg-amber-50 transition-colors flex items-center justify-between group"
          >
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <div>
                <p className="text-xs font-semibold text-zinc-800 group-hover:text-amber-900">
                  Low Stock
                </p>
                <p className="text-[10px] text-zinc-500">Near threshold</p>
              </div>
            </div>
            <span className="font-mono text-sm font-bold text-amber-700">
              {lowStockCount}
            </span>
          </Link>

          {/* Out of Stock */}
          <Link
            href="/inventory/reorders"
            className="p-3 rounded-lg border border-red-200/80 bg-red-50/40 hover:bg-red-50 transition-colors flex items-center justify-between group"
          >
            <div className="flex items-center gap-2">
              <AlertOctagon className="w-4 h-4 text-red-600 shrink-0" />
              <div>
                <p className="text-xs font-semibold text-zinc-800 group-hover:text-red-900">
                  Out of Stock
                </p>
                <p className="text-[10px] text-zinc-500">Immediate stockout</p>
              </div>
            </div>
            <span className="font-mono text-sm font-bold text-red-700">
              {outOfStockCount}
            </span>
          </Link>

          {/* Overstocked */}
          <div className="p-3 rounded-lg border border-blue-100 bg-blue-50/30 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <PackageCheck className="w-4 h-4 text-blue-600 shrink-0" />
              <div>
                <p className="text-xs font-semibold text-zinc-800">Overstocked</p>
                <p className="text-[10px] text-zinc-500">High tied capital</p>
              </div>
            </div>
            <span className="font-mono text-sm font-bold text-blue-700">
              {overstockedCount}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
