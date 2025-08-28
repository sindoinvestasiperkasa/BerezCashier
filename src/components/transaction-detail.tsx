

"use client";

import Image from "next/image";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, Calendar, User, Minus, Plus, Search, Hash, ShieldCheck } from "lucide-react";
import type { Transaction, SaleItem } from "@/providers/app-provider";
import type { Product } from "@/lib/data";
import { cn } from "@/lib/utils";
import { statusVariant } from "./pages/transactions-page";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { useIsMobile } from "@/hooks/use-mobile";


interface TransactionDetailProps {
  transaction: Transaction | null;
  products: Product[];
  isOpen: boolean;
  onClose: () => void;
}

const formatDate = (date: Date) => {
    if (!date || !(date instanceof Date)) {
      return "Tanggal tidak valid";
    }
    return format(date, "d MMMM yyyy, HH:mm", { locale: id });
};


export default function TransactionDetail({ transaction: initialTransaction, products, isOpen, onClose }: TransactionDetailProps) {
  const isMobile = useIsMobile();
  
  const transaction = initialTransaction;

  if (!transaction) {
    return null;
  }

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="flex flex-col p-0 max-h-[90vh] w-full" side="bottom">
        <SheetHeader className="p-4 pb-4 border-b">
          <div className="flex justify-between items-center">
            <SheetTitle className="text-xl font-bold text-left">
                Detail Pesanan
            </SheetTitle>
          </div>
            <div className="space-y-1.5 text-sm text-muted-foreground mt-2">
                <div className="flex items-center gap-2">
                    <Hash className="w-4 h-4" />
                    <span>{transaction.transactionNumber || transaction.id}</span>
                </div>
                <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4" />
                    <Badge variant={statusVariant[transaction.status] || 'outline'} className={cn("text-xs", transaction.status === 'Diproses' ? 'border-primary text-primary' : '')}>
                        {transaction.status}
                    </Badge>
                </div>
                <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <span>{formatDate(new Date(transaction.date))}</span>
                </div>
                <div className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    <span>{transaction.customerName || 'Pelanggan Umum'} {transaction.tableNumber && `(Meja ${transaction.tableNumber})`}</span>
                </div>
            </div>
        </SheetHeader>

        <div className="p-4 space-y-4 flex-grow overflow-y-auto bg-secondary/30">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between p-4">
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <Package className="w-5 h-5 text-primary" />
                        <span>Ringkasan Pesanan</span>
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 p-4 pt-0">
                    {Array.isArray(transaction.items) && transaction.items.map((item, index) => {
                      const productInfo = products.find(p => p.id === item.productId);
                      const imageUrl = item.imageUrl || productInfo?.imageUrls?.[0] || 'https://placehold.co/64x64.png';
                      const productName = item.productName || productInfo?.name || 'Produk tidak ditemukan';
                      
                      return (
                      <div key={`${transaction.id}-${item.productId}-${index}`} className="flex items-center gap-4">
                          <Image 
                              src={imageUrl} 
                              alt={productName} 
                              width={64} 
                              height={64} 
                              className="rounded-md object-cover bg-muted"
                              data-ai-hint="product image"
                          />
                          <div className="flex-grow">
                              <p className="font-semibold">{productName}</p>
                              <p className="text-sm text-muted-foreground">x {item.quantity}</p>
                          </div>
                      </div>
                      )
                    })}
                </CardContent>
            </Card>
        </div>
      </SheetContent>
    </Sheet>
  );
}
