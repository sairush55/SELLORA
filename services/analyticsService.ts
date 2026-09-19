import {
  DateFilterPreset,
  DateRange,
  SalesKPIs,
  PeriodComparison,
  ComparisonMetric,
  TimeSeriesPoint,
  CategorySalesStat,
  ProductSalesStat,
  HourlySalesStat,
  ProductClassifications,
  InventoryAnalyticsData,
  BusinessInsight,
} from "@/types/analytics";
import { salesService } from "./salesService";
import { productService } from "./productService";
import { categoryService } from "./categoryService";
import { inventoryMovementService } from "./inventoryMovementService";

export const analyticsService = {
  /**
   * 1. RESOLVE DATE RANGE
   * Converts any preset or custom range into exact ISO boundaries,
   * selects optimal chart granularity, and calculates comparison period boundaries.
   */
  resolveDateRange(
    preset: DateFilterPreset,
    customStart?: string,
    customEnd?: string
  ): DateRange {
    const now = new Date();
    const todayStr = now.toISOString().split("T")[0];

    const startOfDay = (d: Date): Date => {
      const res = new Date(d);
      res.setHours(0, 0, 0, 0);
      return res;
    };

    const endOfDay = (d: Date): Date => {
      const res = new Date(d);
      res.setHours(23, 59, 59, 999);
      return res;
    };

    let start: Date;
    let end: Date = endOfDay(now);
    let compStart: Date | undefined;
    let compEnd: Date | undefined;
    let label = "";
    let compLabel = "";
    let granularity: "hourly" | "daily" | "weekly" | "monthly" = "daily";

    switch (preset) {
      case "today": {
        start = startOfDay(now);
        end = endOfDay(now);
        label = "Today";
        granularity = "hourly";

        const yest = new Date(now.getTime() - 86400000);
        compStart = startOfDay(yest);
        compEnd = endOfDay(yest);
        compLabel = "Yesterday";
        break;
      }

      case "yesterday": {
        const yest = new Date(now.getTime() - 86400000);
        start = startOfDay(yest);
        end = endOfDay(yest);
        label = "Yesterday";
        granularity = "hourly";

        const dayBefore = new Date(now.getTime() - 2 * 86400000);
        compStart = startOfDay(dayBefore);
        compEnd = endOfDay(dayBefore);
        compLabel = "Day Before Yesterday";
        break;
      }

      case "this_week": {
        const day = now.getDay();
        const diffToMon = (day === 0 ? -6 : 1) - day;
        start = startOfDay(new Date(now.getTime() + diffToMon * 86400000));
        end = endOfDay(now);
        label = "This Week";
        granularity = "daily";

        // Previous week Monday to Sunday
        compStart = new Date(start.getTime() - 7 * 86400000);
        compEnd = new Date(compStart.getTime() + 6 * 86400000 + (23 * 3600000 + 59 * 60000 + 59000));
        compLabel = "Previous Week";
        break;
      }

      case "previous_week": {
        const day = now.getDay();
        const diffToMon = (day === 0 ? -6 : 1) - day;
        const thisMon = startOfDay(new Date(now.getTime() + diffToMon * 86400000));
        start = new Date(thisMon.getTime() - 7 * 86400000);
        end = endOfDay(new Date(start.getTime() + 6 * 86400000));
        label = "Previous Week";
        granularity = "daily";

        compStart = new Date(start.getTime() - 7 * 86400000);
        compEnd = endOfDay(new Date(compStart.getTime() + 6 * 86400000));
        compLabel = "2 Weeks Ago";
        break;
      }

      case "this_month": {
        start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
        end = endOfDay(now);
        label = "This Month";
        granularity = "daily";

        compStart = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0, 0);
        compEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
        compLabel = "Previous Month";
        break;
      }

      case "previous_month": {
        start = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0, 0);
        end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
        label = "Previous Month";
        granularity = "daily";

        compStart = new Date(now.getFullYear(), now.getMonth() - 2, 1, 0, 0, 0, 0);
        compEnd = new Date(now.getFullYear(), now.getMonth() - 1, 0, 23, 59, 59, 999);
        compLabel = "2 Months Ago";
        break;
      }

      case "this_year": {
        start = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);
        end = endOfDay(now);
        label = `This Year (${now.getFullYear()})`;
        granularity = "monthly";

        compStart = new Date(now.getFullYear() - 1, 0, 1, 0, 0, 0, 0);
        compEnd = new Date(now.getFullYear() - 1, 11, 31, 23, 59, 59, 999);
        compLabel = `Previous Year (${now.getFullYear() - 1})`;
        break;
      }

      case "previous_year": {
        start = new Date(now.getFullYear() - 1, 0, 1, 0, 0, 0, 0);
        end = new Date(now.getFullYear() - 1, 11, 31, 23, 59, 59, 999);
        label = `Previous Year (${now.getFullYear() - 1})`;
        granularity = "monthly";

        compStart = new Date(now.getFullYear() - 2, 0, 1, 0, 0, 0, 0);
        compEnd = new Date(now.getFullYear() - 2, 11, 31, 23, 59, 59, 999);
        compLabel = `Year ${now.getFullYear() - 2}`;
        break;
      }

      case "last_7_days": {
        start = startOfDay(new Date(now.getTime() - 6 * 86400000));
        end = endOfDay(now);
        label = "Last 7 Days";
        granularity = "daily";

        compStart = startOfDay(new Date(start.getTime() - 7 * 86400000));
        compEnd = endOfDay(new Date(start.getTime() - 86400000));
        compLabel = "Prior 7 Days";
        break;
      }

      case "last_30_days": {
        start = startOfDay(new Date(now.getTime() - 29 * 86400000));
        end = endOfDay(now);
        label = "Last 30 Days";
        granularity = "daily";

        compStart = startOfDay(new Date(start.getTime() - 30 * 86400000));
        compEnd = endOfDay(new Date(start.getTime() - 86400000));
        compLabel = "Prior 30 Days";
        break;
      }

      case "last_90_days": {
        start = startOfDay(new Date(now.getTime() - 89 * 86400000));
        end = endOfDay(now);
        label = "Last 90 Days";
        granularity = "weekly";

        compStart = startOfDay(new Date(start.getTime() - 90 * 86400000));
        compEnd = endOfDay(new Date(start.getTime() - 86400000));
        compLabel = "Prior 90 Days";
        break;
      }

      case "last_12_months": {
        start = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate(), 0, 0, 0, 0);
        end = endOfDay(now);
        label = "Last 12 Months";
        granularity = "monthly";

        compStart = new Date(now.getFullYear() - 2, now.getMonth(), now.getDate(), 0, 0, 0, 0);
        compEnd = new Date(start.getTime() - 1);
        compLabel = "Prior 12 Months";
        break;
      }

      case "custom": {
        if (customStart && customEnd) {
          start = startOfDay(new Date(customStart));
          end = endOfDay(new Date(customEnd));
        } else if (customStart) {
          start = startOfDay(new Date(customStart));
          end = endOfDay(new Date(customStart));
        } else {
          start = startOfDay(new Date(now.getTime() - 7 * 86400000));
          end = endOfDay(now);
        }

        const durationMs = end.getTime() - start.getTime();
        const durationDays = Math.ceil(durationMs / 86400000);

        label = `Custom (${start.toISOString().split("T")[0]} to ${end.toISOString().split("T")[0]})`;

        if (durationDays <= 1) granularity = "hourly";
        else if (durationDays <= 31) granularity = "daily";
        else if (durationDays <= 90) granularity = "weekly";
        else granularity = "monthly";

        // Equal length prior period
        compEnd = new Date(start.getTime() - 1);
        compStart = new Date(compEnd.getTime() - durationMs);
        compLabel = `Prior ${durationDays} Days`;
        break;
      }

      default: {
        start = startOfDay(new Date(now.getTime() - 29 * 86400000));
        end = endOfDay(now);
        label = "Last 30 Days";
        granularity = "daily";
      }
    }

    return {
      preset,
      startDate: start.toISOString().split("T")[0],
      endDate: end.toISOString().split("T")[0],
      startTime: start.toISOString(),
      endTime: end.toISOString(),
      label,
      granularity,
      comparisonStartDate: compStart?.toISOString().split("T")[0],
      comparisonEndDate: compEnd?.toISOString().split("T")[0],
      comparisonStartTime: compStart?.toISOString(),
      comparisonEndTime: compEnd?.toISOString(),
      comparisonLabel: compLabel,
    };
  },

  /**
   * 2. RAW DATABASE SALES KPIS
   * Queries actual sales and movements. No hardcoded or mock numbers.
   */
  calculateSalesKPIs(shopId: string, startTime: string, endTime: string): SalesKPIs {
    const allSales = salesService.getSales(shopId);
    const startMs = new Date(startTime).getTime();
    const endMs = new Date(endTime).getTime();

    // Filter strictly within period
    const periodSales = allSales.filter((s) => {
      const saleMs = new Date(s.createdAt).getTime();
      return saleMs >= startMs && saleMs <= endMs;
    });

    let totalRevenue = 0;
    let itemsSold = 0;
    let estimatedGrossProfit = 0;
    const soldProductIds = new Set<string>();

    const allProducts = productService.getProducts(shopId);
    const productCostMap: Record<string, number> = {};
    for (const p of allProducts) {
      productCostMap[p.id] = p.costPrice || 0;
    }

    for (const sale of periodSales) {
      totalRevenue += sale.totalAmount;

      for (const item of sale.items) {
        itemsSold += item.quantity;
        soldProductIds.add(item.productId);

        const cost = item.costPrice !== undefined ? item.costPrice : (productCostMap[item.productId] || 0);
        const itemProfit = item.subtotal - (cost * item.quantity);
        estimatedGrossProfit += itemProfit;
      }

      // If sale had discount, deduct from gross profit
      if (sale.discount) {
        estimatedGrossProfit -= sale.discount;
      }
    }

    const totalBills = periodSales.length;
    const avgBillValue = totalBills > 0 ? Math.round(totalRevenue / totalBills) : 0;
    const grossProfitMarginPct = totalRevenue > 0
      ? Number(((estimatedGrossProfit / totalRevenue) * 100).toFixed(1))
      : 0;

    // Query Restocks in the period
    const allMovements = inventoryMovementService.getMovements(shopId);
    const periodRestocks = allMovements.filter((m) => {
      const movMs = new Date(m.createdAt).getTime();
      return m.movementType === "RESTOCK" && movMs >= startMs && movMs <= endMs;
    });

    const restockCount = periodRestocks.length;
    const restockUnits = periodRestocks.reduce((sum, m) => sum + Math.max(0, m.quantityChange), 0);

    return {
      totalRevenue,
      totalBills,
      itemsSold,
      avgBillValue,
      productsSoldCount: soldProductIds.size,
      restockCount,
      restockUnits,
      estimatedGrossProfit: Math.max(0, estimatedGrossProfit),
      grossProfitMarginPct,
    };
  },

  /**
   * 3. PERIOD COMPARISON ENGINE
   * Compares current period against baseline with safe division and data sufficiency flags.
   */
  calculatePeriodComparison(shopId: string, dateRange: DateRange): PeriodComparison {
    const currentKPIs = this.calculateSalesKPIs(shopId, dateRange.startTime, dateRange.endTime);

    if (!dateRange.comparisonStartTime || !dateRange.comparisonEndTime) {
      return {
        revenue: this.createComparisonMetric(currentKPIs.totalRevenue, 0, false),
        units: this.createComparisonMetric(currentKPIs.itemsSold, 0, false),
        bills: this.createComparisonMetric(currentKPIs.totalBills, 0, false),
        avgBill: this.createComparisonMetric(currentKPIs.avgBillValue, 0, false),
        hasPreviousData: false,
        previousPeriodLabel: "No comparison period",
      };
    }

    const prevKPIs = this.calculateSalesKPIs(
      shopId,
      dateRange.comparisonStartTime,
      dateRange.comparisonEndTime
    );

    const hasPreviousData = prevKPIs.totalBills > 0 || prevKPIs.totalRevenue > 0;

    return {
      revenue: this.createComparisonMetric(currentKPIs.totalRevenue, prevKPIs.totalRevenue, hasPreviousData),
      units: this.createComparisonMetric(currentKPIs.itemsSold, prevKPIs.itemsSold, hasPreviousData),
      bills: this.createComparisonMetric(currentKPIs.totalBills, prevKPIs.totalBills, hasPreviousData),
      avgBill: this.createComparisonMetric(currentKPIs.avgBillValue, prevKPIs.avgBillValue, hasPreviousData),
      hasPreviousData,
      previousPeriodLabel: dateRange.comparisonLabel || "Previous Period",
    };
  },

  createComparisonMetric(current: number, previous: number, hasSufficientData: boolean): ComparisonMetric {
    const diff = current - previous;
    let percentChange = 0;

    if (hasSufficientData && previous > 0) {
      percentChange = Number((((current - previous) / previous) * 100).toFixed(1));
    } else if (hasSufficientData && previous === 0 && current > 0) {
      percentChange = 100;
    }

    return {
      current,
      previous,
      diff,
      percentChange,
      hasSufficientData,
      isPositiveGood: true,
    };
  },

  /**
   * 4. TIME SERIES AGGREGATION
   * Generates chronological buckets (hourly, daily, weekly, monthly) from actual raw sales.
   */
  getTimeSeriesData(shopId: string, dateRange: DateRange): TimeSeriesPoint[] {
    const allSales = salesService.getSales(shopId);
    const startMs = new Date(dateRange.startTime).getTime();
    const endMs = new Date(dateRange.endTime).getTime();

    const periodSales = allSales.filter((s) => {
      const ms = new Date(s.createdAt).getTime();
      return ms >= startMs && ms <= endMs;
    });

    const points: Record<string, TimeSeriesPoint> = {};

    if (dateRange.granularity === "hourly") {
      // 24 buckets: 00:00 to 23:00
      for (let h = 0; h < 24; h++) {
        const key = String(h).padStart(2, "0");
        const hour12 = h === 0 ? "12 AM" : h < 12 ? `${h} AM` : h === 12 ? "12 PM" : `${h - 12} PM`;
        points[key] = {
          key,
          label: hour12,
          revenue: 0,
          units: 0,
          bills: 0,
          avgBill: 0,
        };
      }

      for (const s of periodSales) {
        const hourKey = String(new Date(s.createdAt).getHours()).padStart(2, "0");
        if (points[hourKey]) {
          points[hourKey].revenue += s.totalAmount;
          points[hourKey].bills += 1;
          for (const item of s.items) {
            points[hourKey].units += item.quantity;
          }
        }
      }
    } else if (dateRange.granularity === "daily") {
      // Buckets for every day between start and end
      const curr = new Date(dateRange.startTime);
      const endD = new Date(dateRange.endTime);

      while (curr.getTime() <= endD.getTime()) {
        const yyyy = curr.getFullYear();
        const mm = String(curr.getMonth() + 1).padStart(2, "0");
        const dd = String(curr.getDate()).padStart(2, "0");
        const dateKey = `${yyyy}-${mm}-${dd}`;
        const dayLabel = curr.toLocaleDateString("en-IN", {
          day: "numeric",
          month: "short",
        });

        points[dateKey] = {
          key: dateKey,
          label: dayLabel,
          revenue: 0,
          units: 0,
          bills: 0,
          avgBill: 0,
        };

        curr.setDate(curr.getDate() + 1);
      }

      for (const s of periodSales) {
        const dateKey = s.saleDate || s.createdAt.split("T")[0];
        if (points[dateKey]) {
          points[dateKey].revenue += s.totalAmount;
          points[dateKey].bills += 1;
          for (const item of s.items) {
            points[dateKey].units += item.quantity;
          }
        }
      }
    } else if (dateRange.granularity === "weekly") {
      // Group by week (e.g. W1, W2, W3)
      const numDays = Math.ceil((endMs - startMs) / 86400000);
      const numWeeks = Math.max(1, Math.ceil(numDays / 7));

      for (let w = 1; w <= numWeeks; w++) {
        const key = `W${w}`;
        points[key] = {
          key,
          label: `Week ${w}`,
          revenue: 0,
          units: 0,
          bills: 0,
          avgBill: 0,
        };
      }

      for (const s of periodSales) {
        const saleMs = new Date(s.createdAt).getTime();
        const dayOffset = Math.floor((saleMs - startMs) / 86400000);
        const weekNum = Math.min(numWeeks, Math.floor(dayOffset / 7) + 1);
        const key = `W${weekNum}`;
        if (points[key]) {
          points[key].revenue += s.totalAmount;
          points[key].bills += 1;
          for (const item of s.items) {
            points[key].units += item.quantity;
          }
        }
      }
    } else {
      // Monthly buckets
      const curr = new Date(dateRange.startTime);
      const endD = new Date(dateRange.endTime);
      curr.setDate(1);

      while (curr.getTime() <= endD.getTime()) {
        const yyyy = curr.getFullYear();
        const mm = String(curr.getMonth() + 1).padStart(2, "0");
        const monthKey = `${yyyy}-${mm}`;
        const monthLabel = curr.toLocaleDateString("en-IN", {
          month: "short",
          year: "2-digit",
        });

        points[monthKey] = {
          key: monthKey,
          label: monthLabel,
          revenue: 0,
          units: 0,
          bills: 0,
          avgBill: 0,
        };

        curr.setMonth(curr.getMonth() + 1);
      }

      for (const s of periodSales) {
        const d = new Date(s.createdAt);
        const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        if (points[monthKey]) {
          points[monthKey].revenue += s.totalAmount;
          points[monthKey].bills += 1;
          for (const item of s.items) {
            points[monthKey].units += item.quantity;
          }
        }
      }
    }

    // Calculate avg bill for all points
    return Object.values(points).map((pt) => ({
      ...pt,
      avgBill: pt.bills > 0 ? Math.round(pt.revenue / pt.bills) : 0,
    }));
  },

  /**
   * 5. HOURLY DISTRIBUTION
   * 24-hour retail sales velocity curve.
   */
  getHourlyDistribution(shopId: string, startTime: string, endTime: string): HourlySalesStat[] {
    const allSales = salesService.getSales(shopId);
    const startMs = new Date(startTime).getTime();
    const endMs = new Date(endTime).getTime();

    const periodSales = allSales.filter((s) => {
      const ms = new Date(s.createdAt).getTime();
      return ms >= startMs && ms <= endMs;
    });

    const hours: HourlySalesStat[] = [];
    for (let h = 0; h < 24; h++) {
      const label = h === 0 ? "12 AM" : h < 12 ? `${h} AM` : h === 12 ? "12 PM" : `${h - 12} PM`;
      hours.push({
        hour: h,
        label,
        revenue: 0,
        bills: 0,
        units: 0,
      });
    }

    for (const s of periodSales) {
      const h = new Date(s.createdAt).getHours();
      if (hours[h]) {
        hours[h].revenue += s.totalAmount;
        hours[h].bills += 1;
        for (const item of s.items) {
          hours[h].units += item.quantity;
        }
      }
    }

    return hours;
  },

  /**
   * 6. SALES BY CATEGORY
   * Aggregates category turnover and percentage contribution.
   */
  getCategoryBreakdown(shopId: string, startTime: string, endTime: string): CategorySalesStat[] {
    const allSales = salesService.getSales(shopId);
    const allProducts = productService.getProducts(shopId);
    const startMs = new Date(startTime).getTime();
    const endMs = new Date(endTime).getTime();

    const productCategoryMap: Record<string, string> = {};
    for (const p of allProducts) {
      productCategoryMap[p.id] = p.categoryName || "General";
    }

    const categoryMap: Record<string, { revenue: number; units: number; orderCount: number }> = {};
    let totalRevenue = 0;

    for (const sale of allSales) {
      const ms = new Date(sale.createdAt).getTime();
      if (ms < startMs || ms > endMs) continue;

      totalRevenue += sale.totalAmount;

      for (const item of sale.items) {
        const cat = productCategoryMap[item.productId] || "Groceries";
        if (!categoryMap[cat]) {
          categoryMap[cat] = { revenue: 0, units: 0, orderCount: 0 };
        }
        categoryMap[cat].revenue += item.subtotal;
        categoryMap[cat].units += item.quantity;
        categoryMap[cat].orderCount += 1;
      }
    }

    return Object.entries(categoryMap)
      .map(([categoryName, data]) => ({
        categoryName,
        revenue: data.revenue,
        units: data.units,
        orderCount: data.orderCount,
        percentageShare: totalRevenue > 0 ? Number(((data.revenue / totalRevenue) * 100).toFixed(1)) : 0,
      }))
      .sort((a, b) => b.revenue - a.revenue);
  },

  /**
   * 7. PRODUCT ANALYTICS & CLASSIFICATIONS
   * Computes top selling, highest revenue, fast moving, slow moving,
   * increasing sales, and declining sales using real item sales velocity.
   */
  getProductRankings(shopId: string, dateRange: DateRange): ProductClassifications {
    const allSales = salesService.getSales(shopId);
    const allProducts = productService.getProducts(shopId);
    const startMs = new Date(dateRange.startTime).getTime();
    const endMs = new Date(dateRange.endTime).getTime();
    const midMs = startMs + (endMs - startMs) / 2;
    const durationDays = Math.max(1, Math.ceil((endMs - startMs) / 86400000));

    // Maps for product metrics
    const statsMap: Record<
      string,
      {
        unitsSold: number;
        revenue: number;
        profit: number;
        unitsH1: number;
        unitsH2: number;
      }
    > = {};

    for (const p of allProducts) {
      statsMap[p.id] = {
        unitsSold: 0,
        revenue: 0,
        profit: 0,
        unitsH1: 0,
        unitsH2: 0,
      };
    }

    for (const sale of allSales) {
      const ms = new Date(sale.createdAt).getTime();
      if (ms < startMs || ms > endMs) continue;

      const isFirstHalf = ms <= midMs;

      for (const item of sale.items) {
        if (!statsMap[item.productId]) {
          statsMap[item.productId] = {
            unitsSold: 0,
            revenue: 0,
            profit: 0,
            unitsH1: 0,
            unitsH2: 0,
          };
        }

        const stat = statsMap[item.productId];
        stat.unitsSold += item.quantity;
        stat.revenue += item.subtotal;

        const cost = item.costPrice || 0;
        stat.profit += (item.subtotal - cost * item.quantity);

        if (isFirstHalf) {
          stat.unitsH1 += item.quantity;
        } else {
          stat.unitsH2 += item.quantity;
        }
      }
    }

    const productStats: ProductSalesStat[] = allProducts.map((p) => {
      const s = statsMap[p.id] || { unitsSold: 0, revenue: 0, profit: 0, unitsH1: 0, unitsH2: 0 };
      const velocityPerDay = Number((s.unitsSold / durationDays).toFixed(2));
      const marginPct = s.revenue > 0 ? Number(((s.profit / s.revenue) * 100).toFixed(1)) : 0;

      let trendVelocity: "increasing" | "declining" | "stable" = "stable";
      let trendRatio = 1;

      if (s.unitsH1 + s.unitsH2 >= 3) {
        trendRatio = s.unitsH1 > 0 ? Number((s.unitsH2 / s.unitsH1).toFixed(2)) : 2;
        if (s.unitsH2 > s.unitsH1 * 1.15) {
          trendVelocity = "increasing";
        } else if (s.unitsH1 > s.unitsH2 * 1.15) {
          trendVelocity = "declining";
        }
      }

      return {
        productId: p.id,
        productName: p.name,
        sku: p.sku,
        categoryName: p.categoryName || "General",
        unitsSold: s.unitsSold,
        revenue: s.revenue,
        unitPrice: p.sellingPrice,
        costPrice: p.costPrice,
        profit: s.profit,
        marginPct,
        velocityPerDay,
        trendVelocity,
        trendRatio,
      };
    });

    const topSelling = [...productStats].sort((a, b) => b.unitsSold - a.unitsSold);
    const highestRevenue = [...productStats].sort((a, b) => b.revenue - a.revenue);
    const fastMoving = [...productStats]
      .filter((p) => p.unitsSold > 0)
      .sort((a, b) => b.velocityPerDay - a.velocityPerDay);

    // Slow moving: products with <= 2 sales during the period
    const slowMoving = [...productStats]
      .filter((p) => p.unitsSold <= 2)
      .sort((a, b) => a.unitsSold - b.unitsSold);

    const increasingSales = [...productStats]
      .filter((p) => p.trendVelocity === "increasing")
      .sort((a, b) => (b.trendRatio || 0) - (a.trendRatio || 0));

    const decliningSales = [...productStats]
      .filter((p) => p.trendVelocity === "declining")
      .sort((a, b) => (a.trendRatio || 0) - (b.trendRatio || 0));

    return {
      topSelling,
      highestRevenue,
      fastMoving,
      slowMoving,
      increasingSales,
      decliningSales,
    };
  },

  /**
   * 8. INVENTORY ANALYTICS
   * Opening stock, stock added, units sold, closing stock, and turnover.
   */
  getInventoryAnalytics(shopId: string, startTime: string, endTime: string): InventoryAnalyticsData {
    const products = productService.getProducts(shopId);
    const currentStockSum = products.reduce((sum, p) => sum + p.currentStock, 0);

    const startMs = new Date(startTime).getTime();
    const endMs = new Date(endTime).getTime();

    const movements = inventoryMovementService.getMovements(shopId);

    // Reconstruct opening stock: currentStock - sum(movements created after start)
    let movementsAfterStart = 0;
    let movementsAfterEnd = 0;
    let stockAdded = 0;
    let unitsSold = 0;
    let totalRestockCost = 0;
    let restockEventCount = 0;

    for (const mov of movements) {
      const movMs = new Date(mov.createdAt).getTime();

      if (movMs > startMs) {
        movementsAfterStart += mov.quantityChange;
      }
      if (movMs > endMs) {
        movementsAfterEnd += mov.quantityChange;
      }

      // Movements within the period
      if (movMs >= startMs && movMs <= endMs) {
        if (mov.movementType === "RESTOCK") {
          const added = Math.max(0, mov.quantityChange);
          stockAdded += added;
          restockEventCount += 1;
          totalRestockCost += added * (mov.costPerUnit || 0);
        } else if (mov.movementType === "SALE" || mov.movementType === "DAILY_SUMMARY_SALE") {
          unitsSold += Math.abs(mov.quantityChange);
        } else if (mov.movementType === "DAILY_SUMMARY_ADJUSTMENT") {
          if (mov.quantityChange < 0) {
            unitsSold += Math.abs(mov.quantityChange);
          }
        }
      }
    }

    const openingStock = Math.max(0, currentStockSum - movementsAfterStart);
    const closingStock = Math.max(0, currentStockSum - movementsAfterEnd);
    const avgInventory = Math.max(1, (openingStock + closingStock) / 2);
    const stockTurnoverRatio = Number((unitsSold / avgInventory).toFixed(2));

    const stockoutCount = products.filter((p) => p.currentStock === 0).length;
    const lowStockCount = products.filter((p) => p.currentStock > 0 && p.currentStock <= p.minStock).length;

    return {
      openingStock,
      stockAdded,
      unitsSold,
      closingStock,
      stockTurnoverRatio,
      stockoutCount,
      lowStockCount,
      restockEventCount,
      totalRestockCost,
    };
  },

  /**
   * 9. BUSINESS INSIGHTS ENGINE
   * Generates dynamic natural language business observations backed strictly by actual data.
   */
  generateBusinessInsights(
    shopId: string,
    kpis: SalesKPIs,
    comparison: PeriodComparison,
    rankings: ProductClassifications,
    categories: CategorySalesStat[],
    hourly: HourlySalesStat[]
  ): BusinessInsight[] {
    const insights: BusinessInsight[] = [];

    // 1. Top Product Velocity Insight
    if (rankings.topSelling.length > 0 && rankings.topSelling[0].unitsSold > 0) {
      const top = rankings.topSelling[0];
      insights.push({
        id: "bi-top-prod",
        type: "product",
        severity: "positive",
        title: "Leading Revenue Driver",
        message: `"${top.productName}" was your highest-selling product with ${top.unitsSold} units sold, generating ₹${top.revenue.toLocaleString("en-IN")}.`,
        metric: `${top.unitsSold} units`,
      });
    }

    // 2. Period Revenue Comparison Insight
    if (comparison.hasPreviousData) {
      const pct = comparison.revenue.percentChange;
      const diff = comparison.revenue.diff;
      if (diff >= 0) {
        insights.push({
          id: "bi-revenue-growth",
          type: "revenue",
          severity: "positive",
          title: "Revenue Growth",
          message: `Revenue increased by +${pct}% (+₹${diff.toLocaleString("en-IN")}) compared to ${comparison.previousPeriodLabel.toLowerCase()}.`,
          metric: `+${pct}%`,
        });
      } else {
        insights.push({
          id: "bi-revenue-dip",
          type: "revenue",
          severity: "warning",
          title: "Pacing Contraction",
          message: `Revenue declined by ${pct}% (-₹${Math.abs(diff).toLocaleString("en-IN")}) compared to ${comparison.previousPeriodLabel.toLowerCase()}.`,
          metric: `${pct}%`,
        });
      }
    }

    // 3. Category Dominance Insight
    if (categories.length > 0 && categories[0].revenue > 0) {
      const topCat = categories[0];
      insights.push({
        id: "bi-top-cat",
        type: "category",
        severity: "info",
        title: "Category Dominance",
        message: `${topCat.categoryName} contributed ${topCat.percentageShare}% of total gross revenue (₹${topCat.revenue.toLocaleString("en-IN")}).`,
        metric: `${topCat.percentageShare}% share`,
      });
    }

    // 4. Peak Velocity Hour Insight
    const peakHour = [...hourly].sort((a, b) => b.revenue - a.revenue)[0];
    if (peakHour && peakHour.revenue > 0) {
      insights.push({
        id: "bi-peak-hour",
        type: "velocity",
        severity: "neutral",
        title: "Peak Sales Window",
        message: `Busiest shopping window is ${peakHour.label} with ${peakHour.bills} orders recorded and ₹${peakHour.revenue.toLocaleString("en-IN")} in turnover.`,
        metric: peakHour.label,
      });
    }

    // 5. Slow Moving Products Flag
    if (rankings.slowMoving.length > 0) {
      const slow = rankings.slowMoving[0];
      insights.push({
        id: "bi-slow-prod",
        type: "inventory",
        severity: "warning",
        title: "Slow-Moving Inventory Alert",
        message: `"${slow.productName}" recorded only ${slow.unitsSold} sales during this period. Review shelf space or consider promotional bundling.`,
        metric: `${slow.unitsSold} sales`,
      });
    }

    // 6. Restock & Purchasing Insight
    if (kpis.restockCount > 0) {
      insights.push({
        id: "bi-restock",
        type: "inventory",
        severity: "info",
        title: "Inventory Replenishment",
        message: `${kpis.restockCount} restock shipments were received during this period, adding ${kpis.restockUnits} units to active warehouse stock.`,
        metric: `${kpis.restockUnits} units`,
      });
    }

    return insights;
  },
};
