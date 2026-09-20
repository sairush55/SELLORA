"use client";

import React, { useState, useMemo } from "react";
import { useShop } from "@/hooks/useShop";
import { useDataRefresh } from "@/hooks/useDataRefresh";
import {
  DateFilterPreset,
  DateRange,
  SalesKPIs,
  PeriodComparison,
  TimeSeriesPoint,
  CategorySalesStat,
  HourlySalesStat,
  ProductClassifications,
  InventoryAnalyticsData,
  BusinessInsight,
  ReportDefinition,
} from "@/types/analytics";
import { analyticsService } from "@/services/analyticsService";
import { reportExportService } from "@/services/reportExportService";
import { DateFilter } from "@/components/analytics/DateFilter";
import { AnalyticsKpiCards } from "@/components/analytics/AnalyticsKpiCards";
import { TimeSeriesChart } from "@/components/analytics/TimeSeriesChart";
import { HourlyDistributionChart } from "@/components/analytics/HourlyDistributionChart";
import { CategorySalesChart } from "@/components/analytics/CategorySalesChart";
import { ProductPerformanceTable } from "@/components/analytics/ProductPerformanceTable";
import { InventoryAnalyticsCard } from "@/components/analytics/InventoryAnalyticsCard";
import { BusinessInsightsSection } from "@/components/analytics/BusinessInsightsSection";
import { ReportModal } from "@/components/analytics/ReportModal";
import { Button } from "@/components/ui/Button";
import {
  BarChart3,
  FileSpreadsheet,
  Printer,
  Package,
  Clock,
} from "lucide-react";

type AnalysisView = "overview" | "products" | "operations";

export default function AnalyticsPage() {
  const { shop } = useShop();
  const shopId = shop?.id || "shop-1";
  const { refreshTick } = useDataRefresh();

  // Active Date Range state
  const [dateRange, setDateRange] = useState<DateRange>(() =>
    analyticsService.resolveDateRange("this_week")
  );

  const [activeView, setActiveView] = useState<AnalysisView>("overview");
  const [activeReport, setActiveReport] = useState<ReportDefinition | null>(null);
  const [isReportOpen, setIsReportOpen] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Compute all analytics from actual raw database records
  const kpis: SalesKPIs = useMemo(
    () => analyticsService.calculateSalesKPIs(shopId, dateRange.startTime, dateRange.endTime),
    [shopId, dateRange, refreshTick]
  );

  const comparison: PeriodComparison = useMemo(
    () => analyticsService.calculatePeriodComparison(shopId, dateRange),
    [shopId, dateRange, refreshTick]
  );

  const timeSeries: TimeSeriesPoint[] = useMemo(
    () => analyticsService.getTimeSeriesData(shopId, dateRange),
    [shopId, dateRange, refreshTick]
  );

  const hourly: HourlySalesStat[] = useMemo(
    () => analyticsService.getHourlyDistribution(shopId, dateRange.startTime, dateRange.endTime),
    [shopId, dateRange, refreshTick]
  );

  const categories: CategorySalesStat[] = useMemo(
    () => analyticsService.getCategoryBreakdown(shopId, dateRange.startTime, dateRange.endTime),
    [shopId, dateRange, refreshTick]
  );

  const productRankings: ProductClassifications = useMemo(
    () => analyticsService.getProductRankings(shopId, dateRange),
    [shopId, dateRange, refreshTick]
  );

  const inventoryData: InventoryAnalyticsData = useMemo(
    () => analyticsService.getInventoryAnalytics(shopId, dateRange.startTime, dateRange.endTime),
    [shopId, dateRange, refreshTick]
  );

  const insights: BusinessInsight[] = useMemo(
    () =>
      analyticsService.generateBusinessInsights(
        shopId,
        kpis,
        comparison,
        productRankings,
        categories,
        hourly
      ),
    [shopId, kpis, comparison, productRankings, categories, hourly, refreshTick]
  );

  // Range change handler
  const handleRangeChange = (preset: DateFilterPreset, customStart?: string, customEnd?: string) => {
    setIsLoading(true);
    const newRange = analyticsService.resolveDateRange(preset, customStart, customEnd);
    setDateRange(newRange);
    setIsLoading(false);
  };

  // Open report preview
  const handleOpenReport = (type: any) => {
    const rep = reportExportService.generateReport(shopId, type, dateRange);
    setActiveReport(rep);
    setIsReportOpen(true);
  };

  return (
    <div className="space-y-5">
      {/* 1. Header & Primary Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-200/80">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-zinc-900 tracking-tight">
              Retail Intelligence & Analytics
            </h1>
            <span className="inline-flex items-center gap-1.5 text-[10px] font-mono font-semibold text-brand-700 bg-brand-50 border border-brand-200 px-2 py-0.5 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-500 animate-pulse" />
              Live Data
            </span>
          </div>
          <p className="text-xs text-zinc-500 mt-0.5">
            Real-time turnover velocity, margins, demand trends, and stock analytics
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleOpenReport("custom_date")}
            className="text-xs font-semibold gap-1.5"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            Export CSV
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => handleOpenReport("custom_date")}
            className="text-xs font-semibold gap-1.5 shadow-2xs"
          >
            <Printer className="w-3.5 h-3.5" />
            Print Report
          </Button>
        </div>
      </div>

      {/* 2. Streamlined Date Filtering System */}
      <DateFilter
        currentRange={dateRange}
        onRangeChange={handleRangeChange}
        isLoading={isLoading}
      />

      {/* 3. Purposeful Analysis Tabs */}
      <div className="flex items-center gap-1 border-b border-zinc-200/80 overflow-x-auto pb-1">
        <button
          type="button"
          onClick={() => setActiveView("overview")}
          className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-t-lg transition-colors whitespace-nowrap border-b-2 ${
            activeView === "overview"
              ? "border-zinc-900 text-zinc-900 bg-white"
              : "border-transparent text-zinc-500 hover:text-zinc-800"
          }`}
        >
          <BarChart3 className="w-3.5 h-3.5" />
          Store Overview
        </button>

        <button
          type="button"
          onClick={() => setActiveView("products")}
          className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-t-lg transition-colors whitespace-nowrap border-b-2 ${
            activeView === "products"
              ? "border-zinc-900 text-zinc-900 bg-white"
              : "border-transparent text-zinc-500 hover:text-zinc-800"
          }`}
        >
          <Package className="w-3.5 h-3.5 text-amber-600" />
          Product Rankings & Margins
        </button>

        <button
          type="button"
          onClick={() => setActiveView("operations")}
          className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-t-lg transition-colors whitespace-nowrap border-b-2 ${
            activeView === "operations"
              ? "border-zinc-900 text-zinc-900 bg-white"
              : "border-transparent text-zinc-500 hover:text-zinc-800"
          }`}
        >
          <Clock className="w-3.5 h-3.5 text-amber-600" />
          Peak Hours & Inventory Velocity
        </button>
      </div>

      {/* 4. Balanced 4-Card Executive KPI Grid */}
      <AnalyticsKpiCards kpis={kpis} comparison={comparison} />

      {/* 5. Sleek Store Insight Banner */}
      <BusinessInsightsSection insights={insights} />

      {/* 6. Context-Sensitive Visualizations */}
      {activeView === "overview" && (
        <div className="space-y-5">
          {/* Main Charts: Revenue Trend (2 cols) + Category Share (1 col) */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <div className="lg:col-span-2">
              <TimeSeriesChart
                data={timeSeries}
                granularity={dateRange.granularity}
                title="Store Turnover Over Time"
              />
            </div>

            <div className="lg:col-span-1">
              <CategorySalesChart categories={categories} />
            </div>
          </div>

          {/* Operational Secondary Grid: Peak Hours (1 col) + Inventory Flow (1 col) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <HourlyDistributionChart data={hourly} />
            <InventoryAnalyticsCard data={inventoryData} />
          </div>

          {/* Top Products Table */}
          <ProductPerformanceTable classifications={productRankings} />
        </div>
      )}

      {activeView === "products" && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <div className="lg:col-span-2">
              <ProductPerformanceTable classifications={productRankings} />
            </div>
            <div className="lg:col-span-1">
              <CategorySalesChart categories={categories} />
            </div>
          </div>
        </div>
      )}

      {activeView === "operations" && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <HourlyDistributionChart data={hourly} />
            <InventoryAnalyticsCard data={inventoryData} />
          </div>
        </div>
      )}

      {/* Report Modal */}
      <ReportModal
        report={activeReport}
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
      />
    </div>
  );
}
