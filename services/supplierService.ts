import { Supplier, SupplierInput } from "@/types/inventory";
import { isDemoShop } from "./shopService";

const SUPPLIERS_STORAGE_PREFIX = "sellora_suppliers_";

const SHOP_SUPPLIERS: Record<string, Array<Omit<Supplier, "id" | "shopId" | "createdAt">>> = {
  "shop-ravi-stores": [
    {
      name: "Apex FMCG Distributors",
      phone: "+91 98201 44521",
      email: "ramesh@apexfmcg.in",
      address: "Plot 12, APMC Wholesale Yard, Vashi, Navi Mumbai 400703",
      leadTime: 2,
      minOrderQuantity: 10,
      notes: "Primary supplier for branded atta, pulses, and packaged groceries.",
    },
    {
      name: "Bharat Wholesale Traders",
      phone: "+91 94150 99881",
      email: "orders@bharatwholesale.com",
      address: "45 Commercial Gali, Sadar Bazaar, Delhi 110006",
      leadTime: 1,
      minOrderQuantity: 25,
      notes: "Spices, salt, and loose commodities. Next-day dispatch.",
    },
    {
      name: "Metro Chilled Logistics",
      phone: "+91 98840 12345",
      email: "dairy@metrologistics.in",
      address: "Cold Chain Hub 4, Peenya Industrial Area, Bengaluru 560058",
      leadTime: 1,
      minOrderQuantity: 15,
      notes: "Dairy products, butter, paneer, and frozen items. Daily morning delivery.",
    },
    {
      name: "Hindustan Retail Direct",
      phone: "+91 98111 77665",
      email: "supply@hindustanretail.com",
      address: "B-28 Warehousing Zone, Okhla Phase II, New Delhi 110020",
      leadTime: 3,
      minOrderQuantity: 20,
      notes: "Personal care, soaps, shampoos, and home cleaning supplies.",
    },
  ],
  "shop-kumar-mart": [
    {
      name: "Parle Agro Direct Distributors",
      phone: "+91 98450 33221",
      email: "orders@parleagro-dist.in",
      address: "Warehouse B-14, Hosur Road Logistics Park, Bengaluru 560068",
      leadTime: 1,
      minOrderQuantity: 15,
      notes: "Beverages, Frooti, Appy Fizz, and confectioneries. Fast 24-hr restock.",
    },
    {
      name: "Britannia Logistics Hub",
      phone: "+91 98450 44332",
      email: "supply@britanniahub.in",
      address: "Industrial Suburb, Rajajinagar, Bengaluru 560010",
      leadTime: 2,
      minOrderQuantity: 20,
      notes: "Good Day, Bourbon, Marie Gold, and specialty packaged biscuits.",
    },
    {
      name: "PepsiCo & Varun Beverages",
      phone: "+91 98450 55443",
      email: "sales@varunbev-blr.com",
      address: "Plot 22, Peenya 2nd Stage, Bengaluru 560058",
      leadTime: 1,
      minOrderQuantity: 25,
      notes: "Sting, Mountain Dew, Lay's chips, and Kurkure snacks.",
    },
    {
      name: "Hindustan Consumer Direct",
      phone: "+91 98450 66554",
      email: "orders@hindustanconsumer.in",
      address: "Survey 12, Whitefield Industrial Area, Bengaluru 560066",
      leadTime: 3,
      minOrderQuantity: 10,
      notes: "Harpic, Colgate, soaps, shampoos, and household FMCG items.",
    },
  ],
  "shop-fresh-point": [
    {
      name: "Nandini Milk & Dairy Federation",
      phone: "+91 98452 11223",
      email: "procurement@nandinidairy.coop",
      address: "KMF Complex, Dr. M.H. Marigowda Road, Bengaluru 560029",
      leadTime: 1,
      minOrderQuantity: 10,
      notes: "Fresh whole milk, curds, artisanal paneer, and butter delivered daily at 6 AM.",
    },
    {
      name: "Organic Tattva Wholesale Hub",
      phone: "+91 98452 22334",
      email: "b2b@organictattva.in",
      address: "Unit 5, Agro Eco Park, Doddaballapur, Bengaluru 561203",
      leadTime: 2,
      minOrderQuantity: 12,
      notes: "Certified 100% organic pulses, rolled oats, jaggery, and unrefined grains.",
    },
    {
      name: "Pure Origins Farm Logistics",
      phone: "+91 98452 33445",
      email: "dispatch@pureoriginsfarms.com",
      address: "Greenfield Agri Zone, Nelamangala, Bengaluru 562123",
      leadTime: 2,
      minOrderQuantity: 8,
      notes: "Cold pressed extra virgin oils, raw forest honey, chia seeds, and brown eggs.",
    },
    {
      name: "Artisan Bakers Alliance",
      phone: "+91 98452 44556",
      email: "orders@artisanbakers.in",
      address: "12th Main, HAL 2nd Stage, Indiranagar, Bengaluru 560038",
      leadTime: 1,
      minOrderQuantity: 6,
      notes: "Fresh stoneground sourdough loaves, organic almond butters, and seeded granolas.",
    },
  ],
};

export const supplierService = {
  getSuppliers(shopId: string): Supplier[] {
    if (typeof window === "undefined") return [];
    const key = `${SUPPLIERS_STORAGE_PREFIX}${shopId}`;
    const stored = localStorage.getItem(key);

    if (!stored) {
      // Only seed demo data for dedicated demo tenants.
      // Real merchant accounts start with zero suppliers.
      if (!isDemoShop(shopId)) {
        return [];
      }
      const defaultTemplates = SHOP_SUPPLIERS[shopId] || SHOP_SUPPLIERS["shop-ravi-stores"];
      const seeded: Supplier[] = defaultTemplates.map((s, index) => ({
        id: `sup-${shopId}-${index + 1}`,
        shopId,
        name: s.name,
        phone: s.phone,
        email: s.email,
        address: s.address,
        leadTime: s.leadTime,
        minOrderQuantity: s.minOrderQuantity,
        notes: s.notes,
        createdAt: new Date().toISOString(),
      }));
      this.saveSuppliers(shopId, seeded);
      return seeded;
    }

    try {
      return JSON.parse(stored);
    } catch {
      return [];
    }
  },

  getSupplierById(shopId: string, id: string): Supplier | null {
    const suppliers = this.getSuppliers(shopId);
    return suppliers.find((s) => s.id === id) || null;
  },

  createSupplier(shopId: string, input: SupplierInput): { supplier: Supplier | null; error?: string } {
    const suppliers = this.getSuppliers(shopId);
    const normalizedName = input.name.trim();

    if (!normalizedName) {
      return { supplier: null, error: "Supplier name is required" };
    }
    if (!input.phone.trim()) {
      return { supplier: null, error: "Supplier phone is required" };
    }

    const exists = suppliers.some(
      (s) => s.name.toLowerCase() === normalizedName.toLowerCase()
    );
    if (exists) {
      return { supplier: null, error: `Supplier "${normalizedName}" already exists` };
    }

    const newSupplier: Supplier = {
      id: `sup-${shopId}-${Date.now()}`,
      shopId,
      name: normalizedName,
      phone: input.phone.trim(),
      email: input.email.trim(),
      address: input.address.trim(),
      leadTime: Number(input.leadTime) || 2,
      minOrderQuantity: Number(input.minOrderQuantity) || 1,
      notes: input.notes?.trim(),
      createdAt: new Date().toISOString(),
    };

    suppliers.push(newSupplier);
    this.saveSuppliers(shopId, suppliers);
    return { supplier: newSupplier };
  },

  updateSupplier(shopId: string, id: string, input: SupplierInput): { supplier: Supplier | null; error?: string } {
    const suppliers = this.getSuppliers(shopId);
    const index = suppliers.findIndex((s) => s.id === id);

    if (index === -1) {
      return { supplier: null, error: "Supplier not found" };
    }

    const normalizedName = input.name.trim();
    if (!normalizedName) {
      return { supplier: null, error: "Supplier name cannot be empty" };
    }

    const duplicate = suppliers.some(
      (s) => s.id !== id && s.name.toLowerCase() === normalizedName.toLowerCase()
    );
    if (duplicate) {
      return { supplier: null, error: `Another supplier with name "${normalizedName}" already exists` };
    }

    suppliers[index] = {
      ...suppliers[index],
      name: normalizedName,
      phone: input.phone.trim(),
      email: input.email.trim(),
      address: input.address.trim(),
      leadTime: Number(input.leadTime) || 2,
      minOrderQuantity: Number(input.minOrderQuantity) || 1,
      notes: input.notes?.trim(),
    };

    this.saveSuppliers(shopId, suppliers);
    return { supplier: suppliers[index] };
  },

  deleteSupplier(shopId: string, id: string): { success: boolean; error?: string } {
    const suppliers = this.getSuppliers(shopId);
    const updated = suppliers.filter((s) => s.id !== id);

    if (updated.length === suppliers.length) {
      return { success: false, error: "Supplier not found" };
    }

    this.saveSuppliers(shopId, updated);
    return { success: true };
  },

  saveSuppliers(shopId: string, suppliers: Supplier[]): void {
    if (typeof window === "undefined") return;
    const key = `${SUPPLIERS_STORAGE_PREFIX}${shopId}`;
    localStorage.setItem(key, JSON.stringify(suppliers));
  },
};
