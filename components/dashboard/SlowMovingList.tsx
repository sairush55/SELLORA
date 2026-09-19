"use client";

import React, { useMemo } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../ui/Card";
import { formatINR } from "@/lib/utils";
import { useShop } from "@/hooks/useShop";
import { analyticsService } from "@/services/analyticsService";
import { productService } from "@/services/productService";
import { AlertCircle, Clock, ArrowRight } from "lucide-react";
import Link from "next/link";

export function SlowMovingList() {
  const { shop } = useShop();
  const shopId = shop?.id || "shop-1";

  const last30Days = useMemo(() => analyticsService.resolveDateRange("last_30_days"), []);
  const rankings = useMemo(
    () => analyticsService.getProductRankings(shopId, last30Days),
    [shopId, last30Days]
  );
  const products = useMemo(() => productService.getProducts(shopId), [shopId]);

  const slowList = rankings.slowMoving.slice(0, 4);
  const totalLocked = slowList.reduce((acc, p) => {
    const live = products.find((prod) => prod.id === p.productId);
    return acc + ((live?.currentStock || 0) * (live?.costPrice || 0));
  }, 0);

  return (
    <Card className="flex flex-col justify-between">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle>Slow Moving & Deadstock</CardTitle>
          </div>
          <span className="text-[10px] font-mono font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
            {formatINR(totalLocked)} Capital Tied
          </span>
        </div>
        <CardDescription>
          SKUs tying up working capital with minimal velocity in past 30 days
        </CardDescription>
      </CardHeader>

      <CardContent className="p-0">
        <div className="divide-y divide-zinc-100">
          {slowList.map((p) => {
            const live = products.find((prod) => prod.id === p.productId);
            const stock = live?.currentStock || 0;
            const cost = live?.costPrice || 0;
            const tied = stock * cost;

            return (
              <div
                key={p.productId}
                className="flex items-center justify-between p-3.5 hover:bg-zinc-50/70 transition-colors"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="h-7 w-7 rounded-md bg-zinc-100 flex items-center justify-center text-zinc-500 shrink-0">
                    <Clock className="w-3.5 h-3.5 text-zinc-500" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-zinc-900 truncate max-w-[170px]">
                      {p.productName}
                    </p>
                    <p className="text-[11px] text-zinc-400">
                      Stock: {stock} units • {p.categoryName}
                    </p>
                  </div>
                </div>

                <div className="text-right flex-shrink-0">
                  <p className="text-xs font-mono font-bold text-zinc-900">
                    {formatINR(tied)}
                  </p>
                  <span className="inline-block text-[10px] font-mono font-semibold px-1.5 py-0.2 rounded mt-0.5 text-amber-700 bg-amber-50">
                    {p.unitsSold} units sold
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
