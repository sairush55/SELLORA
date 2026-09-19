"use client";

import React, { useMemo } from "react";
import { StatCard } from "../ui/StatCard";
import { formatINR, formatNumberIN } from "@/lib/utils";
import { useShop } from "@/hooks/useShop";
import { analyticsService } from "@/services/analyticsService";
import { productService } from "@/services/productService";
import { IndianRupee, Receipt, ShoppingCart, Boxes } from "lucide-react";

export function KpiGrid() {
  const { shop } = useShop();
  const shopId = shop?.id || "shop-1";

  const todayRange = useMemo(() => analyticsService.resolveDateRange("today"), []);
  const kpis = useMemo(
    () => analyticsService.calculateSalesKPIs(shopId, todayRange.startTime, todayRange.endTime),
    [shopId, todayRange]
  );
  const comparison = useMemo(
    () => analyticsService.calculatePeriodComparison(shopId, todayRange),
    [shopId, todayRange]
  );

  const products = useMemo(() => productService.getProducts(shopId), [shopId]);
  const inventoryValue = useMemo(() => {
    return products.reduce((sum, p) => sum + (p.currentStock * p.costPrice), 0);
  }, [products]);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Today's Sales */}
      <StatCard
        title="Today's Sales"
        value={formatINR(kpis.totalRevenue)}
        change={comparison.hasPreviousData ? comparison.revenue.percentChange : undefined}
        changeLabel="vs yesterday"
        subtitle="Total money collected today"
        icon={<IndianRupee className="w-4 h-4 text-emerald-600" />}
      />

      {/* 2. Bills */}
      <StatCard
        title="Bills Created"
        value={`${kpis.totalBills} bills`}
        change={comparison.hasPreviousData ? comparison.bills.percentChange : undefined}
        changeLabel="vs yesterday"
        subtitle={`Avg: ${formatINR(kpis.avgBillValue)} per bill`}
        icon={<Receipt className="w-4 h-4 text-blue-600" />}
      />

      {/* 3. Items Sold */}
      <StatCard
        title="Items Sold"
        value={`${formatNumberIN(kpis.itemsSold)} units`}
        change={comparison.hasPreviousData ? comparison.units.percentChange : undefined}
        changeLabel="vs yesterday"
        subtitle={`${kpis.productsSoldCount} different products`}
        icon={<ShoppingCart className="w-4 h-4 text-amber-600" />}
      />

      {/* 4. Inventory Value */}
      <StatCard
        title="Inventory Value"
        value={formatINR(inventoryValue)}
        subtitle={`${products.length} active catalog SKUs`}
        icon={<Boxes className="w-4 h-4 text-purple-600" />}
      />
    </div>
  );
}
