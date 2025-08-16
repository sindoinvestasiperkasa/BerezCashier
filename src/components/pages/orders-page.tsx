
"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ClipboardList, CheckCircle, AlertCircle, Clock, Frown, User } from "lucide-react";
import { useApp } from "@/hooks/use-app";
import { cn } from "@/lib/utils";
import type { Transaction } from "@/providers/app-provider";
import TransactionDetail from "../transaction-detail";
import { format } from "date-fns";
import { id } from "date-fns/locale";

export const statusVariant: { [key: string]: "default" | "secondary" | "destructive" | "outline" } = {
    'Selesai': 'default',
    'Lunas': 'default',
    'Dikirim': 'secondary',
    'Diproses': 'outline',
    'Dibatalkan': 'destructive',
};

export const paymentStatusConfig: {
    [key: string]: {
        className: string;
        icon: React.ElementType;
    };
} = {
    'Berhasil': {
        className: 'bg-green-100 text-green-800 border-green-200 hover:bg-green-100',
        icon: CheckCircle,
    },
    'Pending': {
        className: 'bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-100',
        icon: Clock,
    },
    'Gagal': {
        className: 'bg-red-100 text-red-800 border-red-200 hover:bg-red-100',
        icon: AlertCircle,
    },
};

export default function OrdersPage() {
  const { transactions, products } = useApp();
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);

  const pendingTransactions = useMemo(() => {
    return transactions
      .filter(trx => 
        (trx.status !== 'Lunas' || trx.paymentStatus !== 'Berhasil') &&
        trx.transactionNumber?.startsWith('KSR')
      )
      .sort((a, b) => b.date.getTime() - a.date.getTime());
  }, [transactions]);

  const handleCloseDetail = () => {
    setSelectedTransaction(null);
  };
  
  const formatDate = (date: Date) => {
    if (!date || !(date instanceof Date)) {
      return "Tanggal tidak valid";
    }
    return format(date, "d MMMM yyyy, HH:mm", { locale: id });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="flex flex-col h-full">
      <header className="p-4 border-b">
        <div className="flex items-center gap-2">
          <ClipboardList className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-bold">Pesanan Tertunda</h1>
        </div>
        <p className="text-muted-foreground text-sm mt-1">Daftar transaksi yang pembayarannya belum lunas atau masih diproses.</p>
      </header>
      
      <div className="flex-1 overflow-y-auto bg-secondary/30">
        <div className="p-4 space-y-4">
          {pendingTransactions.length === 0 ? (
            <div className="text-center py-20 flex flex-col items-center gap-4">
              <Frown className="w-16 h-16 text-muted-foreground" />
              <h2 className="text-xl font-semibold">Tidak Ada Pesanan Tertunda</h2>
              <p className="text-muted-foreground">Semua transaksi sudah lunas.</p>
            </div>
          ) : (
            pendingTransactions.map((trx) => {
              const paymentConfig = paymentStatusConfig[trx.paymentStatus];
              const PaymentIcon = paymentConfig?.icon || Clock;
              const itemsSummary = Array.isArray(trx.items) 
                ? trx.items.map(item => `${item.productName} (x${item.quantity})`).join(', ')
                : 'Ringkasan item tidak tersedia.';

              return (
              <Card key={trx.id} className="cursor-pointer shadow-md hover:shadow-lg transition-shadow" onClick={() => setSelectedTransaction(trx)}>
                <CardHeader className="p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-base font-bold">{trx.transactionNumber}</CardTitle>
                      <CardDescription>{formatDate(trx.date)}</CardDescription>
                      <CardDescription className="flex items-center gap-1.5 mt-1">
                        <User className="w-3.5 h-3.5" />
                        <span>{trx.customerName || 'Pelanggan Umum'}</span>
                      </CardDescription>
                    </div>
                    <Badge variant={statusVariant[trx.status] || 'outline'} className={trx.status === 'Diproses' ? 'border-primary text-primary' : ''}>{trx.status}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <Separator className="mb-3" />
                  <p className="text-sm text-muted-foreground truncate">{itemsSummary}</p>
                  <div className="flex justify-between items-center mt-3">
                    <p className="text-sm text-muted-foreground">Total Belanja</p>
                    <p className="font-bold text-base text-primary">
                      {formatCurrency(trx.total || 0)}
                    </p>
                  </div>

                  <Separator className="my-3" />

                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between items-center">
                        <p className="text-muted-foreground">Metode Pembayaran</p>
                        <p className="font-medium">{trx.paymentMethod}</p>
                    </div>
                    <div className="flex justify-between items-center">
                        <p className="text-muted-foreground">Status Pembayaran</p>
                        {paymentConfig && (
                            <Badge variant="outline" className={cn("font-medium text-xs", paymentConfig.className)}>
                                <PaymentIcon className="w-3.5 h-3.5 mr-1.5" />
                                {trx.paymentStatus}
                            </Badge>
                        )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )})
          )}
        </div>
      </div>
      <TransactionDetail 
        transaction={selectedTransaction}
        products={products}
        isOpen={!!selectedTransaction}
        onClose={handleCloseDetail}
      />
    </div>
  );
}
