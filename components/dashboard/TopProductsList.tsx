"use client";

import React, { useMemo } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../ui/Card";
import { formatINR } from "@/lib/utils";
import { useShop } from "@/hooks/useShop";
import { analyticsService } from "@/services/analyticsService";
import { Flame, TrendingUp } from "lucide-react";

export function TopProductsList() {
  const { shop } = useShop();
  const shopId = shop?.id || "shop-1";

  const last30Days = useMemo(() => analyticsService.resolveDateRange("last_30_days"), []);
  const rankings = useMemo(
    () => analyticsService.getProductRankings(shopId, last30Days),
    [shopId, last30Days]
  );

  const topList = rankings.topSelling.slice(0, 5);

  return (
    <Card className="flex flex-col justify-between">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle>Top Velocity Products</CardTitle>
          </div>
          <span className="text-[10px] font-mono text-zinc-400">Past 30 Days</span>
        </div>
        <CardDescription>
          Highest contributing SKUs by units dispensed and revenue
        </CardDescription>
      </CardHeader>

      <CardContent className="p-0">
        <div className="divide-y divide-zinc-100">
          {topList.map((p, idx) => (
            <div
              key={p.productId}
              className="flex items-center justify-between p-3.5 hover:bg-zinc-50/70 transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="font-mono text-xs font-bold text-zinc-400 w-4 text-center">
                  #{idx + 1}
                </span>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-zinc-900 truncate max-w-[180px]">
                    {p.productName}
                  </p>
                  <p className="text-[11px] text-zinc-400 truncate">
                    {p.categoryName} • Margin: {p.marginPct}%
                  </p>
                </div>
              </div>

              <div className="text-right flex-shrink-0">
                <p className="text-xs font-mono font-bold text-zinc-900">
                  {formatINR(p.revenue)}
                </p>
                <div className="flex items-center justify-end gap-1 text-[11px] text-emerald-600 font-mono font-medium">
                  <span>{p.unitsSold} units</span>
                  <span className="text-zinc-300">•</span>
                  <span>{p.velocityPerDay} / day</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
