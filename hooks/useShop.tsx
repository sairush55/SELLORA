"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { ShopProfile, ShopSetupInput } from "@/types/shop";
import { shopService, DEMO_SHOP, DEMO_TENANTS } from "@/services/shopService";

interface ShopContextType {
  shop: ShopProfile;
  shops: ShopProfile[];
  isLoading: boolean;
  createShop: (input: ShopSetupInput) => ShopProfile;
  updateShop: (updates: Partial<ShopProfile>) => ShopProfile;
  switchShop: (shopId: string) => ShopProfile;
  completeOnboarding: () => void;
  resetToDemo: () => void;
}

const ShopContext = createContext<ShopContextType | undefined>(undefined);

export function ShopProvider({ children }: { children: ReactNode }) {
  const [shop, setShop] = useState<ShopProfile>(DEMO_SHOP);
  const [shops, setShops] = useState<ShopProfile[]>(DEMO_TENANTS);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const refreshShops = () => {
      const loaded = shopService.getShop();
      const all = shopService.getAllShops();
      setShop(loaded);
      setShops(all);
      setIsLoading(false);
    };

    refreshShops();

    const handleRefresh = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail?.tenantSwitched || detail?.newShopCreated || detail?.shopUpdated) {
        refreshShops();
      }
    };

    window.addEventListener("sellora:data-refresh", handleRefresh);
    return () => window.removeEventListener("sellora:data-refresh", handleRefresh);
  }, []);

  const handleCreateShop = (input: ShopSetupInput) => {
    const newShop = shopService.createShop(input);
    setShop(newShop);
    setShops(shopService.getAllShops());
    return newShop;
  };

  const handleUpdateShop = (updates: Partial<ShopProfile>) => {
    const updated = shopService.updateShop(updates);
    setShop(updated);
    setShops(shopService.getAllShops());
    return updated;
  };

  const handleSwitchShop = (shopId: string) => {
    const switched = shopService.switchActiveTenant(shopId);
    setShop(switched);
    return switched;
  };

  const handleCompleteOnboarding = () => {
    const updated = shopService.completeOnboarding();
    setShop(updated);
  };

  const handleResetToDemo = () => {
    shopService.saveShop(DEMO_SHOP);
    setShop(DEMO_SHOP);
  };

  return (
    <ShopContext.Provider
      value={{
        shop,
        shops,
        isLoading,
        createShop: handleCreateShop,
        updateShop: handleUpdateShop,
        switchShop: handleSwitchShop,
        completeOnboarding: handleCompleteOnboarding,
        resetToDemo: handleResetToDemo,
      }}
    >
      {children}
    </ShopContext.Provider>
  );
}

export function useShop(): ShopContextType {
  const context = useContext(ShopContext);
  if (!context) {
    throw new Error("useShop must be used within a ShopProvider");
  }
  return context;
}
