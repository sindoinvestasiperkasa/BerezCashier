export type Product = {
  id: string;
  name: string;
  categoryId: string;
  categoryName?: string; // Will be populated after fetching from productCategories
  price: number;
  hpp?: number; // Harga Pokok Penjualan
  stock?: number;
  imageUrl: string;
  imageUrls?: string[];
  description: string;
  productType?: 'Barang' | 'Jasa';
  netWeight?: string;
  ingredients?: string[];
  productionCode?: string;
  expirationDate?: string;
  permitNumber?: string;
  nutritionFacts?: { [key: string]: string };
  storageInstructions?: string;
};

// This static data is no longer used and will be removed.
// The app now fetches product data directly from Firestore.
export const products: Product[] = [];
