export type DateFilterPreset =
  | "today"
  | "yesterday"
  | "this_week"
  | "previous_week"
  | "this_month"
  | "previous_month"
  | "this_year"
  | "previous_year"
  | "last_7_days"
  | "last_30_days"
  | "last_90_days"
  | "last_12_months"
  | "custom";

export type TimeGranularity = "hourly" | "daily" | "weekly" | "monthly";

export interface DateRange {
  preset: DateFilterPreset;
  startDate: string; // ISO string YYYY-MM-DD
  endDate: string;   // ISO string YYYY-MM-DD
  startTime: string; // ISO 8601 full string
  endTime: string;   // ISO 8601 full string
  label: string;
  granularity: TimeGranularity;
  comparisonStartDate?: string;
  comparisonEndDate?: string;
  comparisonStartTime?: string;
  comparisonEndTime?: string;
  comparisonLabel?: string;
}

export interface SalesKPIs {
  totalRevenue: number;
  totalBills: number;
  itemsSold: number;
  avgBillValue: number;
  productsSoldCount: number;
  restockCount: number;
  restockUnits: number;
  estimatedGrossProfit: number;
  grossProfitMarginPct: number;
}

export interface ComparisonMetric {
  current: number;
  previous: number;
  diff: number;
  percentChange: number;
  hasSufficientData: boolean;
  isPositiveGood?: boolean;
}

export interface PeriodComparison {
  revenue: ComparisonMetric;
  units: ComparisonMetric;
  bills: ComparisonMetric;
  avgBill: ComparisonMetric;
  hasPreviousData: boolean;
  previousPeriodLabel: string;
}

export interface TimeSeriesPoint {
  key: string;       // e.g. "2026-09-18" or "14:00"
  label: string;     // e.g. "Fri, 18 Sep" or "2 PM"
  revenue: number;
  units: number;
  bills: number;
  avgBill: number;
}

export interface CategorySalesStat {
  categoryName: string;
  revenue: number;
  units: number;
  orderCount: number;
  percentageShare: number;
}

export interface ProductSalesStat {
  productId: string;
  productName: string;
  sku: string;
  categoryName: string;
  unitsSold: number;
  revenue: number;
  unitPrice: number;
  costPrice?: number;
  profit: number;
  marginPct: number;
  velocityPerDay: number; // units per active sales day
  trendVelocity?: "increasing" | "declining" | "stable";
  trendRatio?: number;    // second half vs first half ratio
}

export interface HourlySalesStat {
  hour: number;          // 0 to 23
  label: string;         // "12 AM", "1 AM", ...
  revenue: number;
  bills: number;
  units: number;
}

export interface ProductClassifications {
  topSelling: ProductSalesStat[];       // by units
  highestRevenue: ProductSalesStat[];   // by revenue
  fastMoving: ProductSalesStat[];       // highest turnover velocity
  slowMoving: ProductSalesStat[];       // lowest units / zero sales
  increasingSales: ProductSalesStat[];  // sales higher in 2nd half of period
  decliningSales: ProductSalesStat[];   // sales lower in 2nd half of period
}

export interface InventoryAnalyticsData {
  openingStock: number;
  stockAdded: number;
  unitsSold: number;
  closingStock: number;
  stockTurnoverRatio: number;
  stockoutCount: number;
  lowStockCount: number;
  restockEventCount: number;
  totalRestockCost: number;
}

export interface BusinessInsight {
  id: string;
  type: "revenue" | "product" | "category" | "inventory" | "velocity";
  severity: "positive" | "warning" | "neutral" | "info";
  title: string;
  message: string;
  metric?: string;
}

export type ReportType =
  | "daily_sales"
  | "weekly_sales"
  | "monthly_sales"
  | "yearly_sales"
  | "custom_date"
  | "inventory"
  | "product_performance";

export interface ReportDefinition {
  type: ReportType;
  title: string;
  description: string;
  headers: string[];
  rows: Array<Array<string | number>>;
  generatedAt: string;
  periodLabel: string;
  summaryMetrics?: Record<string, string | number>;
}
