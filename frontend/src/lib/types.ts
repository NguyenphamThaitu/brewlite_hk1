export type Product = {
  id: number;
  name: string;
  price: number;
  imageUrl: string;
  stock: number;
};

export type Ingredient = {
  id: number;
  name: string;
  unit: string;
  stock: number;
  reservedQty: number;
  availableQty: number;
  lowStockThreshold: number;
  isLowStock: boolean;
};

export type ForecastIngredient = {
  ingredientId: number;
  ingredientName: string;
  unit: string;
  required: number;
  stock: number;
  reserved: number;
  available: number;
  shortage: number;
  projectedRemaining: number;
  canFulfill: boolean;
};

export type ForecastResult = {
  canFulfillAll: boolean;
  ingredients: ForecastIngredient[];
};

export type DailyReportRow = {
  ingredientId: number;
  ingredientName: string;
  unit: string;
  openingBalance: number;
  receipts: number;
  consumption: number;
  adjustments: number;
  closingBalance: number;
  currentPhysicalStock: number;
  currentReserved: number;
  currentAvailable: number;
  isReconciled: boolean;
};

export type DailyReport = {
  date: string;
  timezone: string;
  generatedAt: string;
  rows: DailyReportRow[];
};

export type RecipeItemView = {
  id: number;
  size: string;
  ingredientId: number;
  ingredientName: string;
  unit: string;
  amount: number;
};

export type ProductWithRecipes = {
  id: number;
  name: string;
  recipes: RecipeItemView[];
};

export type ToppingRecipeView = {
  id: number;
  toppingName: string;
  ingredientId: number;
  ingredientName: string;
  unit: string;
  amount: number;
};

export type AllRecipes = {
  products: ProductWithRecipes[];
  toppings: ToppingRecipeView[];
};

export type VariantAvailability = {
  available: boolean;
  isolatedAvailableCups: number;
  limitingIngredient?: string;
  note: string;
};