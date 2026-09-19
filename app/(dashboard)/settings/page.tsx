"use client";

import React, { useState } from "react";
import { useShop } from "@/hooks/useShop";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { useRouter } from "next/navigation";
import { Store, User, Phone, Mail, CheckCircle2, RotateCcw, LogOut, Trash2 } from "lucide-react";

export default function SettingsPage() {
  const { shop, updateShop, resetToDemo } = useShop();
  const { logout, user } = useAuth();
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: shop.name,
    ownerName: shop.ownerName,
    businessType: shop.businessType,
    phone: shop.phone,
    email: shop.email,
    currency: shop.currency,
    timezone: shop.timezone,
  });
  const [savedNotice, setSavedNotice] = useState(false);
  const [resetConfirm, setResetConfirm] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateShop(formData);
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 3000);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="pb-3 border-b border-zinc-200/80">
        <h1 className="text-xl font-extrabold text-charcoal-950 tracking-tight">
          Shop & Terminal Settings
        </h1>
        <p className="text-xs text-zinc-500 mt-0.5">
          Configure business metadata, currency defaults, and receipt parameters
        </p>
      </div>

      {savedNotice && (
        <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          Shop settings updated successfully.
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Shop Profile Details</CardTitle>
            <CardDescription>Primary retail business identifiers</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Shop Name"
                prefixIcon={<Store className="w-4 h-4" />}
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
              <Input
                label="Owner / Proprietor"
                prefixIcon={<User className="w-4 h-4" />}
                value={formData.ownerName}
                onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Select
                label="Business Type"
                value={formData.businessType}
                onChange={(e) =>
                  setFormData({ ...formData, businessType: e.target.value as any })
                }
              >
                <option value="supermarket">Supermarket / Grocery</option>
                <option value="apparel">Apparel & Fashion</option>
                <option value="electronics">Consumer Electronics & Mobile</option>
                <option value="pharmacy">Pharmacy & Healthcare</option>
                <option value="general_retail">General Retail</option>
                <option value="hardware">Hardware & Electricals</option>
              </Select>

              <Input
                label="Business Phone"
                prefixIcon={<Phone className="w-4 h-4" />}
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                required
              />
            </div>

            <Input
              label="Billing Email"
              type="email"
              prefixIcon={<Mail className="w-4 h-4" />}
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Currency & Localization</CardTitle>
            <CardDescription>Regional settings for financial calculations</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Select
                label="Active Currency"
                value={formData.currency}
                onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
              >
                <option value="INR">₹ INR — Indian Rupee (Default)</option>
                <option value="USD">$ USD — US Dollar</option>
                <option value="EUR">€ EUR — Euro</option>
                <option value="GBP">£ GBP — British Pound</option>
              </Select>

              <Select
                label="Timezone"
                value={formData.timezone}
                onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
              >
                <option value="Asia/Kolkata">Asia/Kolkata (IST +5:30)</option>
                <option value="UTC">UTC</option>
                <option value="America/New_York">America/New_York</option>
              </Select>
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center justify-between pt-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              resetToDemo();
              setFormData({
                name: "KiranaMart Superstore",
                ownerName: "Rahul Verma",
                businessType: "supermarket",
                phone: "+91 98200 12345",
                email: "store@kiranamart.in",
                currency: "INR",
                timezone: "Asia/Kolkata",
              });
              setSavedNotice(true);
              setTimeout(() => setSavedNotice(false), 3000);
            }}
            className="text-xs gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset to Demo Store
          </Button>

          <Button type="submit" variant="primary" size="md">
            Save Changes
          </Button>
        </div>
      </form>

      {/* Reset All Data */}
      <Card className="border-orange-200/80 bg-orange-50/10">
        <CardContent className="p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h4 className="text-sm font-bold text-zinc-900 flex items-center gap-1.5">
                <Trash2 className="w-4 h-4 text-orange-600" />
                Reset All Data
              </h4>
              <p className="text-xs text-zinc-500 mt-0.5">
                Permanently wipe all products, sales, inventory, categories and suppliers for every account on this browser. Cannot be undone.
              </p>
            </div>

            {!resetConfirm ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setResetConfirm(true)}
                className="text-xs border-orange-300 text-orange-700 hover:bg-orange-50 shrink-0"
              >
                <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                Reset All Data
              </Button>
            ) : (
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs text-orange-700 font-semibold">Are you sure?</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setResetConfirm(false)}
                  className="text-xs"
                >
                  Cancel
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => {
                    // Wipe every sellora_* key in localStorage
                    const keys: string[] = [];
                    for (let i = 0; i < localStorage.length; i++) {
                      const k = localStorage.key(i);
                      if (k && k.startsWith("sellora_")) keys.push(k);
                    }
                    keys.forEach((k) => localStorage.removeItem(k));
                    router.push("/reset");
                  }}
                  className="text-xs"
                >
                  Yes, Reset Everything
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Account actions */}
      <Card className="border-red-200/80 bg-red-50/10">
        <CardContent className="p-5 flex items-center justify-between">
          <div>
            <h4 className="text-sm font-bold text-zinc-900">Sign Out of Session</h4>
            <p className="text-xs text-zinc-500">
              Disconnect active session on this terminal
            </p>
          </div>
          <Button variant="danger" size="sm" onClick={() => logout()} className="text-xs">
            <LogOut className="w-3.5 h-3.5 mr-1.5" />
            Sign Out
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
