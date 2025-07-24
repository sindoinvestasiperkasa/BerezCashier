
"use client";

import Image from "next/image";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, Calendar, CreditCard } from "lucide-react";
import type { Transaction } from "@/providers/app-provider";
import { cn } from "@/lib/utils";
import { statusVariant, paymentStatusConfig } from "./pages/transactions-page";
import { format } from "date-fns";
import { id } from "date-fns/locale";

interface TransactionDetailProps {
  transaction: Transaction | null;
  isOpen: boolean;
  onClose: () => void;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);
};

const formatDate = (dateString: string) => {
    if (!dateString || isNaN(new Date(dateString).getTime())) {
      return "Tanggal tidak valid";
    }
    return format(new Date(dateString), "d MMMM yyyy, HH:mm", { locale: id });
};


export default function TransactionDetail({ transaction, isOpen, onClose }: TransactionDetailProps) {
  if (!transaction) {
    return null;
  }

  const paymentConfig = paymentStatusConfig[transaction.paymentStatus];
  const PaymentIcon = paymentConfig?.icon || CreditCard;
  
  const subtotal = Array.isArray(transaction.items) 
    ? transaction.items.reduce((sum, item) => sum + item.price * item.quantity, 0)
    : 0;
  const shipping = transaction.total > subtotal ? transaction.total - subtotal : 0;

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="flex flex-col p-0 max-h-[90vh] w-full" side="bottom">
        <SheetHeader className="p-6 pb-2 border-b">
            <SheetTitle className="text-xl font-bold text-left flex items-center justify-between mr-8">
                <span>Detail Transaksi</span>
                <Badge variant={statusVariant[transaction.status] || 'outline'} className={cn("text-sm", transaction.status === 'Diproses' ? 'border-primary text-primary' : '')}>
                    {transaction.status}
                </Badge>
            </SheetTitle>
            <div className="text-left flex items-center gap-4 text-sm pt-1 text-muted-foreground">
                <span className="font-mono">{transaction.id}</span>
                <span className="text-xs">•</span>
                <div className="flex items-center gap-1.5">
                    <Calendar className="w-4 h-4" />
                    <span>{formatDate(transaction.date)}</span>
                </div>
            </div>
        </SheetHeader>

        <div className="p-4 space-y-4 flex-grow overflow-y-auto bg-secondary/30">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <Package className="w-5 h-5 text-primary" />
                        <span>Ringkasan Pesanan</span>
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                    {Array.isArray(transaction.items) && transaction.items.map((item, index) => (
                    <div key={`${transaction.id}-${item.id}-${index}`} className="flex items-center gap-4">
                        <Image 
                            src={item.imageUrl} 
                            alt={item.name} 
                            width={64} 
                            height={64} 
                            className="rounded-md object-cover"
                            data-ai-hint="product image"
                        />
                        <div className="flex-grow">
                            <p className="font-semibold">{item.name}</p>
                            <p className="text-sm text-muted-foreground">{item.quantity} x {formatCurrency(item.price)}</p>
                        </div>
                        <p className="font-semibold">{formatCurrency(item.quantity * item.price)}</p>
                    </div>
                    ))}
                </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 space-y-3">
                  <div className="flex justify-between text-muted-foreground">
                      <span>Subtotal</span>
                      <span className="font-medium text-foreground">{formatCurrency(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                      <span>Ongkos Kirim</span>
                      <span className="font-medium text-foreground">{formatCurrency(shipping)}</span>
                  </div>
                  <Separator/>
                  <div className="flex justify-between font-bold text-lg">
                      <span>Total</span>
                      <span>{formatCurrency(transaction.total)}</span>
                  </div>
              </CardContent>
            </Card>
        </div>
        <div className="p-4 border-t bg-background">
            <Card>
                <CardContent className="p-4 space-y-3 text-sm">
                    <div className="flex justify-between items-center">
                        <p className="text-muted-foreground">Metode Pembayaran</p>
                        <p className="font-medium">{transaction.paymentMethod}</p>
                    </div>
                    <div className="flex justify-between items-center">
                        <p className="text-muted-foreground">Status Pembayaran</p>
                        {paymentConfig && (
                            <Badge variant="outline" className={cn("font-medium text-xs", paymentConfig.className)}>
                                <PaymentIcon className="w-3.5 h-3.5 mr-1.5" />
                                {transaction.paymentStatus}
                            </Badge>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
      </SheetContent>
    </Sheet>
  );
}
