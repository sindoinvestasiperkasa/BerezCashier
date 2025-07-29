
// This file is being deprecated as types are now managed in app-provider.
// For now, we will keep a minimal version for compatibility.

export type Product = {
  id: string;
  name: string;
  categoryId: string;
  categoryName?: string;
  price: number;
  hpp?: number; // Harga Pokok Penjualan
  stock?: number;
  imageUrl: string;
  imageUrls?: string[];
  description: string;
  productSubType?: 'Produk Retail' | 'Produk Produksi' | 'Jasa (Layanan)' | 'Bahan Baku';
  netWeight?: string;
  ingredients?: string[];
  productionCode?: string;
  expirationDate?: string;
  permitNumber?: string;
  nutritionFacts?: { [key: string]: string };
  storageInstructions?: string;
};

export const products: Product[] = [];
