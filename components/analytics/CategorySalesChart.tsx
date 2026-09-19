"use client";

import React from "react";
import { CategorySalesStat } from "@/types/analytics";
import { formatINR } from "@/lib/utils";
import { Tag, PieChart } from "lucide-react";

interface CategorySalesChartProps {
  categories: CategorySalesStat[];
}

export function CategorySalesChart({ categories }: CategorySalesChartProps) {
  if (!categories || categories.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-zinc-200/80 p-6 text-center text-xs text-zinc-400">
        No category sales recorded during this period.
      </div>
    );
  }

  const maxRevenue = Math.max(1, ...categories.map((c) => c.revenue));

  return (
    <div className="bg-white rounded-xl border border-zinc-200/80 p-4 sm:p-5 shadow-2xs">
      <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-charcoal-950">
              Sales by Category
            </h3>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-100 text-zinc-600 font-semibold">
              {categories.length} Categories
            </span>
          </div>
          <p className="text-xs text-zinc-500 mt-0.5">
            Turnover and revenue contribution by product group
          </p>
        </div>
      </div>

      <div className="mt-4 space-y-3.5">
        {categories.map((cat, idx) => {
          const widthPct = Math.max(5, Math.round((cat.revenue / maxRevenue) * 100));

          return (
            <div key={cat.categoryName} className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-zinc-400 text-[11px]">
                    #{idx + 1}
                  </span>
                  <span className="font-semibold text-zinc-900">
                    {cat.categoryName}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-zinc-500 text-[11px]">
                    {cat.units.toLocaleString("en-IN")} units ({cat.orderCount} orders)
                  </span>
                  <span className="font-mono font-bold text-zinc-900">
                    {formatINR(cat.revenue)}{" "}
                    <span className="text-zinc-400 font-normal">
                      ({cat.percentageShare}%)
                    </span>
                  </span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="h-2 w-full bg-zinc-100 rounded-full overflow-hidden">
                <div
                  style={{ width: `${widthPct}%` }}
                  className={`h-full rounded-full transition-all ${
                    idx === 0
                      ? "bg-charcoal-950"
                      : idx === 1
                      ? "bg-charcoal-800"
                      : idx === 2
                      ? "bg-charcoal-700"
                      : "bg-zinc-400"
                  }`}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
