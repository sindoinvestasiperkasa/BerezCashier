"use client";

import Image from "next/image";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import type { Product } from "@/lib/data";
import { useApp } from "@/hooks/use-app";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";

interface ProductDetailProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function ProductDetail({ product, isOpen, onClose }: ProductDetailProps) {
  const { addToCart } = useApp();
  const { toast } = useToast();
  const isMobile = useIsMobile();

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
      <SheetContent 
        side={isMobile ? "bottom" : "right"} 
        className="flex flex-col p-0 max-h-[90vh] md:max-h-full md:w-[480px] md:max-w-none"
      >
        <div className="relative h-64 w-full">
            <Image
                src={product.imageUrl}
                alt={product.name}
                fill
                objectFit="cover"
                className="w-full h-full"
            />
        </div>
        <div className="p-6 flex-grow flex flex-col overflow-y-auto">
            <SheetHeader>
              <SheetTitle className="text-2xl font-bold text-left">{product.name}</SheetTitle>
              <SheetDescription className="text-left">{product.category}</SheetDescription>
            </SheetHeader>
            <p className="text-foreground mt-4">{product.description}</p>
            
            <Accordion type="single" collapsible className="w-full mt-4">
              <AccordionItem value="details">
                <AccordionTrigger>Rincian Produk</AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    {product.netWeight && <div className="flex justify-between"><span>Berat Bersih:</span> <span className="font-medium text-foreground">{product.netWeight}</span></div>}
                    {product.ingredients && <div className="flex justify-between"><span>Bahan:</span> <span className="font-medium text-foreground text-right">{product.ingredients.join(', ')}</span></div>}
                    {product.productionCode && <div className="flex justify-between"><span>Kode Produksi:</span> <span className="font-medium text-foreground">{product.productionCode}</span></div>}
                    {product.expirationDate && <div className="flex justify-between"><span>Kedaluwarsa:</span> <span className="font-medium text-foreground">{product.expirationDate}</span></div>}
                    {product.permitNumber && <div className="flex justify-between"><span>Izin Edar:</span> <span className="font-medium text-foreground">{product.permitNumber}</span></div>}
                    {product.storageInstructions && <p className="pt-2"><strong>Cara Penyimpanan:</strong> {product.storageInstructions}</p>}
                  </div>
                </AccordionContent>
              </AccordionItem>
              {product.nutritionFacts && (
                <AccordionItem value="nutrition">
                  <AccordionTrigger>Informasi Nilai Gizi</AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-2 text-sm text-muted-foreground">
                      {Object.entries(product.nutritionFacts).map(([key, value]) => (
                        <div key={key} className="flex justify-between">
                          <span>{key}:</span>
                          <span className="font-medium text-foreground">{value}</span>
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              )}
            </Accordion>
        </div>
        <div className="p-6 mt-auto flex items-center justify-between border-t">
          <span className="text-2xl font-bold text-primary">{formatCurrency(product.price)}</span>
          <Button size="lg" className="h-14 px-8 rounded-full text-lg font-bold" onClick={handleAddToCart}>
              <Plus className="mr-2 h-6 w-6" />
              Keranjang
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
