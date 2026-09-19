export type StockHealthStatus = 'healthy' | 'low_stock' | 'out_of_stock' | 'overstocked';

export interface Product {
  id: string;
  shopId: string;
  name: string;
  sku: string;
  categoryId: string;
  categoryName?: string;
  sellingPrice: number;
  costPrice: number;
  openingStock: number;
  currentStock: number;
  minStock: number; // Minimum stock threshold before alert
  supplierId?: string;
  supplierName?: string;
  supplierLeadTime: number; // in days
  minOrderQuantity: number; // MOQ
  unit: string; // e.g. "Pcs", "Kg", "Bags", "Bottles", "Pks", "L"
  imageUrl?: string;
  sourceUrl?: string;
  status: StockHealthStatus;
  createdAt: string;
  updatedAt: string;
}

export type ProductInput = Omit<Product, 'id' | 'shopId' | 'status' | 'createdAt' | 'updatedAt' | 'categoryName' | 'supplierName'>;

export interface Category {
  id: string;
  shopId: string;
  name: string;
  description?: string;
  productCount?: number;
  createdAt?: string;
}

export type CategoryInput = {
  name: string;
  description?: string;
};

export interface Supplier {
  id: string;
  shopId: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  leadTime: number; // in days
  minOrderQuantity: number; // MOQ
  notes?: string;
  productCount?: number;
  createdAt?: string;
}

export type SupplierInput = {
  name: string;
  phone: string;
  email: string;
  address: string;
  leadTime: number;
  minOrderQuantity: number;
  notes?: string;
};

export type MovementType =
  | 'RESTOCK'
  | 'MANUAL_ADJUSTMENT'
  | 'SALE'
  | 'DAILY_SUMMARY_SALE'
  | 'DAILY_SUMMARY_ADJUSTMENT';

export interface InventoryMovement {
  id: string;
  shopId: string;
  productId: string;
  productName: string;
  sku: string;
  movementType: MovementType;
  quantityChange: number; // positive for restock, positive/negative for adjustment
  stockBefore: number;
  stockAfter: number;
  supplierId?: string;
  supplierName?: string;
  costPerUnit?: number;
  notes?: string;
  date: string;
  createdAt: string;
}

export interface RestockInput {
  productId: string;
  quantity: number;
  supplierId?: string;
  date: string;
  purchaseCost?: number;
  notes?: string;
}

export interface ManualAdjustmentInput {
  productId: string;
  newStock: number;
  reason: string;
  date: string;
  notes?: string;
}

export interface StockAlert {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  currentStock: number;
  threshold: number;
  type: 'critical_out' | 'low_stock' | 'overstocked' | 'slow_moving';
  severity: 'critical' | 'warning' | 'info';
  createdAt: string;
}
