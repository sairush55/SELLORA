"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import { useShop } from "@/hooks/useShop";
import { useDataRefresh } from "@/hooks/useDataRefresh";
import { KpiGrid } from "@/components/dashboard/KpiGrid";
import { SalesTrendChart } from "@/components/dashboard/SalesTrendChart";
import { StockHealthCard } from "@/components/dashboard/StockHealthCard";
import { RecommendedOrdersTable } from "@/components/dashboard/RecommendedOrdersTable";
import { TopProductsList } from "@/components/dashboard/TopProductsList";
import { SlowMovingList } from "@/components/dashboard/SlowMovingList";
import { BusinessInsightCard } from "@/components/dashboard/BusinessInsightCard";
import { Button } from "@/components/ui/Button";
import { analyticsService } from "@/services/analyticsService";
import { productService } from "@/services/productService";
import {
  ReceiptText,
  RotateCw,
  Calendar,
  ArrowRight,
  PackagePlus,
  ShoppingBag,
  BarChart3,
  CheckCircle2,
} from "lucide-react";

export default function DashboardPage() {
  const { shop } = useShop();
  const { refreshTick } = useDataRefresh();
  const shopId = shop?.id || "shop-1";

  const formattedDate = new Intl.DateTimeFormat("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date());

  // Detect if this is a brand-new empty merchant
  const todayRange = useMemo(() => analyticsService.resolveDateRange("today"), []);
  const kpis = useMemo(
    () => analyticsService.calculateSalesKPIs(shopId, todayRange.startTime, todayRange.endTime),
    [shopId, todayRange]
  );
  const products = useMemo(() => productService.getProducts(shopId), [shopId]);
  const isNewMerchant = products.length === 0 && kpis.totalRevenue === 0;

  return (
    <div key={refreshTick} className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-4 border-b border-zinc-200/60">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">
            {shop?.name ? `${shop.name}` : "Your Store"}
          </h1>
          <div className="flex flex-wrap items-center gap-2 mt-1 text-sm text-zinc-500">
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-zinc-400" />
              {formattedDate}
            </span>
            {shop?.ownerName && (
              <>
                <span className="text-zinc-300">•</span>
                <span>
                  Hi, <strong className="font-semibold text-zinc-800">{shop.ownerName}</strong>!
                </span>
              </>
            )}
          </div>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex items-center gap-2.5 shrink-0">
          <Link href="/sales/pos">
            <Button variant="primary" size="sm" className="font-semibold shadow-xs">
              <ReceiptText className="w-4 h-4 mr-1.5" />
              New Sale
            </Button>
          </Link>
          <Link href="/inventory/reorders">
            <Button variant="outline" size="sm" className="font-medium text-xs">
              <RotateCw className="w-3.5 h-3.5 mr-1" />
              Reorder List
            </Button>
          </Link>
        </div>
      </div>

      {/* ── Welcome Banner (only shown to new merchants with no data) ── */}
      {isNewMerchant && (
        <div className="rounded-2xl border border-brand-200 bg-gradient-to-br from-brand-50 to-white p-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex-1">
              <h2 className="text-base font-bold text-zinc-900">
                👋 Welcome to SELLORA!
              </h2>
              <p className="mt-1 text-sm text-zinc-600">
                Your store is set up and ready. Follow these 3 steps to get started:
              </p>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Step 1 */}
            <Link href="/inventory/products" className="group flex items-start gap-3 rounded-xl border border-zinc-200 bg-white p-4 hover:border-brand-400 hover:shadow-sm transition-all">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-100 text-brand-700 font-bold text-sm">
                1
              </div>
              <div>
                <p className="text-sm font-semibold text-zinc-900 group-hover:text-brand-700 transition-colors">
                  Add Products
                </p>
                <p className="text-xs text-zinc-500 mt-0.5 leading-relaxed">
                  Add the items you sell to build your catalog.
                </p>
                <span className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-brand-600">
                  Go to Products <ArrowRight className="w-3 h-3" />
                </span>
              </div>
            </Link>

            {/* Step 2 */}
            <Link href="/sales/pos" className="group flex items-start gap-3 rounded-xl border border-zinc-200 bg-white p-4 hover:border-brand-400 hover:shadow-sm transition-all">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 font-bold text-sm">
                2
              </div>
              <div>
                <p className="text-sm font-semibold text-zinc-900 group-hover:text-emerald-700 transition-colors">
                  Make Your First Sale
                </p>
                <p className="text-xs text-zinc-500 mt-0.5 leading-relaxed">
                  Use the Billing Counter to record a customer purchase.
                </p>
                <span className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-emerald-600">
                  Open Billing <ArrowRight className="w-3 h-3" />
                </span>
              </div>
            </Link>

            {/* Step 3 */}
            <Link href="/analytics" className="group flex items-start gap-3 rounded-xl border border-zinc-200 bg-white p-4 hover:border-brand-400 hover:shadow-sm transition-all">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-purple-100 text-purple-700 font-bold text-sm">
                3
              </div>
              <div>
                <p className="text-sm font-semibold text-zinc-900 group-hover:text-purple-700 transition-colors">
                  Track Your Business
                </p>
                <p className="text-xs text-zinc-500 mt-0.5 leading-relaxed">
                  View sales trends, stock health, and growth insights.
                </p>
                <span className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-purple-600">
                  View Analytics <ArrowRight className="w-3 h-3" />
                </span>
              </div>
            </Link>
          </div>
        </div>
      )}

      {/* KPI Stat Cards */}
      <KpiGrid />

      {/* Sales Trend & Stock Health */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2">
          <SalesTrendChart />
        </div>
        <div className="lg:col-span-1">
          <StockHealthCard />
        </div>
      </div>

      {/* Recommended Orders */}
      <div className="w-full">
        <RecommendedOrdersTable />
      </div>

      {/* Top Products vs Slow Moving */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <TopProductsList />
        <SlowMovingList />
      </div>

      {/* Business Insight */}
      <div className="w-full">
        <BusinessInsightCard />
      </div>
    </div>
  );
}
