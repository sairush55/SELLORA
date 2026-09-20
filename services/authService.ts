import { User } from "@/types/auth";
import { supabase, isSupabaseConfigured } from "@/lib/supabase/client";
import { shopService } from "./shopService";

const LOCAL_STORAGE_USER_KEY = "sellora_auth_user";
const LOCAL_STORAGE_SESSION_KEY = "sellora_auth_session";
const LOCAL_STORAGE_ACCOUNTS_KEY = "sellora_registered_accounts";

export interface LocalAccount {
  id: string;
  email: string;
  password: string;
  name: string;
  shopId: string;
  createdAt: string;
}

export const DEMO_USERS: Record<string, User> = {
  "shop-ravi-stores": {
    id: "usr-ravi-001",
    email: "ravi@ravistores.in",
    name: "Ravi Kumar",
    shopId: "shop-ravi-stores",
    avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    createdAt: "2026-01-01T00:00:00.000Z",
  },
  "shop-kumar-mart": {
    id: "usr-kumar-002",
    email: "suresh@kumarmart.in",
    name: "Suresh Kumar",
    shopId: "shop-kumar-mart",
    avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
    createdAt: "2026-01-15T00:00:00.000Z",
  },
  "shop-fresh-point": {
    id: "usr-deepak-003",
    email: "deepak@freshpoint.in",
    name: "Deepak Patel",
    shopId: "shop-fresh-point",
    avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
    createdAt: "2026-02-01T00:00:00.000Z",
  },
};

export const DEMO_USER: User = DEMO_USERS["shop-ravi-stores"];

export const authService = {
  isSupabaseConnected(): boolean {
    return isSupabaseConfigured;
  },

  getLocalAccounts(): Record<string, LocalAccount> {
    if (typeof window === "undefined") return {};
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_ACCOUNTS_KEY);
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  },

  saveLocalAccounts(accounts: Record<string, LocalAccount>): void {
    if (typeof window === "undefined") return;
    localStorage.setItem(LOCAL_STORAGE_ACCOUNTS_KEY, JSON.stringify(accounts));
  },

  async signUp(
    email: string,
    password: string,
    name: string,
    shopName?: string
  ): Promise<{ user: User | null; error: Error | null }> {
    const cleanEmail = email.trim().toLowerCase();
    const cleanPass = password.trim();

    // Always create a brand-new isolated shop for every new merchant.
    // Never default to a demo tenant.
    const resolvedShopName = shopName || `${name}'s Store`;
    const newShop = shopService.createShop({
      name: resolvedShopName,
      ownerName: name,
      businessType: "supermarket",
      phone: "+91 98000 00000",
      email: cleanEmail,
    });
    const assignedShopId = newShop.id;

    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase.auth.signUp({
          email: cleanEmail,
          password: cleanPass,
          options: {
            data: { full_name: name, shop_id: assignedShopId },
          },
        });
        if (error) return { user: null, error: new Error(error.message) };
        if (data.user) {
          const user: User = {
            id: data.user.id,
            email: data.user.email || cleanEmail,
            name: data.user.user_metadata?.full_name || name,
            shopId: assignedShopId,
            createdAt: data.user.created_at,
          };
          this.setLocalSession(user);
          shopService.switchActiveTenant(assignedShopId);
          return { user, error: null };
        }
      } catch (err: unknown) {
        return { user: null, error: err as Error };
      }
    }

    // Local / Standalone Mode Account Registration
    const accounts = this.getLocalAccounts();
    if (accounts[cleanEmail]) {
      return {
        user: null,
        error: new Error("An account with this email already exists. Please sign in instead."),
      };
    }

    const newAccount: LocalAccount = {
      id: `usr-${Date.now()}`,
      email: cleanEmail,
      password: cleanPass,
      name: name || cleanEmail.split("@")[0],
      shopId: assignedShopId,
      createdAt: new Date().toISOString(),
    };
    accounts[cleanEmail] = newAccount;
    this.saveLocalAccounts(accounts);

    const user: User = {
      id: newAccount.id,
      email: newAccount.email,
      name: newAccount.name,
      shopId: assignedShopId,
      createdAt: newAccount.createdAt,
    };
    this.setLocalSession(user);
    shopService.switchActiveTenant(assignedShopId);
    return { user, error: null };
  },

  async signIn(
    email: string,
    password?: string
  ): Promise<{ user: User | null; error: Error | null }> {
    const cleanEmail = email.trim().toLowerCase();
    const cleanPass = (password || "").trim();

    if (!cleanEmail || !cleanPass) {
      return { user: null, error: new Error("Please enter both email and password.") };
    }

    // 1. If Supabase is configured, authenticate strictly with Supabase Cloud
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password: cleanPass,
        });
        if (error) {
          return {
            user: null,
            error: new Error(error.message || "Invalid email or password in Supabase."),
          };
        }
        if (data.user) {
          const user: User = {
            id: data.user.id,
            email: data.user.email || cleanEmail,
            name: data.user.user_metadata?.full_name || cleanEmail.split("@")[0],
            shopId: data.user.user_metadata?.shop_id || "shop-ravi-stores",
            createdAt: data.user.created_at,
          };
          this.setLocalSession(user);
          shopService.switchActiveTenant(user.shopId!);
          return { user, error: null };
        }
        return { user: null, error: new Error("Failed to authenticate user session.") };
      } catch (err: unknown) {
        return { user: null, error: err as Error };
      }
    }

    // 2. Local / Standalone Mode Authentication
    // A. Check Demo Merchants (ravi@ravistores.in, suresh@kumarmart.in, deepak@freshpoint.in)
    for (const demo of Object.values(DEMO_USERS)) {
      if (demo.email.toLowerCase() === cleanEmail) {
        // Enforce demo password
        const validDemoPasswords = ["sellora123", "demo123", "ravi123"];
        if (validDemoPasswords.includes(cleanPass)) {
          this.setLocalSession(demo);
          shopService.switchActiveTenant(demo.shopId!);
          return { user: demo, error: null };
        } else {
          return {
            user: null,
            error: new Error("Invalid password for demo account. Password is 'sellora123' (or click 'Dedicated Demo Account' above)."),
          };
        }
      }
    }

    // B. Check Registered Local Accounts
    const accounts = this.getLocalAccounts();
    const existingAccount = accounts[cleanEmail];
    if (existingAccount) {
      if (existingAccount.password === cleanPass) {
        const user: User = {
          id: existingAccount.id,
          email: existingAccount.email,
          name: existingAccount.name,
          shopId: existingAccount.shopId,
          createdAt: existingAccount.createdAt,
        };
        this.setLocalSession(user);
        shopService.switchActiveTenant(existingAccount.shopId);
        return { user, error: null };
      } else {
        return {
          user: null,
          error: new Error("Invalid password. Please check your credentials and try again."),
        };
      }
    }

    // C. No account exists: Strict rejection. Never auto-login with fake credentials!
    return {
      user: null,
      error: new Error("No account found with this email. Please register a new shop first or click 'Dedicated Demo Account' to test."),
    };
  },

  async signInDemo(tenantId: string = "shop-ravi-stores"): Promise<User> {
    const targetUser = DEMO_USERS[tenantId] || DEMO_USER;
    this.setLocalSession(targetUser);
    shopService.switchActiveTenant(targetUser.shopId!);
    return targetUser;
  },

  async signOut(): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.auth.signOut();
      } catch (err) {
        console.error("Supabase signOut error:", err);
      }
    }
    if (typeof window !== "undefined") {
      localStorage.removeItem(LOCAL_STORAGE_USER_KEY);
      localStorage.removeItem(LOCAL_STORAGE_SESSION_KEY);
    }
  },

  getCurrentUser(): User | null {
    if (typeof window === "undefined") return null;
    const stored = localStorage.getItem(LOCAL_STORAGE_USER_KEY);
    if (!stored) return null;
    try {
      const parsed = JSON.parse(stored);
      if (parsed.email === "rahul.verma@kiranamart.in") {
        // Migrate legacy KiranaMart user to Ravi Stores
        this.setLocalSession(DEMO_USER);
        return DEMO_USER;
      }
      return parsed;
    } catch {
      return null;
    }
  },

  setLocalSession(user: User): void {
    if (typeof window === "undefined") return;
    localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(user));
    localStorage.setItem(
      LOCAL_STORAGE_SESSION_KEY,
      JSON.stringify({
        user,
        token: `mock-jwt-${user.id}-${user.shopId || "shop-ravi-stores"}`,
        expiresAt: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString(),
      })
    );
  },
};
