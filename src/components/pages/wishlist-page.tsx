"use client";

import { useApp } from "@/hooks/use-app";
import { Button } from "@/components/ui/button";
import ProductCard from "../product-card";
import { Heart, Frown } from "lucide-react";

export default function WishlistPage() {
  const { wishlist, addToCart, removeFromWishlist } = useApp();

  return (
    <div className="p-4">
      <div className="flex items-center gap-2 mb-6">
        <Heart className="w-6 h-6 text-primary" />
        <h1 className="text-2xl font-bold">Wishlist Saya</h1>
      </div>

      {wishlist.length === 0 ? (
        <div className="text-center py-20 flex flex-col items-center gap-4">
          <Frown className="w-16 h-16 text-muted-foreground" />
          <h2 className="text-xl font-semibold">Wishlist Kamu Kosong</h2>
          <p className="text-muted-foreground">Yuk, tambahkan produk favoritmu!</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {wishlist.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
