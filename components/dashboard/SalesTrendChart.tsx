"use client";

import React, { useState, useMemo } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../ui/Card";
import { useShop } from "@/hooks/useShop";
import { analyticsService } from "@/services/analyticsService";
import { formatINR } from "@/lib/utils";
import { TrendingUp, BarChart2 } from "lucide-react";

export function SalesTrendChart() {
  const { shop } = useShop();
  const shopId = shop?.id || "shop-1";

  const [activeRange, setActiveRange] = useState<"today" | "7d" | "30d">("today");

  const dateRange = useMemo(() => {
    switch (activeRange) {
      case "today":
        return analyticsService.resolveDateRange("today");
      case "7d":
        return analyticsService.resolveDateRange("last_7_days");
      case "30d":
        return analyticsService.resolveDateRange("last_30_days");
    }
  }, [activeRange]);

  const timeSeries = useMemo(() => {
    return analyticsService.getTimeSeriesData(shopId, dateRange);
  }, [shopId, dateRange]);

  const maxSales = Math.max(1, ...timeSeries.map((d) => d.revenue));
  const totalPeriodRevenue = timeSeries.reduce((sum, d) => sum + d.revenue, 0);

  return (
    <Card className="flex flex-col justify-between">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div>
          <div className="flex items-center gap-2">
            <CardTitle>Sales Trend & Store Velocity</CardTitle>
            <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              <TrendingUp className="w-3 h-3" /> Live Database
            </span>
          </div>
          <CardDescription>
            Actual store turnover pacing: {formatINR(totalPeriodRevenue)} in period
          </CardDescription>
        </div>

        {/* Range Selector */}
        <div className="flex items-center rounded-lg border border-zinc-200 p-0.5 bg-zinc-50 text-xs font-medium text-zinc-600">
          <button
            type="button"
            onClick={() => setActiveRange("today")}
            className={`px-2.5 py-1 rounded-md transition-all ${
              activeRange === "today"
                ? "bg-white text-zinc-900 shadow-2xs font-semibold"
                : "hover:text-zinc-900"
            }`}
          >
            Today
          </button>
          <button
            type="button"
            onClick={() => setActiveRange("7d")}
            className={`px-2.5 py-1 rounded-md transition-all ${
              activeRange === "7d"
                ? "bg-white text-zinc-900 shadow-2xs font-semibold"
                : "hover:text-zinc-900"
            }`}
          >
            7 Days
          </button>
          <button
            type="button"
            onClick={() => setActiveRange("30d")}
            className={`px-2.5 py-1 rounded-md transition-all ${
              activeRange === "30d"
                ? "bg-white text-zinc-900 shadow-2xs font-semibold"
                : "hover:text-zinc-900"
            }`}
          >
            30 Days
          </button>
        </div>
      </CardHeader>

      <CardContent>
        {/* High Density Bar Chart */}
        <div className="h-52 w-full flex items-end gap-1.5 sm:gap-2 pt-4 pb-1">
          {timeSeries.map((point) => {
            const heightPct = Math.max(4, Math.round((point.revenue / maxSales) * 100));

            return (
              <div
                key={point.key}
                className="flex-1 flex flex-col items-center h-full justify-end group relative cursor-pointer"
              >
                {/* Tooltip Hover Pill */}
                <div className="absolute -top-12 z-20 hidden group-hover:flex flex-col items-center bg-charcoal-950 text-white text-[10px] px-2 py-1 rounded shadow-lg pointer-events-none whitespace-nowrap">
                  <span className="font-bold">{point.label}</span>
                  <span className="font-mono text-emerald-400 font-semibold">
                    {formatINR(point.revenue)}
                  </span>
                  <span className="text-[9px] text-zinc-400">
                    {point.bills} bills • {point.units} units
                  </span>
                </div>

                {/* Actual Sales Bar */}
                <div
                  className={`w-full rounded-t transition-all duration-300 relative ${
                    point.revenue > 0
                      ? "bg-charcoal-900 group-hover:bg-brand-600"
                      : "bg-zinc-200 group-hover:bg-zinc-400"
                  }`}
                  style={{ height: `${heightPct}%` }}
                />

                {/* Time Axis label */}
                <span className="text-[9px] sm:text-[10px] font-mono text-zinc-400 mt-2 truncate group-hover:text-zinc-900">
                  {point.label}
                </span>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
