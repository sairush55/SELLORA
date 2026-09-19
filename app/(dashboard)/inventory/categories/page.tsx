"use client";

import React, { useState, useEffect } from "react";
import { useShop } from "@/hooks/useShop";
import { categoryService } from "@/services/categoryService";
import { productService } from "@/services/productService";
import { Category, CategoryInput } from "@/types/inventory";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { CategoryModal } from "@/components/inventory/CategoryModal";
import {
  Tag,
  Search,
  Plus,
  Edit2,
  Trash2,
  Boxes,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";

export default function CategoriesPage() {
  const { shop } = useShop();
  const shopId = shop.id;

  const [categories, setCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(null);
  const [feedback, setFeedback] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const loadData = () => {
    const rawCategories = categoryService.getCategories(shopId);
    const allProducts = productService.getProducts(shopId);

    // Compute live product counts per category
    const withCounts = rawCategories.map((cat) => ({
      ...cat,
      productCount: allProducts.filter((p) => p.categoryId === cat.id).length,
    }));

    setCategories(withCounts);
  };

  useEffect(() => {
    loadData();
  }, [shopId]);

  const handleCreateOrUpdate = (data: CategoryInput) => {
    if (editingCategory) {
      const res = categoryService.updateCategory(shopId, editingCategory.id, data);
      if (res.category) {
        setFeedback({ message: `Updated category "${res.category.name}"`, type: "success" });
        loadData();
        return { success: true };
      }
      return { success: false, error: res.error };
    } else {
      const res = categoryService.createCategory(shopId, data);
      if (res.category) {
        setFeedback({ message: `Created category "${res.category.name}"`, type: "success" });
        loadData();
        return { success: true };
      }
      return { success: false, error: res.error };
    }
  };

  const handleDeleteConfirm = () => {
    if (!deletingCategory) return;
    const res = categoryService.deleteCategory(shopId, deletingCategory.id);
    if (res.success) {
      setFeedback({ message: `Deleted category "${deletingCategory.name}"`, type: "success" });
      setDeletingCategory(null);
      loadData();
    } else {
      setFeedback({ message: res.error || "Failed to delete", type: "error" });
    }
  };

  const filtered = categories.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.description && c.description.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-zinc-200/80">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-extrabold text-charcoal-950 tracking-tight">
              Product Categories
            </h1>
            <Badge variant="healthy" dot>
              {categories.length} Categories
            </Badge>
          </div>
          <p className="text-xs text-zinc-500 mt-0.5">
            Organize catalog SKUs into reporting groups, shelf aisles, and margin buckets
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link href="/inventory/products">
            <Button variant="outline" size="sm" className="text-xs">
              View All SKUs
            </Button>
          </Link>
          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              setEditingCategory(null);
              setIsModalOpen(true);
            }}
            className="text-xs font-semibold gap-1.5 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Add Category
          </Button>
        </div>
      </div>

      {feedback && (
        <div
          className={`p-3 rounded-lg text-xs font-semibold flex items-center justify-between transition-all ${
            feedback.type === "success"
              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
              : "bg-red-50 text-red-800 border border-red-200"
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
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

      {/* Search Bar */}
      <div className="p-4 rounded-xl bg-white border border-zinc-200/90 shadow-2xs flex items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <input
            type="text"
            placeholder="Search category name or description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-9 pl-9 pr-3 rounded-lg border border-zinc-200 text-xs bg-zinc-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
        </div>
        <span className="text-xs text-zinc-400 font-mono hidden sm:inline-block">
          Showing {filtered.length} categories
        </span>
      </div>

      {/* Categories Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-50 border-b border-zinc-200/80 text-[11px] uppercase font-semibold text-zinc-500 font-mono">
                <tr>
                  <th className="py-3 px-4">Category Name</th>
                  <th className="py-3 px-4">Description</th>
                  <th className="py-3 px-3 text-center">Linked Products</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 font-normal">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-12 text-center text-zinc-400 text-xs">
                      No categories found matching your search.
                    </td>
                  </tr>
                ) : (
                  filtered.map((cat) => (
                    <tr key={cat.id} className="hover:bg-zinc-50/70 transition-colors">
                      <td className="py-3.5 px-4 font-semibold text-zinc-900">
                        <div className="flex items-center gap-2.5">
                          <div className="h-7 w-7 rounded-md bg-zinc-100 flex items-center justify-center text-zinc-600">
                            <Tag className="w-3.5 h-3.5" />
                          </div>
                          <span>{cat.name}</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-zinc-600 max-w-md truncate">
                        {cat.description || "—"}
                      </td>

                      <td className="py-3.5 px-3 text-center font-mono">
                        <span className="font-semibold text-zinc-900 bg-zinc-100 px-2 py-0.5 rounded">
                          {cat.productCount || 0} SKUs
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => {
                              setEditingCategory(cat);
                              setIsModalOpen(true);
                            }}
                            title="Edit category"
                            className="p-1.5 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 rounded-md transition-colors"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDeletingCategory(cat)}
                            title="Delete category"
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

      {/* Category Modal */}
      <CategoryModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingCategory(null);
        }}
        onSubmit={handleCreateOrUpdate}
        initialCategory={editingCategory}
      />

      {/* Delete Confirmation Modal */}
      {deletingCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <Card className="max-w-sm w-full p-6 text-center space-y-4 bg-white shadow-2xl">
            <div className="mx-auto h-12 w-12 rounded-full bg-red-100 flex items-center justify-center text-red-600">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-zinc-900">Delete Category</h3>
              <p className="text-xs text-zinc-500 mt-1">
                Are you sure you want to delete{" "}
                <strong className="text-zinc-800">{deletingCategory.name}</strong>?
                {deletingCategory.productCount && deletingCategory.productCount > 0 ? (
                  <span className="block mt-2 text-amber-700 font-semibold">
                    Warning: {deletingCategory.productCount} products are linked to this category.
                  </span>
                ) : null}
              </p>
            </div>
            <div className="flex items-center gap-3 pt-2">
              <Button
                variant="outline"
                size="md"
                className="flex-1"
                onClick={() => setDeletingCategory(null)}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                size="md"
                className="flex-1"
                onClick={handleDeleteConfirm}
              >
                Delete Category
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
