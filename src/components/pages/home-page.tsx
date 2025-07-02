"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Bell, LayoutGrid, Wheat, Carrot, Apple, Beef, Egg, Milk, Salad } from "lucide-react";
import { products, categories as categoryData } from "@/lib/data";
import ProductCard from "../product-card";
import { cn } from "@/lib/utils";

const iconMap: { [key: string]: React.ElementType } = {
  LayoutGrid,
  Wheat,
  Carrot,
  Apple,
  Beef,
  Egg,
  Milk,
  Salad,
};

export default function HomePage() {
  const [selectedCategory, setSelectedCategory] = useState("All");

  const filteredProducts =
    selectedCategory === "All"
      ? products
      : products.filter((p) => p.category === selectedCategory);

  return (
    <div className="flex flex-col">
      <header className="p-4 bg-gradient-to-b from-primary/20 to-background">
        <div className="flex justify-between items-center mb-4">
          <div>
            <p className="text-muted-foreground text-sm">Lokasi</p>
            <h1 className="font-bold text-lg text-foreground">Jakarta, Indonesia</h1>
          </div>
          <Button variant="ghost" size="icon">
            <Bell className="h-6 w-6" />
          </Button>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input placeholder="Cari di WarungQ..." className="pl-10 h-12 rounded-full" />
        </div>
      </header>

      <section className="p-4">
        <h2 className="text-xl font-bold mb-3 text-foreground">Kategori</h2>
        <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4">
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

      <section className="p-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-foreground">Produk Terlaris</h2>
          <Button variant="link" className="text-primary p-0 h-auto">Lihat Semua</Button>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {filteredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>
    </div>
  );
}
