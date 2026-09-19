"use client";

import React, { useState, useEffect } from "react";
import { useShop } from "@/hooks/useShop";
import { supplierService } from "@/services/supplierService";
import { productService } from "@/services/productService";
import { Supplier, SupplierInput } from "@/types/inventory";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { SupplierModal } from "@/components/inventory/SupplierModal";
import {
  Truck,
  Search,
  Plus,
  Edit2,
  Trash2,
  Phone,
  Mail,
  MapPin,
  Clock,
  CheckCircle2,
  AlertCircle,
  Boxes,
} from "lucide-react";
import Link from "next/link";

export default function SuppliersPage() {
  const { shop } = useShop();
  const shopId = shop.id;

  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [deletingSupplier, setDeletingSupplier] = useState<Supplier | null>(null);
  const [feedback, setFeedback] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const loadData = () => {
    const rawSuppliers = supplierService.getSuppliers(shopId);
    const allProducts = productService.getProducts(shopId);

    // Compute linked products count per supplier
    const withCounts = rawSuppliers.map((sup) => ({
      ...sup,
      productCount: allProducts.filter((p) => p.supplierId === sup.id).length,
    }));

    setSuppliers(withCounts);
  };

  useEffect(() => {
    loadData();
  }, [shopId]);

  const handleCreateOrUpdate = (data: SupplierInput) => {
    if (editingSupplier) {
      const res = supplierService.updateSupplier(shopId, editingSupplier.id, data);
      if (res.supplier) {
        setFeedback({ message: `Updated supplier "${res.supplier.name}"`, type: "success" });
        loadData();
        return { success: true };
      }
      return { success: false, error: res.error };
    } else {
      const res = supplierService.createSupplier(shopId, data);
      if (res.supplier) {
        setFeedback({ message: `Created supplier "${res.supplier.name}"`, type: "success" });
        loadData();
        return { success: true };
      }
      return { success: false, error: res.error };
    }
  };

  const handleDeleteConfirm = () => {
    if (!deletingSupplier) return;
    const res = supplierService.deleteSupplier(shopId, deletingSupplier.id);
    if (res.success) {
      setFeedback({ message: `Deleted supplier "${deletingSupplier.name}"`, type: "success" });
      setDeletingSupplier(null);
      loadData();
    } else {
      setFeedback({ message: res.error || "Failed to delete", type: "error" });
    }
  };

  const filtered = suppliers.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.phone.toLowerCase().includes(search.toLowerCase()) ||
      s.email.toLowerCase().includes(search.toLowerCase()) ||
      s.address.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-zinc-200/80">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-extrabold text-charcoal-950 tracking-tight">
              Suppliers & Vendor Network
            </h1>
            <Badge variant="healthy" dot>
              {suppliers.length} Vendors Active
            </Badge>
          </div>
          <p className="text-xs text-zinc-500 mt-0.5">
            Manage wholesale distributors, lead times, minimum order sizes, and contact details
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link href="/inventory/products">
            <Button variant="outline" size="sm" className="text-xs">
              View Catalog SKUs
            </Button>
          </Link>
          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              setEditingSupplier(null);
              setIsModalOpen(true);
            }}
            className="text-xs font-semibold gap-1.5 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Add Supplier
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
            placeholder="Search vendor name, phone, email, or address..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-9 pl-9 pr-3 rounded-lg border border-zinc-200 text-xs bg-zinc-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
        </div>
        <span className="text-xs text-zinc-400 font-mono hidden sm:inline-block">
          Showing {filtered.length} suppliers
        </span>
      </div>

      {/* Suppliers Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-50 border-b border-zinc-200/80 text-[11px] uppercase font-semibold text-zinc-500 font-mono">
                <tr>
                  <th className="py-3 px-4">Supplier Name</th>
                  <th className="py-3 px-4">Contact & Phone</th>
                  <th className="py-3 px-4">Warehouse Address</th>
                  <th className="py-3 px-3 text-center">Lead Time</th>
                  <th className="py-3 px-3 text-center">MOQ</th>
                  <th className="py-3 px-3 text-center">Linked Products</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 font-normal">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-zinc-400 text-xs">
                      No suppliers found matching your query.
                    </td>
                  </tr>
                ) : (
                  filtered.map((s) => (
                    <tr key={s.id} className="hover:bg-zinc-50/70 transition-colors">
                      <td className="py-3.5 px-4 font-semibold text-zinc-900">
                        <div className="flex items-center gap-2.5">
                          <div className="h-8 w-8 rounded-md bg-zinc-100 flex items-center justify-center text-zinc-700 shrink-0">
                            <Truck className="w-4 h-4 text-brand-600" />
                          </div>
                          <div>
                            <p className="truncate max-w-[180px]">{s.name}</p>
                            {s.notes && (
                              <p className="text-[10px] text-zinc-400 font-normal truncate max-w-[180px]">
                                {s.notes}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-zinc-700">
                        <div className="flex items-center gap-1 font-mono text-[11px]">
                          <Phone className="w-3 h-3 text-zinc-400" />
                          <span>{s.phone}</span>
                        </div>
                        {s.email && (
                          <div className="flex items-center gap-1 text-[10px] text-zinc-400 truncate max-w-[160px]">
                            <Mail className="w-3 h-3 text-zinc-400" />
                            <span>{s.email}</span>
                          </div>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-zinc-600 max-w-[200px] truncate">
                        {s.address || "—"}
                      </td>

                      <td className="py-3.5 px-3 text-center font-mono font-medium">
                        <span className="bg-zinc-100 text-zinc-800 px-2 py-0.5 rounded">
                          {s.leadTime} {s.leadTime === 1 ? "day" : "days"}
                        </span>
                      </td>

                      <td className="py-3.5 px-3 text-center font-mono">
                        {s.minOrderQuantity} units
                      </td>

                      <td className="py-3.5 px-3 text-center font-mono">
                        <span className="font-semibold text-brand-700 bg-brand-50 px-2 py-0.5 rounded border border-brand-200/60">
                          {s.productCount || 0} SKUs
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => {
                              setEditingSupplier(s);
                              setIsModalOpen(true);
                            }}
                            title="Edit supplier"
                            className="p-1.5 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 rounded-md transition-colors"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDeletingSupplier(s)}
                            title="Delete supplier"
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

      {/* Supplier Modal */}
      <SupplierModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingSupplier(null);
        }}
        onSubmit={handleCreateOrUpdate}
        initialSupplier={editingSupplier}
      />

      {/* Delete Confirmation Modal */}
      {deletingSupplier && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <Card className="max-w-sm w-full p-6 text-center space-y-4 bg-white shadow-2xl">
            <div className="mx-auto h-12 w-12 rounded-full bg-red-100 flex items-center justify-center text-red-600">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-zinc-900">Delete Supplier</h3>
              <p className="text-xs text-zinc-500 mt-1">
                Are you sure you want to delete{" "}
                <strong className="text-zinc-800">{deletingSupplier.name}</strong>?
                {deletingSupplier.productCount && deletingSupplier.productCount > 0 ? (
                  <span className="block mt-2 text-amber-700 font-semibold">
                    Note: {deletingSupplier.productCount} products are linked to this vendor.
                  </span>
                ) : null}
              </p>
            </div>
            <div className="flex items-center gap-3 pt-2">
              <Button
                variant="outline"
                size="md"
                className="flex-1"
                onClick={() => setDeletingSupplier(null)}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                size="md"
                className="flex-1"
                onClick={handleDeleteConfirm}
              >
                Delete Supplier
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
