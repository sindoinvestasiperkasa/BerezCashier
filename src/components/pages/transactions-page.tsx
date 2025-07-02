
"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Receipt } from "lucide-react";
import { useApp } from "@/hooks/use-app";

const statusVariant: { [key: string]: "default" | "secondary" | "destructive" | "outline" } = {
    'Selesai': 'default',
    'Dikirim': 'secondary',
    'Diproses': 'outline',
    'Dibatalkan': 'destructive',
}

export default function TransactionsPage() {
  const { transactions } = useApp();

  return (
    <div className="p-4">
      <div className="flex items-center gap-2 mb-6">
        <Receipt className="w-6 h-6 text-primary" />
        <h1 className="text-2xl font-bold">Riwayat Transaksi</h1>
      </div>

      <div className="space-y-4">
        {transactions.map((trx) => (
          <Card key={trx.id}>
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
              <p className="text-sm text-muted-foreground truncate">{trx.items}</p>
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
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
