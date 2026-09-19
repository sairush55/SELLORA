import { Product, ProductInput, StockHealthStatus } from "@/types/inventory";
import { categoryService } from "./categoryService";
import { supplierService } from "./supplierService";
import { notifyDataRefresh } from "@/hooks/useDataRefresh";
import { isDemoShop } from "./shopService";


const PRODUCTS_STORAGE_PREFIX = "sellora_products_";

export function calculateProductStatus(currentStock: number, minStock: number): StockHealthStatus {
  if (currentStock <= 0) return "out_of_stock";
  if (currentStock <= minStock) return "low_stock";
  if (minStock > 0 && currentStock >= minStock * 4) return "overstocked";
  return "healthy";
}

const DEFAULT_PRODUCTS: Array<Omit<Product, "id" | "shopId" | "createdAt" | "updatedAt">> = [
  // Fast-Moving & Core Staples
  {
    name: "Aashirvaad Shudh Chakki Atta 10kg",
    sku: "ATT-10K-01",
    categoryId: "cat-default-8",
    categoryName: "Staples & Grains",
    sellingPrice: 435,
    costPrice: 380,
    openingStock: 30,
    currentStock: 4, // Critical stock
    minStock: 15,
    supplierId: "sup-default-1",
    supplierName: "Apex FMCG Distributors",
    supplierLeadTime: 2,
    minOrderQuantity: 10,
    unit: "Bags",
    imageUrl: "https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=150&auto=format&fit=crop&q=80",
    status: "low_stock",
  },
  {
    name: "Tata Salt Vacuum Evaporated 1kg",
    sku: "SLT-01K-02",
    categoryId: "cat-default-1",
    categoryName: "Groceries",
    sellingPrice: 28,
    costPrice: 23,
    openingStock: 60,
    currentStock: 6, // Low stock
    minStock: 24,
    supplierId: "sup-default-2",
    supplierName: "Bharat Wholesale Traders",
    supplierLeadTime: 1,
    minOrderQuantity: 25,
    unit: "Pks",
    imageUrl: "https://images.unsplash.com/photo-1518110925495-5fe2fda0442c?w=150&auto=format&fit=crop&q=80",
    status: "low_stock",
  },
  {
    name: "Fortune Sunlite Refined Sunflower Oil 1L",
    sku: "OIL-01L-03",
    categoryId: "cat-default-7",
    categoryName: "Edible Oils",
    sellingPrice: 145,
    costPrice: 125,
    openingStock: 50,
    currentStock: 12,
    minStock: 30,
    supplierId: "sup-default-1",
    supplierName: "Apex FMCG Distributors",
    supplierLeadTime: 2,
    minOrderQuantity: 15,
    unit: "Pouches",
    imageUrl: "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=150&auto=format&fit=crop&q=80",
    status: "low_stock",
  },
  {
    name: "Amul Pasteurised Butter 500g",
    sku: "BTR-05K-04",
    categoryId: "cat-default-6",
    categoryName: "Dairy & Chilled",
    sellingPrice: 275,
    costPrice: 235,
    openingStock: 40,
    currentStock: 2, // Critical risk
    minStock: 15,
    supplierId: "sup-default-3",
    supplierName: "Metro Chilled Logistics",
    supplierLeadTime: 2,
    minOrderQuantity: 10,
    unit: "Pks",
    imageUrl: "https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?w=150&auto=format&fit=crop&q=80",
    status: "low_stock",
  },
  {
    name: "Tata Tea Gold Rich Taste 500g",
    sku: "TEA-05K-05",
    categoryId: "cat-default-2",
    categoryName: "Beverages",
    sellingPrice: 300,
    costPrice: 240,
    openingStock: 25,
    currentStock: 3, // Critical
    minStock: 10,
    supplierId: "sup-default-2",
    supplierName: "Bharat Wholesale Traders",
    supplierLeadTime: 3,
    minOrderQuantity: 10,
    unit: "Pks",
    imageUrl: "https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=150&auto=format&fit=crop&q=80",
    status: "low_stock",
  },
  {
    name: "Maggi 2-Minute Masala Noodles 12-Pack",
    sku: "MAG-12P-06",
    categoryId: "cat-default-5",
    categoryName: "Snacks",
    sellingPrice: 160,
    costPrice: 135,
    openingStock: 35,
    currentStock: 24,
    minStock: 12,
    supplierId: "sup-default-1",
    supplierName: "Apex FMCG Distributors",
    supplierLeadTime: 2,
    minOrderQuantity: 12,
    unit: "Pks",
    imageUrl: "https://images.unsplash.com/photo-1612927601601-6638404737ce?w=150&auto=format&fit=crop&q=80",
    status: "healthy",
  },
  {
    name: "Surf Excel Easy Wash Detergent 1kg",
    sku: "DET-01K-07",
    categoryId: "cat-default-4",
    categoryName: "Household",
    sellingPrice: 140,
    costPrice: 118,
    openingStock: 30,
    currentStock: 14,
    minStock: 20,
    supplierId: "sup-default-4",
    supplierName: "Hindustan Retail Direct",
    supplierLeadTime: 3,
    minOrderQuantity: 20,
    unit: "Pks",
    imageUrl: "https://images.unsplash.com/photo-1583947215259-38e31be8751f?w=150&auto=format&fit=crop&q=80",
    status: "low_stock",
  },
  {
    name: "Specialty Organic Quinoa Seeds 500g",
    sku: "QUI-05K-08",
    categoryId: "cat-default-8",
    categoryName: "Staples & Grains",
    sellingPrice: 400,
    costPrice: 320,
    openingStock: 20,
    currentStock: 17, // Slow-moving / overstock
    minStock: 4,
    supplierId: "sup-default-2",
    supplierName: "Bharat Wholesale Traders",
    supplierLeadTime: 2,
    minOrderQuantity: 5,
    unit: "Pks",
    imageUrl: "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=150&auto=format&fit=crop&q=80",
    status: "overstocked",
  },
  // Out of Stock Products
  {
    name: "Britannia 100% Whole Wheat Bread 400g",
    sku: "BRD-400-09",
    categoryId: "cat-default-6",
    categoryName: "Dairy & Chilled",
    sellingPrice: 50,
    costPrice: 40,
    openingStock: 30,
    currentStock: 0, // OUT OF STOCK
    minStock: 15,
    supplierId: "sup-default-3",
    supplierName: "Metro Chilled Logistics",
    supplierLeadTime: 1,
    minOrderQuantity: 20,
    unit: "Pks",
    imageUrl: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=150&auto=format&fit=crop&q=80",
    status: "out_of_stock",
  },
  {
    name: "Nescafe Classic Instant Coffee 100g Jar",
    sku: "COF-100-10",
    categoryId: "cat-default-2",
    categoryName: "Beverages",
    sellingPrice: 220,
    costPrice: 180,
    openingStock: 25,
    currentStock: 0, // OUT OF STOCK
    minStock: 10,
    supplierId: "sup-default-1",
    supplierName: "Apex FMCG Distributors",
    supplierLeadTime: 3,
    minOrderQuantity: 10,
    unit: "Jars",
    imageUrl: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=150&auto=format&fit=crop&q=80",
    status: "out_of_stock",
  },
  // Fast Moving Essentials
  {
    name: "Amul Taaza Homogenised Toned Milk 1L",
    sku: "MLK-01L-11",
    categoryId: "cat-default-6",
    categoryName: "Dairy & Chilled",
    sellingPrice: 72,
    costPrice: 62,
    openingStock: 60,
    currentStock: 18,
    minStock: 30,
    supplierId: "sup-default-3",
    supplierName: "Metro Chilled Logistics",
    supplierLeadTime: 1,
    minOrderQuantity: 30,
    unit: "Tetra",
    imageUrl: "https://images.unsplash.com/photo-1563636619-e9143da7973b?w=150&auto=format&fit=crop&q=80",
    status: "low_stock",
  },
  {
    name: "Daawat Rozana Super Basmati Rice 5kg",
    sku: "RIC-05K-12",
    categoryId: "cat-default-8",
    categoryName: "Staples & Grains",
    sellingPrice: 380,
    costPrice: 320,
    openingStock: 40,
    currentStock: 22,
    minStock: 15,
    supplierId: "sup-default-2",
    supplierName: "Bharat Wholesale Traders",
    supplierLeadTime: 2,
    minOrderQuantity: 10,
    unit: "Bags",
    imageUrl: "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=150&auto=format&fit=crop&q=80",
    status: "healthy",
  },
  {
    name: "Madhur Pure & Hygienic Sugar 1kg",
    sku: "SGR-01K-13",
    categoryId: "cat-default-1",
    categoryName: "Groceries",
    sellingPrice: 52,
    costPrice: 44,
    openingStock: 50,
    currentStock: 35,
    minStock: 20,
    supplierId: "sup-default-2",
    supplierName: "Bharat Wholesale Traders",
    supplierLeadTime: 1,
    minOrderQuantity: 25,
    unit: "Pks",
    imageUrl: "https://images.unsplash.com/photo-1622484212850-cab596d744f4?w=150&auto=format&fit=crop&q=80",
    status: "healthy",
  },
  {
    name: "Parle-G Original Glucose Biscuits 800g",
    sku: "PAR-800-14",
    categoryId: "cat-default-5",
    categoryName: "Snacks",
    sellingPrice: 75,
    costPrice: 62,
    openingStock: 45,
    currentStock: 30,
    minStock: 15,
    supplierId: "sup-default-1",
    supplierName: "Apex FMCG Distributors",
    supplierLeadTime: 2,
    minOrderQuantity: 20,
    unit: "Pks",
    imageUrl: "https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=150&auto=format&fit=crop&q=80",
    status: "healthy",
  },
  {
    name: "Kissan Fresh Tomato Ketchup 950g",
    sku: "KIS-950-15",
    categoryId: "cat-default-1",
    categoryName: "Groceries",
    sellingPrice: 135,
    costPrice: 110,
    openingStock: 20,
    currentStock: 2, // Critical
    minStock: 8,
    supplierId: "sup-default-4",
    supplierName: "Hindustan Retail Direct",
    supplierLeadTime: 2,
    minOrderQuantity: 10,
    unit: "Bottles",
    imageUrl: "https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=150&auto=format&fit=crop&q=80",
    status: "low_stock",
  },
  // Overstocked Products (>45 days of supply)
  {
    name: "Colgate Strong Teeth Toothpaste 200g",
    sku: "COL-200-16",
    categoryId: "cat-default-3",
    categoryName: "Personal Care",
    sellingPrice: 110,
    costPrice: 88,
    openingStock: 90,
    currentStock: 85, // Overstock
    minStock: 15,
    supplierId: "sup-default-4",
    supplierName: "Hindustan Retail Direct",
    supplierLeadTime: 2,
    minOrderQuantity: 20,
    unit: "Tubes",
    imageUrl: "https://images.unsplash.com/photo-1559599101-f09722fb4948?w=150&auto=format&fit=crop&q=80",
    status: "overstocked",
  },
  {
    name: "Dettol Original Liquid Handwash 750ml Refill",
    sku: "DET-750-17",
    categoryId: "cat-default-3",
    categoryName: "Personal Care",
    sellingPrice: 125,
    costPrice: 98,
    openingStock: 65,
    currentStock: 60, // Overstock
    minStock: 12,
    supplierId: "sup-default-4",
    supplierName: "Hindustan Retail Direct",
    supplierLeadTime: 2,
    minOrderQuantity: 15,
    unit: "Pouches",
    imageUrl: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=150&auto=format&fit=crop&q=80",
    status: "overstocked",
  },
  {
    name: "Vim Dishwash Gel Lemon 500ml Bottle",
    sku: "VIM-500-18",
    categoryId: "cat-default-4",
    categoryName: "Household",
    sellingPrice: 105,
    costPrice: 85,
    openingStock: 60,
    currentStock: 55, // Overstock
    minStock: 12,
    supplierId: "sup-default-4",
    supplierName: "Hindustan Retail Direct",
    supplierLeadTime: 2,
    minOrderQuantity: 15,
    unit: "Bottles",
    imageUrl: "https://images.unsplash.com/photo-1585830812416-a6c86bb14576?w=150&auto=format&fit=crop&q=80",
    status: "overstocked",
  },
  // Slow Moving Niche SKUs
  {
    name: "Royal Kashmiri Saffron Mogra 1g",
    sku: "SAF-001-19",
    categoryId: "cat-default-1",
    categoryName: "Groceries",
    sellingPrice: 350,
    costPrice: 280,
    openingStock: 10,
    currentStock: 8, // Slow-moving
    minStock: 2,
    supplierId: "sup-default-2",
    supplierName: "Bharat Wholesale Traders",
    supplierLeadTime: 3,
    minOrderQuantity: 5,
    unit: "Boxes",
    imageUrl: "https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=150&auto=format&fit=crop&q=80",
    status: "healthy",
  },
  {
    name: "Borges Extra Virgin Olive Oil 500ml",
    sku: "BOR-500-20",
    categoryId: "cat-default-7",
    categoryName: "Edible Oils",
    sellingPrice: 550,
    costPrice: 450,
    openingStock: 12,
    currentStock: 9, // Slow-moving
    minStock: 3,
    supplierId: "sup-default-1",
    supplierName: "Apex FMCG Distributors",
    supplierLeadTime: 3,
    minOrderQuantity: 6,
    unit: "Bottles",
    imageUrl: "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=150&auto=format&fit=crop&q=80",
    status: "healthy",
  },
  // Additional Healthy Inventory
  {
    name: "Lay's India's Magic Masala Chips 50g",
    sku: "LAY-050-21",
    categoryId: "cat-default-5",
    categoryName: "Snacks",
    sellingPrice: 20,
    costPrice: 16,
    openingStock: 50,
    currentStock: 42,
    minStock: 20,
    supplierId: "sup-default-1",
    supplierName: "Apex FMCG Distributors",
    supplierLeadTime: 1,
    minOrderQuantity: 24,
    unit: "Pks",
    imageUrl: "https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=150&auto=format&fit=crop&q=80",
    status: "healthy",
  },
  {
    name: "Kurkure Masala Munch 82g",
    sku: "KUR-082-22",
    categoryId: "cat-default-5",
    categoryName: "Snacks",
    sellingPrice: 20,
    costPrice: 16,
    openingStock: 40,
    currentStock: 36,
    minStock: 15,
    supplierId: "sup-default-1",
    supplierName: "Apex FMCG Distributors",
    supplierLeadTime: 1,
    minOrderQuantity: 24,
    unit: "Pks",
    imageUrl: "https://images.unsplash.com/photo-1527515637462-cff94eecc1ac?w=150&auto=format&fit=crop&q=80",
    status: "healthy",
  },
  {
    name: "Good Day Cashew Cookies 600g",
    sku: "GDY-600-23",
    categoryId: "cat-default-5",
    categoryName: "Snacks",
    sellingPrice: 120,
    costPrice: 98,
    openingStock: 35,
    currentStock: 28,
    minStock: 10,
    supplierId: "sup-default-1",
    supplierName: "Apex FMCG Distributors",
    supplierLeadTime: 2,
    minOrderQuantity: 12,
    unit: "Pks",
    imageUrl: "https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=150&auto=format&fit=crop&q=80",
    status: "healthy",
  },
  {
    name: "Saffola Gold Pro Healthy Oil 1L Pouch",
    sku: "SAF-01L-24",
    categoryId: "cat-default-7",
    categoryName: "Edible Oils",
    sellingPrice: 165,
    costPrice: 140,
    openingStock: 30,
    currentStock: 22,
    minStock: 10,
    supplierId: "sup-default-1",
    supplierName: "Apex FMCG Distributors",
    supplierLeadTime: 2,
    minOrderQuantity: 15,
    unit: "Pouches",
    imageUrl: "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=150&auto=format&fit=crop&q=80",
    status: "healthy",
  },
  {
    name: "Brooke Bond Red Label Tea 500g",
    sku: "RED-500-25",
    categoryId: "cat-default-2",
    categoryName: "Beverages",
    sellingPrice: 280,
    costPrice: 230,
    openingStock: 30,
    currentStock: 25,
    minStock: 10,
    supplierId: "sup-default-2",
    supplierName: "Bharat Wholesale Traders",
    supplierLeadTime: 2,
    minOrderQuantity: 10,
    unit: "Pks",
    imageUrl: "https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=150&auto=format&fit=crop&q=80",
    status: "healthy",
  },
  {
    name: "Harpic Power Plus Disinfectant Toilet Cleaner 1L",
    sku: "HAR-01L-26",
    categoryId: "cat-default-4",
    categoryName: "Household",
    sellingPrice: 195,
    costPrice: 160,
    openingStock: 35,
    currentStock: 30,
    minStock: 12,
    supplierId: "sup-default-4",
    supplierName: "Hindustan Retail Direct",
    supplierLeadTime: 2,
    minOrderQuantity: 12,
    unit: "Bottles",
    imageUrl: "https://images.unsplash.com/photo-1585830812416-a6c86bb14576?w=150&auto=format&fit=crop&q=80",
    status: "healthy",
  },
  {
    name: "Dove Deeply Nourishing Body Wash 250ml",
    sku: "DOV-250-27",
    categoryId: "cat-default-3",
    categoryName: "Personal Care",
    sellingPrice: 210,
    costPrice: 170,
    openingStock: 25,
    currentStock: 18,
    minStock: 8,
    supplierId: "sup-default-4",
    supplierName: "Hindustan Retail Direct",
    supplierLeadTime: 3,
    minOrderQuantity: 10,
    unit: "Bottles",
    imageUrl: "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=150&auto=format&fit=crop&q=80",
    status: "healthy",
  },
  {
    name: "Head & Shoulders Anti-Dandruff Shampoo 340ml",
    sku: "HNS-340-28",
    categoryId: "cat-default-3",
    categoryName: "Personal Care",
    sellingPrice: 320,
    costPrice: 260,
    openingStock: 25,
    currentStock: 20,
    minStock: 8,
    supplierId: "sup-default-4",
    supplierName: "Hindustan Retail Direct",
    supplierLeadTime: 3,
    minOrderQuantity: 10,
    unit: "Bottles",
    imageUrl: "https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?w=150&auto=format&fit=crop&q=80",
    status: "healthy",
  },
  {
    name: "Everest Garam Masala 100g Carton",
    sku: "EVE-100-29",
    categoryId: "cat-default-1",
    categoryName: "Groceries",
    sellingPrice: 85,
    costPrice: 70,
    openingStock: 40,
    currentStock: 32,
    minStock: 12,
    supplierId: "sup-default-2",
    supplierName: "Bharat Wholesale Traders",
    supplierLeadTime: 2,
    minOrderQuantity: 20,
    unit: "Boxes",
    imageUrl: "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=150&auto=format&fit=crop&q=80",
    status: "healthy",
  },
  {
    name: "Catch Black Pepper Sprinkler 100g",
    sku: "CAT-100-30",
    categoryId: "cat-default-1",
    categoryName: "Groceries",
    sellingPrice: 95,
    costPrice: 78,
    openingStock: 30,
    currentStock: 26,
    minStock: 10,
    supplierId: "sup-default-2",
    supplierName: "Bharat Wholesale Traders",
    supplierLeadTime: 2,
    minOrderQuantity: 15,
    unit: "Bottles",
    imageUrl: "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=150&auto=format&fit=crop&q=80",
    status: "healthy",
  },
];

const KUMAR_MART_PRODUCTS: Array<Omit<Product, "id" | "shopId" | "createdAt" | "updatedAt">> = [
  {
    name: "Parle-G Gold Glucose Biscuits 1kg",
    sku: "PAR-GLD-01",
    categoryId: "cat-km-1",
    categoryName: "Confectionery & Sweets",
    sellingPrice: 140,
    costPrice: 115,
    openingStock: 60,
    currentStock: 8,
    minStock: 25,
    supplierId: "sup-km-1",
    supplierName: "Britannia Logistics Hub",
    supplierLeadTime: 2,
    minOrderQuantity: 15,
    unit: "Pks",
    imageUrl: "https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=150&auto=format&fit=crop&q=80",
    status: "low_stock",
  },
  {
    name: "Britannia Bourbon Chocolate Cream Biscuits 400g",
    sku: "BRT-BRB-02",
    categoryId: "cat-km-1",
    categoryName: "Confectionery & Sweets",
    sellingPrice: 85,
    costPrice: 68,
    openingStock: 40,
    currentStock: 32,
    minStock: 15,
    supplierId: "sup-km-1",
    supplierName: "Britannia Logistics Hub",
    supplierLeadTime: 2,
    minOrderQuantity: 12,
    unit: "Pks",
    imageUrl: "https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=150&auto=format&fit=crop&q=80",
    status: "healthy",
  },
  {
    name: "Thums Up Charged Carbonated Beverage 2.25L",
    sku: "THU-225-03",
    categoryId: "cat-km-2",
    categoryName: "Beverages & Drinks",
    sellingPrice: 95,
    costPrice: 78,
    openingStock: 50,
    currentStock: 3,
    minStock: 20,
    supplierId: "sup-km-3",
    supplierName: "PepsiCo & Varun Beverages",
    supplierLeadTime: 1,
    minOrderQuantity: 24,
    unit: "Bottles",
    imageUrl: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=150&auto=format&fit=crop&q=80",
    status: "low_stock",
  },
  {
    name: "Frooti Fresh Mango Drink 1.2L Bottle",
    sku: "FRO-120-04",
    categoryId: "cat-km-2",
    categoryName: "Beverages & Drinks",
    sellingPrice: 75,
    costPrice: 60,
    openingStock: 45,
    currentStock: 28,
    minStock: 15,
    supplierId: "sup-km-2",
    supplierName: "Parle Agro Direct Distributors",
    supplierLeadTime: 1,
    minOrderQuantity: 20,
    unit: "Bottles",
    imageUrl: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=150&auto=format&fit=crop&q=80",
    status: "healthy",
  },
  {
    name: "Lay's India's Magic Masala Potato Chips 52g",
    sku: "LAY-052-05",
    categoryId: "cat-km-3",
    categoryName: "Snacks & Namkeen",
    sellingPrice: 20,
    costPrice: 16,
    openingStock: 120,
    currentStock: 14,
    minStock: 40,
    supplierId: "sup-km-3",
    supplierName: "PepsiCo & Varun Beverages",
    supplierLeadTime: 1,
    minOrderQuantity: 48,
    unit: "Pouches",
    imageUrl: "https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=150&auto=format&fit=crop&q=80",
    status: "low_stock",
  },
  {
    name: "Kurkure Masala Munch Crisps 90g",
    sku: "KUR-090-06",
    categoryId: "cat-km-3",
    categoryName: "Snacks & Namkeen",
    sellingPrice: 20,
    costPrice: 16,
    openingStock: 100,
    currentStock: 65,
    minStock: 30,
    supplierId: "sup-km-3",
    supplierName: "PepsiCo & Varun Beverages",
    supplierLeadTime: 1,
    minOrderQuantity: 36,
    unit: "Pouches",
    imageUrl: "https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=150&auto=format&fit=crop&q=80",
    status: "healthy",
  },
  {
    name: "Cadbury Dairy Milk Silk Chocolate Bar 150g",
    sku: "CAD-SLK-07",
    categoryId: "cat-km-1",
    categoryName: "Confectionery & Sweets",
    sellingPrice: 180,
    costPrice: 150,
    openingStock: 35,
    currentStock: 2,
    minStock: 12,
    supplierId: "sup-km-2",
    supplierName: "Parle Agro Direct Distributors",
    supplierLeadTime: 2,
    minOrderQuantity: 12,
    unit: "Bars",
    imageUrl: "https://images.unsplash.com/photo-1549007994-cb92caebd54b?w=150&auto=format&fit=crop&q=80",
    status: "low_stock",
  },
  {
    name: "Oreo Original Vanilla Cream Sandwich 300g",
    sku: "ORE-300-08",
    categoryId: "cat-km-1",
    categoryName: "Confectionery & Sweets",
    sellingPrice: 85,
    costPrice: 70,
    openingStock: 40,
    currentStock: 30,
    minStock: 15,
    supplierId: "sup-km-1",
    supplierName: "Britannia Logistics Hub",
    supplierLeadTime: 2,
    minOrderQuantity: 16,
    unit: "Pks",
    imageUrl: "https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=150&auto=format&fit=crop&q=80",
    status: "healthy",
  },
  {
    name: "Sting Energy Drink Gold Rush 250ml Can",
    sku: "STG-250-09",
    categoryId: "cat-km-2",
    categoryName: "Beverages & Drinks",
    sellingPrice: 20,
    costPrice: 16,
    openingStock: 120,
    currentStock: 0,
    minStock: 30,
    supplierId: "sup-km-3",
    supplierName: "PepsiCo & Varun Beverages",
    supplierLeadTime: 1,
    minOrderQuantity: 48,
    unit: "Cans",
    imageUrl: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=150&auto=format&fit=crop&q=80",
    status: "out_of_stock",
  },
  {
    name: "Red Bull Energy Drink 250ml Premium Can",
    sku: "RDB-250-10",
    categoryId: "cat-km-2",
    categoryName: "Beverages & Drinks",
    sellingPrice: 125,
    costPrice: 102,
    openingStock: 48,
    currentStock: 40,
    minStock: 12,
    supplierId: "sup-km-3",
    supplierName: "PepsiCo & Varun Beverages",
    supplierLeadTime: 2,
    minOrderQuantity: 24,
    unit: "Cans",
    imageUrl: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=150&auto=format&fit=crop&q=80",
    status: "healthy",
  },
  {
    name: "Doritos Sweet Chilli Nachos 100g Bag",
    sku: "DOR-100-11",
    categoryId: "cat-km-3",
    categoryName: "Snacks & Namkeen",
    sellingPrice: 50,
    costPrice: 40,
    openingStock: 35,
    currentStock: 25,
    minStock: 10,
    supplierId: "sup-km-3",
    supplierName: "PepsiCo & Varun Beverages",
    supplierLeadTime: 1,
    minOrderQuantity: 20,
    unit: "Bags",
    imageUrl: "https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=150&auto=format&fit=crop&q=80",
    status: "healthy",
  },
  {
    name: "Haldiram's Nagpur Bhujia Sev 400g",
    sku: "HAL-BHU-12",
    categoryId: "cat-km-3",
    categoryName: "Snacks & Namkeen",
    sellingPrice: 110,
    costPrice: 88,
    openingStock: 45,
    currentStock: 36,
    minStock: 15,
    supplierId: "sup-km-2",
    supplierName: "Parle Agro Direct Distributors",
    supplierLeadTime: 2,
    minOrderQuantity: 15,
    unit: "Pks",
    imageUrl: "https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=150&auto=format&fit=crop&q=80",
    status: "healthy",
  },
  {
    name: "Tropicana 100% Real Mixed Fruit Juice 1L",
    sku: "TRP-MIX-13",
    categoryId: "cat-km-2",
    categoryName: "Beverages & Drinks",
    sellingPrice: 130,
    costPrice: 108,
    openingStock: 30,
    currentStock: 18,
    minStock: 10,
    supplierId: "sup-km-3",
    supplierName: "PepsiCo & Varun Beverages",
    supplierLeadTime: 1,
    minOrderQuantity: 12,
    unit: "Tetra",
    imageUrl: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=150&auto=format&fit=crop&q=80",
    status: "healthy",
  },
  {
    name: "Harpic Power Plus Disinfectant Toilet Cleaner 1L",
    sku: "HAR-100-14",
    categoryId: "cat-km-5",
    categoryName: "Household Cleaning",
    sellingPrice: 195,
    costPrice: 160,
    openingStock: 35,
    currentStock: 30,
    minStock: 10,
    supplierId: "sup-km-4",
    supplierName: "Hindustan Consumer Direct",
    supplierLeadTime: 3,
    minOrderQuantity: 12,
    unit: "Bottles",
    imageUrl: "https://images.unsplash.com/photo-1583947215259-38e31be8751f?w=150&auto=format&fit=crop&q=80",
    status: "healthy",
  },
  {
    name: "Colgate MaxFresh Peppermint Ice Gel Toothpaste 150g",
    sku: "COL-MAX-15",
    categoryId: "cat-km-4",
    categoryName: "Personal Care",
    sellingPrice: 120,
    costPrice: 98,
    openingStock: 40,
    currentStock: 26,
    minStock: 12,
    supplierId: "sup-km-4",
    supplierName: "Hindustan Consumer Direct",
    supplierLeadTime: 3,
    minOrderQuantity: 15,
    unit: "Tubes",
    imageUrl: "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=150&auto=format&fit=crop&q=80",
    status: "healthy",
  },
];

const FRESH_POINT_PRODUCTS: Array<Omit<Product, "id" | "shopId" | "createdAt" | "updatedAt">> = [
  {
    name: "Farm Fresh Malai Paneer 500g Vacuum Pack",
    sku: "FPN-500-01",
    categoryId: "cat-fp-1",
    categoryName: "Farm Fresh Dairy",
    sellingPrice: 220,
    costPrice: 185,
    openingStock: 30,
    currentStock: 4,
    minStock: 15,
    supplierId: "sup-fp-1",
    supplierName: "Nandini Milk & Dairy Federation",
    supplierLeadTime: 1,
    minOrderQuantity: 12,
    unit: "Pks",
    imageUrl: "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=150&auto=format&fit=crop&q=80",
    status: "low_stock",
  },
  {
    name: "Amul Pure Traditional Desi Ghee 1L Tin",
    sku: "AMG-01L-02",
    categoryId: "cat-fp-1",
    categoryName: "Farm Fresh Dairy",
    sellingPrice: 640,
    costPrice: 560,
    openingStock: 25,
    currentStock: 18,
    minStock: 8,
    supplierId: "sup-fp-1",
    supplierName: "Nandini Milk & Dairy Federation",
    supplierLeadTime: 1,
    minOrderQuantity: 8,
    unit: "Tins",
    imageUrl: "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=150&auto=format&fit=crop&q=80",
    status: "healthy",
  },
  {
    name: "Farm-to-Table Organic Brown Free-Range Eggs (6 pack)",
    sku: "EGG-006-03",
    categoryId: "cat-fp-5",
    categoryName: "Artisanal Breakfast",
    sellingPrice: 85,
    costPrice: 65,
    openingStock: 40,
    currentStock: 5,
    minStock: 20,
    supplierId: "sup-fp-3",
    supplierName: "Pure Origins Farm Logistics",
    supplierLeadTime: 2,
    minOrderQuantity: 18,
    unit: "Boxes",
    imageUrl: "https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=150&auto=format&fit=crop&q=80",
    status: "low_stock",
  },
  {
    name: "Epigamia Natural High-Protein Greek Yogurt 400g",
    sku: "EPG-400-04",
    categoryId: "cat-fp-1",
    categoryName: "Farm Fresh Dairy",
    sellingPrice: 150,
    costPrice: 120,
    openingStock: 28,
    currentStock: 22,
    minStock: 10,
    supplierId: "sup-fp-1",
    supplierName: "Nandini Milk & Dairy Federation",
    supplierLeadTime: 1,
    minOrderQuantity: 10,
    unit: "Tubs",
    imageUrl: "https://images.unsplash.com/photo-1488477181946-6428a0291777?w=150&auto=format&fit=crop&q=80",
    status: "healthy",
  },
  {
    name: "Organic Wild Forest Raw Unpasteurized Honey 500g",
    sku: "HNY-500-05",
    categoryId: "cat-fp-4",
    categoryName: "Health & Superfoods",
    sellingPrice: 420,
    costPrice: 330,
    openingStock: 20,
    currentStock: 14,
    minStock: 6,
    supplierId: "sup-fp-3",
    supplierName: "Pure Origins Farm Logistics",
    supplierLeadTime: 2,
    minOrderQuantity: 8,
    unit: "Jars",
    imageUrl: "https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=150&auto=format&fit=crop&q=80",
    status: "healthy",
  },
  {
    name: "Country Delight Pure Buffalo Whole Milk 1L",
    sku: "CDM-01L-06",
    categoryId: "cat-fp-1",
    categoryName: "Farm Fresh Dairy",
    sellingPrice: 88,
    costPrice: 72,
    openingStock: 50,
    currentStock: 0,
    minStock: 25,
    supplierId: "sup-fp-1",
    supplierName: "Nandini Milk & Dairy Federation",
    supplierLeadTime: 1,
    minOrderQuantity: 30,
    unit: "Bottles",
    imageUrl: "https://images.unsplash.com/photo-1563636619-e9143da7973b?w=150&auto=format&fit=crop&q=80",
    status: "out_of_stock",
  },
  {
    name: "Nandini Standardized Pasteurized Fresh Milk 500ml",
    sku: "NAN-500-07",
    categoryId: "cat-fp-1",
    categoryName: "Farm Fresh Dairy",
    sellingPrice: 27,
    costPrice: 23,
    openingStock: 80,
    currentStock: 48,
    minStock: 30,
    supplierId: "sup-fp-1",
    supplierName: "Nandini Milk & Dairy Federation",
    supplierLeadTime: 1,
    minOrderQuantity: 40,
    unit: "Pouches",
    imageUrl: "https://images.unsplash.com/photo-1563636619-e9143da7973b?w=150&auto=format&fit=crop&q=80",
    status: "healthy",
  },
  {
    name: "Milky Mist Natural Fresh Cooking Curd 1kg",
    sku: "MMK-01K-08",
    categoryId: "cat-fp-1",
    categoryName: "Farm Fresh Dairy",
    sellingPrice: 90,
    costPrice: 74,
    openingStock: 35,
    currentStock: 25,
    minStock: 12,
    supplierId: "sup-fp-1",
    supplierName: "Nandini Milk & Dairy Federation",
    supplierLeadTime: 1,
    minOrderQuantity: 15,
    unit: "Tubs",
    imageUrl: "https://images.unsplash.com/photo-1488477181946-6428a0291777?w=150&auto=format&fit=crop&q=80",
    status: "healthy",
  },
  {
    name: "Organic Tattva 100% Rolled Oats 1kg",
    sku: "TTV-OTS-09",
    categoryId: "cat-fp-2",
    categoryName: "Organic Staples & Grains",
    sellingPrice: 260,
    costPrice: 210,
    openingStock: 30,
    currentStock: 6,
    minStock: 15,
    supplierId: "sup-fp-2",
    supplierName: "Organic Tattva Wholesale Hub",
    supplierLeadTime: 2,
    minOrderQuantity: 10,
    unit: "Pks",
    imageUrl: "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=150&auto=format&fit=crop&q=80",
    status: "low_stock",
  },
  {
    name: "24 Mantra Organic Chemical-Free Jaggery Powder 500g",
    sku: "MNT-JAG-10",
    categoryId: "cat-fp-2",
    categoryName: "Organic Staples & Grains",
    sellingPrice: 75,
    costPrice: 58,
    openingStock: 40,
    currentStock: 32,
    minStock: 12,
    supplierId: "sup-fp-2",
    supplierName: "Organic Tattva Wholesale Hub",
    supplierLeadTime: 2,
    minOrderQuantity: 15,
    unit: "Pks",
    imageUrl: "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=150&auto=format&fit=crop&q=80",
    status: "healthy",
  },
  {
    name: "Organic Roasted Golden Flax Seeds 250g",
    sku: "FLX-250-11",
    categoryId: "cat-fp-4",
    categoryName: "Health & Superfoods",
    sellingPrice: 110,
    costPrice: 85,
    openingStock: 30,
    currentStock: 24,
    minStock: 10,
    supplierId: "sup-fp-3",
    supplierName: "Pure Origins Farm Logistics",
    supplierLeadTime: 2,
    minOrderQuantity: 12,
    unit: "Jars",
    imageUrl: "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=150&auto=format&fit=crop&q=80",
    status: "healthy",
  },
  {
    name: "Cold Pressed Extra Virgin Olive Oil 500ml Glass Bottle",
    sku: "OLI-500-12",
    categoryId: "cat-fp-3",
    categoryName: "Cold Pressed Oils",
    sellingPrice: 580,
    costPrice: 470,
    openingStock: 20,
    currentStock: 16,
    minStock: 6,
    supplierId: "sup-fp-3",
    supplierName: "Pure Origins Farm Logistics",
    supplierLeadTime: 2,
    minOrderQuantity: 6,
    unit: "Bottles",
    imageUrl: "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=150&auto=format&fit=crop&q=80",
    status: "healthy",
  },
  {
    name: "Artisanal Stoneground Country Sourdough Loaf 400g",
    sku: "SDR-400-13",
    categoryId: "cat-fp-5",
    categoryName: "Artisanal Breakfast",
    sellingPrice: 140,
    costPrice: 105,
    openingStock: 25,
    currentStock: 3,
    minStock: 10,
    supplierId: "sup-fp-4",
    supplierName: "Artisan Bakers Alliance",
    supplierLeadTime: 1,
    minOrderQuantity: 8,
    unit: "Loaves",
    imageUrl: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=150&auto=format&fit=crop&q=80",
    status: "low_stock",
  },
  {
    name: "Raw Organic Nutrient-Dense Chia Seeds 200g",
    sku: "CHA-200-14",
    categoryId: "cat-fp-4",
    categoryName: "Health & Superfoods",
    sellingPrice: 145,
    costPrice: 112,
    openingStock: 35,
    currentStock: 28,
    minStock: 10,
    supplierId: "sup-fp-3",
    supplierName: "Pure Origins Farm Logistics",
    supplierLeadTime: 2,
    minOrderQuantity: 10,
    unit: "Pouches",
    imageUrl: "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=150&auto=format&fit=crop&q=80",
    status: "healthy",
  },
  {
    name: "Stoneground 100% Raw Unsweetened Almond Butter 200g",
    sku: "ALM-200-15",
    categoryId: "cat-fp-5",
    categoryName: "Artisanal Breakfast",
    sellingPrice: 380,
    costPrice: 310,
    openingStock: 20,
    currentStock: 15,
    minStock: 6,
    supplierId: "sup-fp-4",
    supplierName: "Artisan Bakers Alliance",
    supplierLeadTime: 1,
    minOrderQuantity: 6,
    unit: "Jars",
    imageUrl: "https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=150&auto=format&fit=crop&q=80",
    status: "healthy",
  },
];

export interface ProductFilterOptions {
  search?: string;
  categoryId?: string;
  supplierId?: string;
  status?: string;
  sortBy?: "name" | "currentStock" | "sellingPrice" | "createdAt";
  sortOrder?: "asc" | "desc";
}

export const productService = {
  getProducts(shopId: string, options?: ProductFilterOptions): Product[] {
    if (typeof window === "undefined") return [];
    const key = `${PRODUCTS_STORAGE_PREFIX}${shopId}`;
    const stored = localStorage.getItem(key);

    let products: Product[] = [];

    if (stored) {
      try {
        products = JSON.parse(stored);
      } catch {
        products = [];
      }
    }

    // Determine catalog template and expected count based on shopId
    let template = DEFAULT_PRODUCTS;
    let minExpected = 25;
    if (shopId === "shop-kumar-mart") {
      template = KUMAR_MART_PRODUCTS;
      minExpected = 15;
    } else if (shopId === "shop-fresh-point") {
      template = FRESH_POINT_PRODUCTS;
      minExpected = 15;
    }

    // Seed or upgrade to the dedicated catalog — demo tenants only.
    // Real merchant accounts must start completely empty.
    if (!isDemoShop(shopId)) {
      // Non-demo shop: never auto-seed
    } else if (!products || products.length < minExpected) {
      const categories = categoryService.getCategories(shopId);
      const suppliers = supplierService.getSuppliers(shopId);

      products = template.map((p, index) => {
        const matchedCat = categories.find((c) => c.name === p.categoryName) || categories[0];
        const matchedSup = suppliers.find((s) => s.name === p.supplierName) || suppliers[0];

        return {
          ...p,
          id: `prod-${shopId}-${index + 1}`,
          shopId,
          categoryId: matchedCat ? matchedCat.id : `cat-${shopId}-1`,
          categoryName: matchedCat ? matchedCat.name : p.categoryName,
          supplierId: matchedSup ? matchedSup.id : `sup-${shopId}-1`,
          supplierName: matchedSup ? matchedSup.name : p.supplierName,
          status: calculateProductStatus(p.currentStock, p.minStock),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
      });

      this.saveProducts(shopId, products);
    }

    // Apply filtering
    if (options?.search) {
      const q = options.search.toLowerCase().trim();
      products = products.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q) ||
          (p.categoryName && p.categoryName.toLowerCase().includes(q)) ||
          (p.supplierName && p.supplierName.toLowerCase().includes(q))
      );
    }

    if (options?.categoryId && options.categoryId !== "all") {
      products = products.filter((p) => p.categoryId === options.categoryId);
    }

    if (options?.supplierId && options.supplierId !== "all") {
      products = products.filter((p) => p.supplierId === options.supplierId);
    }

    if (options?.status && options.status !== "all") {
      products = products.filter((p) => p.status === options.status);
    }

    // Apply sorting
    const sortBy = options?.sortBy || "name";
    const sortOrder = options?.sortOrder || "asc";

    products.sort((a, b) => {
      let valA: any = a[sortBy];
      let valB: any = b[sortBy];

      if (typeof valA === "string") {
        const comp = valA.localeCompare(valB as string);
        return sortOrder === "asc" ? comp : -comp;
      }
      if (typeof valA === "number") {
        return sortOrder === "asc" ? valA - valB : valB - valA;
      }
      return 0;
    });

    return products;
  },

  getProductById(shopId: string, id: string): Product | null {
    const products = this.getProducts(shopId);
    return products.find((p) => p.id === id) || null;
  },

  createProduct(shopId: string, input: ProductInput): { product: Product | null; error?: string } {
    const products = this.getProducts(shopId);
    const sku = input.sku.trim().toUpperCase();

    if (!input.name.trim()) {
      return { product: null, error: "Product name is required" };
    }
    if (!sku) {
      return { product: null, error: "SKU is required" };
    }

    // Validate SKU uniqueness within the shop
    const duplicateSku = products.some((p) => p.sku.toUpperCase() === sku);
    if (duplicateSku) {
      return { product: null, error: `SKU "${sku}" is already assigned to another product in this shop` };
    }

    // Resolve category and supplier names
    const categories = categoryService.getCategories(shopId);
    const suppliers = supplierService.getSuppliers(shopId);

    const category = categories.find((c) => c.id === input.categoryId);
    const supplier = suppliers.find((s) => s.id === input.supplierId);

    const openingStock = Number(input.openingStock) || 0;
    const currentStock = input.currentStock !== undefined ? Number(input.currentStock) : openingStock;
    const minStock = Number(input.minStock) || 10;

    const newProduct: Product = {
      id: `prod-${shopId}-${Date.now()}`,
      shopId,
      name: input.name.trim(),
      sku,
      categoryId: input.categoryId,
      categoryName: category?.name || "General",
      sellingPrice: Number(input.sellingPrice) || 0,
      costPrice: Number(input.costPrice) || 0,
      openingStock,
      currentStock,
      minStock,
      supplierId: input.supplierId,
      supplierName: supplier?.name,
      supplierLeadTime: Number(input.supplierLeadTime) || 2,
      minOrderQuantity: Number(input.minOrderQuantity) || 1,
      unit: input.unit || "Pcs",
      imageUrl: input.imageUrl?.trim(),
      status: calculateProductStatus(currentStock, minStock),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    products.push(newProduct);
    this.saveProducts(shopId, products);
    notifyDataRefresh("product_updated", { productId: newProduct.id });
    return { product: newProduct };
  },

  updateProduct(shopId: string, id: string, input: Partial<ProductInput>): { product: Product | null; error?: string } {
    const products = this.getProducts(shopId);
    const index = products.findIndex((p) => p.id === id);

    if (index === -1) {
      return { product: null, error: "Product not found" };
    }

    // If updating SKU, ensure it remains unique
    if (input.sku) {
      const sku = input.sku.trim().toUpperCase();
      const duplicateSku = products.some((p) => p.id !== id && p.sku.toUpperCase() === sku);
      if (duplicateSku) {
        return { product: null, error: `SKU "${sku}" is already assigned to another product` };
      }
    }

    // Resolve category & supplier if changed
    const categories = categoryService.getCategories(shopId);
    const suppliers = supplierService.getSuppliers(shopId);

    const categoryId = input.categoryId || products[index].categoryId;
    const supplierId = input.supplierId || products[index].supplierId;

    const category = categories.find((c) => c.id === categoryId);
    const supplier = suppliers.find((s) => s.id === supplierId);

    const currentStock = input.currentStock !== undefined ? Number(input.currentStock) : products[index].currentStock;
    const minStock = input.minStock !== undefined ? Number(input.minStock) : products[index].minStock;

    products[index] = {
      ...products[index],
      ...input,
      categoryId,
      categoryName: category?.name || products[index].categoryName,
      supplierId,
      supplierName: supplier?.name || products[index].supplierName,
      currentStock,
      minStock,
      status: calculateProductStatus(currentStock, minStock),
      updatedAt: new Date().toISOString(),
    };

    this.saveProducts(shopId, products);
    notifyDataRefresh("product_updated", { productId: id });
    return { product: products[index] };
  },

  deleteProduct(shopId: string, id: string): { success: boolean; error?: string } {
    const products = this.getProducts(shopId);
    const updated = products.filter((p) => p.id !== id);

    if (updated.length === products.length) {
      return { success: false, error: "Product not found" };
    }

    this.saveProducts(shopId, updated);
    notifyDataRefresh("product_updated", { productId: id });
    return { success: true };
  },

  updateStock(shopId: string, id: string, newStock: number): Product | null {
    const products = this.getProducts(shopId);
    const index = products.findIndex((p) => p.id === id);
    if (index === -1) return null;

    products[index].currentStock = newStock;
    products[index].status = calculateProductStatus(newStock, products[index].minStock);
    products[index].updatedAt = new Date().toISOString();

    this.saveProducts(shopId, products);
    notifyDataRefresh("product_updated", { productId: id, newStock });
    return products[index];
  },

  saveProducts(shopId: string, products: Product[]): void {
    if (typeof window === "undefined") return;
    const key = `${PRODUCTS_STORAGE_PREFIX}${shopId}`;
    localStorage.setItem(key, JSON.stringify(products));
  },
};
