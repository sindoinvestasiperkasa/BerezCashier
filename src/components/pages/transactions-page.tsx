"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Receipt, CheckCircle, AlertCircle, Clock } from "lucide-react";
import { useApp } from "@/hooks/use-app";
import { cn } from "@/lib/utils";
import type { Transaction } from "@/providers/app-provider";
import TransactionDetail from "../transaction-detail";

export const statusVariant: { [key: string]: "default" | "secondary" | "destructive" | "outline" } = {
    'Selesai': 'default',
    'Dikirim': 'secondary',
    'Diproses': 'outline',
    'Dibatalkan': 'destructive',
}

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
}

export default function TransactionsPage() {
  const { transactions } = useApp();
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);

  const handleCloseDetail = () => {
    setSelectedTransaction(null);
  };

  return (
    <div className="p-4">
      <div className="flex items-center gap-2 mb-6">
        <Receipt className="w-6 h-6 text-primary" />
        <h1 className="text-2xl font-bold">Riwayat Transaksi</h1>
      </div>

      <div className="space-y-4">
        {transactions.map((trx) => {
          const paymentConfig = paymentStatusConfig[trx.paymentStatus];
          const PaymentIcon = paymentConfig?.icon || Clock;
          const itemsSummary = Array.isArray(trx.items) 
            ? trx.items.map(item => `${item.name} (x${item.quantity})`).join(', ')
            : 'Ringkasan item tidak tersedia.';


          return (
          <Card key={trx.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setSelectedTransaction(trx)}>
            <CardHeader className="p-4">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-base font-bold">{trx.id}</CardTitle>
                  <CardDescription>{trx.date}</CardDescription>
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
                  {new Intl.NumberFormat("id-ID", {
                    style: "currency",
                    currency: "IDR",
                    minimumFractionDigits: 0,
                  }).format(trx.total)}
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
        )})}
      </div>
      <TransactionDetail 
        transaction={selectedTransaction}
        isOpen={!!selectedTransaction}
        onClose={handleCloseDetail}
      />
    </div>
  );
}
