"use client";

import React, { useState, useEffect } from "react";
import { Category, CategoryInput } from "@/types/inventory";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { X, Tag } from "lucide-react";

interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CategoryInput) => { success: boolean; error?: string };
  initialCategory?: Category | null;
}

export function CategoryModal({
  isOpen,
  onClose,
  onSubmit,
  initialCategory,
}: CategoryModalProps) {
  const [formData, setFormData] = useState<CategoryInput>({
    name: "",
    description: "",
  });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialCategory) {
      setFormData({
        name: initialCategory.name,
        description: initialCategory.description || "",
      });
    } else {
      setFormData({ name: "", description: "" });
    }
    setError(null);
  }, [initialCategory, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.name.trim()) {
      setError("Category Name is required");
      return;
    }

    const result = onSubmit(formData);
    if (result.success) {
      onClose();
    } else {
      setError(result.error || "Failed to save category");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
      <Card className="max-w-md w-full bg-white shadow-2xl border-zinc-300">
        <div className="flex items-center justify-between p-5 border-b border-zinc-100">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-charcoal-900 text-brand-400 flex items-center justify-center">
              <Tag className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-charcoal-950">
                {initialCategory ? "Edit Category" : "Add New Category"}
              </h2>
              <p className="text-xs text-zinc-500">Group store SKUs for reporting and stock control</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-zinc-700 rounded-md hover:bg-zinc-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mx-6 mt-4 p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <Input
            label="Category Name"
            placeholder="e.g. Household, Groceries, Snacks"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-zinc-700 uppercase tracking-wider">
              Description (Optional)
            </label>
            <textarea
              rows={3}
              placeholder="e.g. Cleaning agents, paper towels, and dishwashing bars"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full rounded-lg border border-zinc-300/90 bg-white p-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div className="pt-3 border-t border-zinc-100 flex items-center justify-end gap-3">
            <Button type="button" variant="outline" size="md" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="md">
              {initialCategory ? "Save Changes" : "Create Category"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
