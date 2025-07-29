"use client";

import { useApp } from "@/hooks/use-app";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Frown, Heart, PackagePlus, Trash2 } from "lucide-react";
import Image from "next/image";
import { useToast } from "@/hooks/use-toast";

export default function WishlistPage() {
  const { wishlist, removeFromWishlist, addToCart } = useApp();
  const { toast } = useToast();

  const handleRemove = (productId: string, productName: string) => {
    removeFromWishlist(productId);
    toast({
      variant: "destructive",
      title: "Dihapus dari Wishlist",
      description: `${productName} telah dihapus dari wishlist.`,
    });
  };

  const handleAddToCart = (product: any) => {
    addToCart(product);
    toast({
      title: "Ditambahkan ke Keranjang",
      description: `${product.name} telah ditambahkan ke keranjang.`,
    });
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="flex flex-col h-full">
      <header className="p-4 border-b sticky top-0 bg-background/95 backdrop-blur-sm z-10">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Heart className="w-6 h-6 text-primary" />
          <span>Wishlist</span>
        </h1>
      </header>

      <div className="flex-grow overflow-y-auto p-4 bg-secondary/30">
        {wishlist.length === 0 ? (
          <div className="text-center py-20 flex flex-col items-center gap-4">
            <Frown className="w-16 h-16 text-muted-foreground" />
            <h2 className="text-xl font-semibold">Wishlist Kosong</h2>
            <p className="text-muted-foreground max-w-xs">
              Anda belum menambahkan produk apa pun ke wishlist. Klik ikon hati pada produk untuk menyimpannya di sini.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {wishlist.map((item) => (
              <Card key={item.id} className="overflow-hidden shadow-sm">
                <CardContent className="p-3 flex gap-4 items-center">
                  <Image
                    src={item.imageUrls?.[0] || item.imageUrl || "https://placehold.co/100x100.png"}
                    alt={item.name}
                    width={80}
                    height={80}
                    className="rounded-md object-cover aspect-square bg-muted"
                  />
                  <div className="flex-grow">
                    <h3 className="font-semibold">{item.name}</h3>
                    <p className="text-primary font-bold text-sm">
                      {formatCurrency(item.price)}
                    </p>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Button
                      size="icon"
                      variant="outline"
                      className="h-9 w-9 border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
                      onClick={() => handleRemove(item.id, item.name)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                     <Button
                      size="icon"
                      className="h-9 w-9"
                      onClick={() => handleAddToCart(item)}
                    >
                      <PackagePlus className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
