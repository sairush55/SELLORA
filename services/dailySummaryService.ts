import {
  DailySalesSummary,
  DailySalesSummaryItem,
  DailySummaryInput,
  Sale,
  SaleItem,
} from "@/types/sales";
import { productService } from "./productService";
import { inventoryMovementService } from "./inventoryMovementService";
import { salesService } from "./salesService";
import { notifyDataRefresh } from "@/hooks/useDataRefresh";

const SUMMARIES_STORAGE_PREFIX = "sellora_daily_summaries_";

export const dailySummaryService = {
  getSummaries(shopId: string): DailySalesSummary[] {
    if (typeof window === "undefined") return [];
    const key = `${SUMMARIES_STORAGE_PREFIX}${shopId}`;
    const stored = localStorage.getItem(key);

    if (!stored) return [];
    try {
      const parsed = JSON.parse(stored);
      return parsed.sort(
        (a: DailySalesSummary, b: DailySalesSummary) =>
          new Date(b.summaryDate).getTime() - new Date(a.summaryDate).getTime()
      );
    } catch {
      return [];
    }
  },

  getSummaryByDate(shopId: string, date: string): DailySalesSummary | null {
    const summaries = this.getSummaries(shopId);
    return summaries.find((s) => s.summaryDate === date) || null;
  },

  getSummaryById(shopId: string, id: string): DailySalesSummary | null {
    const summaries = this.getSummaries(shopId);
    return summaries.find((s) => s.id === id) || null;
  },

  /**
   * Submit new Daily Sales Summary (Busy Merchant Mode)
   * 1. Validate date
   * 2. Validate quantities
   * 3. Check duplicate summary
   * 4. Save summary
   * 5. Create sales records
   * 6. Create sale items
   * 7. Reduce inventory
   * 8. Create inventory movements
   */
  submitDailySummary(
    shopId: string,
    input: DailySummaryInput
  ): {
    summary: DailySalesSummary | null;
    error?: string;
    isDuplicate?: boolean;
    existingSummary?: DailySalesSummary;
  } {
    // 1. Validate date
    if (!input.date) {
      return { summary: null, error: "Summary date is required" };
    }

    // 2. Validate quantities: at least one product with quantity > 0
    const validItems = input.items.filter((i) => i.quantitySold > 0);
    if (validItems.length === 0) {
      return {
        summary: null,
        error: "Please enter quantity sold for at least one product.",
      };
    }

    // 3. Duplicate Protection: One shop cannot accidentally submit two summaries for the same date
    const existing = this.getSummaryByDate(shopId, input.date);
    if (existing) {
      return {
        summary: null,
        error: "Sales summary already exists for this date.",
        isDuplicate: true,
        existingSummary: existing,
      };
    }

    // Validate stock for all products to be deducted
    const allProducts = productService.getProducts(shopId);
    for (const item of validItems) {
      const product = allProducts.find((p) => p.id === item.productId);
      if (!product) {
        return { summary: null, error: `Product not found: ID ${item.productId}` };
      }
      if (product.currentStock < item.quantitySold) {
        return {
          summary: null,
          error: `Insufficient stock for "${product.name}". Available: ${product.currentStock}, Entered sold: ${item.quantitySold}`,
        };
      }
    }

    const summaryId = `dsum-${shopId}-${Date.now()}`;
    const saleId = `sale-${shopId}-sum-${Date.now()}`;
    const invoiceNumber = `INV-SUM-${input.date.replace(/-/g, "")}`;
    const now = new Date().toISOString();

    let totalItemsSold = 0;
    let totalRevenue = 0;

    const summaryItems: DailySalesSummaryItem[] = [];
    const saleItems: SaleItem[] = [];

    // 4, 5, 6, 7 & 8: Build items, update inventory, and create movements
    for (let idx = 0; idx < validItems.length; idx++) {
      const entry = validItems[idx];
      const product = allProducts.find((p) => p.id === entry.productId)!;

      const subtotal = entry.quantitySold * product.sellingPrice;
      totalItemsSold += entry.quantitySold;
      totalRevenue += subtotal;

      const sumItem: DailySalesSummaryItem = {
        id: `dsum-item-${summaryId}-${idx + 1}`,
        summaryId,
        productId: product.id,
        productName: product.name,
        sku: product.sku,
        quantitySold: entry.quantitySold,
        unitPrice: product.sellingPrice,
        subtotal,
      };
      summaryItems.push(sumItem);

      saleItems.push({
        id: `sitem-${saleId}-${idx + 1}`,
        saleId,
        productId: product.id,
        productName: product.name,
        sku: product.sku,
        quantity: entry.quantitySold,
        unitPrice: product.sellingPrice,
        subtotal,
        costPrice: product.costPrice,
        createdAt: now,
      });

      // 7. Reduce Inventory
      const stockBefore = product.currentStock;
      const stockAfter = stockBefore - entry.quantitySold;
      productService.updateStock(shopId, product.id, stockAfter);

      // 8. Create Inventory Movement
      const movement = {
        id: `mov-${shopId}-${Date.now()}-${idx + 1}`,
        shopId,
        productId: product.id,
        productName: product.name,
        sku: product.sku,
        movementType: "DAILY_SUMMARY_SALE" as const,
        quantityChange: -entry.quantitySold,
        stockBefore,
        stockAfter,
        costPerUnit: product.costPrice,
        notes: `Daily Summary Sale (${input.date})`,
        date: input.date,
        createdAt: now,
      };

      const existingMovements = inventoryMovementService.getMovements(shopId);
      existingMovements.unshift(movement);
      inventoryMovementService.saveMovements(shopId, existingMovements);
    }

    // 5. Create linked Sale Record
    const linkedSale: Sale = {
      id: saleId,
      shopId,
      invoiceNumber,
      saleType: "DAILY_SUMMARY",
      subtotal: totalRevenue,
      discount: 0,
      tax: 0,
      totalAmount: totalRevenue,
      paymentMethod: "other",
      customerName: "Daily Consolidated Customers",
      status: "completed",
      notes: input.notes?.trim() || `Busy Merchant Mode Summary for ${input.date}`,
      saleDate: input.date,
      createdAt: now,
      items: saleItems,
      payment: {
        id: `pay-${saleId}`,
        saleId,
        shopId,
        paymentMethod: "other",
        amount: totalRevenue,
        referenceId: `SUM-${input.date}`,
        status: "completed",
        createdAt: now,
      },
    };

    const allSales = salesService.getSales(shopId);
    allSales.unshift(linkedSale);
    salesService.saveSales(shopId, allSales);

    // 4. Save Summary
    const newSummary: DailySalesSummary = {
      id: summaryId,
      shopId,
      summaryDate: input.date,
      totalItemsSold,
      totalRevenue,
      saleId,
      notes: input.notes?.trim(),
      createdAt: now,
      updatedAt: now,
      items: summaryItems,
    };

    const summaries = this.getSummaries(shopId);
    summaries.unshift(newSummary);
    this.saveSummaries(shopId, summaries);

    notifyDataRefresh("daily_summary", { summaryId: newSummary.id, date: newSummary.summaryDate });

    return { summary: newSummary };
  },

  /**
   * Edit Existing Daily Sales Summary
   * Calculate inventory difference correctly:
   * Delta = newQuantitySold - oldQuantitySold
   * Never deduct the entire summary again!
   */
  updateDailySummary(
    shopId: string,
    summaryId: string,
    input: DailySummaryInput
  ): { summary: DailySalesSummary | null; error?: string } {
    const summaries = this.getSummaries(shopId);
    const index = summaries.findIndex((s) => s.id === summaryId);

    if (index === -1) {
      return { summary: null, error: "Summary not found" };
    }

    const currentSummary = summaries[index];
    const allProducts = productService.getProducts(shopId);
    const now = new Date().toISOString();

    // Build map of previous quantities per product
    const previousQtyMap: Record<string, number> = {};
    for (const item of currentSummary.items) {
      previousQtyMap[item.productId] = item.quantitySold;
    }

    // Check validity of inventory differences before applying
    for (const entry of input.items) {
      const oldQty = previousQtyMap[entry.productId] || 0;
      const newQty = Math.max(0, entry.quantitySold);
      const delta = newQty - oldQty;

      if (delta > 0) {
        // Selling more: check if current stock can cover the additional delta
        const product = allProducts.find((p) => p.id === entry.productId);
        if (product && product.currentStock < delta) {
          return {
            summary: null,
            error: `Cannot increase "${product.name}" by ${delta}. Current stock is only ${product.currentStock}.`,
          };
        }
      }
    }

    // Apply differential inventory adjustments
    let newTotalItemsSold = 0;
    let newTotalRevenue = 0;
    const updatedSummaryItems: DailySalesSummaryItem[] = [];
    const updatedSaleItems: SaleItem[] = [];

    for (let idx = 0; idx < input.items.length; idx++) {
      const entry = input.items[idx];
      const product = allProducts.find((p) => p.id === entry.productId);
      if (!product) continue;

      const oldQty = previousQtyMap[entry.productId] || 0;
      const newQty = Math.max(0, entry.quantitySold);
      const delta = newQty - oldQty; // Difference!

      if (newQty > 0) {
        const subtotal = newQty * product.sellingPrice;
        newTotalItemsSold += newQty;
        newTotalRevenue += subtotal;

        updatedSummaryItems.push({
          id: `dsum-item-${summaryId}-${idx + 1}`,
          summaryId,
          productId: product.id,
          productName: product.name,
          sku: product.sku,
          quantitySold: newQty,
          unitPrice: product.sellingPrice,
          subtotal,
        });

        updatedSaleItems.push({
          id: `sitem-${currentSummary.saleId || summaryId}-${idx + 1}`,
          saleId: currentSummary.saleId || `sale-${summaryId}`,
          productId: product.id,
          productName: product.name,
          sku: product.sku,
          quantity: newQty,
          unitPrice: product.sellingPrice,
          subtotal,
          costPrice: product.costPrice,
          createdAt: now,
        });
      }

      // Apply delta to inventory
      if (delta !== 0) {
        const stockBefore = product.currentStock;
        const stockAfter = stockBefore - delta; // If delta > 0, subtracts; if delta < 0, adds back!

        productService.updateStock(shopId, product.id, stockAfter);

        // Record differential movement
        const movement = {
          id: `mov-${shopId}-${Date.now()}-${idx + 1}`,
          shopId,
          productId: product.id,
          productName: product.name,
          sku: product.sku,
          movementType: "DAILY_SUMMARY_ADJUSTMENT" as const,
          quantityChange: -delta,
          stockBefore,
          stockAfter,
          costPerUnit: product.costPrice,
          notes: `Summary Edit (${currentSummary.summaryDate}): adjusted sold qty ${oldQty} -> ${newQty} (delta: ${delta > 0 ? `+${delta}` : delta})`,
          date: currentSummary.summaryDate,
          createdAt: now,
        };

        const existingMovements = inventoryMovementService.getMovements(shopId);
        existingMovements.unshift(movement);
        inventoryMovementService.saveMovements(shopId, existingMovements);
      }
    }

    // Update Summary record
    summaries[index] = {
      ...currentSummary,
      totalItemsSold: newTotalItemsSold,
      totalRevenue: newTotalRevenue,
      notes: input.notes !== undefined ? input.notes : currentSummary.notes,
      updatedAt: now,
      items: updatedSummaryItems,
    };
    this.saveSummaries(shopId, summaries);

    // Update linked Sale record if present
    if (currentSummary.saleId) {
      const allSales = salesService.getSales(shopId);
      const saleIdx = allSales.findIndex((s) => s.id === currentSummary.saleId);
      if (saleIdx !== -1) {
        allSales[saleIdx] = {
          ...allSales[saleIdx],
          subtotal: newTotalRevenue,
          totalAmount: newTotalRevenue,
          items: updatedSaleItems,
          payment: allSales[saleIdx].payment
            ? { ...allSales[saleIdx].payment!, amount: newTotalRevenue }
            : undefined,
        };
        salesService.saveSales(shopId, allSales);
      }
    }

    notifyDataRefresh("daily_summary", { summaryId: summaries[index].id, date: summaries[index].summaryDate });

    return { summary: summaries[index] };
  },

  saveSummaries(shopId: string, summaries: DailySalesSummary[]): void {
    if (typeof window === "undefined") return;
    const key = `${SUMMARIES_STORAGE_PREFIX}${shopId}`;
    localStorage.setItem(key, JSON.stringify(summaries));
  },
};
