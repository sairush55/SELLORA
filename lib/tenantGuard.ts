/**
 * SELLORA — Multi-Tenant Security Guard
 * Enforces strict tenant data boundaries across all read, write, and analytical operations.
 */

import { shopService } from "@/services/shopService";

export class TenantAccessError extends Error {
  constructor(message: string, public attemptedShopId?: string) {
    super(message);
    this.name = "TenantAccessError";
  }
}

export const tenantGuard = {
  /**
   * Validates that a requested shopId is valid, non-empty, and registered.
   */
  validateTenant(shopId: string): boolean {
    if (!shopId || typeof shopId !== "string" || shopId.trim().length === 0) {
      return false;
    }
    const cleanId = shopId.trim();
    const shops = shopService.getAllShops();
    return shops.some((s) => s.id === cleanId);
  },

  /**
   * Asserts that the operation is executed strictly within an authorized tenant boundary.
   * Throws a TenantAccessError if unauthorized or undefined.
   */
  assertTenantAccess(requestShopId: string, authorizedShopId?: string): string {
    if (!requestShopId || typeof requestShopId !== "string" || requestShopId.trim().length === 0) {
      throw new TenantAccessError("Access denied: Tenant ID (shopId) is missing or undefined.");
    }

    const cleanReq = requestShopId.trim();

    if (authorizedShopId && cleanReq !== authorizedShopId.trim()) {
      throw new TenantAccessError(
        `Cross-tenant access violation: Request tenant "${cleanReq}" does not match authorized session tenant "${authorizedShopId}".`,
        cleanReq
      );
    }

    return cleanReq;
  },

  /**
   * Resolves the active authorized tenant safely.
   */
  resolveAuthorizedShopId(explicitShopId?: string): string {
    if (explicitShopId && explicitShopId.trim().length > 0) {
      return explicitShopId.trim();
    }
    const active = shopService.getActiveShop();
    return active.id;
  },
};
