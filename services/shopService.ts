import { ShopProfile, ShopSetupInput } from "@/types/shop";
import { notifyDataRefresh } from "@/hooks/useDataRefresh";

/**
 * Dedicated demo tenant IDs — the ONLY shops that receive auto-seeded demo data.
 * All other shop IDs represent real merchant accounts and must start completely empty.
 */
export const DEMO_SHOP_IDS = new Set([
  "shop-ravi-stores",
  "shop-kumar-mart",
  "shop-fresh-point",
  "shop-demo-1",
  "shop-1",
]);

export function isDemoShop(shopId: string): boolean {
  return DEMO_SHOP_IDS.has(shopId);
}

const LOCAL_STORAGE_ACTIVE_SHOP_KEY = "sellora_active_shop";
const LOCAL_STORAGE_SHOPS_REGISTRY_KEY = "sellora_shops_registry";

/**
 * 1 Dedicated Isolated Demo Tenant: Ravi Stores
 */
export const DEMO_TENANTS: ShopProfile[] = [
  {
    id: "shop-ravi-stores",
    name: "Ravi Stores",
    ownerName: "Ravi Kumar",
    businessType: "supermarket",
    phone: "+91 98450 67890",
    email: "ravi@ravistores.in",
    currency: "INR",
    currencySymbol: "₹",
    timezone: "Asia/Kolkata",
    address: "Shop #12, Market Main Road, Malleshwaram, Bengaluru, KA 560003",
    gstin: "29AABCR4819B1Z2",
    createdAt: "2026-01-01T00:00:00.000Z",
    onboardingCompleted: true,
    onboardingStep: 4,
  },
];

export const DEMO_SHOP: ShopProfile = DEMO_TENANTS[0];

export const shopService = {
  /**
   * Returns all registered tenants. Seeds the 3 isolated demo tenants if none exist.
   */
  getAllShops(): ShopProfile[] {
    if (typeof window === "undefined") return DEMO_TENANTS;
    const stored = localStorage.getItem(LOCAL_STORAGE_SHOPS_REGISTRY_KEY);
    if (!stored) {
      localStorage.setItem(LOCAL_STORAGE_SHOPS_REGISTRY_KEY, JSON.stringify(DEMO_TENANTS));
      return DEMO_TENANTS;
    }
    try {
      const parsed: ShopProfile[] = JSON.parse(stored);
      // Ensure all 3 default demo tenants exist in registry
      let updated = false;
      for (const demo of DEMO_TENANTS) {
        if (!parsed.some((s) => s.id === demo.id)) {
          parsed.push(demo);
          updated = true;
        }
      }
      if (updated) {
        localStorage.setItem(LOCAL_STORAGE_SHOPS_REGISTRY_KEY, JSON.stringify(parsed));
      }
      return parsed;
    } catch {
      return DEMO_TENANTS;
    }
  },

  /**
   * Retrieves a specific tenant by shopId, or the currently active tenant if not specified.
   */
  getShop(shopId?: string): ShopProfile {
    const allShops = this.getAllShops();

    if (shopId) {
      // Direct lookup with compatibility aliases
      const normalizedId =
        shopId === "shop-demo-1" || shopId === "shop-1" ? "shop-ravi-stores" : shopId;
      const found = allShops.find((s) => s.id === normalizedId);
      if (found) return found;
    }

    if (typeof window === "undefined") return DEMO_SHOP;

    const storedActive = localStorage.getItem(LOCAL_STORAGE_ACTIVE_SHOP_KEY);
    if (storedActive) {
      try {
        const parsed = JSON.parse(storedActive);
        if (parsed.name === "KiranaMart Superstore") {
          this.saveShop(DEMO_SHOP);
          return DEMO_SHOP;
        }
        // If an alias ID was saved, resolve to proper tenant
        if (parsed.id === "shop-demo-1" || parsed.id === "shop-1") {
          parsed.id = "shop-ravi-stores";
          this.saveShop(parsed);
        }
        return parsed;
      } catch {
        return DEMO_SHOP;
      }
    }

    this.saveShop(DEMO_SHOP);
    return DEMO_SHOP;
  },

  /**
   * Returns the currently active tenant.
   */
  getActiveShop(): ShopProfile {
    return this.getShop();
  },

  /**
   * Switches the active tenant context with complete data refresh.
   */
  switchActiveTenant(shopId: string): ShopProfile {
    const targetShop = this.getShop(shopId);
    this.saveShop(targetShop);

    // Sync auth user session to match the active merchant
    if (typeof window !== "undefined") {
      const sessionUser = {
        id: `usr-${targetShop.id}`,
        email: targetShop.email,
        name: targetShop.ownerName,
        shopId: targetShop.id,
        createdAt: targetShop.createdAt,
      };
      localStorage.setItem("sellora_auth_user", JSON.stringify(sessionUser));
    }

    notifyDataRefresh("all", { tenantSwitched: true, newShopId: targetShop.id });
    return targetShop;
  },

  /**
   * Creates a new isolated merchant tenant.
   */
  createShop(input: ShopSetupInput): ShopProfile {
    const allShops = this.getAllShops();
    const newShopId = `shop-${Date.now()}`;

    const newShop: ShopProfile = {
      id: newShopId,
      name: input.name.trim(),
      ownerName: input.ownerName.trim(),
      businessType: input.businessType,
      phone: input.phone.trim(),
      email: input.email.trim(),
      currency: input.currency || "INR",
      currencySymbol: "₹",
      timezone: input.timezone || "Asia/Kolkata",
      createdAt: new Date().toISOString(),
      onboardingCompleted: false,
      onboardingStep: 1,
    };

    allShops.push(newShop);
    if (typeof window !== "undefined") {
      localStorage.setItem(LOCAL_STORAGE_SHOPS_REGISTRY_KEY, JSON.stringify(allShops));
      // Auto-set the active auth user session to the newly registered merchant
      const sessionUser = {
        id: `usr-${newShop.id}`,
        email: newShop.email,
        name: newShop.ownerName,
        shopId: newShop.id,
        createdAt: newShop.createdAt,
      };
      localStorage.setItem("sellora_auth_user", JSON.stringify(sessionUser));
    }

    this.saveShop(newShop);
    notifyDataRefresh("all", { newShopCreated: true, shopId: newShop.id });
    return newShop;
  },

  /**
   * Updates an existing tenant profile.
   */
  updateShop(updates: Partial<ShopProfile>, shopId?: string): ShopProfile {
    const current = this.getShop(shopId);
    const updated: ShopProfile = { ...current, ...updates };

    const allShops = this.getAllShops();
    const index = allShops.findIndex((s) => s.id === updated.id);
    if (index !== -1) {
      allShops[index] = updated;
      if (typeof window !== "undefined") {
        localStorage.setItem(LOCAL_STORAGE_SHOPS_REGISTRY_KEY, JSON.stringify(allShops));
      }
    }

    // If updating active shop, update active shop key and active auth user
    const active = this.getActiveShop();
    if (active.id === updated.id) {
      this.saveShop(updated);
      if (typeof window !== "undefined") {
        const storedUser = localStorage.getItem("sellora_auth_user");
        if (storedUser) {
          try {
            const parsed = JSON.parse(storedUser);
            parsed.name = updated.ownerName || parsed.name;
            parsed.email = updated.email || parsed.email;
            localStorage.setItem("sellora_auth_user", JSON.stringify(parsed));
          } catch {}
        }
      }
    }

    notifyDataRefresh("all", { shopUpdated: true, shopId: updated.id });
    return updated;
  },

  completeOnboarding(shopId?: string): ShopProfile {
    return this.updateShop(
      {
        onboardingCompleted: true,
        onboardingStep: 4,
      },
      shopId
    );
  },

  saveShop(shop: ShopProfile): void {
    if (typeof window === "undefined") return;
    localStorage.setItem(LOCAL_STORAGE_ACTIVE_SHOP_KEY, JSON.stringify(shop));
  },
};
