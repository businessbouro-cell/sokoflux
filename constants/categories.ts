import type { ProductCategory } from "@/types";

export const PRODUCT_CATEGORIES: { value: ProductCategory; label: string; icon: string }[] = [
  { value: "ELECTRONICS", label: "Électronique", icon: "📱" },
  { value: "TEXTILE_FASHION", label: "Textile & Mode", icon: "👗" },
  { value: "FOOD_BEVERAGE", label: "Alimentation", icon: "🍎" },
  { value: "COSMETICS_BEAUTY", label: "Cosmétiques & Beauté", icon: "💄" },
  { value: "HOME_FURNITURE", label: "Maison & Mobilier", icon: "🛋️" },
  { value: "CONSTRUCTION", label: "Construction", icon: "🔨" },
  { value: "VEHICLES_PARTS", label: "Véhicules & Pièces", icon: "🚗" },
  { value: "AGRICULTURE", label: "Agriculture", icon: "🌱" },
  { value: "HEALTH_PHARMACY", label: "Santé & Pharmacie", icon: "💊" },
  { value: "TOYS_GAMES", label: "Jouets & Jeux", icon: "🎮" },
  { value: "SPORTS", label: "Sports", icon: "⚽" },
  { value: "STATIONERY", label: "Papeterie", icon: "📚" },
  { value: "SECOND_HAND", label: "Occasion", icon: "♻️" },
  { value: "OTHER", label: "Autre", icon: "📦" },
];

export const CATEGORY_MAP = Object.fromEntries(
  PRODUCT_CATEGORIES.map((c) => [c.value, c.label])
) as Record<ProductCategory, string>;

export const ITEM_CONDITIONS = [
  { value: "NEW_WITH_TAGS", label: "Neuf avec étiquette", color: "bg-green-100 text-green-800" },
  { value: "LIKE_NEW", label: "Comme neuf", color: "bg-emerald-100 text-emerald-800" },
  { value: "GOOD", label: "Bon état", color: "bg-blue-100 text-blue-800" },
  { value: "ACCEPTABLE", label: "État correct", color: "bg-yellow-100 text-yellow-800" },
  { value: "WORN", label: "Usé", color: "bg-gray-100 text-gray-600" },
] as const;

export const SHIPPING_TYPES = [
  { value: "LCL", label: "Groupage (LCL)" },
  { value: "FCL20", label: "Conteneur 20 pieds" },
  { value: "FCL40", label: "Conteneur 40 pieds" },
  { value: "AIR", label: "Fret aérien" },
] as const;

export const CHINESE_CITIES = [
  "Guangzhou",
  "Yiwu",
  "Shenzhen",
  "Shanghai",
  "Beijing",
  "Ningbo",
  "Foshan",
];
