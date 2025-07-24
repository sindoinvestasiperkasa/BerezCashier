"use client";

import { useState, useEffect, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Search,
  Bell,
  LayoutGrid,
  ShoppingBasket,
  Frown,
  ConciergeBell,
  Wrench,
  Scissors,
  Shirt,
  Car,
} from "lucide-react";
import type { Product } from "@/lib/data";
import ProductCard from "../product-card";
import { cn } from "@/lib/utils";
import ProductDetail from "../product-detail";
import { collection, getDocs, query, where, getFirestore, documentId } from "firebase/firestore";
import { Skeleton } from "../ui/skeleton";
import { Card, CardContent } from "../ui/card";
import { useApp } from "@/hooks/use-app";

const iconMap: { [key: string]: React.ElementType } = {
  All: LayoutGrid,
  Layanan: ConciergeBell,
  Perbaikan: Wrench,
  "Potong Rambut": Scissors,
  Laundry: Shirt,
  Transportasi: Car,
  Default: ShoppingBasket,
};

interface ProductCategory {
  id: string;
  name: string;
  icon?: string;
}

export default function HomePage() {
  const { user } = useApp();
  const [products, setProducts] = useState<Product[]>([]);
  const [productCategories, setProductCategories] = useState<ProductCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategoryId, setSelectedCategoryId] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  useEffect(() => {
    const fetchProductsAndCategories = async () => {
      if (!user) return;

      setIsLoading(true);
      const db = getFirestore();
      const idUMKM = user.role === 'UMKM' ? user.uid : user.idUMKM;

      if (!idUMKM) {
        setProducts([]);
        setProductCategories([]);
        setIsLoading(false);
        return;
      }

      try {
        // 1. Fetch Products of type "Jasa"
        const productsQuery = query(
          collection(db, "products"),
          where("productType", "==", "Jasa"),
          where("idUMKM", "==", idUMKM)
        );
        const productsSnapshot = await getDocs(productsQuery);
        const productsData: Omit<Product, 'categoryName'>[] = productsSnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            name: data.name,
            categoryId: data.categoryId,
            price: data.price,
            imageUrl: data.imageUrls?.[0] || "https://placehold.co/300x300.png",
            description: data.description,
            productType: data.productType,
            imageUrls: data.imageUrls,
          };
        });

        // 2. Get unique category IDs from the fetched products
        const activeCategoryIds = [...new Set(productsData.map(p => p.categoryId))];

        let categoriesData: ProductCategory[] = [];
        if (activeCategoryIds.length > 0) {
          // 3. Fetch only the active categories
          const categoriesQuery = query(collection(db, "productCategories"), where(documentId(), "in", activeCategoryIds));
          const categoriesSnapshot = await getDocs(categoriesQuery);
          categoriesData = categoriesSnapshot.docs.map(doc => ({
              id: doc.id,
              name: doc.data().name,
              icon: doc.data().name 
          }));
        }
        
        setProductCategories(categoriesData);

        // 4. Map products with category names
        const productsWithCategoryNames: Product[] = productsData.map(product => {
          const category = categoriesData.find(cat => cat.id === product.categoryId);
          return {
            ...product,
            categoryName: category ? category.name : "Uncategorized",
          };
        });

        setProducts(productsWithCategoryNames);

      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProductsAndCategories();
  }, [user]);
  
  const displayCategories = useMemo(() => {
    const allCategory: ProductCategory = { id: "All", name: "All", icon: "All" };
    return [allCategory, ...productCategories];
  }, [productCategories]);

  const filteredProducts = products.filter((product) => {
    const matchesCategory =
      selectedCategoryId === "All" || product.categoryId === selectedCategoryId;
    const matchesSearch = product.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });
  
  const handleProductClick = (product: Product) => {
    setSelectedProduct(product);
  };

  const handleCloseDetail = () => {
    setSelectedProduct(null);
  };

  return (
    <div className="flex flex-col">
      <header className="p-4 md:p-6 bg-gradient-to-b from-primary/20 to-background">
        <div className="flex justify-between items-center mb-4">
          <div>
            <p className="text-muted-foreground text-sm">Lokasi</p>
            <h1 className="font-bold text-lg text-foreground">
              Jakarta, Indonesia
            </h1>
          </div>
          <Button variant="ghost" size="icon">
            <Bell className="h-6 w-6" />
          </Button>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            placeholder="Cari di Berez Cashier..."
            className="pl-10 h-12 rounded-full"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </header>

      <section className="p-4 md:p-6">
        <h2 className="text-xl font-bold mb-3 text-foreground">Kategori</h2>
        <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 md:-mx-6 px-4 md:px-6">
          {displayCategories.map((category) => {
            const Icon = iconMap[category.icon || "Default"] || iconMap["Default"];
            return (
              <button
                key={category.id}
                onClick={() => setSelectedCategoryId(category.id)}
                className={cn(
                  "flex flex-col items-center justify-center gap-2 w-20 h-20 rounded-lg border transition-colors flex-shrink-0",
                  selectedCategoryId === category.id
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-card text-foreground hover:bg-secondary"
                )}
              >
                {Icon && <Icon className="w-6 h-6" />}
                <span className="text-xs font-medium">{category.name}</span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="p-4 md:p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-foreground">
            {searchQuery ? `Hasil Pencarian` : "Produk Terlaris"}
          </h2>
          <Button variant="link" className="text-primary p-0 h-auto">
            Lihat Semua
          </Button>
        </div>
        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <Card key={i}>
                <Skeleton className="w-full aspect-square" />
                <CardContent className="p-3 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                  <div className="flex justify-between items-center mt-3">
                    <Skeleton className="h-5 w-1/3" />
                    <Skeleton className="h-8 w-8 rounded-full" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredProducts.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredProducts.map((product) => (
              <ProductCard 
                key={product.id} 
                product={product} 
                onProductClick={handleProductClick} 
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-10 flex flex-col items-center gap-4">
            <Frown className="w-16 h-16 text-muted-foreground" />
            <h3 className="text-lg font-semibold">Produk tidak ditemukan</h3>
            <p className="text-muted-foreground max-w-xs">
              Tidak ada produk 'Jasa' yang tersedia untuk UMKM Anda saat ini.
            </p>
          </div>
        )}
      </section>
      
      <ProductDetail 
        product={selectedProduct}
        isOpen={!!selectedProduct}
        onClose={handleCloseDetail}
      />
    </div>
  );
}
