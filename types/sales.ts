import { Product } from "./inventory";

export type SaleType = 'TRANSACTION' | 'DAILY_SUMMARY';
export type PaymentMethod = 'cash' | 'upi' | 'card' | 'other';
export type SaleStatus = 'completed' | 'refunded' | 'cancelled';

export interface SaleItem {
  id: string;
  saleId: string;
  productId: string;
  productName: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  costPrice?: number;
  createdAt?: string;
}

export interface Payment {
  id: string;
  saleId: string;
  shopId: string;
  paymentMethod: PaymentMethod;
  amount: number;
  referenceId?: string;
  status: 'completed' | 'refunded';
  createdAt: string;
}

export interface Sale {
  id: string;
  shopId: string;
  invoiceNumber: string;
  saleType: SaleType;
  subtotal: number;
  discount: number;
  tax: number;
  taxRate?: number;
  applyGst?: boolean;
  taxType?: 'cgst_sgst' | 'igst';
  cgst?: number;
  sgst?: number;
  igst?: number;
  totalAmount: number;
  paymentMethod: PaymentMethod;
  customerName?: string;
  customerPhone?: string;
  status: SaleStatus;
  notes?: string;
  saleDate: string;
  createdAt: string;
  items: SaleItem[];
  payment?: Payment;
}

export interface POSCartItem {
  product: Product;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface ProcessSaleInput {
  cartItems: POSCartItem[];
  discount?: number; // In ₹ INR
  tax?: number; // In ₹ INR
  taxRate?: number;
  applyGst?: boolean;
  taxType?: 'cgst_sgst' | 'igst';
  paymentMethod: PaymentMethod;
  customerName?: string;
  customerPhone?: string;
  notes?: string;
}

export interface DailySalesSummaryItem {
  id: string;
  summaryId: string;
  productId: string;
  productName: string;
  sku: string;
  quantitySold: number;
  unitPrice: number;
  subtotal: number;
}

export interface DailySalesSummary {
  id: string;
  shopId: string;
  summaryDate: string; // YYYY-MM-DD
  totalItemsSold: number;
  totalRevenue: number;
  saleId?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  items: DailySalesSummaryItem[];
}

export interface DailySummaryInput {
  date: string;
  items: Array<{
    productId: string;
    quantitySold: number;
  }>;
  notes?: string;
}

export interface DailySummaryStat {
  date: string;
  totalRevenue: number;
  billCount: number;
  avgTicketSize: number;
  cashAmount: number;
  upiAmount: number;
  cardAmount: number;
  otherAmount: number;
}
