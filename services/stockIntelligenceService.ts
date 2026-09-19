import { Product } from "@/types/inventory";
import { Sale } from "@/types/sales";
import {
  StockStatus,
  OrderPriority,
  SalesTrend,
  ProductDemandMetrics,
  ReorderRecommendation,
} from "@/types/stockIntelligence";
import { productService } from "./productService";
import { salesService } from "./salesService";

export const stockIntelligenceService = {
  /**
   * 1. DEMAND ANALYSIS
   * Computes Average Daily Sales, 7-Day Average, 30-Day Average,
   * Recent Sales Velocity, and Sales Trend using actual historical sales records.
   */
  calculateProductDemand(
    productId: string,
    allSales: Sale[]
  ): ProductDemandMetrics {
    const now = new Date().getTime();
    const ms7DaysAgo = now - 7 * 86400000;
    const ms14DaysAgo = now - 14 * 86400000;
    const ms30DaysAgo = now - 30 * 86400000;

    let unitsSold7d = 0;
    let unitsSoldPrev7d = 0;
    let unitsSold30d = 0;
    let totalUnitsSoldHistorical = 0;
    let totalSalesCount = 0;
    const activeDaysSet = new Set<string>();

    for (const sale of allSales) {
      const saleMs = new Date(sale.createdAt).getTime();

      for (const item of sale.items) {
        if (item.productId === productId) {
          const qty = item.quantity;
          totalUnitsSoldHistorical += qty;
          totalSalesCount += 1;
          activeDaysSet.add(sale.saleDate || sale.createdAt.split("T")[0]);

          if (saleMs >= ms7DaysAgo) {
            unitsSold7d += qty;
          } else if (saleMs >= ms14DaysAgo) {
            unitsSoldPrev7d += qty;
          }

          if (saleMs >= ms30DaysAgo) {
            unitsSold30d += qty;
          }
        }
      }
    }

    const avgDailyDemand7d = Number((unitsSold7d / 7).toFixed(2));
    const avgDailyDemand30d = Number((unitsSold30d / 30).toFixed(2));

    // Weighted Demand: 60% weight on recent 7d trend, 40% on monthly baseline
    let avgDailyDemand = 0;
    if (avgDailyDemand30d > 0) {
      avgDailyDemand = Number((0.6 * avgDailyDemand7d + 0.4 * avgDailyDemand30d).toFixed(2));
    } else if (avgDailyDemand7d > 0) {
      avgDailyDemand = avgDailyDemand7d;
    } else if (totalUnitsSoldHistorical > 0) {
      avgDailyDemand = Number((totalUnitsSoldHistorical / 60).toFixed(2));
    }

    // Recent Sales Velocity (units sold per active sales day)
    const activeDaysCount = Math.max(1, activeDaysSet.size);
    const recentSalesVelocity = Number((totalUnitsSoldHistorical / activeDaysCount).toFixed(2));

    // Sales Trend (7d vs prior 7d)
    let salesTrend: SalesTrend = "stable";
    if (unitsSold7d >= 3 && unitsSold7d > unitsSoldPrev7d * 1.15) {
      salesTrend = "increasing";
    } else if (unitsSoldPrev7d >= 3 && unitsSold7d < unitsSoldPrev7d * 0.85) {
      salesTrend = "declining";
    }

    // Limited history check
    const isLimitedData = totalSalesCount < 5 || activeDaysSet.size < 3;
    const limitedDataNotice = isLimitedData
      ? "Demand estimate based on limited sales history."
      : undefined;

    return {
      avgDailyDemand,
      avgDailyDemand7d,
      avgDailyDemand30d,
      recentSalesVelocity,
      salesTrend,
      isLimitedData,
      limitedDataNotice,
      totalUnitsSoldHistorical,
    };
  },

  /**
   * 2. DAYS OF INVENTORY (DAYS REMAINING)
   * Days Remaining = Current Stock / Average Daily Demand
   */
  calculateDaysRemaining(currentStock: number, avgDailyDemand: number): number {
    if (currentStock <= 0) return 0;
    if (avgDailyDemand <= 0) return 999; // Effectively infinite / no depletion
    return Number((currentStock / avgDailyDemand).toFixed(1));
  },

  /**
   * 3. REORDER POINT (ROP)
   * Expected Lead-Time Demand = Average Daily Demand × Supplier Lead Time
   * Safety Stock = max(minStock, 50% of LTD, 2 days of demand)
   * Reorder Point = Expected Lead-Time Demand + Safety Stock
   */
  calculateReorderPoint(
    avgDailyDemand: number,
    supplierLeadTime: number,
    minStock: number
  ): { expectedLeadTimeDemand: number; safetyStock: number; reorderPoint: number } {
    const leadTime = Math.max(1, supplierLeadTime);
    const expectedLeadTimeDemand = Number((avgDailyDemand * leadTime).toFixed(1));

    // Calculate robust safety stock buffer
    const dynamicBuffer = Math.max(
      Math.ceil(expectedLeadTimeDemand * 0.5),
      Math.ceil(avgDailyDemand * 2)
    );
    const safetyStock = Math.max(minStock, dynamicBuffer, 1);

    const reorderPoint = Math.ceil(expectedLeadTimeDemand + safetyStock);

    return {
      expectedLeadTimeDemand,
      safetyStock,
      reorderPoint,
    };
  },

  /**
   * 4. STOCK STATUS CLASSIFICATION
   * Dynamic evaluation considering Current Stock, Demand, and Supplier Lead Time.
   */
  classifyStockStatus(
    currentStock: number,
    daysRemaining: number,
    supplierLeadTime: number,
    reorderPoint: number
  ): StockStatus {
    if (currentStock <= 0) {
      return "OUT_OF_STOCK";
    }

    // Critical: days of stock left is <= supplier delivery window
    // (A replacement shipment cannot arrive in time before stock reaches 0)
    if (daysRemaining <= supplierLeadTime) {
      return "CRITICAL";
    }

    if (currentStock <= reorderPoint) {
      return "LOW";
    }

    if (daysRemaining > 45) {
      return "OVERSTOCK";
    }

    return "HEALTHY";
  },

  /**
   * 5. RECOMMENDED ORDER QUANTITY (ROQ)
   * Target Stock = (Lead Time + 14-Day Cycle) × Demand + Safety Stock
   * Deficit = Target Stock - Current Stock
   * Respects Supplier Minimum Order Quantity (MOQ).
   */
  calculateRecommendedOrderQuantity(
    currentStock: number,
    avgDailyDemand: number,
    supplierLeadTime: number,
    safetyStock: number,
    minOrderQuantity: number,
    reorderPoint: number
  ): { recommendedQuantity: number; moqApplied: boolean } {
    // If current stock is comfortably above reorder point, no reorder needed
    if (currentStock > reorderPoint) {
      return { recommendedQuantity: 0, moqApplied: false };
    }

    const leadTime = Math.max(1, supplierLeadTime);
    const reviewCycleDays = 14; // Standard 2-week inventory cycle buffer
    const targetStock = Math.ceil((leadTime + reviewCycleDays) * avgDailyDemand + safetyStock);
    const rawDeficit = Math.max(0, targetStock - currentStock);

    if (rawDeficit <= 0) {
      return { recommendedQuantity: 0, moqApplied: false };
    }

    const moq = Math.max(1, minOrderQuantity);
    let recommendedQuantity = Math.max(rawDeficit, moq);
    const moqApplied = rawDeficit < moq;

    // Round to whole units
    recommendedQuantity = Math.ceil(recommendedQuantity);

    return {
      recommendedQuantity,
      moqApplied,
    };
  },

  /**
   * 6. ORDER PRIORITY
   */
  determineOrderPriority(
    stockStatus: StockStatus,
    daysRemaining: number,
    supplierLeadTime: number,
    currentStock: number,
    reorderPoint: number
  ): OrderPriority {
    if (stockStatus === "OUT_OF_STOCK" || stockStatus === "CRITICAL") {
      return "ORDER_NOW";
    }

    if (stockStatus === "LOW") {
      return "ORDER_SOON";
    }

    // Monitor if stock is within 25% of reorder trigger
    if (currentStock <= reorderPoint * 1.25 || daysRemaining <= supplierLeadTime + 6) {
      return "MONITOR";
    }

    return "NO_ACTION";
  },

  /**
   * 7. WHY THIS ORDER? (DETERMINISTIC JUSTIFICATION)
   * Clear mathematical reasoning explaining exactly why the order is recommended.
   */
  generateWhyReasoning(
    productName: string,
    currentStock: number,
    unit: string,
    reorderPoint: number,
    daysRemaining: number,
    supplierLeadTime: number,
    avgDailyDemand: number,
    recommendedQuantity: number,
    moq: number,
    moqApplied: boolean,
    stockStatus: StockStatus
  ): string {
    if (stockStatus === "OUT_OF_STOCK") {
      return `"${productName}" is completely OUT OF STOCK (0 ${unit}). Immediate replenishment of ${recommendedQuantity} ${unit} is required to restore availability.`;
    }

    if (stockStatus === "CRITICAL") {
      return `CRITICAL STOCKOUT RISK: "${productName}" has only ${currentStock} ${unit} remaining (${daysRemaining} days of stock). Because supplier delivery takes ${supplierLeadTime} days, stock will deplete before delivery unless ordered immediately. Recommended order: ${recommendedQuantity} ${unit}${
        moqApplied ? ` (adjusted to meet supplier MOQ of ${moq} ${unit})` : ""
      }.`;
    }

    if (stockStatus === "LOW") {
      return `"${productName}" is below its calculated reorder point of ${reorderPoint} ${unit} (Current: ${currentStock} ${unit}). Based on daily demand of ${avgDailyDemand} ${unit}/day and a ${supplierLeadTime}-day lead time, ${recommendedQuantity} ${unit} are recommended to cover lead-time and a 14-day sales buffer${
        moqApplied ? ` (satisfies supplier MOQ of ${moq} ${unit})` : ""
      }.`;
    }

    if (stockStatus === "OVERSTOCK") {
      return `"${productName}" holds ${currentStock} ${unit} with an estimated ${daysRemaining} days of inventory remaining. No replenishment recommended to avoid excessive working capital lockup.`;
    }

    return `"${productName}" inventory is healthy at ${currentStock} ${unit} (${daysRemaining} days of supply), comfortably above the reorder threshold of ${reorderPoint} ${unit}.`;
  },

  /**
   * 8. GET ALL RECOMMENDATIONS
   * Aggregates and returns verified stock intelligence for all products in the shop.
   */
  getRecommendations(shopId: string): ReorderRecommendation[] {
    const products = productService.getProducts(shopId);
    const allSales = salesService.getSales(shopId);

    const recommendations: ReorderRecommendation[] = products.map((product) => {
      const demand = this.calculateProductDemand(product.id, allSales);
      const daysRemaining = this.calculateDaysRemaining(product.currentStock, demand.avgDailyDemand);

      const leadTime = product.supplierLeadTime || 2;
      const minOrderQty = product.minOrderQuantity || 10;

      const { expectedLeadTimeDemand, safetyStock, reorderPoint } = this.calculateReorderPoint(
        demand.avgDailyDemand,
        leadTime,
        product.minStock
      );

      const stockStatus = this.classifyStockStatus(
        product.currentStock,
        daysRemaining,
        leadTime,
        reorderPoint
      );

      const { recommendedQuantity, moqApplied } = this.calculateRecommendedOrderQuantity(
        product.currentStock,
        demand.avgDailyDemand,
        leadTime,
        safetyStock,
        minOrderQty,
        reorderPoint
      );

      const priority = this.determineOrderPriority(
        stockStatus,
        daysRemaining,
        leadTime,
        product.currentStock,
        reorderPoint
      );

      const estimatedCost = recommendedQuantity * (product.costPrice || 0);

      const whyReasoning = this.generateWhyReasoning(
        product.name,
        product.currentStock,
        product.unit || "Pcs",
        reorderPoint,
        daysRemaining,
        leadTime,
        demand.avgDailyDemand,
        recommendedQuantity,
        minOrderQty,
        moqApplied,
        stockStatus
      );

      return {
        productId: product.id,
        productName: product.name,
        sku: product.sku,
        category: product.categoryName || "General",
        imageUrl: product.imageUrl,
        unit: product.unit || "Pcs",
        currentStock: product.currentStock,
        minStock: product.minStock,
        costPrice: product.costPrice,
        sellingPrice: product.sellingPrice,
        supplierId: product.supplierId,
        supplierName: product.supplierName || "Default Supplier",
        supplierLeadTime: leadTime,
        minOrderQuantity: minOrderQty,
        demand,
        daysRemaining,
        expectedLeadTimeDemand,
        safetyStock,
        reorderPoint,
        recommendedQuantity,
        estimatedCost,
        stockStatus,
        priority,
        whyReasoning,
        moqApplied,
      };
    });

    // Sort: ORDER_NOW (0) -> ORDER_SOON (1) -> MONITOR (2) -> NO_ACTION (3)
    const priorityWeight: Record<OrderPriority, number> = {
      ORDER_NOW: 0,
      ORDER_SOON: 1,
      MONITOR: 2,
      NO_ACTION: 3,
    };

    return recommendations.sort((a, b) => {
      const pDiff = priorityWeight[a.priority] - priorityWeight[b.priority];
      if (pDiff !== 0) return pDiff;
      return a.daysRemaining - b.daysRemaining;
    });
  },

  /**
   * Helper: Get single recommendation by product ID
   */
  getRecommendationByProductId(shopId: string, productId: string): ReorderRecommendation | null {
    const all = this.getRecommendations(shopId);
    return all.find((r) => r.productId === productId) || null;
  },
};
