"use client";

import React, { useState } from "react";
import { ShopSetupInput, BusinessType } from "@/types/shop";
import { Input } from "../ui/Input";
import { Select } from "../ui/Select";
import { Button } from "../ui/Button";
import { Store, User, Phone, Mail, Globe, Clock, ArrowRight } from "lucide-react";

interface ShopSetupFormProps {
  initialData?: Partial<ShopSetupInput>;
  onSubmit: (data: ShopSetupInput) => void;
  onSkip?: () => void;
}

export function ShopSetupForm({ initialData, onSubmit, onSkip }: ShopSetupFormProps) {
  const [formData, setFormData] = useState<ShopSetupInput>({
    name: initialData?.name || "",
    ownerName: initialData?.ownerName || "",
    businessType: initialData?.businessType || "supermarket",
    phone: initialData?.phone || "",
    email: initialData?.email || "",
    currency: initialData?.currency || "INR",
    timezone: initialData?.timezone || "Asia/Kolkata",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = "Shop Name is required";
    if (!formData.ownerName.trim()) newErrors.ownerName = "Owner Name is required";
    if (!formData.phone.trim()) newErrors.phone = "Phone number is required";
    if (!formData.email.trim() || !formData.email.includes("@")) {
      newErrors.email = "Valid email is required";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      onSubmit(formData);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="Shop Name"
          placeholder="e.g. Modern Retail Mart"
          prefixIcon={<Store className="w-4 h-4" />}
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          error={errors.name}
          required
        />

        <Input
          label="Owner / Proprietor Name"
          placeholder="e.g. Rahul Verma"
          prefixIcon={<User className="w-4 h-4" />}
          value={formData.ownerName}
          onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
          error={errors.ownerName}
          required
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Select
          label="Business Type"
          value={formData.businessType}
          onChange={(e) =>
            setFormData({ ...formData, businessType: e.target.value as BusinessType })
          }
        >
          <option value="supermarket">Supermarket / Grocery</option>
          <option value="apparel">Apparel & Fashion</option>
          <option value="electronics">Consumer Electronics & Mobile</option>
          <option value="pharmacy">Pharmacy & Healthcare</option>
          <option value="general_retail">General Merchandise & Dept Store</option>
          <option value="hardware">Hardware & Electricals</option>
          <option value="other">Other Retail Business</option>
        </Select>

        <Input
          label="Business Phone"
          type="tel"
          placeholder="e.g. +91 98200 12345"
          prefixIcon={<Phone className="w-4 h-4" />}
          value={formData.phone}
          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          error={errors.phone}
          required
        />
      </div>

      <Input
        label="Store Billing Email"
        type="email"
        placeholder="e.g. orders@kiranamart.in"
        prefixIcon={<Mail className="w-4 h-4" />}
        value={formData.email}
        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
        error={errors.email}
        required
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Select
          label="Default Currency"
          value={formData.currency}
          onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
        >
          <option value="INR">₹ INR — Indian Rupee (Default)</option>
          <option value="USD">$ USD — US Dollar</option>
          <option value="EUR">€ EUR — Euro</option>
          <option value="GBP">£ GBP — British Pound</option>
          <option value="AED">AED — UAE Dirham</option>
        </Select>

        <Select
          label="Timezone"
          value={formData.timezone}
          onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
        >
          <option value="Asia/Kolkata">Asia/Kolkata (IST +5:30)</option>
          <option value="Asia/Dubai">Asia/Dubai (GST +4:00)</option>
          <option value="UTC">UTC (Coordinated Universal Time)</option>
          <option value="America/New_York">America/New_York (EST)</option>
        </Select>
      </div>

      <div className="pt-4 flex items-center justify-between">
        {onSkip ? (
          <button
            type="button"
            onClick={onSkip}
            className="text-xs font-semibold text-zinc-400 hover:text-zinc-600 transition-colors"
          >
            Skip for now
          </button>
        ) : (
          <div />
        )}

        <Button type="submit" variant="primary" size="md">
          Save & Continue to Inventory
          <ArrowRight className="w-4 h-4 ml-1.5" />
        </Button>
      </div>
    </form>
  );
}
