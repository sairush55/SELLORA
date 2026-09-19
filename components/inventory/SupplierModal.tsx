"use client";

import React, { useState, useEffect } from "react";
import { Supplier, SupplierInput } from "@/types/inventory";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { X, Truck, Phone, Mail, MapPin, Clock, Hash } from "lucide-react";

interface SupplierModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: SupplierInput) => { success: boolean; error?: string };
  initialSupplier?: Supplier | null;
}

export function SupplierModal({
  isOpen,
  onClose,
  onSubmit,
  initialSupplier,
}: SupplierModalProps) {
  const [formData, setFormData] = useState<SupplierInput>({
    name: "",
    phone: "",
    email: "",
    address: "",
    leadTime: 2,
    minOrderQuantity: 10,
    notes: "",
  });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialSupplier) {
      setFormData({
        name: initialSupplier.name,
        phone: initialSupplier.phone,
        email: initialSupplier.email,
        address: initialSupplier.address,
        leadTime: initialSupplier.leadTime,
        minOrderQuantity: initialSupplier.minOrderQuantity,
        notes: initialSupplier.notes || "",
      });
    } else {
      setFormData({
        name: "",
        phone: "",
        email: "",
        address: "",
        leadTime: 2,
        minOrderQuantity: 10,
        notes: "",
      });
    }
    setError(null);
  }, [initialSupplier, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.name.trim()) {
      setError("Supplier Name is required");
      return;
    }
    if (!formData.phone.trim()) {
      setError("Contact Phone is required");
      return;
    }

    const result = onSubmit({
      ...formData,
      leadTime: Number(formData.leadTime) || 1,
      minOrderQuantity: Number(formData.minOrderQuantity) || 1,
    });

    if (result.success) {
      onClose();
    } else {
      setError(result.error || "Failed to save supplier");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 overflow-y-auto">
      <Card className="max-w-xl w-full my-8 bg-white shadow-2xl border-zinc-300">
        <div className="flex items-center justify-between p-5 border-b border-zinc-100">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-charcoal-900 text-brand-400 flex items-center justify-center">
              <Truck className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-charcoal-950">
                {initialSupplier ? "Edit Vendor Details" : "Add New Supplier / Distributor"}
              </h2>
              <p className="text-xs text-zinc-500">
                Contact information, lead times, and purchase order constraints
              </p>
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
            label="Supplier / Distributor Name"
            placeholder="e.g. Apex FMCG Distributors"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Contact Phone"
              type="tel"
              placeholder="+91 98200 12345"
              prefixIcon={<Phone className="w-3.5 h-3.5" />}
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              required
            />

            <Input
              label="Email Address"
              type="email"
              placeholder="orders@vendor.com"
              prefixIcon={<Mail className="w-3.5 h-3.5" />}
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>

          <Input
            label="Warehouse / Delivery Address"
            placeholder="e.g. APMC Wholesale Yard, Vashi, Navi Mumbai"
            prefixIcon={<MapPin className="w-3.5 h-3.5" />}
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-3.5 rounded-xl bg-zinc-50 border border-zinc-200/80">
            <Input
              label="Standard Lead Time (Days)"
              type="number"
              min="0"
              prefixIcon={<Clock className="w-3.5 h-3.5" />}
              value={formData.leadTime}
              onChange={(e) => setFormData({ ...formData, leadTime: parseInt(e.target.value) || 0 })}
              helperText="Days required to fulfill an order"
              required
            />

            <Input
              label="Minimum Order Quantity (MOQ)"
              type="number"
              min="1"
              prefixIcon={<Hash className="w-3.5 h-3.5" />}
              value={formData.minOrderQuantity}
              onChange={(e) => setFormData({ ...formData, minOrderQuantity: parseInt(e.target.value) || 1 })}
              helperText="Minimum order batch threshold"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-zinc-700 uppercase tracking-wider">
              Notes & Payment Terms (Optional)
            </label>
            <textarea
              rows={2}
              placeholder="e.g. 15-day credit cycle, morning delivery between 9-11 AM"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full rounded-lg border border-zinc-300/90 bg-white p-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div className="pt-3 border-t border-zinc-100 flex items-center justify-end gap-3">
            <Button type="button" variant="outline" size="md" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="md">
              {initialSupplier ? "Save Changes" : "Create Supplier"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
