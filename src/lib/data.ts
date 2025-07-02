export type Product = {
  id: string;
  name: string;
  category: string;
  price: number;
  imageUrl: string;
  description: string;
  netWeight?: string;
  ingredients?: string[];
  productionCode?: string;
  expirationDate?: string;
  permitNumber?: string;
  nutritionFacts?: { [key: string]: string };
  storageInstructions?: string;
};

export const categories = [
  { name: "All", icon: "LayoutGrid" },
  { name: "Groceries", icon: "ShoppingBasket" },
  { name: "Beras", icon: "Wheat" },
  { name: "Sayuran", icon: "Carrot" },
  { name: "Buah", icon: "Apple" },
  { name: "Daging", icon: "Beef" },
  { name: "Telur", icon: "Egg" },
  { name: "Susu", icon: "Milk" },
  { name: "Bawang", icon: "Salad" },
];
