export interface DashboardKPIs {
  todaySales: number;
  todaySalesChange: number; // percentage e.g. +14.2
  billsCount: number;
  billsChange: number;
  avgBillValue: number;
  itemsSold: number;
  inventoryValue: number;
  skuCount: number;
}

export interface SalesTrendPoint {
  timeLabel: string;
  sales: number;
  target: number;
  bills: number;
}

export interface StockHealthSummary {
  totalSkus: number;
  healthyCount: number;
  lowStockCount: number;
  outOfStockCount: number;
  overstockedCount: number;
  healthyPercentage: number;
}

export interface RecommendedOrder {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  category: string;
  supplierName: string;
  currentStock: number;
  reorderPoint: number;
  recommendedQty: number;
  unit: string;
  estimatedCost: number;
  urgency: 'critical' | 'moderate' | 'scheduled';
  stockoutRiskDays: number;
}

export interface TopProduct {
  id: string;
  name: string;
  category: string;
  unitsSold: number;
  revenue: number;
  velocity: string; // e.g. "34/day"
  marginPercentage: number;
}

export interface SlowMovingProduct {
  id: string;
  name: string;
  category: string;
  daysWithoutSale: number;
  tiedCapital: number;
  currentStock: number;
  unit: string;
  status: 'critical_deadstock' | 'slow';
}

export interface BusinessInsight {
  id: string;
  title: string;
  description: string;
  type: 'opportunity' | 'warning' | 'alert' | 'healthy';
  metricImpact?: string;
  actionText: string;
  actionHref: string;
}
