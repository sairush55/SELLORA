"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useShop } from "@/hooks/useShop";
import { productService, ProductFilterOptions } from "@/services/productService";
import { categoryService } from "@/services/categoryService";
import { supplierService } from "@/services/supplierService";
import { Product, ProductInput, Category, Supplier } from "@/types/inventory";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ProductModal } from "@/components/inventory/ProductModal";
import { InvoiceUploadModal } from "@/components/inventory/InvoiceUploadModal";
import { formatINR } from "@/lib/utils";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  Boxes,
  Search,
  Plus,
  Edit2,
  Trash2,
  ArrowUpDown,
  Filter,
  Download,
  AlertCircle,
  CheckCircle2,
  LayoutGrid,
  List,
  ArrowRight,
  Truck,
  FileText,
} from "lucide-react";
import Link from "next/link";

export default function ProductsPage() {
  const { shop } = useShop();
  const shopId = shop.id;

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);

  // Search & Filter state
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedSupplier, setSelectedSupplier] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [sortBy, setSortBy] = useState<"name" | "currentStock" | "sellingPrice" | "createdAt">("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  // View Mode: Cards / Grid vs Table
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("sellora_product_view");
      if (saved === "table" || saved === "grid") {
        setViewMode(saved);
      }
    }
  }, []);

  const handleViewModeChange = (mode: "grid" | "table") => {
    setViewMode(mode);
    if (typeof window !== "undefined") {
      localStorage.setItem("sellora_product_view", mode);
    }
  };

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);
  const [feedback, setFeedback] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const loadData = () => {
    const p = productService.getProducts(shopId, {
      search,
      categoryId: selectedCategory,
      supplierId: selectedSupplier,
      status: selectedStatus,
      sortBy,
      sortOrder,
    });
    const c = categoryService.getCategories(shopId);
    const s = supplierService.getSuppliers(shopId);

    setProducts(p);
    setCategories(c);
    setSuppliers(s);
  };

  useEffect(() => {
    loadData();
  }, [shopId, search, selectedCategory, selectedSupplier, selectedStatus, sortBy, sortOrder]);

  const handleCreateOrUpdate = (data: ProductInput) => {
    if (editingProduct) {
      const res = productService.updateProduct(shopId, editingProduct.id, data);
      if (res.product) {
        setFeedback({ message: `Updated "${res.product.name}" successfully`, type: "success" });
        loadData();
        return { success: true };
      }
      return { success: false, error: res.error };
    } else {
      const res = productService.createProduct(shopId, data);
      if (res.product) {
        setFeedback({ message: `Created "${res.product.name}" with SKU ${res.product.sku}`, type: "success" });
        loadData();
        return { success: true };
      }
      return { success: false, error: res.error };
    }
  };

  const handleDeleteConfirm = () => {
    if (!deletingProduct) return;
    const res = productService.deleteProduct(shopId, deletingProduct.id);
    if (res.success) {
      setFeedback({ message: `Deleted "${deletingProduct.name}"`, type: "success" });
      setDeletingProduct(null);
      loadData();
    } else {
      setFeedback({ message: res.error || "Failed to delete", type: "error" });
    }
  };

  const toggleSort = (field: "name" | "currentStock" | "sellingPrice" | "createdAt") => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("asc");
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-zinc-200/80">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-extrabold text-charcoal-950 tracking-tight">
              Product Catalog Management
            </h1>
            <Badge variant="healthy" dot>
              {products.length} Active SKUs
            </Badge>
          </div>
          <p className="text-xs text-zinc-500 mt-0.5">
            Add, edit, calibrate thresholds, and link vendor supply parameters
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
          <Link href="/inventory/categories">
            <Button variant="outline" size="sm" className="text-xs">
              Categories ({categories.length})
            </Button>
          </Link>
          <Link href="/inventory/suppliers">
            <Button variant="outline" size="sm" className="text-xs">
              Suppliers ({suppliers.length})
            </Button>
          </Link>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsInvoiceModalOpen(true)}
            className="text-xs font-semibold gap-1.5 border-amber-300 text-amber-900 bg-amber-50 hover:bg-amber-100 shadow-2xs"
          >
            <FileText className="w-3.5 h-3.5 text-amber-600" />
            Upload Billing PDF
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              setEditingProduct(null);
              setIsModalOpen(true);
            }}
            className="text-xs font-semibold gap-1.5 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Add New Product
          </Button>
        </div>
      </div>

      {feedback && (
        <div
          className={`p-3 rounded-lg text-xs font-semibold flex items-center justify-between transition-all ${
            feedback.type === "success"
              ? "bg-amber-50 text-amber-900 border border-amber-200"
              : "bg-red-50 text-red-800 border border-red-200"
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-amber-600" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-600" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button
            onClick={() => setFeedback(null)}
            className="text-zinc-400 hover:text-zinc-600 font-bold ml-4"
          >
            ×
          </button>
        </div>
      )}

      {/* Control Strip: Search & Filter Dropdowns */}
      <div className="p-4 rounded-xl bg-white border border-zinc-200/90 shadow-2xs space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input
              type="text"
              placeholder="Search by product name, SKU, or supplier..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-9 pl-9 pr-3 rounded-lg border border-zinc-200 text-xs bg-zinc-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Category Filter */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="h-9 px-2.5 rounded-lg border border-zinc-200 text-xs text-zinc-700 bg-zinc-50 focus:outline-none"
            >
              <option value="all">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>

            {/* Supplier Filter */}
            <select
              value={selectedSupplier}
              onChange={(e) => setSelectedSupplier(e.target.value)}
              className="h-9 px-2.5 rounded-lg border border-zinc-200 text-xs text-zinc-700 bg-zinc-50 focus:outline-none"
            >
              <option value="all">All Suppliers</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>

            {/* Status Filter */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="h-9 px-2.5 rounded-lg border border-zinc-200 text-xs text-zinc-700 bg-zinc-50 focus:outline-none"
            >
              <option value="all">All Stock Status</option>
              <option value="healthy">Healthy</option>
              <option value="low_stock">Low Stock</option>
              <option value="out_of_stock">Out of Stock</option>
              <option value="overstocked">Overstocked</option>
            </select>

            {/* View Mode Switcher */}
            <div className="flex items-center bg-zinc-100 p-0.5 rounded-lg border border-zinc-200">
              <button
                type="button"
                onClick={() => handleViewModeChange("grid")}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-semibold transition-all ${
                  viewMode === "grid"
                    ? "bg-white text-zinc-900 shadow-2xs"
                    : "text-zinc-500 hover:text-zinc-800"
                }`}
                title="Cards / Grid View"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Cards</span>
              </button>
              <button
                type="button"
                onClick={() => handleViewModeChange("table")}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-semibold transition-all ${
                  viewMode === "table"
                    ? "bg-white text-zinc-900 shadow-2xs"
                    : "text-zinc-500 hover:text-zinc-800"
                }`}
                title="Table View"
              >
                <List className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Table</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content: Grid / Cards View OR Table View */}
      {viewMode === "grid" ? (
        products.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <EmptyState
                icon={<Boxes className="w-8 h-8 text-zinc-400" />}
                title="No products found"
                description="No products match your current search or filter criteria. Try adjusting your filters or add a new product."
                action={
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => {
                      setEditingProduct(null);
                      setIsModalOpen(true);
                    }}
                    className="text-xs"
                  >
                    <Plus className="w-3.5 h-3.5 mr-1" />
                    Add Product
                  </Button>
                }
              />
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
            {products.map((p) => {
              const marginPercent =
                p.sellingPrice > 0
                  ? Math.round(((p.sellingPrice - p.costPrice) / p.sellingPrice) * 100)
                  : 0;

              const stockMax = Math.max(p.minStock * 2, p.currentStock, 1);
              const stockPercent = Math.min(100, Math.round((p.currentStock / stockMax) * 100));

              return (
                <div
                  key={p.id}
                  className="group relative bg-white border border-zinc-200/90 hover:border-zinc-300 rounded-2xl shadow-2xs hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col justify-between"
                >
                  {/* Top Image Stage & Floating Badges */}
                  <div className="relative w-full h-48 bg-zinc-50/70 border-b border-zinc-100 flex items-center justify-center p-3 overflow-hidden">
                    {p.imageUrl ? (
                      <img
                        src={p.imageUrl}
                        alt={p.name}
                        className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center text-zinc-300 gap-1.5">
                        <Boxes className="w-10 h-10 stroke-1 text-zinc-400" />
                        <span className="text-[10px] font-mono text-zinc-400">No Image</span>
                      </div>
                    )}

                    {/* Category Tag (Top Left) */}
                    <span className="absolute top-2.5 left-2.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-white/95 backdrop-blur-xs text-zinc-700 shadow-2xs border border-zinc-200/80">
                      {p.categoryName || "General"}
                    </span>

                    {/* Stock Status Badge (Top Right) */}
                    <div className="absolute top-2.5 right-2.5">
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
                    </div>
                  </div>

                  {/* Body Details */}
                  <div className="p-4 flex-1 flex flex-col justify-between space-y-3.5">
                    <div>
                      <h3 className="font-bold text-zinc-900 text-sm leading-snug line-clamp-2 group-hover:text-emerald-700 transition-colors">
                        {p.name}
                      </h3>
                      <div className="mt-1 text-[11px] font-mono text-zinc-400 flex items-center justify-between">
                        <span>
                          SKU: <strong className="text-zinc-600 font-semibold">{p.sku}</strong>
                        </span>
                        <span className="text-zinc-500 font-medium">Unit: {p.unit}</span>
                      </div>
                    </div>

                    {/* Financial Metrics Strip */}
                    <div className="bg-zinc-50/90 rounded-xl p-2.5 border border-zinc-100 flex items-center justify-between">
                      <div>
                        <div className="text-[10px] uppercase font-mono text-zinc-400 font-bold">
                          Selling Price
                        </div>
                        <div className="font-mono text-base font-extrabold text-zinc-900 leading-tight">
                          {formatINR(p.sellingPrice)}
                        </div>
                        <div className="text-[10px] font-mono text-zinc-500 mt-0.5">
                          Cost: {formatINR(p.costPrice)}
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-[10px] uppercase font-mono text-zinc-400 font-bold">
                          Margin
                        </div>
                        <span
                          className={`inline-block font-mono text-xs font-bold px-1.5 py-0.5 rounded-md mt-0.5 border ${
                            marginPercent >= 20
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200/70"
                              : marginPercent >= 0
                              ? "bg-blue-50 text-blue-700 border-blue-200/70"
                              : "bg-red-50 text-red-700 border-red-200/70"
                          }`}
                        >
                          {marginPercent >= 0 ? `+${marginPercent}%` : `${marginPercent}%`}
                        </span>
                      </div>
                    </div>

                    {/* Stock Level Bar */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs font-mono">
                        <span className="text-zinc-500 text-[11px]">
                          Stock:{" "}
                          <strong
                            className={
                              p.currentStock <= p.minStock
                                ? "text-red-600 font-bold"
                                : "text-zinc-900 font-bold"
                            }
                          >
                            {p.currentStock}
                          </strong>
                        </span>
                        <span className="text-zinc-400 text-[10px]">Min: {p.minStock}</span>
                      </div>
                      <div className="h-1.5 w-full bg-zinc-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            p.currentStock === 0
                              ? "bg-red-500"
                              : p.currentStock <= p.minStock
                              ? "bg-amber-500"
                              : p.status === "overstocked"
                              ? "bg-blue-500"
                              : "bg-emerald-500"
                          }`}
                          style={{ width: `${p.currentStock === 0 ? 100 : stockPercent}%` }}
                        />
                      </div>
                    </div>

                    {/* Supplier info (if present) */}
                    {p.supplierName && (
                      <div className="text-[11px] text-zinc-500 truncate flex items-center gap-1.5 pt-0.5">
                        <Truck className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                        <span className="truncate">{p.supplierName}</span>
                        <span className="text-zinc-300">•</span>
                        <span className="shrink-0 font-mono text-[10px] text-zinc-400">
                          {p.supplierLeadTime}d lead
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Card Actions Footer */}
                  <div className="px-4 py-2.5 bg-zinc-50/50 border-t border-zinc-100 flex items-center justify-between">
                    <Link
                      href="/sales/pos"
                      className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 transition-colors"
                    >
                      <span>Sell in POS</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingProduct(p);
                          setIsModalOpen(true);
                        }}
                        title="Edit product"
                        className="p-1.5 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 rounded-md transition-colors"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeletingProduct(p)}
                        title="Delete product"
                        className="p-1.5 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )
      ) : (
        /* Products Table */
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-zinc-50 border-b border-zinc-200/80 text-[11px] uppercase font-semibold text-zinc-500 font-mono">
                  <tr>
                    <th
                      className="py-3 px-4 cursor-pointer hover:text-zinc-900 select-none"
                      onClick={() => toggleSort("name")}
                    >
                      <div className="flex items-center gap-1">
                        <span>Product Details</span>
                        <ArrowUpDown className="w-3 h-3 text-zinc-400" />
                      </div>
                    </th>
                    <th className="py-3 px-3">Category</th>
                    <th
                      className="py-3 px-3 text-right cursor-pointer hover:text-zinc-900 select-none"
                      onClick={() => toggleSort("sellingPrice")}
                    >
                      <div className="flex items-center justify-end gap-1">
                        <span>Selling Price</span>
                        <ArrowUpDown className="w-3 h-3 text-zinc-400" />
                      </div>
                    </th>
                    <th className="py-3 px-3 text-right">Cost Price</th>
                    <th
                      className="py-3 px-3 text-center cursor-pointer hover:text-zinc-900 select-none"
                      onClick={() => toggleSort("currentStock")}
                    >
                      <div className="flex items-center justify-center gap-1">
                        <span>Stock / Min</span>
                        <ArrowUpDown className="w-3 h-3 text-zinc-400" />
                      </div>
                    </th>
                    <th className="py-3 px-3 text-center">Status</th>
                    <th className="py-3 px-4">Supplier & Lead</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 font-normal">
                  {products.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-zinc-400 text-xs">
                        No products found matching your search and filter criteria.
                      </td>
                    </tr>
                  ) : (
                    products.map((p) => (
                      <tr key={p.id} className="hover:bg-zinc-50/70 transition-colors">
                        {/* Product Name & SKU & Image */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            {p.imageUrl ? (
                              <img
                                src={p.imageUrl}
                                alt={p.name}
                                className="w-12 h-12 rounded-lg object-contain bg-zinc-50 border border-zinc-200 p-0.5 shrink-0"
                              />
                            ) : (
                              <div className="w-12 h-12 rounded-lg bg-zinc-100 flex items-center justify-center text-zinc-400 font-mono text-xs shrink-0 border border-zinc-200">
                                <Boxes className="w-5 h-5" />
                              </div>
                            )}
                            <div className="min-w-0">
                              <p className="font-semibold text-zinc-900 truncate max-w-[200px] sm:max-w-[240px]">
                                {p.name}
                              </p>
                              <div className="text-[11px] font-mono text-zinc-400">
                                SKU: <span className="text-zinc-600 font-bold">{p.sku}</span> • {p.unit}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Category */}
                        <td className="py-3 px-3 text-zinc-700">
                          {p.categoryName || "General"}
                        </td>

                        {/* Selling Price */}
                        <td className="py-3 px-3 text-right font-mono font-bold text-zinc-900">
                          {formatINR(p.sellingPrice)}
                        </td>

                        {/* Cost Price */}
                        <td className="py-3 px-3 text-right font-mono text-zinc-600">
                          {formatINR(p.costPrice)}
                        </td>

                        {/* Current Stock vs Min */}
                        <td className="py-3 px-3 text-center font-mono">
                          <span
                            className={`font-bold ${
                              p.currentStock <= p.minStock ? "text-red-600" : "text-zinc-900"
                            }`}
                          >
                            {p.currentStock}
                          </span>
                          <span className="text-zinc-400"> / </span>
                          <span className="text-zinc-500">{p.minStock}</span>
                        </td>

                        {/* Stock Status Badge */}
                        <td className="py-3 px-3 text-center">
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

                        {/* Supplier */}
                        <td className="py-3 px-4 text-zinc-600 truncate max-w-[160px]">
                          <div className="font-medium text-zinc-800 truncate">
                            {p.supplierName || "—"}
                          </div>
                          <div className="text-[10px] font-mono text-zinc-400">
                            Lead: {p.supplierLeadTime}d • MOQ: {p.minOrderQuantity}
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => {
                                setEditingProduct(p);
                                setIsModalOpen(true);
                              }}
                              title="Edit product"
                              className="p-1.5 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 rounded-md transition-colors"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setDeletingProduct(p)}
                              title="Delete product"
                              className="p-1.5 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Product Add / Edit Modal */}
      <ProductModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingProduct(null);
        }}
        onSubmit={handleCreateOrUpdate}
        initialProduct={editingProduct}
        categories={categories}
        suppliers={suppliers}
        shopId={shopId}
      />

      {/* Invoice PDF Upload & Stock Sync Modal */}
      <InvoiceUploadModal
        isOpen={isInvoiceModalOpen}
        onClose={() => setIsInvoiceModalOpen(false)}
        shopId={shopId}
        categories={categories}
        onImportSuccess={(res) => {
          loadData();
          setFeedback({
            type: "success",
            message: `Invoice processed successfully! Updated stock for ${res.updatedCount} existing SKU(s) and added ${res.createdCount} new product(s).`,
          });
        }}
      />

      {/* Delete Confirmation Modal */}
      {deletingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <Card className="max-w-sm w-full p-6 text-center space-y-4 bg-white shadow-2xl">
            <div className="mx-auto h-12 w-12 rounded-full bg-red-100 flex items-center justify-center text-red-600">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-zinc-900">Confirm SKU Deletion</h3>
              <p className="text-xs text-zinc-500 mt-1">
                Are you sure you want to permanently delete{" "}
                <strong className="text-zinc-800">{deletingProduct.name}</strong> ({deletingProduct.sku})?
              </p>
            </div>
            <div className="flex items-center gap-3 pt-2">
              <Button
                variant="outline"
                size="md"
                className="flex-1"
                onClick={() => setDeletingProduct(null)}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                size="md"
                className="flex-1"
                onClick={handleDeleteConfirm}
              >
                Delete SKU
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
