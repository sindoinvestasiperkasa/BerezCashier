
"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ChefHat, Clock, CheckCircle, User, Hash, CookingPot } from "lucide-react";
import { useApp } from "@/hooks/use-app";
import { cn } from "@/lib/utils";
import type { Transaction, SaleItem } from "@/providers/app-provider";
import { Button } from "../ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

const PREPARATION_TIME_LIMIT_SECONDS = 900; // 15 minutes

const statusConfig: { [key: string]: { text: string; bg: string; icon: React.ElementType } } = {
    'Diproses': { text: 'Baru', bg: 'bg-blue-500', icon: CookingPot },
    'Sedang Disiapkan': { text: 'Sedang Disiapkan', bg: 'bg-yellow-500 animate-pulse', icon: ChefHat },
    'Siap Diantar': { text: 'Siap Diantar', bg: 'bg-green-500', icon: CheckCircle },
};

const KitchenOrderCard = ({ transaction, onUpdateStatus }: { transaction: Transaction, onUpdateStatus: (id: string, status: "Sedang Disiapkan" | "Selesai Diantar") => void }) => {
    const [elapsedSeconds, setElapsedSeconds] = useState(0);

    const startTime = useMemo(() => new Date(transaction.preparationStartTime || transaction.date).getTime(), [transaction.date, transaction.preparationStartTime]);

    useEffect(() => {
        if (transaction.status === 'Siap Diantar') return;
        const timer = setInterval(() => {
            const now = new Date().getTime();
            setElapsedSeconds(Math.floor((now - startTime) / 1000));
        }, 1000);
        return () => clearInterval(timer);
    }, [startTime, transaction.status]);

    const formatDuration = (seconds: number) => {
        const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
        const secs = (seconds % 60).toString().padStart(2, '0');
        return `${mins}:${secs}`;
    };

    const isOverTime = elapsedSeconds > PREPARATION_TIME_LIMIT_SECONDS;
    const currentStatus = transaction.status as keyof typeof statusConfig;
    const config = statusConfig[currentStatus] || { text: transaction.status, bg: 'bg-gray-500', icon: Clock };
    const Icon = config.icon;
    const employeeName = transaction.employeeName || 'Waitress';

    return (
        <Card className={cn(
            "shadow-lg w-full transform transition-all duration-300",
            isOverTime && transaction.status !== 'Siap Diantar' && "animate-flash"
        )}>
            <CardHeader className={cn("p-3 text-white rounded-t-lg", config.bg)}>
                <div className="flex justify-between items-center">
                    <CardTitle className="text-lg font-bold flex items-center gap-2">
                        <Icon className="w-6 h-6" /> {config.text}
                    </CardTitle>
                     {transaction.status !== 'Siap Diantar' && (
                        <div className="flex items-center gap-2 text-xl font-bold">
                            <Clock className="w-6 h-6" />
                            <span>{formatDuration(elapsedSeconds)}</span>
                        </div>
                     )}
                </div>
                <div className="text-sm opacity-90 mt-1 space-y-1">
                     <div className="flex justify-between">
                        <span>Meja: <span className="font-bold">{transaction.tableNumber || '-'}</span></span>
                        <span>Oleh: <span className="font-bold">{employeeName}</span></span>
                     </div>
                     <div>
                        <span>Pelanggan: <span className="font-bold">{transaction.customerName || 'Umum'}</span></span>
                     </div>
                </div>
            </CardHeader>
            <CardContent className="p-3">
                <ScrollArea className="h-48 pr-3">
                  <div className="space-y-2">
                      {transaction.items.map((item, index) => (
                          <div key={index} className="flex justify-between items-start text-sm">
                              <p className="font-bold">{item.quantity}x</p>
                              <p className="flex-1 px-2">{item.productName}</p>
                          </div>
                      ))}
                  </div>
                </ScrollArea>
                <Separator className="my-2" />
                <div className="flex gap-2 mt-2">
                    {transaction.status === 'Diproses' && (
                        <Button className="w-full" variant="outline" onClick={() => onUpdateStatus(transaction.id, "Sedang Disiapkan")}>
                            <ChefHat className="mr-2" /> Siapkan Pesanan
                        </Button>
                    )}
                    {transaction.status === 'Sedang Disiapkan' && (
                        <Button className="w-full" variant="default" onClick={() => onUpdateStatus(transaction.id, "Selesai Diantar")}>
                           <CheckCircle className="mr-2"/> Tandai Selesai
                        </Button>
                    )}
                     {transaction.status === 'Siap Diantar' && (
                        <Button className="w-full" disabled variant="secondary">
                           Menunggu Diambil Pelayan
                        </Button>
                    )}
                </div>
            </CardContent>
        </Card>
    );
};


export default function OrdersPage() {
  const { transactions, updateTransactionStatus, markTransactionAsNotified } = useApp();
  const audioRef = useRef<HTMLAudioElement>(null);

  const kitchenOrders = useMemo(() => {
    const statusPriority: { [key: string]: number } = {
      'Diproses': 1,
      'Sedang Disiapkan': 2,
      'Siap Diantar': 3,
    };
    const filtered = transactions
      .filter(trx => 
        (trx.status === 'Diproses' || trx.status === 'Sedang Disiapkan' || trx.status === 'Siap Diantar')
      )
      .sort((a, b) => {
        const priorityA = statusPriority[a.status] || 99;
        const priorityB = statusPriority[b.status] || 99;
        if (priorityA !== priorityB) {
            return priorityA - priorityB;
        }
        return new Date(a.date).getTime() - new Date(b.date).getTime();
      });
    return filtered;
  }, [transactions]);
  
  // Sound notification for new orders
  useEffect(() => {
    const newOrder = transactions.find(tx => tx.status === 'Diproses' && !tx.isNotified);
    if (newOrder) {
      audioRef.current?.play().catch(e => console.error("Audio play failed:", e));
      markTransactionAsNotified(newOrder.id);
    }
  }, [transactions, markTransactionAsNotified]);

  const handleUpdateStatus = (id: string, status: "Sedang Disiapkan" | "Selesai Diantar") => {
    updateTransactionStatus(id, status);
  };

  return (
    <div className="flex flex-col h-screen bg-gray-100 dark:bg-gray-900">
       <audio ref={audioRef} src="/sounds/notification.mp3" preload="auto" />
      <header className="p-4 border-b bg-background shadow-sm">
        <div className="flex items-center gap-3">
          <ChefHat className="w-8 h-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">Tampilan Dapur</h1>
            <p className="text-muted-foreground text-sm">Pesanan aktif yang perlu disiapkan.</p>
          </div>
        </div>
      </header>
      
      <main className="flex-1 overflow-y-auto p-2 md:p-4 pb-20">
        {kitchenOrders.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center text-gray-500">
                <CheckCircle className="w-24 h-24 mx-auto text-green-500" />
                <h2 className="mt-4 text-2xl font-semibold">Tidak Ada Pesanan Aktif</h2>
                <p className="mt-2">Semua pesanan sudah selesai disiapkan. Kerja bagus!</p>
              </div>
            </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 md:gap-4">
            {kitchenOrders.map((trx) => (
              <KitchenOrderCard 
                key={trx.id}
                transaction={trx}
                onUpdateStatus={handleUpdateStatus}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

// Add this to your globals.css or a style tag if needed
const styles = `
@keyframes flash {
  50% { background-color: hsl(var(--destructive)); }
}
.animate-flash {
  animation: flash 1.5s infinite;
}
`;
// You can inject this style block in layout or here directly for simplicity
if (typeof window !== "undefined") {
    const styleSheet = document.createElement("style");
    styleSheet.type = "text/css";
    styleSheet.innerText = styles;
    document.head.appendChild(styleSheet);
}
