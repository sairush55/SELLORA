export type StockStatus =
  | "OUT_OF_STOCK"
  | "CRITICAL"
  | "LOW"
  | "HEALTHY"
  | "OVERSTOCK";

export type OrderPriority =
  | "ORDER_NOW"
  | "ORDER_SOON"
  | "MONITOR"
  | "NO_ACTION";

export type SalesTrend = "increasing" | "declining" | "stable";

export interface ProductDemandMetrics {
  avgDailyDemand: number;       // Weighted daily demand run-rate
  avgDailyDemand7d: number;     // 7-day rolling average
  avgDailyDemand30d: number;    // 30-day rolling average
  recentSalesVelocity: number;  // Units sold per active sales day
  salesTrend: SalesTrend;       // Trend trajectory
  isLimitedData: boolean;       // Flag if history < 5 sales
  limitedDataNotice?: string;   // "Demand estimate based on limited sales history."
  totalUnitsSoldHistorical: number;
}

export interface ReorderRecommendation {
  productId: string;
  productName: string;
  sku: string;
  category: string;
  imageUrl?: string;
  unit: string;
  currentStock: number;
  minStock: number;
  costPrice: number;
  sellingPrice: number;
  supplierId?: string;
  supplierName: string;
  supplierLeadTime: number;     // In days
  minOrderQuantity: number;    // Supplier MOQ
  demand: ProductDemandMetrics;
  daysRemaining: number;        // Stock / Daily Demand (1 decimal place)
  expectedLeadTimeDemand: number; // Demand × Lead Time
  safetyStock: number;          // Buffer stock
  reorderPoint: number;         // LTD + Safety Stock
  recommendedQuantity: number;  // Target Stock - Current Stock (respecting MOQ)
  estimatedCost: number;        // RecommendedQuantity × CostPrice
  stockStatus: StockStatus;
  priority: OrderPriority;
  whyReasoning: string;         // Detailed mathematical justification
  moqApplied: boolean;          // True if MOQ bumped order quantity
}

export type AISummaryQuery =
  | "what_to_order"
  | "at_risk"
  | "monthly_performance"
  | "slow_moving"
  | "why_product";

export interface AIStockAnswer {
  query: string;
  queryType: AISummaryQuery | "custom";
  answer: string;
  groundedMetrics?: {
    actionableCount: number;
    totalProcurementCost: number;
    criticalSkus: string[];
    topRecommendedSku?: string;
  };
  isFallback: boolean;
  generatedAt: string;
}
