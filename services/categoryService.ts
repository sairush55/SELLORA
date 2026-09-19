import { Category, CategoryInput } from "@/types/inventory";
import { isDemoShop } from "./shopService";

const CATEGORIES_STORAGE_PREFIX = "sellora_categories_";

const SHOP_CATEGORIES: Record<string, Array<Omit<Category, "id" | "shopId" | "createdAt">>> = {
  "shop-ravi-stores": [
    { name: "Groceries", description: "Everyday grocery staples, pulses, and dry foods" },
    { name: "Beverages", description: "Tea, coffee, packaged juices, and soft drinks" },
    { name: "Personal Care", description: "Soaps, shampoos, oral care, and cosmetics" },
    { name: "Household", description: "Cleaning agents, detergents, and paper goods" },
    { name: "Snacks", description: "Biscuits, chips, namkeen, and confectioneries" },
    { name: "Dairy & Chilled", description: "Milk, butter, curd, paneer, and cheese" },
    { name: "Edible Oils", description: "Refined oils, mustard oil, and ghee" },
    { name: "Staples & Grains", description: "Flour, rice, wheat, and whole grains" },
  ],
  "shop-kumar-mart": [
    { name: "Snacks & Namkeen", description: "Chips, namkeen, wafers, and savory nibbles" },
    { name: "Beverages & Drinks", description: "Soft drinks, fruit juices, and energy beverages" },
    { name: "Confectionery & Sweets", description: "Chocolates, biscuits, and premium confectionery" },
    { name: "Personal Care", description: "Grooming, oral care, and cosmetics" },
    { name: "Household Cleaning", description: "Disinfectants, cleaners, and home utilities" },
  ],
  "shop-fresh-point": [
    { name: "Farm Fresh Dairy", description: "Artisanal paneer, buffalo milk, curd, and pure ghee" },
    { name: "Organic Staples & Grains", description: "Certified chemical-free millets, rolled oats, and pulses" },
    { name: "Cold Pressed Oils", description: "Virgin coconut oil, extra virgin olive oil, and mustard oil" },
    { name: "Health & Superfoods", description: "Raw chia seeds, organic flax, and unprocessed honey" },
    { name: "Artisanal Breakfast", description: "Sourdough breads, nut butters, and farm eggs" },
  ],
};

export const categoryService = {
  getCategories(shopId: string): Category[] {
    if (typeof window === "undefined") return [];
    const key = `${CATEGORIES_STORAGE_PREFIX}${shopId}`;
    const stored = localStorage.getItem(key);

    if (!stored) {
      // Only seed demo data for dedicated demo tenants.
      // Real merchant accounts start with zero categories.
      if (!isDemoShop(shopId)) {
        return [];
      }
      const defaultTemplates = SHOP_CATEGORIES[shopId] || SHOP_CATEGORIES["shop-ravi-stores"];
      const seeded: Category[] = defaultTemplates.map((c, index) => ({
        id: `cat-${shopId}-${index + 1}`,
        shopId,
        name: c.name,
        description: c.description,
        createdAt: new Date().toISOString(),
      }));
      this.saveCategories(shopId, seeded);
      return seeded;
    }

    try {
      return JSON.parse(stored);
    } catch {
      return [];
    }
  },

  getCategoryById(shopId: string, id: string): Category | null {
    const categories = this.getCategories(shopId);
    return categories.find((c) => c.id === id) || null;
  },

  createCategory(shopId: string, input: CategoryInput): { category: Category | null; error?: string } {
    const categories = this.getCategories(shopId);
    const normalizedName = input.name.trim();

    if (!normalizedName) {
      return { category: null, error: "Category name is required" };
    }

    const exists = categories.some(
      (c) => c.name.toLowerCase() === normalizedName.toLowerCase()
    );
    if (exists) {
      return { category: null, error: `Category "${normalizedName}" already exists` };
    }

    const newCategory: Category = {
      id: `cat-${shopId}-${Date.now()}`,
      shopId,
      name: normalizedName,
      description: input.description?.trim(),
      createdAt: new Date().toISOString(),
    };

    categories.push(newCategory);
    this.saveCategories(shopId, categories);
    return { category: newCategory };
  },

  updateCategory(shopId: string, id: string, input: CategoryInput): { category: Category | null; error?: string } {
    const categories = this.getCategories(shopId);
    const index = categories.findIndex((c) => c.id === id);

    if (index === -1) {
      return { category: null, error: "Category not found" };
    }

    const normalizedName = input.name.trim();
    if (!normalizedName) {
      return { category: null, error: "Category name cannot be empty" };
    }

    const duplicate = categories.some(
      (c) => c.id !== id && c.name.toLowerCase() === normalizedName.toLowerCase()
    );
    if (duplicate) {
      return { category: null, error: `Another category with name "${normalizedName}" already exists` };
    }

    categories[index] = {
      ...categories[index],
      name: normalizedName,
      description: input.description?.trim(),
    };

    this.saveCategories(shopId, categories);
    return { category: categories[index] };
  },

  deleteCategory(shopId: string, id: string): { success: boolean; error?: string } {
    const categories = this.getCategories(shopId);
    const updated = categories.filter((c) => c.id !== id);

    if (updated.length === categories.length) {
      return { success: false, error: "Category not found" };
    }

    this.saveCategories(shopId, updated);
    return { success: true };
  },

  saveCategories(shopId: string, categories: Category[]): void {
    if (typeof window === "undefined") return;
    const key = `${CATEGORIES_STORAGE_PREFIX}${shopId}`;
    localStorage.setItem(key, JSON.stringify(categories));
  },

  /** Finds an existing category by name (case-insensitive), or creates it if not found. */
  getOrCreateByName(shopId: string, name: string): Category {
    const categories = this.getCategories(shopId);
    const normalized = name.trim();
    const existing = categories.find(
      (c) => c.name.toLowerCase() === normalized.toLowerCase()
    );
    if (existing) return existing;

    const newCat: Category = {
      id: `cat-${shopId}-${Date.now()}`,
      shopId,
      name: normalized,
      description: "",
      createdAt: new Date().toISOString(),
    };
    categories.push(newCat);
    this.saveCategories(shopId, categories);
    return newCat;
  },
};
