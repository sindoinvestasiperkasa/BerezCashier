"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Search,
  Bell,
  LayoutGrid,
  Wheat,
  Carrot,
  Apple,
  Beef,
  Egg,
  Milk,
  Salad,
  Frown,
  ShoppingBasket,
} from "lucide-react";
import { categories as categoryData, type Product } from "@/lib/data";
import ProductCard from "../product-card";
import { cn } from "@/lib/utils";
import ProductDetail from "../product-detail";
import { collection, getDocs, query, where, getFirestore } from "firebase/firestore";
import { Skeleton } from "../ui/skeleton";
import { Card, CardContent } from "../ui/card";
import { useApp } from "@/hooks/use-app";

const iconMap: { [key: string]: React.ElementType } = {
  LayoutGrid,
  Wheat,
  Carrot,
  Apple,
  Beef,
  Egg,
  Milk,
  Salad,
  ShoppingBasket,
};

export default function HomePage() {
  const { user } = useApp();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  useEffect(() => {
    const fetchProducts = async () => {
      if (!user) return;

      setIsLoading(true);
      const db = getFirestore();
      const productsCollection = collection(db, "products");
      
      const idUMKM = user.role === 'UMKM' ? user.uid : user.idUMKM;

      if (!idUMKM) {
        setProducts([]);
        setIsLoading(false);
        return;
      }

      const q = query(
        productsCollection, 
        where("productType", "==", "Jasa"),
        where("idUMKM", "==", idUMKM)
      );
      
      const querySnapshot = await getDocs(q);
      const productsData: Product[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        productsData.push({
          id: doc.id,
          name: data.name,
          category: data.category,
          price: data.price,
          imageUrl: data.imageUrls?.[0] || "https://placehold.co/300x300.png",
          description: data.description,
          productType: data.productType,
          imageUrls: data.imageUrls,
        });
      });
      setProducts(productsData);
      setIsLoading(false);
    };

    fetchProducts();
  }, [user]);

  const filteredProducts = products.filter((product) => {
    const matchesCategory =
      selectedCategory === "All" || product.category === selectedCategory;
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
          {categoryData.map((category) => {
            const Icon = iconMap[category.icon];
            return (
              <button
                key={category.name}
                onClick={() => setSelectedCategory(category.name)}
                className={cn(
                  "flex flex-col items-center justify-center gap-2 w-20 h-20 rounded-lg border transition-colors flex-shrink-0",
                  selectedCategory === category.name
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
