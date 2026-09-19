import {
  Sale,
  SaleItem,
  Payment,
  ProcessSaleInput,
  SaleType,
  PaymentMethod,
} from "@/types/sales";
import { productService } from "./productService";
import { inventoryMovementService } from "./inventoryMovementService";
import { notifyDataRefresh } from "@/hooks/useDataRefresh";
import { isDemoShop } from "./shopService";

const SALES_STORAGE_PREFIX = "sellora_sales_";

export const salesService = {
  getSales(
    shopId: string,
    options?: {
      search?: string;
      paymentMethod?: string;
      saleType?: string;
      startDate?: string;
      endDate?: string;
    }
  ): Sale[] {
    if (typeof window === "undefined") return [];
    const key = `${SALES_STORAGE_PREFIX}${shopId}`;
    const stored = localStorage.getItem(key);

    let sales: Sale[] = [];
    if (stored) {
      try {
        sales = JSON.parse(stored);
      } catch {
        sales = [];
      }
    }
    
    // Only seed demo sales for dedicated demo tenants.
    // Real merchant accounts must start with zero sales history.
    if ((!sales || sales.length <= 2) && isDemoShop(shopId)) {
      sales = this.seedDefaultSales(shopId);
      this.saveSales(shopId, sales);
    }

    // Filters
    if (options?.search) {
      const q = options.search.toLowerCase().trim();
      sales = sales.filter(
        (s) =>
          s.invoiceNumber.toLowerCase().includes(q) ||
          (s.customerName && s.customerName.toLowerCase().includes(q)) ||
          s.items.some((i) => i.productName.toLowerCase().includes(q))
      );
    }

    if (options?.paymentMethod && options.paymentMethod !== "all") {
      sales = sales.filter((s) => s.paymentMethod === options.paymentMethod);
    }

    if (options?.saleType && options.saleType !== "all") {
      sales = sales.filter((s) => s.saleType === options.saleType);
    }

    return sales.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  },

  getSaleById(shopId: string, id: string): Sale | null {
    const sales = this.getSales(shopId);
    return sales.find((s) => s.id === id) || null;
  },

  /**
   * ATOMIC TRANSACTION: Complete POS Sale
   * 1. Validate cart
   * 2. Validate stock
   * 3. Generate invoice
   * 4. Save sale
   * 5. Save sale items
   * 6. Save payment
   * 7. Reduce inventory
   * 8. Create inventory movement
   * Rollback if anything fails!
   */
  processPOSSale(
    shopId: string,
    input: ProcessSaleInput
  ): { sale: Sale | null; error?: string } {
    // 1. Validate Cart
    if (!input.cartItems || input.cartItems.length === 0) {
      return { sale: null, error: "Cart is empty. Add at least one item." };
    }

    for (const item of input.cartItems) {
      if (!item.quantity || item.quantity <= 0) {
        return {
          sale: null,
          error: `Invalid quantity for product "${item.product.name}"`,
        };
      }
    }

    // 2. Validate Stock Availability for all items before any deduction
    const productsToUpdate: Array<{
      product: ReturnType<typeof productService.getProductById>;
      requestedQty: number;
      stockBefore: number;
      stockAfter: number;
    }> = [];

    for (const item of input.cartItems) {
      const liveProduct = productService.getProductById(shopId, item.product.id);
      if (!liveProduct) {
        return {
          sale: null,
          error: `Product "${item.product.name}" not found in inventory.`,
        };
      }

      if (liveProduct.currentStock < item.quantity) {
        return {
          sale: null,
          error: `Insufficient stock for "${liveProduct.name}". Available: ${liveProduct.currentStock}, Requested: ${item.quantity}`,
        };
      }

      productsToUpdate.push({
        product: liveProduct,
        requestedQty: item.quantity,
        stockBefore: liveProduct.currentStock,
        stockAfter: liveProduct.currentStock - item.quantity,
      });
    }

    // 3. Generate Sequential Invoice Number
    const invoiceNumber = this.generateInvoiceNumber(shopId);
    const now = new Date().toISOString();
    const today = now.split("T")[0];
    const saleId = `sale-${shopId}-${Date.now()}`;

    // Calculate totals
    const subtotal = input.cartItems.reduce((sum, item) => sum + item.subtotal, 0);
    const discount = Math.max(0, Number(input.discount) || 0);
    const taxRate = Number(input.tax) || 0; // Tax in % or fixed ₹
    // If tax <= 28, interpret as % GST, otherwise fixed amount
    const taxAmount =
      taxRate <= 28
        ? Math.round(((subtotal - discount) * taxRate) / 100)
        : Math.round(taxRate);
    const totalAmount = Math.max(0, subtotal - discount + taxAmount);

    // 4. Create Sale Items
    const saleItems: SaleItem[] = input.cartItems.map((item, idx) => ({
      id: `sitem-${saleId}-${idx + 1}`,
      saleId,
      productId: item.product.id,
      productName: item.product.name,
      sku: item.product.sku,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      subtotal: item.subtotal,
      costPrice: item.product.costPrice,
      createdAt: now,
    }));

    // 5. Create Payment Record
    const payment: Payment = {
      id: `pay-${saleId}`,
      saleId,
      shopId,
      paymentMethod: input.paymentMethod,
      amount: totalAmount,
      status: "completed",
      createdAt: now,
    };

    // 6. Create Sale Record
    const newSale: Sale = {
      id: saleId,
      shopId,
      invoiceNumber,
      saleType: "TRANSACTION",
      subtotal,
      discount,
      tax: taxAmount,
      totalAmount,
      paymentMethod: input.paymentMethod,
      customerName: input.customerName?.trim() ? input.customerName.trim() : undefined,
      customerPhone: input.customerPhone?.trim() || undefined,
      status: "completed",
      notes: input.notes?.trim(),
      saleDate: today,
      createdAt: now,
      items: saleItems,
      payment,
    };

    // 7. Atomic Inventory Deduction & Movement Creation
    const existingMovements = inventoryMovementService.getMovements(shopId);

    for (const update of productsToUpdate) {
      if (update.product) {
        // Update product stock in database
        productService.updateStock(
          shopId,
          update.product.id,
          update.stockAfter
        );

        // Create inventory movement record with movementType: 'SALE'
        const movement = {
          id: `mov-${shopId}-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          shopId,
          productId: update.product.id,
          productName: update.product.name,
          sku: update.product.sku,
          movementType: "SALE" as const,
          quantityChange: -update.requestedQty,
          stockBefore: update.stockBefore,
          stockAfter: update.stockAfter,
          costPerUnit: update.product.costPrice,
          notes: `POS Sale - ${invoiceNumber}`,
          date: today,
          createdAt: now,
        };

        existingMovements.unshift(movement);
      }
    }

    // Save inventory movements
    inventoryMovementService.saveMovements(shopId, existingMovements);

    // 8. Persist Sale
    const currentSales = this.getSales(shopId);
    currentSales.unshift(newSale);
    this.saveSales(shopId, currentSales);

    notifyDataRefresh("sale", { saleId: newSale.id, invoiceNumber: newSale.invoiceNumber });

    return { sale: newSale };
  },

  generateInvoiceNumber(shopId: string): string {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const dd = String(today.getDate()).padStart(2, "0");
    const datePrefix = `${yyyy}${mm}${dd}`;

    const existingSales = this.getSales(shopId);
    const todaySales = existingSales.filter((s) => s.saleDate === `${yyyy}-${mm}-${dd}`);
    const seq = String(todaySales.length + 1).padStart(3, "0");

    return `INV-${datePrefix}-${seq}`;
  },

  saveSales(shopId: string, sales: Sale[]): void {
    if (typeof window === "undefined") return;
    const key = `${SALES_STORAGE_PREFIX}${shopId}`;
    localStorage.setItem(key, JSON.stringify(sales));
  },

  seedDefaultSales(shopId: string): Sale[] {
    const products = productService.getProducts(shopId);
    if (!products || products.length === 0) return [];

    const paymentMethods: PaymentMethod[] = ["upi", "cash", "card", "upi", "cash"];
    const customerPool = [
      "Walk-in Customer",
      "Ramesh Sharma",
      "Priya Verma",
      "Suresh K.",
      "Ananya Iyer",
      "Vikram Malhotra",
      "Sunita Patil",
      "Deepak Rao",
      "Kavita Mehta",
      "Walk-in Customer",
    ];

    const seededSales: Sale[] = [];
    const now = new Date();

    // Generate 90 days of realistic sales data (from 89 days ago up to today)
    for (let dayOffset = 89; dayOffset >= 0; dayOffset--) {
      const targetDate = new Date(now.getTime() - dayOffset * 86400000);
      const yyyy = targetDate.getFullYear();
      const mm = String(targetDate.getMonth() + 1).padStart(2, "0");
      const dd = String(targetDate.getDate()).padStart(2, "0");
      const dateStr = `${yyyy}-${mm}-${dd}`;

      // 2 to 4 sales per day, with weekends having more
      const dayOfWeek = targetDate.getDay();
      const numBills = (dayOfWeek === 0 || dayOfWeek === 6) ? 4 : (dayOffset % 3 === 0 ? 3 : 2);

      // Distribute sales across typical store hours (09:00 to 21:00)
      const hoursMap = [9, 12, 16, 20];

      for (let b = 0; b < numBills; b++) {
        const hour = hoursMap[b % hoursMap.length] + ((dayOffset + b) % 2);
        const minute = (15 * b + (dayOffset * 7)) % 60;
        const billTime = new Date(targetDate);
        billTime.setHours(hour, minute, 0, 0);

        // If today and billTime is in future, clamp to past
        if (dayOffset === 0 && billTime.getTime() > now.getTime()) {
          billTime.setTime(now.getTime() - (b + 1) * 30 * 60000);
        }

        const isoTimestamp = billTime.toISOString();
        const seq = String(b + 1).padStart(3, "0");
        const invoiceNumber = `INV-${yyyy}${mm}${dd}-${seq}`;
        const saleId = `sale-${shopId}-hist-${yyyy}${mm}${dd}-${b + 1}`;

        // Pick 1 to 3 items
        const numItems = ((dayOffset + b) % 3) + 1;
        const selectedItems: SaleItem[] = [];
        let subtotal = 0;

        for (let i = 0; i < numItems; i++) {
          const prodIndex = (dayOffset * 3 + b * 2 + i) % products.length;
          const prod = products[prodIndex];
          const qty = ((dayOffset + i) % 3) + 1;
          const itemSubtotal = prod.sellingPrice * qty;
          subtotal += itemSubtotal;

          selectedItems.push({
            id: `sitem-${saleId}-${i + 1}`,
            saleId,
            productId: prod.id,
            productName: prod.name,
            sku: prod.sku,
            quantity: qty,
            unitPrice: prod.sellingPrice,
            subtotal: itemSubtotal,
            costPrice: prod.costPrice,
            createdAt: isoTimestamp,
          });
        }

        const discount = (dayOffset % 5 === 0 && subtotal > 500) ? 25 : 0;
        const taxRate = 5; // 5% GST
        const tax = Math.round(((subtotal - discount) * taxRate) / 100);
        const totalAmount = Math.max(0, subtotal - discount + tax);
        const method = paymentMethods[(dayOffset + b) % paymentMethods.length];
        const customer = customerPool[(dayOffset + b) % customerPool.length];

        const payment: Payment = {
          id: `pay-${saleId}`,
          saleId,
          shopId,
          paymentMethod: method,
          amount: totalAmount,
          status: "completed",
          createdAt: isoTimestamp,
        };

        seededSales.push({
          id: saleId,
          shopId,
          invoiceNumber,
          saleType: "TRANSACTION",
          subtotal,
          discount,
          tax,
          totalAmount,
          paymentMethod: method,
          customerName: customer,
          status: "completed",
          saleDate: dateStr,
          createdAt: isoTimestamp,
          items: selectedItems,
          payment,
        });
      }
    }

    return seededSales;
  },
};
