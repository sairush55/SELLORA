"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useShop } from "@/hooks/useShop";
import { useDataRefresh } from "@/hooks/useDataRefresh";
import { productService } from "@/services/productService";
import { categoryService } from "@/services/categoryService";
import { salesService } from "@/services/salesService";
import { Product, Category } from "@/types/inventory";
import { POSCartItem, PaymentMethod, Sale } from "@/types/sales";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { ReceiptModal } from "@/components/sales/ReceiptModal";
import { formatINR } from "@/lib/utils";
import {
  Search,
  Receipt,
  Trash2,
  Plus,
  Minus,
  CreditCard,
  QrCode,
  Banknote,
  Wallet,
  Boxes,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  User,
  ShoppingBag,
  X,
} from "lucide-react";
import Link from "next/link";

interface CartQuantitySelectorProps {
  quantity: number;
  maxStock: number;
  productName: string;
  onUpdate: (qty: number) => void;
}

function CartQuantitySelector({
  quantity,
  maxStock,
  productName,
  onUpdate,
}: CartQuantitySelectorProps) {
  const [val, setVal] = useState<string>(String(quantity));

  useEffect(() => {
    setVal(String(quantity));
  }, [quantity]);

  const handleCommit = () => {
    const parsed = parseInt(val, 10);
    if (isNaN(parsed) || parsed < 1) {
      setVal("1");
      onUpdate(1);
    } else if (parsed > maxStock) {
      setVal(String(maxStock));
      onUpdate(maxStock);
    } else {
      setVal(String(parsed));
      onUpdate(parsed);
    }
  };

  return (
    <div className="inline-flex items-center border border-zinc-200 rounded-lg bg-zinc-50/70 p-0.5 shadow-2xs">
      <button
        type="button"
        disabled={quantity <= 1}
        onClick={() => onUpdate(Math.max(1, quantity - 1))}
        className="w-7 h-7 flex items-center justify-center rounded-md bg-white border border-zinc-200/90 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 active:bg-zinc-200 disabled:opacity-30 disabled:cursor-not-allowed shadow-2xs transition-all"
        title={quantity <= 1 ? "Minimum quantity is 1" : "Decrease quantity"}
        aria-label="Decrease quantity"
      >
        <Minus className="w-3 h-3 stroke-[2.5]" />
      </button>

      <input
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        value={val}
        onFocus={(e) => e.target.select()}
        onChange={(e) => {
          const digitsOnly = e.target.value.replace(/[^0-9]/g, "");
          setVal(digitsOnly);
        }}
        onBlur={handleCommit}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            handleCommit();
            (e.target as HTMLInputElement).blur();
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            if (quantity < maxStock) onUpdate(quantity + 1);
          } else if (e.key === "ArrowDown") {
            e.preventDefault();
            if (quantity > 1) onUpdate(quantity - 1);
          }
        }}
        className="w-10 text-center font-mono text-xs font-bold text-zinc-900 bg-transparent focus:bg-white focus:outline-none focus:ring-1 focus:ring-zinc-400 focus:rounded-md transition-all py-1"
        title={`Quantity (Available: ${maxStock})`}
        aria-label={`Quantity for ${productName}`}
      />

      <button
        type="button"
        disabled={quantity >= maxStock}
        onClick={() => onUpdate(Math.min(maxStock, quantity + 1))}
        className="w-7 h-7 flex items-center justify-center rounded-md bg-white border border-zinc-200/90 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 active:bg-zinc-200 disabled:opacity-30 disabled:cursor-not-allowed shadow-2xs transition-all"
        title={quantity >= maxStock ? `Maximum stock reached (${maxStock})` : "Increase quantity"}
        aria-label="Increase quantity"
      >
        <Plus className="w-3 h-3 stroke-[2.5]" />
      </button>
    </div>
  );
}

export default function POSBillingPage() {
  const { shop } = useShop();
  const shopId = shop.id;

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  // Cart state
  const [cart, setCart] = useState<POSCartItem[]>([]);
  const [mobileTab, setMobileTab] = useState<"catalog" | "cart">("catalog");
  const [discountType, setDiscountType] = useState<"percent" | "fixed">("percent");
  const [discountValue, setDiscountValue] = useState<number>(0);
  const [taxPercent, setTaxPercent] = useState<number>(5); // 5% default GST
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("upi");
  const [customerName, setCustomerName] = useState<string>("");

  // Transaction processing state
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [completedSale, setCompletedSale] = useState<Sale | null>(null);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);

  const loadData = useCallback(() => {
    const p = productService.getProducts(shopId);
    const c = categoryService.getCategories(shopId);
    setProducts(p);
    setCategories(c);
  }, [shopId]);

  useDataRefresh(loadData);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Filter catalog products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const q = search.toLowerCase().trim();
      const matchesSearch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q);
      const matchesCat = selectedCategory === "all" || p.categoryId === selectedCategory;
      return matchesSearch && matchesCat;
    });
  }, [products, search, selectedCategory]);

  // Cart operations
  const addToCart = (product: Product) => {
    setErrorMessage(null);

    // Stock check
    if (product.currentStock <= 0) {
      setErrorMessage(`Cannot add "${product.name}". Item is out of stock.`);
      return;
    }

    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        if (existing.quantity >= product.currentStock) {
          setErrorMessage(
            `Cannot add more "${product.name}". Available stock is ${product.currentStock} units.`
          );
          return prev;
        }
        return prev.map((item) =>
          item.product.id === product.id
            ? {
                ...item,
                quantity: item.quantity + 1,
                subtotal: (item.quantity + 1) * item.unitPrice,
              }
            : item
        );
      } else {
        return [
          ...prev,
          {
            product,
            quantity: 1,
            unitPrice: product.sellingPrice,
            subtotal: product.sellingPrice,
          },
        ];
      }
    });
  };

  const updateQuantity = (productId: string, newQty: number) => {
    setErrorMessage(null);
    if (newQty <= 0) {
      removeFromCart(productId);
      return;
    }

    const targetProduct = products.find((p) => p.id === productId);
    if (targetProduct && newQty > targetProduct.currentStock) {
      setErrorMessage(
        `Insufficient stock for "${targetProduct.name}". Maximum available: ${targetProduct.currentStock} units.`
      );
      return;
    }

    setCart((prev) =>
      prev.map((item) =>
        item.product.id === productId
          ? {
              ...item,
              quantity: newQty,
              subtotal: newQty * item.unitPrice,
            }
          : item
      )
    );
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const clearCart = () => {
    setCart([]);
    setDiscountValue(0);
    setCustomerName("");
    setErrorMessage(null);
    setMobileTab("catalog");
  };

  // Calculations
  const subtotal = cart.reduce((sum, item) => sum + item.subtotal, 0);
  const rawDiscount =
    discountType === "percent"
      ? (subtotal * (Number(discountValue) || 0)) / 100
      : Number(discountValue) || 0;
  const discount = Math.min(subtotal, Math.max(0, Math.round(rawDiscount)));
  const taxableAmount = Math.max(0, subtotal - discount);
  const tax = taxPercent > 0 ? Math.round(taxableAmount * (taxPercent / 100)) : 0;
  const grandTotal = Math.max(0, taxableAmount + tax);

  // Execute Sale Transaction
  const handleCompleteSale = () => {
    setErrorMessage(null);
    if (cart.length === 0) {
      setErrorMessage("Cannot checkout with an empty cart. Add at least one item.");
      return;
    }

    setIsProcessing(true);
    const result = salesService.processPOSSale(shopId, {
      cartItems: cart,
      discount,
      tax,
      paymentMethod,
      customerName: customerName.trim() ? customerName.trim() : undefined,
    });
    setIsProcessing(false);

    if (result.sale) {
      setCompletedSale(result.sale);
      setIsReceiptOpen(true);
      // Reload product stock after atomic deduction
      loadData();
    } else {
      setErrorMessage(result.error || "Failed to process sale");
    }
  };

  return (
    <div className="space-y-5">
      {/* Top Billing Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-200/80">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 tracking-tight font-sans">
            Billing
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 mt-0.5">
            Create a sale and update inventory automatically.
          </p>
        </div>

        {cart.length > 0 && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={clearCart}
              className="text-xs text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
            >
              <Trash2 className="w-3.5 h-3.5 mr-1" />
              Clear Cart
            </Button>
          </div>
        )}
      </div>

      {/* Error notification banner */}
      {errorMessage && (
        <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 font-semibold flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button
            onClick={() => setErrorMessage(null)}
            className="text-red-400 hover:text-red-700 font-bold ml-2 text-base leading-none"
          >
            ×
          </button>
        </div>
      )}

      {/* Mobile View Switcher Tabs (lg:hidden) */}
      <div className="lg:hidden flex items-center bg-zinc-100 p-1 rounded-xl border border-zinc-200/90 shadow-2xs">
        <button
          type="button"
          onClick={() => setMobileTab("catalog")}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            mobileTab === "catalog"
              ? "bg-white text-zinc-950 shadow-2xs"
              : "text-zinc-600 hover:text-zinc-900"
          }`}
        >
          <Boxes className="w-3.5 h-3.5 text-zinc-500" />
          <span>Catalog ({filteredProducts.length})</span>
        </button>
        <button
          type="button"
          onClick={() => setMobileTab("cart")}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer relative ${
            mobileTab === "cart"
              ? "bg-white text-zinc-950 shadow-2xs"
              : "text-zinc-600 hover:text-zinc-900"
          }`}
        >
          <ShoppingBag className="w-3.5 h-3.5 text-zinc-500" />
          <span>Cart ({cart.reduce((s, i) => s + i.quantity, 0)})</span>
          {cart.length > 0 && (
            <span className="font-mono text-[10px] text-brand-800 bg-brand-50 px-1.5 py-0.5 rounded-full border border-brand-200 ml-1 font-bold">
              {formatINR(grandTotal)}
            </span>
          )}
        </button>
      </div>

      {/* 2-Column POS Layout (Adaptive: stacked with tabs on mobile, side-by-side on desktop) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT / MAIN AREA: Product Search & Product Selection (7 cols) */}
        <div className={`lg:col-span-7 space-y-4 ${mobileTab === "catalog" ? "block" : "hidden lg:block"}`}>
          {/* Prominent Search Field */}
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input
              type="text"
              placeholder="Search products or scan barcode..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-11 pl-10 pr-4 rounded-xl border border-zinc-200 bg-white text-xs sm:text-sm font-medium text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent shadow-xs transition-all"
            />
          </div>

          {/* Category Filter Chips */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
            <button
              type="button"
              onClick={() => setSelectedCategory("all")}
              className={`px-3.5 py-1.5 rounded-full border whitespace-nowrap font-medium transition-all cursor-pointer ${
                selectedCategory === "all"
                  ? "bg-charcoal-900 text-white border-charcoal-900 shadow-2xs font-semibold"
                  : "bg-white text-zinc-600 border-zinc-200 hover:bg-zinc-50 hover:border-zinc-300"
              }`}
            >
              All Products ({products.length})
            </button>
            {categories.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setSelectedCategory(c.id)}
                className={`px-3.5 py-1.5 rounded-full border whitespace-nowrap font-medium transition-all cursor-pointer ${
                  selectedCategory === c.id
                    ? "bg-charcoal-900 text-white border-charcoal-900 shadow-2xs font-semibold"
                    : "bg-white text-zinc-600 border-zinc-200 hover:bg-zinc-50 hover:border-zinc-300"
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>

          {/* Product Catalog Grid */}
          {products.length === 0 ? (
            <div className="rounded-2xl border border-zinc-200 bg-white p-6">
              <EmptyState
                icon={<Boxes className="w-7 h-7" />}
                title="Your catalog is empty"
                description="Add products to your inventory first, then return here to start billing."
                action={
                  <Link href="/inventory/products">
                    <Button variant="primary" size="sm">
                      <Plus className="w-3.5 h-3.5 mr-1.5" />
                      Add Products
                    </Button>
                  </Link>
                }
              />
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[calc(100vh-280px)] overflow-y-auto pr-1">
              {filteredProducts.length === 0 ? (
                <div className="col-span-full py-16 text-center text-zinc-400 text-xs bg-white rounded-2xl border border-zinc-200">
                  No products match &ldquo;{search}&rdquo;
                </div>
              ) : (
                filteredProducts.map((p) => {
                  const isOutOfStock = p.currentStock <= 0;
                  const cartItem = cart.find((i) => i.product.id === p.id);

                  return (
                    <div
                      key={p.id}
                      onClick={() => !isOutOfStock && addToCart(p)}
                      className={`relative flex flex-col justify-between p-3.5 rounded-xl border bg-white transition-all text-left group ${
                        isOutOfStock
                          ? "border-zinc-200 opacity-60 cursor-not-allowed bg-zinc-50/60"
                          : "border-zinc-200 hover:border-emerald-500/80 hover:shadow-md cursor-pointer active:scale-[0.99]"
                      }`}
                    >
                      {/* Top Tag / Status */}
                      <div>
                        <div className="flex items-start justify-between gap-1 mb-2">
                          <span className="font-mono text-[10px] text-zinc-400 truncate">
                            {p.sku || "NO-SKU"}
                          </span>

                          {isOutOfStock ? (
                            <span className="text-[10px] font-bold text-red-700 bg-red-50 border border-red-200 px-1.5 py-0.2 rounded shrink-0">
                              Out of Stock
                            </span>
                          ) : (
                            <span
                              className={`text-[10px] font-mono font-medium px-1.5 py-0.2 rounded shrink-0 ${
                                p.currentStock <= p.minStock
                                  ? "text-amber-800 bg-amber-50 border border-amber-200"
                                  : "text-zinc-500 bg-zinc-100"
                              }`}
                            >
                              Stock: {p.currentStock}
                            </span>
                          )}
                        </div>

                        <h4 className="text-xs sm:text-sm font-bold text-zinc-900 line-clamp-2 leading-snug">
                          {p.name}
                        </h4>
                      </div>

                      {/* Bottom Row: Price & Add Action */}
                      <div className="mt-3 pt-2.5 border-t border-zinc-100 flex items-center justify-between">
                        <span className="font-mono text-xs sm:text-sm font-extrabold text-charcoal-950">
                          {formatINR(p.sellingPrice)}
                        </span>

                        {!isOutOfStock && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              addToCart(p);
                            }}
                            className={`px-2 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all ${
                              cartItem
                                ? "bg-brand-500 text-charcoal-950 font-bold shadow-2xs"
                                : "bg-zinc-100 text-zinc-800 hover:bg-brand-50 hover:text-brand-700"
                            }`}
                          >
                            <Plus className="w-3 h-3" />
                            <span>{cartItem ? `${cartItem.quantity}` : "Add"}</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>

        {/* RIGHT / CHECKOUT PANEL: Customer, Cart Table, Summary & Tender (5 cols) */}
        <div className={`lg:col-span-5 sticky top-20 ${mobileTab === "cart" ? "block" : "hidden lg:block"}`}>
          <Card className="border border-zinc-200/90 shadow-md rounded-2xl overflow-hidden bg-white">
            {/* Mobile Back To Catalog Action (lg:hidden) */}
            <div className="lg:hidden px-4 py-2.5 bg-brand-50/80 border-b border-brand-100 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setMobileTab("catalog")}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-800 hover:text-brand-950 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>← Back to Products Catalog</span>
              </button>
              <span className="text-[11px] font-mono font-semibold text-brand-700 bg-white/80 px-2 py-0.5 rounded-full border border-brand-200">
                {cart.reduce((s, i) => s + i.quantity, 0)} in cart
              </span>
            </div>

            {/* 1. Customer Section */}
            <div className="p-3.5 sm:p-4 bg-white border-b border-zinc-100 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <label className="font-semibold text-zinc-700 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-zinc-400" />
                  <span>Customer</span>
                </label>
                <span className="text-[10px] text-zinc-400 font-mono">Optional</span>
              </div>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Enter customer name or phone..."
                  value={customerName}
                  maxLength={80}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full h-9 pl-3 pr-8 rounded-lg border border-zinc-200 bg-zinc-50/50 text-xs font-medium text-zinc-900 placeholder:text-zinc-400 focus:bg-white focus:border-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-400 transition-all"
                />
                {customerName && (
                  <button
                    type="button"
                    onClick={() => setCustomerName("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 p-0.5 cursor-pointer"
                    title="Clear customer name"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* 2. Main Cart Area: Product | Qty | Price | Total | Remove */}
            <div className="p-0">
              <div className="px-4 py-2.5 bg-zinc-50/80 border-b border-zinc-100 flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 font-bold text-zinc-800 uppercase tracking-wide text-[11px]">
                  <ShoppingBag className="w-3.5 h-3.5 text-zinc-400" />
                  <span>Cart ({cart.reduce((s, i) => s + i.quantity, 0)} items)</span>
                </div>
                <span className="font-mono text-xs font-semibold text-zinc-700">
                  Subtotal: {formatINR(subtotal)}
                </span>
              </div>

              <div className="max-h-[30vh] overflow-y-auto">
                {cart.length === 0 ? (
                  <div className="py-10 text-center px-4 space-y-1.5">
                    <ShoppingBag className="w-7 h-7 text-zinc-300 mx-auto" />
                    <p className="text-xs font-semibold text-zinc-600">Cart is empty</p>
                    <p className="text-[11px] text-zinc-400">
                      Click products in the catalog to add them to this bill.
                    </p>
                  </div>
                ) : (
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-zinc-50/80 border-b border-zinc-200 text-[10px] uppercase font-mono text-zinc-400 font-bold sticky top-0">
                      <tr>
                        <th className="py-2 px-3">Product</th>
                        <th className="py-2 px-2 text-center">Qty</th>
                        <th className="py-2 px-2 text-right">Price</th>
                        <th className="py-2 px-3 text-right">Total</th>
                        <th className="py-2 px-2 text-center w-8"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100">
                      {cart.map((item) => (
                        <tr key={item.product.id} className="hover:bg-zinc-50/60 transition-colors">
                          {/* Product */}
                          <td className="py-2.5 px-3">
                            <div className="font-semibold text-zinc-900 truncate max-w-[140px]">
                              {item.product.name}
                            </div>
                            <div className="text-[10px] font-mono text-zinc-400">
                              {item.product.sku}
                            </div>
                          </td>

                          {/* Qty Stepper & Direct Editing */}
                          <td className="py-2.5 px-2 text-center">
                            <CartQuantitySelector
                              quantity={item.quantity}
                              maxStock={item.product.currentStock}
                              productName={item.product.name}
                              onUpdate={(newQty) => updateQuantity(item.product.id, newQty)}
                            />
                          </td>

                          {/* Unit Price */}
                          <td className="py-2.5 px-2 text-right font-mono text-zinc-500 text-[11px]">
                            {formatINR(item.unitPrice)}
                          </td>

                          {/* Line Total */}
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-zinc-900">
                            {formatINR(item.subtotal)}
                          </td>

                          {/* Remove */}
                          <td className="py-2.5 px-2 text-center">
                            <button
                              type="button"
                              onClick={() => removeFromCart(item.product.id)}
                              className="p-1 text-zinc-400 hover:text-red-600 rounded-md hover:bg-red-50 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>

            {/* 3. Order Summary & Payment Section */}
            <div className="p-4 bg-zinc-50/90 border-t border-zinc-200/80 space-y-3.5 text-xs">
              {/* Order Summary */}
              <div className="space-y-2 text-zinc-600">
                <div className="flex justify-between items-center text-xs">
                  <span>Subtotal</span>
                  <span className="font-mono font-semibold text-zinc-900">
                    {formatINR(subtotal)}
                  </span>
                </div>

                {/* Discount Section (Percentage-First) */}
                <div className="py-2 border-y border-zinc-200/70 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-zinc-700">Discount</span>
                      {/* Mode toggle: % vs ₹ */}
                      <div className="inline-flex items-center bg-zinc-200/70 p-0.5 rounded-md text-[10px] font-bold">
                        <button
                          type="button"
                          onClick={() => {
                            setDiscountType("percent");
                            setDiscountValue(0);
                          }}
                          className={`px-1.5 py-0.5 rounded transition-all ${
                            discountType === "percent"
                              ? "bg-white text-zinc-900 shadow-2xs"
                              : "text-zinc-500 hover:text-zinc-800"
                          }`}
                          title="Percentage discount"
                        >
                          %
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setDiscountType("fixed");
                            setDiscountValue(0);
                          }}
                          className={`px-1.5 py-0.5 rounded transition-all ${
                            discountType === "fixed"
                              ? "bg-white text-zinc-900 shadow-2xs"
                              : "text-zinc-500 hover:text-zinc-800"
                          }`}
                          title="Fixed amount discount"
                        >
                          ₹
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {discount > 0 && (
                        <span className="font-mono text-[11px] text-zinc-400">
                          ({discountType === "percent" ? `${discountValue}%` : `₹${discountValue}`})
                        </span>
                      )}
                      <span className="font-mono text-xs font-bold text-emerald-600">
                        {discount > 0 ? `-${formatINR(discount)}` : "₹0"}
                      </span>
                    </div>
                  </div>

                  {discountType === "percent" ? (
                    <div className="flex items-center gap-1.5">
                      {[0, 5, 10, 15, 20].map((pct) => (
                        <button
                          key={pct}
                          type="button"
                          onClick={() => setDiscountValue(pct)}
                          className={`flex-1 py-1 rounded-md text-[11px] font-mono font-semibold transition-all ${
                            discountValue === pct
                              ? "bg-zinc-900 text-white shadow-2xs"
                              : "bg-white border border-zinc-200 text-zinc-700 hover:bg-zinc-100"
                          }`}
                        >
                          {pct === 0 ? "0%" : `${pct}%`}
                        </button>
                      ))}

                      {/* Custom % input */}
                      <div className="relative w-16 shrink-0">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={discountValue || ""}
                          placeholder="%"
                          onFocus={(e) => e.target.select()}
                          onChange={(e) => {
                            const val = Math.min(100, Math.max(0, parseFloat(e.target.value) || 0));
                            setDiscountValue(val);
                          }}
                          className="w-full h-7 pr-4 pl-1.5 text-center font-mono text-xs rounded-md border border-zinc-200 bg-white focus:outline-none focus:ring-1 focus:ring-zinc-400 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                        <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[10px] font-mono text-zinc-400 pointer-events-none">
                          %
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] text-zinc-500">Fixed rupee deduction:</span>
                      <div className="flex items-center gap-1">
                        <span className="font-mono text-zinc-400 text-xs">₹</span>
                        <input
                          type="number"
                          min="0"
                          max={subtotal}
                          value={discountValue || ""}
                          placeholder="0"
                          onFocus={(e) => e.target.select()}
                          onChange={(e) => {
                            const val = Math.min(subtotal, Math.max(0, parseFloat(e.target.value) || 0));
                            setDiscountValue(val);
                          }}
                          className="w-24 h-7 px-2 text-right font-mono text-xs rounded-md border border-zinc-200 bg-white focus:outline-none focus:ring-1 focus:ring-zinc-400 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span>Tax (GST)</span>
                  <div className="flex items-center gap-2">
                    <select
                      value={taxPercent}
                      onChange={(e) => setTaxPercent(parseInt(e.target.value) || 0)}
                      className="h-7 px-2 text-xs rounded-lg border border-zinc-200 bg-white font-mono focus:outline-none"
                    >
                      <option value={0}>0%</option>
                      <option value={5}>5% GST</option>
                      <option value={12}>12% GST</option>
                      <option value={18}>18% GST</option>
                    </select>
                    <span className="font-mono text-zinc-800 font-medium">+{formatINR(tax)}</span>
                  </div>
                </div>

                <div className="flex justify-between items-center pt-2.5 border-t border-zinc-200">
                  <span className="text-sm font-bold text-charcoal-950 uppercase tracking-tight">
                    Grand Total
                  </span>
                  <span className="font-mono text-xl font-extrabold text-emerald-700">
                    {formatINR(grandTotal)}
                  </span>
                </div>
              </div>

              {/* Payment Method Pills */}
              <div className="pt-1">
                <label className="block text-[10px] uppercase font-bold text-zinc-400 font-mono mb-2 tracking-wider">
                  Payment Method
                </label>
                <div className="grid grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("cash")}
                    className={`py-2 px-2 rounded-xl border text-xs font-semibold flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                      paymentMethod === "cash"
                        ? "bg-charcoal-900 text-white border-charcoal-900 shadow-sm"
                        : "bg-white text-zinc-700 border-zinc-200 hover:bg-zinc-100"
                    }`}
                  >
                    <Banknote className="w-3.5 h-3.5" />
                    <span>Cash</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod("upi")}
                    className={`py-2 px-2 rounded-xl border text-xs font-semibold flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                      paymentMethod === "upi"
                        ? "bg-charcoal-900 text-white border-charcoal-900 shadow-sm"
                        : "bg-white text-zinc-700 border-zinc-200 hover:bg-zinc-100"
                    }`}
                  >
                    <QrCode className="w-3.5 h-3.5" />
                    <span>UPI</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod("card")}
                    className={`py-2 px-2 rounded-xl border text-xs font-semibold flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                      paymentMethod === "card"
                        ? "bg-charcoal-900 text-white border-charcoal-900 shadow-sm"
                        : "bg-white text-zinc-700 border-zinc-200 hover:bg-zinc-100"
                    }`}
                  >
                    <CreditCard className="w-3.5 h-3.5" />
                    <span>Card</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod("other")}
                    className={`py-2 px-2 rounded-xl border text-xs font-semibold flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                      paymentMethod === "other"
                        ? "bg-charcoal-900 text-white border-charcoal-900 shadow-sm"
                        : "bg-white text-zinc-700 border-zinc-200 hover:bg-zinc-100"
                    }`}
                  >
                    <Wallet className="w-3.5 h-3.5" />
                    <span>Other</span>
                  </button>
                </div>
              </div>

              {/* Complete Sale Button */}
              <button
                type="button"
                onClick={handleCompleteSale}
                disabled={cart.length === 0 || isProcessing}
                className="w-full h-12 rounded-xl font-extrabold text-sm text-charcoal-950 bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:brightness-105 shadow-accent hover:shadow-accent-lg active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
              >
                {isProcessing ? (
                  <span>Processing Sale...</span>
                ) : (
                  <>
                    <span>Complete Sale • {formatINR(grandTotal)}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </Card>
        </div>
      </div>

      {/* Mobile Floating Cart Summary Bar (lg:hidden) */}
      {cart.length > 0 && mobileTab === "catalog" && (
        <div className="lg:hidden fixed bottom-14 left-3 right-3 z-30 bg-charcoal-950/95 backdrop-blur-md text-white p-3 rounded-2xl border border-amber-500/40 shadow-2xl flex items-center justify-between animate-in fade-in slide-in-from-bottom-4">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center justify-center font-mono font-bold text-xs shrink-0">
              {cart.reduce((s, i) => s + i.quantity, 0)}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-extrabold text-zinc-100 truncate">{formatINR(grandTotal)}</p>
              <p className="text-[10px] text-zinc-400 font-medium truncate">
                {cart.length} {cart.length === 1 ? "item" : "items"} in bill
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setMobileTab("cart")}
            className="px-3.5 py-2 rounded-xl text-xs font-extrabold text-charcoal-950 bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:brightness-105 active:scale-95 shadow-md flex items-center gap-1.5 transition-all cursor-pointer shrink-0"
          >
            <span>Review Bill & Pay</span>
            <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
          </button>
        </div>
      )}

      {/* Printable Receipt Modal */}
      <ReceiptModal
        isOpen={isReceiptOpen}
        onClose={() => setIsReceiptOpen(false)}
        sale={completedSale}
        onNewBill={clearCart}
      />
    </div>
  );
}
