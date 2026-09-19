import {
  InventoryMovement,
  RestockInput,
  ManualAdjustmentInput,
} from "@/types/inventory";
import { productService } from "./productService";
import { supplierService } from "./supplierService";
import { notifyDataRefresh } from "@/hooks/useDataRefresh";
import { isDemoShop } from "./shopService";

const MOVEMENTS_STORAGE_PREFIX = "sellora_movements_";

export const inventoryMovementService = {
  getMovements(shopId: string, productId?: string): InventoryMovement[] {
    if (typeof window === "undefined") return [];
    const key = `${MOVEMENTS_STORAGE_PREFIX}${shopId}`;
    const stored = localStorage.getItem(key);

    let movements: InventoryMovement[] = [];
    if (stored) {
      try {
        movements = JSON.parse(stored);
      } catch {
        movements = [];
      }
    }

    if (!movements || movements.length === 0) {
      // Only seed demo movement history for dedicated demo tenants.
      // Real merchant accounts must start with zero inventory history.
      if (isDemoShop(shopId)) {
        movements = this.seedDefaultMovements(shopId);
        this.saveMovements(shopId, movements);
      }
    }

    if (productId) {
      movements = movements.filter((m) => m.productId === productId);
    }

    // Sort newest first
    return movements.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  },

  seedDefaultMovements(shopId: string): InventoryMovement[] {
    const products = productService.getProducts(shopId);
    if (!products || products.length === 0) return [];

    const seeded: InventoryMovement[] = [];
    const now = new Date();

    // Generate periodic restock events over the past 90 days
    const restockOffsets = [85, 70, 55, 42, 28, 14, 4, 1];
    for (let idx = 0; idx < restockOffsets.length; idx++) {
      const offsetDays = restockOffsets[idx];
      const d = new Date(now.getTime() - offsetDays * 86400000);
      d.setHours(10, 30, 0, 0);
      const iso = d.toISOString();
      const dateStr = d.toISOString().split("T")[0];

      // Restock 2-3 products per delivery
      const pIndex1 = (idx * 2) % products.length;
      const pIndex2 = (idx * 2 + 1) % products.length;
      const prod1 = products[pIndex1];
      const prod2 = products[pIndex2];

      const qty1 = prod1.minOrderQuantity || 20;
      const qty2 = prod2.minOrderQuantity || 25;

      seeded.push({
        id: `mov-${shopId}-seed-rst-${idx}-1`,
        shopId,
        productId: prod1.id,
        productName: prod1.name,
        sku: prod1.sku,
        movementType: "RESTOCK",
        quantityChange: qty1,
        stockBefore: Math.max(2, prod1.minStock - 2),
        stockAfter: Math.max(2, prod1.minStock - 2) + qty1,
        supplierId: prod1.supplierId,
        supplierName: prod1.supplierName,
        costPerUnit: prod1.costPrice,
        notes: `PO Batch Delivery #${1000 + idx}`,
        date: dateStr,
        createdAt: iso,
      });

      seeded.push({
        id: `mov-${shopId}-seed-rst-${idx}-2`,
        shopId,
        productId: prod2.id,
        productName: prod2.name,
        sku: prod2.sku,
        movementType: "RESTOCK",
        quantityChange: qty2,
        stockBefore: Math.max(3, prod2.minStock - 1),
        stockAfter: Math.max(3, prod2.minStock - 1) + qty2,
        supplierId: prod2.supplierId,
        supplierName: prod2.supplierName,
        costPerUnit: prod2.costPrice,
        notes: `PO Batch Delivery #${1000 + idx}`,
        date: dateStr,
        createdAt: iso,
      });
    }

    return seeded;
  },

  receiveStock(
    shopId: string,
    input: RestockInput
  ): { movement: InventoryMovement | null; error?: string } {
    const product = productService.getProductById(shopId, input.productId);
    if (!product) {
      return { movement: null, error: "Selected product not found" };
    }

    const qty = Number(input.quantity);
    if (!qty || qty <= 0) {
      return { movement: null, error: "Restock quantity must be greater than 0" };
    }

    const stockBefore = product.currentStock;
    const stockAfter = stockBefore + qty; // e.g. 40 + 60 = 100

    // Resolve supplier details
    const supplierId = input.supplierId || product.supplierId;
    let supplierName = product.supplierName;
    if (supplierId) {
      const sup = supplierService.getSupplierById(shopId, supplierId);
      if (sup) supplierName = sup.name;
    }

    // Update product stock
    productService.updateStock(shopId, product.id, stockAfter);

    const movement: InventoryMovement = {
      id: `mov-${shopId}-${Date.now()}`,
      shopId,
      productId: product.id,
      productName: product.name,
      sku: product.sku,
      movementType: "RESTOCK",
      quantityChange: qty,
      stockBefore,
      stockAfter,
      supplierId,
      supplierName,
      costPerUnit: input.purchaseCost ? Number(input.purchaseCost) : product.costPrice,
      notes: input.notes?.trim(),
      date: input.date || new Date().toISOString().split("T")[0],
      createdAt: new Date().toISOString(),
    };

    const movements = this.getMovements(shopId);
    movements.unshift(movement);
    this.saveMovements(shopId, movements);

    notifyDataRefresh("restock", { productId: product.id, quantity: qty });

    return { movement };
  },

  adjustStock(
    shopId: string,
    input: ManualAdjustmentInput
  ): { movement: InventoryMovement | null; error?: string } {
    const product = productService.getProductById(shopId, input.productId);
    if (!product) {
      return { movement: null, error: "Selected product not found" };
    }

    const newStock = Number(input.newStock);
    if (isNaN(newStock) || newStock < 0) {
      return { movement: null, error: "New stock count must be a non-negative number" };
    }

    const stockBefore = product.currentStock;
    const stockAfter = newStock;
    const quantityChange = stockAfter - stockBefore;

    // Update product stock
    productService.updateStock(shopId, product.id, stockAfter);

    const movement: InventoryMovement = {
      id: `mov-${shopId}-${Date.now()}`,
      shopId,
      productId: product.id,
      productName: product.name,
      sku: product.sku,
      movementType: "MANUAL_ADJUSTMENT",
      quantityChange,
      stockBefore,
      stockAfter,
      supplierId: product.supplierId,
      supplierName: product.supplierName,
      costPerUnit: product.costPrice,
      notes: `${input.reason}${input.notes ? ` - ${input.notes}` : ""}`,
      date: input.date || new Date().toISOString().split("T")[0],
      createdAt: new Date().toISOString(),
    };

    const movements = this.getMovements(shopId);
    movements.unshift(movement);
    this.saveMovements(shopId, movements);

    notifyDataRefresh("adjustment", { productId: product.id, newStock });

    return { movement };
  },

  saveMovements(shopId: string, movements: InventoryMovement[]): void {
    if (typeof window === "undefined") return;
    const key = `${MOVEMENTS_STORAGE_PREFIX}${shopId}`;
    localStorage.setItem(key, JSON.stringify(movements));
  },
};
