"use client";

import React from "react";
import { SalesKPIs, PeriodComparison } from "@/types/analytics";
import { formatINR } from "@/lib/utils";
import {
  TrendingUp,
  TrendingDown,
  Receipt,
  Layers,
  Wallet,
  Minus,
  CircleDollarSign,
} from "lucide-react";

interface AnalyticsKpiCardsProps {
  kpis: SalesKPIs;
  comparison: PeriodComparison;
}

export function AnalyticsKpiCards({ kpis, comparison }: AnalyticsKpiCardsProps) {
  const renderComparisonBadge = (
    metric: PeriodComparison["revenue"],
    unit = "%"
  ) => {
    if (!comparison.hasPreviousData || !metric.hasSufficientData) {
      return (
        <span className="inline-flex items-center gap-0.5 text-[10px] font-medium text-zinc-400 bg-zinc-100 px-2 py-0.5 rounded-full">
          <Minus className="w-2.5 h-2.5" /> No prior baseline
        </span>
      );
    }

    const isPositive = metric.diff >= 0;
    const absPercent = Math.abs(metric.percentChange);

    return (
      <span
        className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${
          isPositive
            ? "text-emerald-700 bg-emerald-50 border border-emerald-200/60"
            : "text-rose-700 bg-rose-50 border border-rose-200/60"
        }`}
      >
        {isPositive ? (
          <TrendingUp className="w-2.5 h-2.5" />
        ) : (
          <TrendingDown className="w-2.5 h-2.5" />
        )}
        {isPositive ? "+" : "-"}
        {absPercent}
        {unit} vs {comparison.previousPeriodLabel.toLowerCase()}
      </span>
    );
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Total Revenue */}
      <div className="bg-white rounded-2xl border border-zinc-200/90 p-4 sm:p-5 shadow-2xs hover:shadow-xs transition-shadow flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
            Total Revenue
          </span>
          <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-200/60">
            <Wallet className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3">
          <div className="text-2xl sm:text-3xl font-black text-zinc-900 font-mono tracking-tight">
            {formatINR(kpis.totalRevenue)}
          </div>
          <div className="mt-2.5 flex items-center justify-between text-xs pt-2 border-t border-zinc-100">
            <div>{renderComparisonBadge(comparison.revenue)}</div>
            <span className="text-[11px] font-mono text-zinc-400">
              {kpis.itemsSold.toLocaleString("en-IN")} units sold
            </span>
          </div>
        </div>
      </div>

      {/* 2. Gross Profit & Margin */}
      <div className="bg-white rounded-2xl border border-zinc-200/90 p-4 sm:p-5 shadow-2xs hover:shadow-xs transition-shadow flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
            Gross Profit
          </span>
          <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-200/60">
            <CircleDollarSign className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3">
          <div className="text-2xl sm:text-3xl font-black text-zinc-900 font-mono tracking-tight">
            {formatINR(kpis.estimatedGrossProfit)}
          </div>
          <div className="mt-2.5 flex items-center justify-between text-xs pt-2 border-t border-zinc-100">
            <span className="inline-flex items-center gap-1 font-mono text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/70">
              {kpis.grossProfitMarginPct}% Margin
            </span>
            <span className="text-[11px] font-mono text-zinc-400">
              COGS: {formatINR(Math.max(0, kpis.totalRevenue - kpis.estimatedGrossProfit))}
            </span>
          </div>
        </div>
      </div>

      {/* 3. Total Bills / Invoices */}
      <div className="bg-white rounded-2xl border border-zinc-200/90 p-4 sm:p-5 shadow-2xs hover:shadow-xs transition-shadow flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
            Total Orders
          </span>
          <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center border border-blue-200/60">
            <Receipt className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3">
          <div className="text-2xl sm:text-3xl font-black text-zinc-900 font-mono tracking-tight">
            {kpis.totalBills.toLocaleString("en-IN")}
          </div>
          <div className="mt-2.5 flex items-center justify-between text-xs pt-2 border-t border-zinc-100">
            <div>{renderComparisonBadge(comparison.bills)}</div>
            <span className="text-[11px] font-mono text-zinc-400">
              {kpis.productsSoldCount} active SKUs
            </span>
          </div>
        </div>
      </div>

      {/* 4. Average Order Value (AOV) */}
      <div className="bg-white rounded-2xl border border-zinc-200/90 p-4 sm:p-5 shadow-2xs hover:shadow-xs transition-shadow flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
            Average Order Value
          </span>
          <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center border border-amber-200/60">
            <Layers className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3">
          <div className="text-2xl sm:text-3xl font-black text-zinc-900 font-mono tracking-tight">
            {formatINR(kpis.avgBillValue)}
          </div>
          <div className="mt-2.5 flex items-center justify-between text-xs pt-2 border-t border-zinc-100">
            <div>{renderComparisonBadge(comparison.avgBill)}</div>
            <span className="text-[11px] font-mono text-zinc-400">
              per invoice
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
