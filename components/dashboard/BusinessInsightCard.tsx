"use client";

import React, { useMemo } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../ui/Card";
import { useShop } from "@/hooks/useShop";
import { analyticsService } from "@/services/analyticsService";
import { Lightbulb, AlertTriangle, ArrowUpRight, TrendingUp, CheckCircle2 } from "lucide-react";
import Link from "next/link";

export function BusinessInsightCard() {
  const { shop } = useShop();
  const shopId = shop?.id || "shop-1";

  const range = useMemo(() => analyticsService.resolveDateRange("this_week"), []);
  const kpis = useMemo(
    () => analyticsService.calculateSalesKPIs(shopId, range.startTime, range.endTime),
    [shopId, range]
  );
  const comparison = useMemo(
    () => analyticsService.calculatePeriodComparison(shopId, range),
    [shopId, range]
  );
  const rankings = useMemo(
    () => analyticsService.getProductRankings(shopId, range),
    [shopId, range]
  );
  const categories = useMemo(
    () => analyticsService.getCategoryBreakdown(shopId, range.startTime, range.endTime),
    [shopId, range]
  );
  const hourly = useMemo(
    () => analyticsService.getHourlyDistribution(shopId, range.startTime, range.endTime),
    [shopId, range]
  );

  const insights = useMemo(
    () => analyticsService.generateBusinessInsights(shopId, kpis, comparison, rankings, categories, hourly),
    [shopId, kpis, comparison, rankings, categories, hourly]
  );

  return (
    <Card className="border-brand-200/80 bg-gradient-to-br from-white via-white to-brand-50/20">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-md bg-brand-100 flex items-center justify-center text-brand-700">
              <Lightbulb className="w-3.5 h-3.5" />
            </div>
            <CardTitle>Business Insights</CardTitle>
          </div>
          <span className="text-[10px] font-mono text-brand-700 font-bold bg-brand-50 px-2 py-0.5 rounded border border-brand-200">
            {insights.length} Active Signals
          </span>
        </div>
        <CardDescription>
          Algorithmic correlations linking billing receipts directly to stock decisions
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-3">
        {insights.slice(0, 3).map((insight) => (
          <div
            key={insight.id}
            className="p-3.5 rounded-lg border border-zinc-200/80 bg-white shadow-2xs hover:border-zinc-300 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
          >
            <div className="flex items-start gap-3 min-w-0">
              <div className="mt-0.5">
                {insight.severity === "warning" ? (
                  <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                ) : insight.severity === "positive" ? (
                  <TrendingUp className="w-4 h-4 text-emerald-500 shrink-0" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 text-brand-500 shrink-0" />
                )}
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-bold text-zinc-900">{insight.title}</h4>
                  {insight.metric && (
                    <span className="text-[10px] font-mono font-medium text-zinc-500 bg-zinc-100 px-1.5 py-0.2 rounded">
                      {insight.metric}
                    </span>
                  )}
                </div>
                <p className="text-xs text-zinc-600 leading-snug">{insight.message}</p>
              </div>
            </div>

            <div className="flex-shrink-0 sm:self-center">
              <Link
                href="/analytics"
                className="inline-flex items-center text-xs font-semibold text-charcoal-900 hover:text-brand-600 transition-colors"
              >
                View Analytics
                <ArrowUpRight className="w-3.5 h-3.5 ml-1" />
              </Link>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
