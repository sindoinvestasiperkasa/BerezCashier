
"use client";

import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Receipt, CheckCircle, AlertCircle, Clock, Frown, DollarSign, Hash, CalendarIcon } from "lucide-react";
import { useApp } from "@/hooks/use-app";
import { cn } from "@/lib/utils";
import type { Transaction } from "@/providers/app-provider";
import TransactionDetail from "../transaction-detail";
import { format, startOfDay, endOfDay } from "date-fns";
import { id } from "date-fns/locale";
import { Button } from "../ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Calendar } from "../ui/calendar";
import type { DateRange } from "react-day-picker";
import { Skeleton } from "../ui/skeleton";

export const statusVariant: { [key: string]: "default" | "secondary" | "destructive" | "outline" } = {
    'Selesai': 'default',
    'Lunas': 'default',
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

const ITEMS_PER_PAGE = 10;

export default function TransactionsPage() {
  const { transactions, products } = useApp();
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  
  const today = new Date();
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: startOfMonth,
    to: today,
  });

  const [displayedCount, setDisplayedCount] = useState(ITEMS_PER_PAGE);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const filteredTransactions = useMemo(() => {
    const cashierTransactions = transactions
      .filter(trx => 
        trx.status === 'Lunas' &&
        trx.transactionNumber?.startsWith('KSR') &&
        Array.isArray(trx.items) &&
        trx.items.length > 0
      )
      .sort((a, b) => b.date.getTime() - a.date.getTime());

    if (!dateRange?.from) {
      return cashierTransactions;
    }
    const fromDate = startOfDay(dateRange.from);
    const toDate = dateRange.to ? endOfDay(dateRange.to) : endOfDay(dateRange.from);

    return cashierTransactions.filter(trx => {
      const trxDate = trx.date;
      return trxDate >= fromDate && trxDate <= toDate;
    });
  }, [transactions, dateRange]);
  
  const paginatedTransactions = useMemo(() => {
    return filteredTransactions.slice(0, displayedCount);
  }, [filteredTransactions, displayedCount]);
  
  const summary = useMemo(() => {
    const totalSales = filteredTransactions.reduce((acc, trx) => acc + trx.total, 0);
    const transactionCount = filteredTransactions.length;
    return { totalSales, transactionCount };
  }, [filteredTransactions]);

  const handleScroll = useCallback(() => {
    const container = scrollContainerRef.current;
    if (container) {
      const { scrollTop, scrollHeight, clientHeight } = container;
      if (scrollTop + clientHeight >= scrollHeight - 20) {
        if (displayedCount < filteredTransactions.length) {
          setDisplayedCount(prev => Math.min(prev + ITEMS_PER_PAGE, filteredTransactions.length));
        }
      }
    }
  }, [displayedCount, filteredTransactions.length]);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, [handleScroll]);

  // Reset pagination when filter changes
  useEffect(() => {
    setDisplayedCount(ITEMS_PER_PAGE);
  }, [dateRange]);


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
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      <header className="p-4 border-b">
        <div className="flex items-center gap-2">
          <Receipt className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-bold">Riwayat Transaksi Kasir</h1>
        </div>
        <div className="mt-4 flex flex-col sm:flex-row gap-4">
            <Card className="flex-1">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Pendapatan</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(summary.totalSales)}</div>
              </CardContent>
            </Card>
            <Card className="flex-1">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Jumlah Transaksi</CardTitle>
                <Hash className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{summary.transactionCount}</div>
              </CardContent>
            </Card>
        </div>
        <div className="mt-4">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  id="date"
                  variant={"outline"}
                  className={cn("w-full justify-start text-left font-normal", !dateRange && "text-muted-foreground")}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateRange?.from ? (
                    dateRange.to ? (
                      <>
                        {format(dateRange.from, "LLL dd, y")} - {format(dateRange.to, "LLL dd, y")}
                      </>
                    ) : (
                      format(dateRange.from, "LLL dd, y")
                    )
                  ) : (
                    <span>Pilih tanggal</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  initialFocus
                  mode="range"
                  defaultMonth={dateRange?.from}
                  selected={dateRange}
                  onSelect={setDateRange}
                  numberOfMonths={2}
                />
              </PopoverContent>
            </Popover>
        </div>
      </header>
      
      <div className="flex-1 overflow-y-auto" ref={scrollContainerRef}>
        <div className="p-4 space-y-4">
          {paginatedTransactions.length === 0 ? (
            <div className="text-center py-20 flex flex-col items-center gap-4">
              <Frown className="w-16 h-16 text-muted-foreground" />
              <h2 className="text-xl font-semibold">Belum Ada Transaksi</h2>
              <p className="text-muted-foreground">Tidak ada riwayat transaksi kasir pada rentang tanggal ini.</p>
            </div>
          ) : (
            paginatedTransactions.map((trx) => {
              const paymentConfig = paymentStatusConfig[trx.paymentStatus];
              const PaymentIcon = paymentConfig?.icon || Clock;
              const itemsSummary = Array.isArray(trx.items) 
                ? trx.items.map(item => `${item.productName} (x${item.quantity})`).join(', ')
                : 'Ringkasan item tidak tersedia.';

              return (
              <Card key={trx.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setSelectedTransaction(trx)}>
                <CardHeader className="p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-base font-bold">{trx.transactionNumber}</CardTitle>
                      <CardDescription>{formatDate(trx.date)}</CardDescription>
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
                      {formatCurrency(trx.total)}
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
          {filteredTransactions.length > displayedCount && (
            <div className="space-y-4 mt-4">
              {[...Array(3)].map((_, i) => (
                <Card key={i}>
                  <CardHeader className="p-4">
                    <Skeleton className="h-5 w-1/3" />
                    <Skeleton className="h-4 w-1/2 mt-1" />
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    <Separator className="mb-3" />
                    <Skeleton className="h-4 w-full" />
                    <div className="flex justify-between items-center mt-3">
                      <Skeleton className="h-4 w-1/4" />
                      <Skeleton className="h-6 w-1/3" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
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

    