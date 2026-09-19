"use client";

import React, { useState } from "react";
import { ProductClassifications, ProductSalesStat } from "@/types/analytics";
import { formatINR } from "@/lib/utils";
import {
  TrendingUp,
  TrendingDown,
  Flame,
  Turtle,
  DollarSign,
  Award,
  Package,
} from "lucide-react";

interface ProductPerformanceTableProps {
  classifications: ProductClassifications;
}

type TabType =
  | "top_selling"
  | "highest_revenue"
  | "fast_moving"
  | "slow_moving"
  | "increasing"
  | "declining";

export function ProductPerformanceTable({
  classifications,
}: ProductPerformanceTableProps) {
  const [activeTab, setActiveTab] = useState<TabType>("top_selling");

  const getList = (): ProductSalesStat[] => {
    switch (activeTab) {
      case "top_selling":
        return classifications.topSelling;
      case "highest_revenue":
        return classifications.highestRevenue;
      case "fast_moving":
        return classifications.fastMoving;
      case "slow_moving":
        return classifications.slowMoving;
      case "increasing":
        return classifications.increasingSales;
      case "declining":
        return classifications.decliningSales;
    }
  };

  const list = getList();

  return (
    <div className="bg-white rounded-xl border border-zinc-200/80 p-4 sm:p-5 shadow-2xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-100">
        <div>
          <h3 className="text-sm font-bold text-charcoal-950">
            Product Performance & SKU Intelligence
          </h3>
          <p className="text-xs text-zinc-500 mt-0.5">
            Turnover velocities, profit contribution, and demand trajectory
          </p>
        </div>

        {/* Tab Filters */}
        <div className="flex flex-wrap items-center gap-1 bg-zinc-100/80 p-0.5 rounded-lg text-xs">
          <button
            type="button"
            onClick={() => setActiveTab("top_selling")}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-all font-medium ${
              activeTab === "top_selling"
                ? "bg-white text-zinc-900 shadow-2xs font-bold"
                : "text-zinc-600 hover:text-zinc-900"
            }`}
          >
            <Award className="w-3 h-3 text-amber-600" />
            Top Selling
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("highest_revenue")}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-all font-medium ${
              activeTab === "highest_revenue"
                ? "bg-white text-zinc-900 shadow-2xs font-bold"
                : "text-zinc-600 hover:text-zinc-900"
            }`}
          >
            <DollarSign className="w-3 h-3 text-emerald-600" />
            Highest Revenue
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("fast_moving")}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-all font-medium ${
              activeTab === "fast_moving"
                ? "bg-white text-zinc-900 shadow-2xs font-bold"
                : "text-zinc-600 hover:text-zinc-900"
            }`}
          >
            <Flame className="w-3 h-3 text-orange-600" />
            Fast Moving
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("slow_moving")}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-all font-medium ${
              activeTab === "slow_moving"
                ? "bg-white text-zinc-900 shadow-2xs font-bold"
                : "text-zinc-600 hover:text-zinc-900"
            }`}
          >
            <Turtle className="w-3 h-3 text-zinc-500" />
            Slow Moving
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("increasing")}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-all font-medium ${
              activeTab === "increasing"
                ? "bg-white text-zinc-900 shadow-2xs font-bold"
                : "text-zinc-600 hover:text-zinc-900"
            }`}
          >
            <TrendingUp className="w-3 h-3 text-emerald-600" />
            Rising (📈)
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("declining")}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-all font-medium ${
              activeTab === "declining"
                ? "bg-white text-zinc-900 shadow-2xs font-bold"
                : "text-zinc-600 hover:text-zinc-900"
            }`}
          >
            <TrendingDown className="w-3 h-3 text-rose-600" />
            Declining (📉)
          </button>
        </div>
      </div>

      {/* Table Content */}
      <div className="mt-3 overflow-x-auto">
        {list.length === 0 ? (
          <div className="py-8 text-center text-xs text-zinc-400">
            No SKUs match this classification for the selected period.
          </div>
        ) : (
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-zinc-100 text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                <th className="py-2.5 px-2">#</th>
                <th className="py-2.5 px-2">Product</th>
                <th className="py-2.5 px-2">Category</th>
                <th className="py-2.5 px-2 text-right">Units Sold</th>
                <th className="py-2.5 px-2 text-right">Velocity</th>
                <th className="py-2.5 px-2 text-right">Revenue</th>
                <th className="py-2.5 px-2 text-right">Gross Profit</th>
                <th className="py-2.5 px-2 text-center">Trajectory</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-50">
              {list.map((prod, idx) => (
                <tr key={prod.productId} className="hover:bg-zinc-50/60 transition-colors">
                  <td className="py-2.5 px-2 font-mono text-zinc-400">{idx + 1}</td>
                  <td className="py-2.5 px-2">
                    <div className="font-semibold text-zinc-900">{prod.productName}</div>
                    <div className="font-mono text-[10px] text-zinc-400">{prod.sku}</div>
                  </td>
                  <td className="py-2.5 px-2">
                    <span className="inline-block px-1.5 py-0.5 rounded text-[10px] bg-zinc-100 text-zinc-700 font-medium">
                      {prod.categoryName}
                    </span>
                  </td>
                  <td className="py-2.5 px-2 text-right font-mono font-bold text-zinc-900">
                    {prod.unitsSold.toLocaleString("en-IN")}
                  </td>
                  <td className="py-2.5 px-2 text-right font-mono text-zinc-600">
                    {prod.velocityPerDay} / day
                  </td>
                  <td className="py-2.5 px-2 text-right font-mono font-bold text-charcoal-950">
                    {formatINR(prod.revenue)}
                  </td>
                  <td className="py-2.5 px-2 text-right font-mono text-emerald-700 font-semibold">
                    {formatINR(prod.profit)}{" "}
                    <span className="text-[10px] text-zinc-400 font-normal">
                      ({prod.marginPct}%)
                    </span>
                  </td>
                  <td className="py-2.5 px-2 text-center">
                    {prod.trendVelocity === "increasing" ? (
                      <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                        <TrendingUp className="w-2.5 h-2.5" /> Rising
                      </span>
                    ) : prod.trendVelocity === "declining" ? (
                      <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded">
                        <TrendingDown className="w-2.5 h-2.5" /> Declining
                      </span>
                    ) : (
                      <span className="text-[10px] font-medium text-zinc-400">
                        Stable
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
