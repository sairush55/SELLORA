"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useShop } from "@/hooks/useShop";
import { productService } from "@/services/productService";
import { categoryService } from "@/services/categoryService";
import { supplierService } from "@/services/supplierService";
import { inventoryMovementService } from "@/services/inventoryMovementService";
import { Product, Category, Supplier, InventoryMovement, RestockInput, ManualAdjustmentInput } from "@/types/inventory";
import { EmptyState } from "@/components/ui/EmptyState";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { StatCard } from "@/components/ui/StatCard";
import { formatINR, formatNumberIN } from "@/lib/utils";
import { RestockModal } from "@/components/inventory/RestockModal";
import { MovementHistoryModal } from "@/components/inventory/MovementHistoryModal";
import {
  Boxes,
  PackagePlus,
  Sliders,
  History,
  Search,
  ArrowRight,
  TrendingDown,
  AlertTriangle,
  RotateCw,
  Plus,
} from "lucide-react";
import Link from "next/link";

export default function InventoryOverviewPage() {
  const { shop } = useShop();
  const shopId = shop.id;

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [movements, setMovements] = useState<InventoryMovement[]>([]);

  // Search & Filter state
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");

  // Modals state
  const [isRestockOpen, setIsRestockOpen] = useState(false);
  const [restockMode, setRestockMode] = useState<"RESTOCK" | "MANUAL_ADJUSTMENT">("RESTOCK");
  const [selectedProductForModal, setSelectedProductForModal] = useState<Product | null>(null);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  const loadData = () => {
    const p = productService.getProducts(shopId);
    const c = categoryService.getCategories(shopId);
    const s = supplierService.getSuppliers(shopId);
    const m = inventoryMovementService.getMovements(shopId);

    setProducts(p);
    setCategories(c);
    setSuppliers(s);
    setMovements(m);
  };

  useEffect(() => {
    loadData();
  }, [shopId]);

  // Handle Restock action
  const handleRestockSubmit = (input: RestockInput) => {
    const res = inventoryMovementService.receiveStock(shopId, input);
    if (res.movement) {
      loadData();
      return { success: true };
    }
    return { success: false, error: res.error };
  };

  // Handle Adjustment action
  const handleAdjustmentSubmit = (input: ManualAdjustmentInput) => {
    const res = inventoryMovementService.adjustStock(shopId, input);
    if (res.movement) {
      loadData();
      return { success: true };
    }
    return { success: false, error: res.error };
  };

  // Open modal targeting specific product
  const triggerRestock = (product: Product, mode: "RESTOCK" | "MANUAL_ADJUSTMENT" = "RESTOCK") => {
    setSelectedProductForModal(product);
    setRestockMode(mode);
    setIsRestockOpen(true);
  };

  // Filtered products list
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesSearch =
        !search ||
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.sku.toLowerCase().includes(search.toLowerCase()) ||
        (p.supplierName && p.supplierName.toLowerCase().includes(search.toLowerCase()));

      const matchesCat = selectedCategory === "all" || p.categoryId === selectedCategory;
      const matchesStatus = selectedStatus === "all" || p.status === selectedStatus;

      return matchesSearch && matchesCat && matchesStatus;
    });
  }, [products, search, selectedCategory, selectedStatus]);

  // Inventory KPI metrics
  const totalStockUnits = products.reduce((sum, p) => sum + p.currentStock, 0);
  const inventoryValuation = products.reduce(
    (sum, p) => sum + p.currentStock * p.costPrice,
    0
  );
  const lowStockCount = products.filter((p) => p.status === "low_stock" || p.status === "out_of_stock").length;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 pb-2 border-b border-zinc-200/80">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-zinc-900 tracking-tight">
            Inventory
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 mt-0.5">
            View and manage your current stock levels
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          {/* Primary Action Button */}
          <Button
            variant="accent"
            size="sm"
            onClick={() => {
              setSelectedProductForModal(null);
              setRestockMode("RESTOCK");
              setIsRestockOpen(true);
            }}
            className="text-xs font-semibold gap-1.5 shadow-sm justify-center h-9 sm:h-8"
          >
            <PackagePlus className="w-4 h-4" />
            Add Incoming Stock
          </Button>

          {/* Secondary Actions */}
          <div className="grid grid-cols-2 sm:flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsHistoryOpen(true)}
              className="text-xs gap-1.5 justify-center h-8"
            >
              <History className="w-3.5 h-3.5" />
              History ({movements.length})
            </Button>

            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setSelectedProductForModal(null);
                setRestockMode("MANUAL_ADJUSTMENT");
                setIsRestockOpen(true);
              }}
              className="text-xs gap-1.5 justify-center h-8"
            >
              <Sliders className="w-3.5 h-3.5 text-amber-600" />
              Adjust Stock
            </Button>
          </div>
        </div>
      </div>

      {/* Summary KPI Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          title="Total Products"
          value={`${products.length} products`}
          subtitle="In your catalog"
          icon={<Boxes className="w-4 h-4 text-zinc-700" />}
        />

        <StatCard
          title="Units in Stock"
          value={`${formatNumberIN(totalStockUnits)} units`}
          subtitle="Across all products"
          icon={<PackagePlus className="w-4 h-4 text-brand-600" />}
        />

        <StatCard
          title="Stock Value"
          value={formatINR(inventoryValuation)}
          subtitle="At purchase / cost price"
          icon={<TrendingDown className="w-4 h-4 text-purple-600" />}
        />

        <StatCard
          title="Need Restock"
          value={`${lowStockCount} products`}
          subtitle="At or below minimum level"
          change={lowStockCount > 0 ? -12.5 : 0}
          changeLabel="stockout exposure"
          icon={<AlertTriangle className="w-4 h-4 text-red-500" />}
        />
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col gap-2.5 p-3 rounded-xl bg-white border border-zinc-200/90 shadow-2xs">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <input
            type="text"
            placeholder="Search product, SKU, or supplier..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-9 pl-9 pr-3 rounded-lg border border-zinc-200 text-xs bg-zinc-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 justify-between">
          <div className="grid grid-cols-2 gap-2 flex-1">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="h-9 px-2.5 rounded-lg border border-zinc-200 text-xs text-zinc-700 bg-zinc-50 focus:outline-none truncate"
            >
              <option value="all">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>

            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="h-9 px-2.5 rounded-lg border border-zinc-200 text-xs text-zinc-700 bg-zinc-50 focus:outline-none truncate"
            >
              <option value="all">All Stock Status</option>
              <option value="healthy">Healthy</option>
              <option value="low_stock">Low Stock</option>
              <option value="out_of_stock">Out of Stock</option>
              <option value="overstocked">Overstocked</option>
            </select>
          </div>

          <Link href="/inventory/products" className="w-full sm:w-auto">
            <Button variant="outline" size="sm" className="text-xs whitespace-nowrap w-full sm:w-auto justify-center h-9">
              Manage Catalog
              <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </Link>
        </div>
      </div>

      {/* 1. Mobile Cards View (Easy Thumb-Friendly Interface) */}
      <div className="space-y-3 md:hidden">
        {filteredProducts.length === 0 && products.length === 0 ? (
          <EmptyState
            icon={<Boxes className="w-7 h-7" />}
            title="No products yet"
            description="Add your first product to start tracking stock levels and making sales."
            action={
              <Link href="/inventory/products">
                <Button variant="primary" size="sm" className="w-full justify-center">
                  <Plus className="w-3.5 h-3.5 mr-1.5" />
                  Add Your First Product
                </Button>
              </Link>
            }
          />
        ) : filteredProducts.length === 0 ? (
          <div className="py-10 text-center text-zinc-400 text-xs bg-white rounded-xl border border-zinc-200 p-4">
            No products match your search or filter.
          </div>
        ) : (
          filteredProducts.map((p) => {
            const avgDailySales = Math.max(
              1,
              Math.round(p.openingStock > 0 ? p.openingStock / 10 : 3)
            );
            const daysRemaining = Math.max(
              0,
              Math.round(p.currentStock / avgDailySales)
            );

            return (
              <div
                key={p.id}
                className="p-3.5 rounded-2xl bg-white border border-zinc-200/90 shadow-2xs space-y-3"
              >
                {/* Header: Product Name, SKU, Status Badge */}
                <div className="flex items-start justify-between gap-2.5">
                  <div className="flex items-center gap-2.5 min-w-0">
                    {p.imageUrl ? (
                      <img
                        src={p.imageUrl}
                        alt={p.name}
                        className="w-10 h-10 rounded-lg object-cover border border-zinc-200 shrink-0"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-zinc-100 flex items-center justify-center text-zinc-500 font-mono text-xs shrink-0">
                        <Boxes className="w-5 h-5" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="font-bold text-zinc-900 text-sm truncate leading-snug">
                        {p.name}
                      </p>
                      <p className="text-[11px] font-mono text-zinc-400 truncate">
                        {p.sku} • {p.categoryName || "General"}
                      </p>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div className="shrink-0">
                    {p.status === "healthy" && <Badge variant="healthy" dot>Healthy</Badge>}
                    {p.status === "low_stock" && <Badge variant="warning" dot>Low Stock</Badge>}
                    {p.status === "out_of_stock" && <Badge variant="critical" dot>Out</Badge>}
                    {p.status === "overstocked" && <Badge variant="info" dot>Over</Badge>}
                  </div>
                </div>

                {/* Metrics Grid: Stock, Price, Days */}
                <div className="grid grid-cols-3 gap-2 p-2.5 bg-zinc-50/80 rounded-xl border border-zinc-100 text-center">
                  <div>
                    <span className="text-[10px] uppercase font-mono text-zinc-400 font-bold block">
                      Stock
                    </span>
                    <span className="text-sm font-extrabold text-zinc-900 font-mono">
                      {p.currentStock} {p.unit}
                    </span>
                    <span className="text-[10px] text-zinc-400 block">Min: {p.minStock}</span>
                  </div>

                  <div>
                    <span className="text-[10px] uppercase font-mono text-zinc-400 font-bold block">
                      Price
                    </span>
                    <span className="text-sm font-extrabold text-zinc-900 font-mono">
                      {formatINR(p.sellingPrice)}
                    </span>
                    <span className="text-[10px] text-zinc-400 block">Cost: {formatINR(p.costPrice)}</span>
                  </div>

                  <div>
                    <span className="text-[10px] uppercase font-mono text-zinc-400 font-bold block">
                      Runout
                    </span>
                    <span
                      className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold font-mono mt-0.5 ${
                        daysRemaining <= 1
                          ? "bg-red-100 text-red-700"
                          : daysRemaining <= 3
                          ? "bg-amber-100 text-amber-700"
                          : "bg-emerald-50 text-emerald-700"
                      }`}
                    >
                      {daysRemaining === 0 ? "Depleted" : `${daysRemaining}d left`}
                    </span>
                    <span className="text-[10px] text-zinc-400 block mt-0.5">{avgDailySales}/day</span>
                  </div>
                </div>

                {/* Quick Action Touch Bar */}
                <div className="flex items-center gap-2 pt-0.5">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => triggerRestock(p, "MANUAL_ADJUSTMENT")}
                    className="flex-1 text-xs justify-center h-8"
                  >
                    <Sliders className="w-3 h-3 mr-1 text-amber-600" />
                    Adjust
                  </Button>

                  <Button
                    variant="accent"
                    size="sm"
                    onClick={() => triggerRestock(p, "RESTOCK")}
                    className="flex-1 text-xs font-semibold justify-center h-8 shadow-xs"
                  >
                    <PackagePlus className="w-3.5 h-3.5 mr-1" />
                    + Restock
                  </Button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 2. Desktop Inventory Table with Required Columns */}
      <div className="hidden md:block">
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-zinc-50 border-b border-zinc-200/80 text-[11px] uppercase font-semibold text-zinc-500 font-mono">
                  <tr>
                    <th className="py-3 px-4">Product</th>
                    <th className="py-3 px-3 text-center">Current Stock</th>
                    <th className="py-3 px-3 text-right">Selling Price</th>
                    <th className="py-3 px-3 text-center">Avg Daily Sales</th>
                    <th className="py-3 px-3 text-center">Days Remaining</th>
                    <th className="py-3 px-3 text-center">Status</th>
                    <th className="py-3 px-4">Supplier</th>
                    <th className="py-3 px-4 text-right">Quick Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 font-normal">
                  {filteredProducts.length === 0 && products.length === 0 ? (
                    <tr>
                      <td colSpan={8}>
                        <EmptyState
                          icon={<Boxes className="w-7 h-7" />}
                          title="No products yet"
                          description="Add your first product to start tracking stock levels and making sales."
                          action={
                            <Link href="/inventory/products">
                              <Button variant="primary" size="sm">
                                <Plus className="w-3.5 h-3.5 mr-1.5" />
                                Add Your First Product
                              </Button>
                            </Link>
                          }
                        />
                      </td>
                    </tr>
                  ) : filteredProducts.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-zinc-400 text-xs">
                        No products match your search or filter.
                      </td>
                    </tr>
                  ) : (
                    filteredProducts.map((p) => {
                      // Approximate Daily Sales placeholder calibrated to stock
                      const avgDailySales = Math.max(
                        1,
                        Math.round(p.openingStock > 0 ? p.openingStock / 10 : 3)
                      );

                      // Days Remaining calculation: Current Stock / Daily Sales
                      const daysRemaining = Math.max(
                        0,
                        Math.round(p.currentStock / avgDailySales)
                      );

                      return (
                        <tr key={p.id} className="hover:bg-zinc-50/70 transition-colors">
                          {/* 1. Product (Name, SKU, Category) */}
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-2.5">
                              {p.imageUrl ? (
                                <img
                                  src={p.imageUrl}
                                  alt={p.name}
                                  className="w-9 h-9 rounded-md object-cover border border-zinc-200 shrink-0"
                                />
                              ) : (
                                <div className="w-9 h-9 rounded-md bg-zinc-100 flex items-center justify-center text-zinc-500 font-mono text-xs shrink-0">
                                  <Boxes className="w-4 h-4" />
                                </div>
                              )}
                              <div className="min-w-0">
                                <p className="font-semibold text-zinc-900 truncate max-w-[200px] sm:max-w-[240px]">
                                  {p.name}
                                </p>
                                <div className="text-[11px] font-mono text-zinc-400">
                                  {p.sku} • {p.categoryName || "General"}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* 2. Current Stock */}
                          <td className="py-3.5 px-3 text-center font-mono">
                            <span className="text-sm font-bold text-zinc-900">
                              {p.currentStock}
                            </span>
                            <span className="text-zinc-400 text-[11px] block">
                              {p.unit} (Min: {p.minStock})
                            </span>
                          </td>

                          {/* 3. Selling Price */}
                          <td className="py-3.5 px-3 text-right font-mono font-semibold text-zinc-900">
                            {formatINR(p.sellingPrice)}
                          </td>

                          {/* 4. Average Daily Sales placeholder */}
                          <td className="py-3.5 px-3 text-center font-mono">
                            <span className="text-zinc-700 font-medium">
                              {avgDailySales} {p.unit}/day
                            </span>
                          </td>

                          {/* 5. Days Remaining placeholder */}
                          <td className="py-3.5 px-3 text-center font-mono">
                            <span
                              className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold ${
                                daysRemaining <= 1
                                  ? "bg-red-100 text-red-700"
                                  : daysRemaining <= 3
                                  ? "bg-amber-100 text-amber-700"
                                  : "bg-emerald-50 text-emerald-700"
                              }`}
                            >
                              {daysRemaining === 0 ? "Depleted" : `${daysRemaining} days`}
                            </span>
                          </td>

                          {/* 6. Status placeholder */}
                          <td className="py-3.5 px-3 text-center">
                            {p.status === "healthy" && (
                              <Badge variant="healthy" dot>
                                Healthy
                              </Badge>
                            )}
                            {p.status === "low_stock" && (
                              <Badge variant="warning" dot>
                                Low Stock
                              </Badge>
                            )}
                            {p.status === "out_of_stock" && (
                              <Badge variant="critical" dot>
                                Out of Stock
                              </Badge>
                            )}
                            {p.status === "overstocked" && (
                              <Badge variant="info" dot>
                                Overstocked
                              </Badge>
                            )}
                          </td>

                          {/* 7. Supplier */}
                          <td className="py-3.5 px-4 text-zinc-600 truncate max-w-[160px]">
                            <div className="font-medium text-zinc-800 truncate">
                              {p.supplierName || "Direct / Local"}
                            </div>
                            <div className="text-[10px] font-mono text-zinc-400">
                              Lead: {p.supplierLeadTime}d • MOQ: {p.minOrderQuantity}
                            </div>
                          </td>

                          {/* 8. Actions (Quick Restock) */}
                          <td className="py-3.5 px-4 text-right">
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => triggerRestock(p, "RESTOCK")}
                              className="text-[11px] h-7 px-2.5 hover:border-brand-300"
                            >
                              <PackagePlus className="w-3.5 h-3.5 mr-1 text-brand-600" />
                              Restock
                            </Button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Restock & Adjustment Modal */}
      <RestockModal
        isOpen={isRestockOpen}
        onClose={() => {
          setIsRestockOpen(false);
          setSelectedProductForModal(null);
        }}
        products={products}
        suppliers={suppliers}
        preselectedProduct={selectedProductForModal}
        initialMode={restockMode}
        onRestock={handleRestockSubmit}
        onAdjust={handleAdjustmentSubmit}
      />

      {/* Movement Ledger Drawer */}
      <MovementHistoryModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        movements={movements}
      />
    </div>
  );
}
