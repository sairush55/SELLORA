import { Product, ProductInput, Category } from "@/types/inventory";
import { productService } from "./productService";
import { categoryService } from "./categoryService";
import { inventoryMovementService } from "./inventoryMovementService";
import { notifyDataRefresh } from "@/hooks/useDataRefresh";

export interface MatchedInvoiceItem {
  id: string;
  action: "UPDATE_STOCK" | "CREATE_PRODUCT";
  matchedProductId?: string;
  matchedProductName?: string;
  name: string;
  sku: string;
  categoryId: string;
  categoryName?: string;
  quantity: number;
  currentStock: number;
  newStock: number;
  baseCostPrice?: number;
  costPrice: number; // PURCHASE COST INCLUDING GST
  taxAmount?: number;
  taxRate?: number;
  sellingPrice: number;
  unit: string;
  selected: boolean;
  requiresReview?: boolean;
  reviewReason?: string;
}

export interface InvoiceImportResult {
  updatedCount: number;
  createdCount: number;
  errors: string[];
}

export const invoiceParserService = {
  // Normalize string for fuzzy comparison
  normalizeText(str: string): string {
    return str
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "")
      .trim();
  },

  // Match extracted line items against existing shop catalog
  matchInvoiceItems(
    shopId: string,
    extractedItems: Array<{
      name: string;
      sku?: string;
      quantity: number;
      unit?: string;
      baseCostPrice?: number;
      costPrice: number;
      taxAmount?: number;
      taxRate?: number;
      suggestedSellingPrice: number;
      hsn?: string;
      requiresReview?: boolean;
      reviewReason?: string;
    }>
  ): MatchedInvoiceItem[] {
    const existingProducts = productService.getProducts(shopId);
    const categories = categoryService.getCategories(shopId);
    const defaultCategoryId = categories.length > 0 ? categories[0].id : "cat-default-1";

    return extractedItems.map((item, index) => {
      const normName = this.normalizeText(item.name);
      const itemSkuUpper = (item.sku || "").toUpperCase().trim();

      // 1. Search for existing product match (SKU exact, or name exact, or normalized name)
      const matched = existingProducts.find((p) => {
        if (itemSkuUpper && p.sku.toUpperCase() === itemSkuUpper) return true;
        if (p.name.toLowerCase().trim() === item.name.toLowerCase().trim()) return true;
        const normExisting = this.normalizeText(p.name);
        return normExisting === normName || (normName.length > 5 && normExisting.includes(normName));
      });

      if (matched) {
        const invoicedQty = Number(item.quantity) || 1;
        const currentStock = Number(matched.currentStock) || 0;
        return {
          id: `item-${index}-${Date.now()}`,
          action: "UPDATE_STOCK",
          matchedProductId: matched.id,
          matchedProductName: matched.name,
          name: matched.name,
          sku: matched.sku,
          categoryId: matched.categoryId,
          categoryName: matched.categoryName,
          quantity: invoicedQty,
          currentStock,
          newStock: currentStock + invoicedQty,
          baseCostPrice: item.baseCostPrice || matched.costPrice,
          costPrice: item.costPrice > 0 ? item.costPrice : matched.costPrice,
          taxAmount: item.taxAmount,
          taxRate: item.taxRate,
          sellingPrice: matched.sellingPrice,
          unit: matched.unit || item.unit || "Units",
          selected: true,
          requiresReview: item.requiresReview,
          reviewReason: item.reviewReason,
        };
      }

      // 2. New product (needs review)
      const cost = Number(item.costPrice) || 0;
      const suggestedSelling =
        Number(item.suggestedSellingPrice) || (cost > 0 ? Math.round(cost * 1.25) : 0);
      const invoicedQty = Number(item.quantity) || 1;

      // Ensure unique SKU
      let assignedSku = item.sku?.toUpperCase() || `SKU-${Math.floor(1000 + Math.random() * 9000)}`;
      if (existingProducts.some((p) => p.sku.toUpperCase() === assignedSku)) {
        assignedSku = `${assignedSku}-${index + 1}`;
      }

      return {
        id: `item-${index}-${Date.now()}`,
        action: "CREATE_PRODUCT",
        name: item.name.trim(),
        sku: assignedSku,
        categoryId: defaultCategoryId,
        categoryName: categories.find((c) => c.id === defaultCategoryId)?.name || "General",
        quantity: invoicedQty,
        currentStock: 0,
        newStock: invoicedQty,
        baseCostPrice: item.baseCostPrice || cost,
        costPrice: cost,
        taxAmount: item.taxAmount,
        taxRate: item.taxRate,
        sellingPrice: suggestedSelling,
        unit: item.unit || "Units",
        selected: true,
        requiresReview: item.requiresReview,
        reviewReason: item.reviewReason,
      };
    });
  },

  // Upload PDF file to API endpoint
  async uploadAndParsePdf(file: File): Promise<{
    success: boolean;
    invoiceNumber?: string;
    supplierName?: string;
    date?: string;
    summary?: {
      subtotal: number;
      taxableAmount: number;
      cgst: number;
      sgst: number;
      igst: number;
      totalTax: number;
      grandTotal: number;
      isTaxInclusive: boolean;
      effectiveTaxRate?: number;
    };
    items: Array<{
      name: string;
      sku?: string;
      quantity: number;
      unit?: string;
      baseCostPrice?: number;
      costPrice: number;
      taxAmount?: number;
      taxRate?: number;
      suggestedSellingPrice: number;
      hsn?: string;
      requiresReview?: boolean;
      reviewReason?: string;
    }>;
    rawTextPreview?: string;
    error?: string;
  }> {
    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch("/api/extract-invoice-pdf", {
      method: "POST",
      body: formData,
    });

    const data = await res.json();
    return data;
  },

  // Parse raw invoice text or pasted table directly
  async parseRawInvoiceText(text: string): Promise<{
    success: boolean;
    invoiceNumber?: string;
    supplierName?: string;
    date?: string;
    summary?: {
      subtotal: number;
      taxableAmount: number;
      cgst: number;
      sgst: number;
      igst: number;
      totalTax: number;
      grandTotal: number;
      isTaxInclusive: boolean;
      effectiveTaxRate?: number;
    };
    items: Array<{
      name: string;
      sku?: string;
      quantity: number;
      unit?: string;
      baseCostPrice?: number;
      costPrice: number;
      taxAmount?: number;
      taxRate?: number;
      suggestedSellingPrice: number;
      hsn?: string;
      requiresReview?: boolean;
      reviewReason?: string;
    }>;
    rawTextPreview?: string;
    error?: string;
  }> {
    const res = await fetch("/api/extract-invoice-pdf", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ text }),
    });

    const data = await res.json();
    return data;
  },

  // Provide a realistic sample invoice generator for instant testing
  getSampleInvoiceData(): {
    invoiceNumber: string;
    supplierName: string;
    date: string;
    items: Array<{
      name: string;
      sku?: string;
      quantity: number;
      unit: string;
      costPrice: number;
      suggestedSellingPrice: number;
    }>;
  } {
    return {
      invoiceNumber: `INV-GST-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      supplierName: "Apex FMCG & Wholesale Distributors",
      date: new Date().toISOString().split("T")[0],
      items: [
        {
          name: "sun flower white soap",
          sku: "SFW-225",
          quantity: 25,
          unit: "Boxes",
          costPrice: 720,
          suggestedSellingPrice: 1150,
        },
        {
          name: "Tata Salt Vacuum Evaporated 1kg",
          sku: "SLT-01K-02",
          quantity: 50,
          unit: "Pks",
          costPrice: 22,
          suggestedSellingPrice: 28,
        },
        {
          name: "Britannia Good Day Butter Biscuits 200g",
          sku: "BRT-GD-200",
          quantity: 40,
          unit: "Pks",
          costPrice: 32,
          suggestedSellingPrice: 45,
        },
        {
          name: "Dabur Red Toothpaste 150g",
          sku: "DBR-RED-150",
          quantity: 30,
          unit: "Pcs",
          costPrice: 85,
          suggestedSellingPrice: 110,
        },
        {
          name: "Taj Mahal Tea Leaves 500g",
          sku: "TAJ-TEA-500",
          quantity: 15,
          unit: "Pks",
          costPrice: 260,
          suggestedSellingPrice: 340,
        },
      ],
    };
  },

  // Commit all approved items (both stock updates and new product creations)
  commitInvoiceImport(
    shopId: string,
    itemsToImport: MatchedInvoiceItem[],
    invoiceNumber?: string,
    supplierName?: string
  ): InvoiceImportResult {
    let updatedCount = 0;
    let createdCount = 0;
    const errors: string[] = [];

    const categories = categoryService.getCategories(shopId);

    for (const item of itemsToImport) {
      if (!item.selected) continue;

      try {
        if (item.action === "UPDATE_STOCK" && item.matchedProductId) {
          // 1. Update stock count and cost price for existing product
          productService.updateStock(shopId, item.matchedProductId, item.newStock);

          // Update cost or selling price if modified
          if (item.costPrice > 0 || item.sellingPrice > 0) {
            productService.updateProduct(shopId, item.matchedProductId, {
              costPrice: item.costPrice,
              sellingPrice: item.sellingPrice,
            });
          }

          // Record restock movement
          inventoryMovementService.receiveStock(shopId, {
            productId: item.matchedProductId,
            quantity: item.quantity,
            purchaseCost: item.costPrice,
            date: new Date().toISOString().split("T")[0],
            notes: `Invoice PDF import (${invoiceNumber || "Bill"}${supplierName ? ` • ${supplierName}` : ""})`,
          });

          updatedCount++;
        } else if (item.action === "CREATE_PRODUCT") {
          // 2. Create new product in catalog
          const cat = categories.find((c) => c.id === item.categoryId);
          const res = productService.createProduct(shopId, {
            name: item.name.trim(),
            sku: item.sku.trim().toUpperCase(),
            categoryId: item.categoryId,
            currentStock: item.quantity,
            openingStock: 0,
            minStock: 10,
            costPrice: item.costPrice,
            sellingPrice: item.sellingPrice,
            unit: item.unit,
            supplierLeadTime: 2,
            minOrderQuantity: 1,
          });

          if (res.product) {
            // Record initial receipt movement
            inventoryMovementService.receiveStock(shopId, {
              productId: res.product.id,
              quantity: item.quantity,
              purchaseCost: item.costPrice,
              date: new Date().toISOString().split("T")[0],
              notes: `New SKU from Invoice PDF (${invoiceNumber || "Bill"})`,
            });
            createdCount++;
          } else {
            errors.push(`Failed to create "${item.name}": ${res.error || "Unknown error"}`);
          }
        }
      } catch (err: any) {
        errors.push(`Error processing "${item.name}": ${err.message}`);
      }
    }

    notifyDataRefresh("all", { updatedCount, createdCount });
    return { updatedCount, createdCount, errors };
  },
};
