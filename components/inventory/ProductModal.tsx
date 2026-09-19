"use client";

import React, { useState, useEffect } from "react";
import { Product, ProductInput, Category, Supplier } from "@/types/inventory";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { categoryService } from "@/services/categoryService";
import {
  X,
  Boxes,
  Barcode,
  IndianRupee,
  Truck,
  Image as ImageIcon,
  Tag,
  Link as LinkIcon,
  Sparkles,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

/** Common Indian retail categories shown when the merchant has no categories yet */
const COMMON_CATEGORY_NAMES = [
  "Groceries",
  "Beverages",
  "Snacks & Namkeen",
  "Dairy & Chilled",
  "Edible Oils",
  "Staples & Grains",
  "Personal Care",
  "Household",
  "Medicines",
  "Fruits & Vegetables",
  "Clothing",
  "Electronics",
  "Stationery",
  "Others",
];

/** Sentinel prefix: when categoryId starts with this, create the category on save */
const CREATE_PREFIX = "__create__:";

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ProductInput) => { success: boolean; error?: string };
  initialProduct?: Product | null;
  categories: Category[];
  suppliers: Supplier[];
  shopId: string;
}

const PRESET_IMAGES = [
  { label: "Grains & Atta", url: "https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=300&auto=format&fit=crop&q=80" },
  { label: "Salt & Spices", url: "https://images.unsplash.com/photo-1518110925495-5fe2fda0442c?w=300&auto=format&fit=crop&q=80" },
  { label: "Edible Oil", url: "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=300&auto=format&fit=crop&q=80" },
  { label: "Dairy & Butter", url: "https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?w=300&auto=format&fit=crop&q=80" },
  { label: "Tea & Beverages", url: "https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=300&auto=format&fit=crop&q=80" },
  { label: "Snacks", url: "https://images.unsplash.com/photo-1612927601601-6638404737ce?w=300&auto=format&fit=crop&q=80" },
];

export function ProductModal({
  isOpen,
  onClose,
  onSubmit,
  initialProduct,
  categories,
  suppliers,
  shopId,
}: ProductModalProps) {
  // When no categories exist yet, offer built-in options
  const hasCategories = categories.length > 0;
  const defaultCategoryValue = hasCategories
    ? (categories[0]?.id || "")
    : `${CREATE_PREFIX}${COMMON_CATEGORY_NAMES[0]}`;

  const [formData, setFormData] = useState<ProductInput>({
    name: "",
    sku: "",
    categoryId: defaultCategoryValue,
    sellingPrice: 0,
    costPrice: 0,
    openingStock: 0,
    currentStock: 0,
    minStock: 10,
    supplierId: suppliers[0]?.id || "",
    supplierLeadTime: 2,
    minOrderQuantity: 1,
    unit: "Pcs",
    imageUrl: "",
    sourceUrl: "",
  });

  const [error, setError] = useState<string | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractStatus, setExtractStatus] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  useEffect(() => {
    const defCat = categories.length > 0
      ? categories[0]?.id || ""
      : `${CREATE_PREFIX}${COMMON_CATEGORY_NAMES[0]}`;

    if (initialProduct) {
      setFormData({
        name: initialProduct.name,
        sku: initialProduct.sku,
        categoryId: initialProduct.categoryId,
        sellingPrice: initialProduct.sellingPrice,
        costPrice: initialProduct.costPrice,
        openingStock: initialProduct.openingStock,
        currentStock: initialProduct.currentStock,
        minStock: initialProduct.minStock,
        supplierId: initialProduct.supplierId || suppliers[0]?.id || "",
        supplierLeadTime: initialProduct.supplierLeadTime,
        minOrderQuantity: initialProduct.minOrderQuantity,
        unit: initialProduct.unit,
        imageUrl: initialProduct.imageUrl || "",
        sourceUrl: initialProduct.sourceUrl || "",
      });
    } else {
      setFormData({
        name: "",
        sku: "",
        categoryId: defCat,
        sellingPrice: 0,
        costPrice: 0,
        openingStock: 0,
        currentStock: 0,
        minStock: 10,
        supplierId: suppliers[0]?.id || "",
        supplierLeadTime: 2,
        minOrderQuantity: 1,
        unit: "Pcs",
        imageUrl: "",
        sourceUrl: "",
      });
    }
    setError(null);
    setExtractStatus(null);
  }, [initialProduct, isOpen, categories, suppliers]);

  if (!isOpen) return null;

  const handleGenerateSku = () => {
    const prefix = formData.name
      ? formData.name
          .split(" ")
          .map((w) => w[0])
          .join("")
          .slice(0, 3)
          .toUpperCase()
      : "SKU";
    const rand = Math.floor(100 + Math.random() * 900);
    setFormData((prev) => ({ ...prev, sku: `${prefix}-${rand}` }));
  };

  const handleSupplierChange = (supId: string) => {
    const selectedSup = suppliers.find((s) => s.id === supId);
    setFormData((prev) => ({
      ...prev,
      supplierId: supId,
      supplierLeadTime: selectedSup ? selectedSup.leadTime : prev.supplierLeadTime,
      minOrderQuantity: selectedSup ? selectedSup.minOrderQuantity : prev.minOrderQuantity,
    }));
  };

  // Extract Image from Product Webpage URL via server-side API
  const handleExtractImage = async () => {
    setExtractStatus(null);
    const url = formData.sourceUrl?.trim();
    if (!url) {
      setExtractStatus({
        message: "Please enter a product link to extract an image.",
        type: "error",
      });
      return;
    }

    setIsExtracting(true);
    try {
      const res = await fetch("/api/extract-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const data = await res.json();

      if (data.success && data.imageUrl) {
        setFormData((prev) => ({
          ...prev,
          imageUrl: data.imageUrl,
        }));
        setExtractStatus({
          message: "Product image extracted successfully.",
          type: "success",
        });
      } else {
        setExtractStatus({
          message:
            data.error ||
            "Couldn't extract a product image from this link. You can enter or upload an image manually.",
          type: "error",
        });
      }
    } catch {
      setExtractStatus({
        message:
          "Couldn't extract an image from this link. You can enter or upload an image manually.",
        type: "error",
      });
    } finally {
      setIsExtracting(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.name.trim()) {
      setError("Product Name is required");
      return;
    }
    if (!formData.sku.trim()) {
      setError("SKU is required");
      return;
    }
    if (formData.sellingPrice < 0 || formData.costPrice < 0) {
      setError("Prices cannot be negative");
      return;
    }

    let resolvedCategoryId = formData.categoryId;

    // If user selected a built-in "create" option, auto-create the category now
    if (resolvedCategoryId.startsWith(CREATE_PREFIX)) {
      const catName = resolvedCategoryId.slice(CREATE_PREFIX.length);
      const cat = categoryService.getOrCreateByName(shopId, catName);
      resolvedCategoryId = cat.id;
    }

    const result = onSubmit({
      ...formData,
      categoryId: resolvedCategoryId,
      currentStock: initialProduct ? formData.currentStock : formData.openingStock,
      sourceUrl: formData.sourceUrl?.trim() || undefined,
      imageUrl: formData.imageUrl?.trim() || undefined,
    });

    if (result.success) {
      onClose();
    } else {
      setError(result.error || "Failed to save product");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 overflow-y-auto">
      <Card className="max-w-2xl w-full my-8 bg-white shadow-2xl border-zinc-300">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-zinc-100">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-charcoal-900 text-brand-400 flex items-center justify-center">
              <Boxes className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-charcoal-950">
                {initialProduct ? "Edit Product" : "Add New Product"}
              </h2>
              <p className="text-xs text-zinc-500">
                Fill in the details below to {initialProduct ? "update" : "add"} this product
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-zinc-700 rounded-md hover:bg-zinc-100 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mx-6 mt-4 p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 font-medium">
            {error}
          </div>
        )}

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Row 1: Name & SKU */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <Input
                label="Product Name"
                placeholder="e.g. Aashirvaad Atta 10kg"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div>
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold text-zinc-700 uppercase tracking-wider mb-1.5">
                  SKU
                </label>
                <button
                  type="button"
                  onClick={handleGenerateSku}
                  className="text-[10px] text-brand-700 hover:underline font-semibold cursor-pointer"
                >
                  Auto-generate
                </button>
              </div>
              <Input
                placeholder="ATT-10K-01"
                prefixIcon={<Barcode className="w-3.5 h-3.5" />}
                value={formData.sku}
                onChange={(e) => setFormData({ ...formData, sku: e.target.value.toUpperCase() })}
                required
              />
            </div>
          </div>

          {/* Row 2: Category & Unit */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Select
                label="Category"
                value={formData.categoryId}
                onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                required
              >
                {hasCategories ? (
                  categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))
                ) : (
                  <>
                    <option value="" disabled>
                      — Pick a category —
                    </option>
                    {COMMON_CATEGORY_NAMES.map((name) => (
                      <option key={name} value={`${CREATE_PREFIX}${name}`}>
                        {name}
                      </option>
                    ))}
                  </>
                )}
              </Select>
              {!hasCategories && (
                <p className="mt-1 text-[11px] text-zinc-400 flex items-center gap-1">
                  <Tag className="w-3 h-3" />
                  Category will be created automatically when you save.
                </p>
              )}
            </div>

            <Select
              label="Unit of Measure"
              value={formData.unit}
              onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
            >
              <option value="Pcs">Pieces (Pcs)</option>
              <option value="Bags">Bags</option>
              <option value="Pks">Packets (Pks)</option>
              <option value="Kg">Kilograms (Kg)</option>
              <option value="Grams">Grams (g)</option>
              <option value="L">Liters (L)</option>
              <option value="Bottles">Bottles</option>
              <option value="Boxes">Boxes</option>
            </Select>
          </div>

          {/* Row 3: Pricing */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-3.5 rounded-xl bg-zinc-50 border border-zinc-200/80">
            <Input
              label="Selling Price (₹)"
              type="number"
              step="0.01"
              min="0"
              prefixIcon={<IndianRupee className="w-3.5 h-3.5" />}
              value={formData.sellingPrice || ""}
              onChange={(e) => setFormData({ ...formData, sellingPrice: parseFloat(e.target.value) || 0 })}
              helperText="Price you charge customers"
              required
            />

            <Input
              label="Cost Price (₹)"
              type="number"
              step="0.01"
              min="0"
              prefixIcon={<IndianRupee className="w-3.5 h-3.5" />}
              value={formData.costPrice || ""}
              onChange={(e) => setFormData({ ...formData, costPrice: parseFloat(e.target.value) || 0 })}
              helperText="What you paid to buy it"
              required
            />
          </div>

          {/* Row 4: Stock */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {!initialProduct && (
              <Input
                label="Opening Stock"
                type="number"
                min="0"
                value={formData.openingStock}
                onChange={(e) => {
                  const val = parseInt(e.target.value) || 0;
                  setFormData({ ...formData, openingStock: val, currentStock: val });
                }}
                helperText="Units you have right now"
              />
            )}

            {initialProduct && (
              <Input
                label="Current Stock"
                type="number"
                min="0"
                value={formData.currentStock}
                onChange={(e) => setFormData({ ...formData, currentStock: parseInt(e.target.value) || 0 })}
                helperText="Current units in stock"
              />
            )}

            <Input
              label="Low Stock Alert At"
              type="number"
              min="1"
              value={formData.minStock}
              onChange={(e) => setFormData({ ...formData, minStock: parseInt(e.target.value) || 1 })}
              helperText="Alert when stock falls below this"
              required
            />

            <Input
              label="Min Order Qty"
              type="number"
              min="1"
              value={formData.minOrderQuantity}
              onChange={(e) => setFormData({ ...formData, minOrderQuantity: parseInt(e.target.value) || 1 })}
              helperText="Minimum from supplier"
            />
          </div>

          {/* Row 5: Supplier & Lead Time */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Supplier (Optional)"
              value={formData.supplierId}
              onChange={(e) => handleSupplierChange(e.target.value)}
            >
              <option value="">— No Supplier —</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} (Lead: {s.leadTime}d)
                </option>
              ))}
            </Select>

            <Input
              label="Supplier Lead Time (Days)"
              type="number"
              min="0"
              prefixIcon={<Truck className="w-3.5 h-3.5" />}
              value={formData.supplierLeadTime}
              onChange={(e) => setFormData({ ...formData, supplierLeadTime: parseInt(e.target.value) || 1 })}
              helperText="Days to receive stock after ordering"
            />
          </div>

          {/* Row 6: Product Link & Automated Image Extraction */}
          <div className="p-4 rounded-xl bg-zinc-50/70 border border-zinc-200/80 space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold text-zinc-800 uppercase tracking-wider">
                Product Link / Webpage (Optional)
              </label>
              <span className="text-[11px] text-zinc-400">Amazon, Blinkit, Brand site</span>
            </div>

            <div className="flex gap-2">
              <div className="relative flex-1">
                <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400" />
                <input
                  type="url"
                  placeholder="https://example.com/product/..."
                  value={formData.sourceUrl || ""}
                  onChange={(e) => setFormData({ ...formData, sourceUrl: e.target.value })}
                  className="w-full h-9 pl-9 pr-3 text-xs rounded-lg border border-zinc-200 bg-white text-zinc-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={handleExtractImage}
                isLoading={isExtracting}
                disabled={isExtracting || !formData.sourceUrl?.trim()}
                className="shrink-0 text-xs font-semibold"
              >
                <Sparkles className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                Extract Image
              </Button>
            </div>

            {/* Extraction status feedback */}
            {extractStatus && (
              <div
                className={`text-xs p-2 rounded-lg flex items-center gap-1.5 ${
                  extractStatus.type === "success"
                    ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                    : "bg-amber-50 text-amber-800 border border-amber-200"
                }`}
              >
                {extractStatus.type === "success" ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                ) : (
                  <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                )}
                <span>{extractStatus.message}</span>
              </div>
            )}

            {/* Image Preview & Manual Fallback */}
            <div className="flex items-center gap-3 pt-1">
              {formData.imageUrl ? (
                <div className="flex items-center gap-3 p-2 rounded-lg bg-white border border-zinc-200 flex-1">
                  <div className="w-12 h-12 rounded-md bg-zinc-100 border border-zinc-200 overflow-hidden shrink-0 flex items-center justify-center">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={formData.imageUrl}
                      alt="Product preview"
                      className="w-full h-full object-cover"
                      onError={() => {
                        setExtractStatus({
                          message: "Image could not be loaded. Please enter another image URL.",
                          type: "error",
                        });
                      }}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-xs font-semibold text-zinc-800 block truncate">
                      Image Active
                    </span>
                    <span className="text-[10px] text-zinc-400 truncate block font-mono">
                      {formData.imageUrl}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, imageUrl: "" })}
                    className="p-1 text-zinc-400 hover:text-red-600 rounded"
                    title="Remove image"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex-1">
                  <Input
                    label="Image URL (Manual fallback)"
                    type="url"
                    placeholder="https://images.unsplash.com/..."
                    prefixIcon={<ImageIcon className="w-3.5 h-3.5" />}
                    value={formData.imageUrl || ""}
                    onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                  />
                </div>
              )}
            </div>

            {/* Quick Presets */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-[11px] text-zinc-400 font-medium mr-1">Quick presets:</span>
              {PRESET_IMAGES.map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => setFormData({ ...formData, imageUrl: preset.url })}
                  className={`text-[10px] px-2 py-0.5 rounded border transition-colors cursor-pointer ${
                    formData.imageUrl === preset.url
                      ? "bg-brand-50 border-brand-300 text-brand-700 font-semibold"
                      : "bg-white border-zinc-200 text-zinc-600 hover:bg-zinc-100"
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* Modal Actions */}
          <div className="pt-4 border-t border-zinc-100 flex items-center justify-end gap-3">
            <Button type="button" variant="outline" size="md" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="md">
              {initialProduct ? "Update Product" : "Add Product"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
