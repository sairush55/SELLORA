import { ReportType, ReportDefinition, DateRange } from "@/types/analytics";
import { analyticsService } from "./analyticsService";
import { productService } from "./productService";
import { inventoryMovementService } from "./inventoryMovementService";

export const reportExportService = {
  /**
   * Generates formatted dataset for any of the 7 report types.
   */
  generateReport(shopId: string, type: ReportType, dateRange: DateRange): ReportDefinition {
    const kpis = analyticsService.calculateSalesKPIs(shopId, dateRange.startTime, dateRange.endTime);
    const now = new Date().toLocaleString("en-IN");

    switch (type) {
      case "daily_sales": {
        const timeSeries = analyticsService.getTimeSeriesData(shopId, {
          ...dateRange,
          granularity: "hourly",
        });

        return {
          type,
          title: "Daily Sales Report",
          description: "Hourly sales velocity, bill count, and average order value.",
          generatedAt: now,
          periodLabel: dateRange.label,
          headers: ["Hour", "Revenue (INR)", "Bills Count", "Units Sold", "Avg Bill Value (INR)"],
          rows: timeSeries.map((t) => [
            t.label,
            t.revenue,
            t.bills,
            t.units,
            t.avgBill,
          ]),
          summaryMetrics: {
            "Total Revenue": `₹${kpis.totalRevenue.toLocaleString("en-IN")}`,
            "Total Bills": kpis.totalBills,
            "Units Sold": kpis.itemsSold,
            "Avg Bill Size": `₹${kpis.avgBillValue.toLocaleString("en-IN")}`,
            "Est. Gross Profit": `₹${kpis.estimatedGrossProfit.toLocaleString("en-IN")}`,
          },
        };
      }

      case "weekly_sales": {
        const timeSeries = analyticsService.getTimeSeriesData(shopId, {
          ...dateRange,
          granularity: "daily",
        });

        return {
          type,
          title: "Weekly Sales Report",
          description: "Daily breakdown of store turnover across the week.",
          generatedAt: now,
          periodLabel: dateRange.label,
          headers: ["Day", "Revenue (INR)", "Bills Count", "Units Sold", "Avg Bill (INR)"],
          rows: timeSeries.map((t) => [
            t.label,
            t.revenue,
            t.bills,
            t.units,
            t.avgBill,
          ]),
          summaryMetrics: {
            "Weekly Revenue": `₹${kpis.totalRevenue.toLocaleString("en-IN")}`,
            "Weekly Bills": kpis.totalBills,
            "Units Sold": kpis.itemsSold,
            "Gross Margin": `${kpis.grossProfitMarginPct}%`,
          },
        };
      }

      case "monthly_sales": {
        const timeSeries = analyticsService.getTimeSeriesData(shopId, {
          ...dateRange,
          granularity: "daily",
        });

        return {
          type,
          title: "Monthly Sales Report",
          description: "Month-to-date daily ledger of revenues and turnover.",
          generatedAt: now,
          periodLabel: dateRange.label,
          headers: ["Date", "Revenue (INR)", "Bills Count", "Units Sold", "Avg Bill (INR)"],
          rows: timeSeries.map((t) => [
            t.label,
            t.revenue,
            t.bills,
            t.units,
            t.avgBill,
          ]),
          summaryMetrics: {
            "Monthly Revenue": `₹${kpis.totalRevenue.toLocaleString("en-IN")}`,
            "Total Transactions": kpis.totalBills,
            "Units Sold": kpis.itemsSold,
            "Restock Deliveries": kpis.restockCount,
          },
        };
      }

      case "yearly_sales": {
        const timeSeries = analyticsService.getTimeSeriesData(shopId, {
          ...dateRange,
          granularity: "monthly",
        });

        return {
          type,
          title: "Annual Sales Report",
          description: "Year-to-date monthly revenue progression and trends.",
          generatedAt: now,
          periodLabel: dateRange.label,
          headers: ["Month", "Revenue (INR)", "Orders Count", "Units Sold", "Avg Order Value (INR)"],
          rows: timeSeries.map((t) => [
            t.label,
            t.revenue,
            t.bills,
            t.units,
            t.avgBill,
          ]),
          summaryMetrics: {
            "Annual Revenue": `₹${kpis.totalRevenue.toLocaleString("en-IN")}`,
            "Total Invoices": kpis.totalBills,
            "Total Units": kpis.itemsSold,
            "Est. Profit": `₹${kpis.estimatedGrossProfit.toLocaleString("en-IN")}`,
          },
        };
      }

      case "custom_date": {
        const timeSeries = analyticsService.getTimeSeriesData(shopId, dateRange);

        return {
          type,
          title: "Custom Period Sales Report",
          description: `Consolidated performance from ${dateRange.startDate} to ${dateRange.endDate}.`,
          generatedAt: now,
          periodLabel: dateRange.label,
          headers: ["Period Segment", "Revenue (INR)", "Bills Count", "Units Sold", "Avg Bill (INR)"],
          rows: timeSeries.map((t) => [
            t.label,
            t.revenue,
            t.bills,
            t.units,
            t.avgBill,
          ]),
          summaryMetrics: {
            "Period Revenue": `₹${kpis.totalRevenue.toLocaleString("en-IN")}`,
            "Bills": kpis.totalBills,
            "Items Sold": kpis.itemsSold,
            "Distinct Products": kpis.productsSoldCount,
          },
        };
      }

      case "inventory": {
        const products = productService.getProducts(shopId);
        const invAnalytics = analyticsService.getInventoryAnalytics(
          shopId,
          dateRange.startTime,
          dateRange.endTime
        );

        return {
          type,
          title: "Inventory & Stock Valuation Report",
          description: "Catalog stock levels, reorder thresholds, and inventory turnover.",
          generatedAt: now,
          periodLabel: dateRange.label,
          headers: [
            "Product Name",
            "SKU",
            "Category",
            "Current Stock",
            "Min Safety Stock",
            "Unit Price (INR)",
            "Cost Price (INR)",
            "Stock Valuation (INR)",
            "Status",
          ],
          rows: products.map((p) => {
            const valuation = p.currentStock * p.costPrice;
            const status = p.currentStock === 0 ? "Out of Stock" : p.currentStock <= p.minStock ? "Low Stock" : "Healthy";
            return [
              p.name,
              p.sku,
              p.categoryName || "General",
              p.currentStock,
              p.minStock,
              p.sellingPrice,
              p.costPrice,
              valuation,
              status,
            ];
          }),
          summaryMetrics: {
            "Opening Stock": invAnalytics.openingStock,
            "Stock Added (Restocks)": invAnalytics.stockAdded,
            "Units Sold": invAnalytics.unitsSold,
            "Closing Stock": invAnalytics.closingStock,
            "Stock Turnover Ratio": `${invAnalytics.stockTurnoverRatio}x`,
            "Stockout Alerts": invAnalytics.stockoutCount,
          },
        };
      }

      case "product_performance": {
        const rankings = analyticsService.getProductRankings(shopId, dateRange);

        return {
          type,
          title: "Product Performance & Velocity Report",
          description: "Unit sales rankings, margins, turnover velocity, and sales trajectory.",
          generatedAt: now,
          periodLabel: dateRange.label,
          headers: [
            "Product Name",
            "SKU",
            "Category",
            "Units Sold",
            "Gross Revenue (INR)",
            "Gross Profit (INR)",
            "Margin (%)",
            "Units / Day",
            "Trajectory",
          ],
          rows: rankings.topSelling.map((p) => [
            p.productName,
            p.sku,
            p.categoryName,
            p.unitsSold,
            p.revenue,
            p.profit,
            `${p.marginPct}%`,
            p.velocityPerDay,
            p.trendVelocity === "increasing" ? "Rising" : p.trendVelocity === "declining" ? "Declining" : "Stable",
          ]),
          summaryMetrics: {
            "Top Selling SKU": rankings.topSelling[0]?.productName || "N/A",
            "Highest Revenue SKU": rankings.highestRevenue[0]?.productName || "N/A",
            "Fast Moving SKUs": rankings.fastMoving.length,
            "Slow Moving SKUs": rankings.slowMoving.length,
          },
        };
      }
    }
  },

  /**
   * Generates clean RFC 4180 CSV and triggers browser download.
   */
  exportToCSV(report: ReportDefinition): void {
    if (typeof window === "undefined") return;

    const escapeCSV = (val: string | number | undefined): string => {
      if (val === undefined || val === null) return "";
      const str = String(val);
      if (str.includes(",") || str.includes('"') || str.includes("\n")) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const lines: string[] = [];

    // Header metadata
    lines.push(`Report Title,${escapeCSV(report.title)}`);
    lines.push(`Period,${escapeCSV(report.periodLabel)}`);
    lines.push(`Generated At,${escapeCSV(report.generatedAt)}`);
    lines.push("");

    // Summary KPIs
    if (report.summaryMetrics) {
      lines.push("--- Summary Metrics ---");
      for (const [key, value] of Object.entries(report.summaryMetrics)) {
        lines.push(`${escapeCSV(key)},${escapeCSV(value)}`);
      }
      lines.push("");
    }

    // Table headers & rows
    lines.push(report.headers.map(escapeCSV).join(","));

    for (const row of report.rows) {
      lines.push(row.map(escapeCSV).join(","));
    }

    const csvContent = lines.join("\r\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const filename = `sellora_${report.type}_${Date.now()}.csv`;

    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  },

  /**
   * Print / PDF Trigger using browser print stylesheet.
   */
  triggerPrintPDF(): void {
    if (typeof window !== "undefined") {
      window.print();
    }
  },
};
