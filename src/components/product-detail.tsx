"use client";

import Image from "next/image";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import type { Product } from "@/lib/data";
import { useApp } from "@/hooks/use-app";
import { useToast } from "@/hooks/use-toast";

interface ProductDetailProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function ProductDetail({ product, isOpen, onClose }: ProductDetailProps) {
  const { addToCart } = useApp();
  const { toast } = useToast();

  if (!product) {
    return null;
  }
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const handleAddToCart = () => {
    addToCart(product);
    toast({
      title: "Berhasil!",
      description: `${product.name} ditambahkan ke keranjang.`,
    });
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="flex flex-col p-0" side="bottom">
        <div className="relative h-64 w-full">
            <Image
                src={product.imageUrl}
                alt={product.name}
                fill
                objectFit="cover"
                className="w-full h-full"
            />
        </div>
        <div className="p-6 flex-grow flex flex-col">
            <h2 className="text-2xl font-bold">{product.name}</h2>
            <p className="text-muted-foreground mb-4">{product.category}</p>
            <p className="text-foreground flex-grow">{product.description}</p>
            <div className="mt-auto flex items-center justify-between pt-4">
                <span className="text-2xl font-bold text-primary">{formatCurrency(product.price)}</span>
                <Button size="lg" className="h-14 px-8 rounded-full text-lg font-bold" onClick={handleAddToCart}>
                    <Plus className="mr-2 h-6 w-6" />
                    Keranjang
                </Button>
            </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
