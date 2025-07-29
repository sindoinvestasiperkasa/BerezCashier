
"use client";

import Image from "next/image";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import type { Product } from "@/providers/app-provider";
import { Heart, Plus } from "lucide-react";
import { useApp } from "@/hooks/use-app";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface ProductCardProps {
  product: Product;
  onProductClick?: (product: Product) => void;
}

export default function ProductCard({ product, onProductClick }: ProductCardProps) {
  const { addToCart, addToWishlist, removeFromWishlist, isInWishlist } = useApp();
  const { toast } = useToast();
  const inWishlist = isInWishlist(product.id);
  const imageUrl = product.imageUrls?.[0] || product.imageUrl || 'https://placehold.co/300x300.png';


  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    addToCart(product);
    toast({
      title: "Berhasil!",
      description: `${product.name} ditambahkan ke keranjang.`,
    });
  };
  
  const handleWishlistToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if(inWishlist) {
        removeFromWishlist(product.id);
        toast({
            title: "Dihapus dari Wishlist",
            description: `${product.name} telah dihapus dari wishlist.`,
            variant: "destructive"
        })
    } else {
        addToWishlist(product);
        toast({
            title: "Ditambahkan ke Wishlist",
            description: `${product.name} telah ditambahkan ke wishlist.`,
        })
    }
  }


  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const stockInfo = product.productSubType === 'Jasa (Layanan)' 
    ? 'Jasa' 
    : `Stok: ${product.stock || 0} ${product.unitName || ''}`;

  return (
    <Card 
      className={cn(
        "group overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300",
        onProductClick && "cursor-pointer"
      )}
      onClick={() => onProductClick?.(product)}
    >
      <CardContent className="p-0">
        <div className="relative">
          <Image
            src={imageUrl}
            alt={product.name}
            width={300}
            height={300}
            className="object-contain w-full aspect-square"
          />
          <Button size="icon" variant="secondary" className="absolute top-2 right-2 h-8 w-8 rounded-full" onClick={handleWishlistToggle}>
            <Heart className={cn("h-4 w-4 text-muted-foreground", inWishlist && "fill-red-500 text-red-500")} />
          </Button>
        </div>
        <div className="p-3">
          <h3 className="font-bold text-sm truncate">{product.name}</h3>
          <p className="text-xs text-muted-foreground">{stockInfo}</p>
          <div className="flex justify-between items-center mt-3">
            <span className="font-bold text-primary">
              {formatCurrency(product.price)}
            </span>
            <Button size="icon" className="h-8 w-8 rounded-full" onClick={handleAddToCart}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
