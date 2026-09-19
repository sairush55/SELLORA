"use client";

import React from "react";
import { InventoryAnalyticsData } from "@/types/analytics";
import { formatINR } from "@/lib/utils";
import {
  Boxes,
  ArrowUpRight,
  ArrowDownRight,
  AlertTriangle,
  RotateCw,
  TrendingUp,
  PackageCheck,
} from "lucide-react";

interface InventoryAnalyticsCardProps {
  data: InventoryAnalyticsData;
}

export function InventoryAnalyticsCard({ data }: InventoryAnalyticsCardProps) {
  return (
    <div className="bg-white rounded-xl border border-zinc-200/80 p-4 sm:p-5 shadow-2xs">
      <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-charcoal-950">
              Inventory Turnover & Stock Health
            </h3>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200">
              Turnover: {data.stockTurnoverRatio}x
            </span>
          </div>
          <p className="text-xs text-zinc-500 mt-0.5">
            Reconstructed opening vs closing stock levels and velocity
          </p>
        </div>
      </div>

      {/* Stock Movement Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-4">
        {/* Opening Stock */}
        <div className="p-3 rounded-lg bg-zinc-50 border border-zinc-100">
          <div className="flex items-center justify-between text-xs text-zinc-500">
            <span>Opening Stock</span>
            <Boxes className="w-3.5 h-3.5 text-zinc-400" />
          </div>
          <div className="text-lg font-bold font-mono text-charcoal-950 mt-1">
            {data.openingStock.toLocaleString("en-IN")}
          </div>
          <span className="text-[10px] text-zinc-400">At period start</span>
        </div>

        {/* Stock Added */}
        <div className="p-3 rounded-lg bg-emerald-50/60 border border-emerald-100">
          <div className="flex items-center justify-between text-xs text-emerald-700 font-medium">
            <span>Stock Added</span>
            <ArrowUpRight className="w-3.5 h-3.5 text-emerald-600" />
          </div>
          <div className="text-lg font-bold font-mono text-emerald-800 mt-1">
            +{data.stockAdded.toLocaleString("en-IN")}
          </div>
          <span className="text-[10px] text-emerald-600">
            {data.restockEventCount} restock shipments
          </span>
        </div>

        {/* Units Sold */}
        <div className="p-3 rounded-lg bg-rose-50/60 border border-rose-100">
          <div className="flex items-center justify-between text-xs text-rose-700 font-medium">
            <span>Units Sold</span>
            <ArrowDownRight className="w-3.5 h-3.5 text-rose-600" />
          </div>
          <div className="text-lg font-bold font-mono text-rose-800 mt-1">
            -{data.unitsSold.toLocaleString("en-IN")}
          </div>
          <span className="text-[10px] text-rose-600">POS & summaries</span>
        </div>

        {/* Closing Stock */}
        <div className="p-3 rounded-lg bg-zinc-50 border border-zinc-100">
          <div className="flex items-center justify-between text-xs text-zinc-500">
            <span>Closing Stock</span>
            <PackageCheck className="w-3.5 h-3.5 text-zinc-400" />
          </div>
          <div className="text-lg font-bold font-mono text-charcoal-950 mt-1">
            {data.closingStock.toLocaleString("en-IN")}
          </div>
          <span className="text-[10px] text-zinc-400">At period end</span>
        </div>
      </div>

      {/* Stock Health Badges & Risk Warnings */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-zinc-100">
        <div className="flex items-center gap-3 p-3 rounded-lg bg-zinc-50 border border-zinc-100">
          <div className="w-8 h-8 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-semibold text-zinc-900">
              {data.stockoutCount === 0 ? "Zero Active Stockouts" : `${data.stockoutCount} Active Stockouts`}
            </div>
            <div className="text-[11px] text-zinc-500">
              {data.stockoutCount === 0
                ? "All catalog products currently hold stock"
                : "Products currently with 0 inventory balance"}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 p-3 rounded-lg bg-zinc-50 border border-zinc-100">
          <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
            <RotateCw className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-semibold text-zinc-900">
              {data.lowStockCount} SKUs Near Reorder Level
            </div>
            <div className="text-[11px] text-zinc-500">
              Stock is at or below defined minimum safety buffer
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
