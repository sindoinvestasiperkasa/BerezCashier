

"use client";

import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Receipt, Frown, CalendarIcon, History } from "lucide-react";
import { useApp } from "@/hooks/use-app";
import { cn } from "@/lib/utils";
import type { Transaction } from "@/providers/app-provider";
import TransactionDetail from "../transaction-detail";
import { format, startOfDay, endOfDay, startOfWeek, startOfMonth, startOfYear, subMonths, endOfMonth } from "date-fns";
import { id } from "date-fns/locale";
import { Button } from "../ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Calendar } from "../ui/calendar";
import type { DateRange } from "react-day-picker";
import { Skeleton } from "../ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const statusVariant: { [key: string]: "default" | "secondary" | "destructive" | "outline" } = {
    'Selesai Diantar': 'default',
    'Lunas': 'default',
    'Dikirim': 'secondary',
    'Diproses': 'outline',
    'Dibatalkan': 'destructive',
    'Siap Diantar': 'default',
}

const ITEMS_PER_PAGE = 10;

export default function TransactionsPage() {
  const { transactions, products } = useApp();
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  
  const today = new Date();
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: startOfDay(today),
    to: endOfDay(today),
  });

  const [displayedCount, setDisplayedCount] = useState(ITEMS_PER_PAGE);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const handlePresetChange = (value: string) => {
    const now = new Date();
    switch (value) {
      case "all":
        setDateRange(undefined);
        break;
      case "today":
        setDateRange({ from: startOfDay(now), to: endOfDay(now) });
        break;
      case "this_week":
        setDateRange({ from: startOfWeek(now, { weekStartsOn: 1 }), to: endOfDay(now) });
        break;
      case "this_month":
        setDateRange({ from: startOfMonth(now), to: endOfDay(now) });
        break;
      case "last_2_months": {
        const twoMonthsAgo = subMonths(now, 2);
        setDateRange({ from: startOfMonth(twoMonthsAgo), to: endOfMonth(twoMonthsAgo) });
        break;
      }
      case "last_3_months": {
        const threeMonthsAgo = subMonths(now, 3);
        setDateRange({ from: startOfMonth(threeMonthsAgo), to: endOfMonth(threeMonthsAgo) });
        break;
      }
      case "this_year":
        setDateRange({ from: startOfYear(now), to: endOfDay(now) });
        break;
      default:
        break;
    }
  };


  const filteredTransactions = useMemo(() => {
    // Filter for kitchen-relevant transactions
    const kitchenTransactions = transactions
      .filter(trx => 
        trx.status === 'Selesai Diantar' &&
        Array.isArray(trx.items) &&
        trx.items.length > 0
      )
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    if (!dateRange?.from) {
      return kitchenTransactions;
    }
    const fromDate = startOfDay(dateRange.from);
    const toDate = dateRange.to ? endOfDay(dateRange.to) : endOfDay(dateRange.from);

    return kitchenTransactions.filter(trx => {
      const trxDate = new Date(trx.date);
      return trxDate >= fromDate && trxDate <= toDate;
    });
  }, [transactions, dateRange]);
  
  const paginatedTransactions = useMemo(() => {
    return filteredTransactions.slice(0, displayedCount);
  }, [filteredTransactions, displayedCount]);
  
  const summary = useMemo(() => {
    const transactionCount = filteredTransactions.length;
    return { transactionCount };
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

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      <header className="p-4 border-b">
        <div className="flex items-center gap-2">
          <History className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-bold">Riwayat Pesanan Kitchen</h1>
        </div>
        <div className="mt-4 flex flex-row gap-4">
            <Card className="flex-1 shadow-md">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Jumlah Pesanan</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xl font-bold">{summary.transactionCount}</div>
              </CardContent>
            </Card>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                id="date"
                variant={"outline"}
                className={cn("w-full justify-start text-left font-normal shadow-sm col-span-2", !dateRange && "text-muted-foreground")}
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
          <Select onValueChange={handlePresetChange} defaultValue="today">
              <SelectTrigger className="shadow-sm col-span-1">
                  <SelectValue placeholder="Pilih rentang..." />
              </SelectTrigger>
              <SelectContent>
                  <SelectItem value="all">Semua</SelectItem>
                  <SelectItem value="today">Hari Ini</SelectItem>
                  <SelectItem value="this_week">Minggu Ini</SelectItem>
                  <SelectItem value="this_month">Bulan Ini</SelectItem>
                  <SelectItem value="last_2_months">2 Bulan Lalu</SelectItem>
                  <SelectItem value="last_3_months">3 Bulan Lalu</SelectItem>
                  <SelectItem value="this_year">Tahun Ini</SelectItem>
              </SelectContent>
          </Select>
        </div>
      </header>
      
      <div className="flex-1 overflow-y-auto" ref={scrollContainerRef}>
        <div className="p-4 space-y-4">
          {paginatedTransactions.length === 0 ? (
            <div className="text-center py-20 flex flex-col items-center gap-4">
              <Frown className="w-16 h-16 text-muted-foreground" />
              <h2 className="text-xl font-semibold">Belum Ada Riwayat</h2>
              <p className="text-muted-foreground">Tidak ada riwayat pesanan pada rentang tanggal ini.</p>
            </div>
          ) : (
            paginatedTransactions.map((trx) => {
              const itemsSummary = Array.isArray(trx.items) 
                ? trx.items.map(item => `${item.productName} (x${item.quantity})`).join(', ')
                : 'Ringkasan item tidak tersedia.';

              return (
              <Card key={trx.id} className="cursor-pointer shadow-md hover:shadow-lg transition-shadow" onClick={() => setSelectedTransaction(trx)}>
                <CardHeader className="p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-base font-bold">{trx.transactionNumber}</CardTitle>
                      <CardDescription>{formatDate(new Date(trx.date))}</CardDescription>
                    </div>
                    <Badge variant={statusVariant[trx.status] || 'outline'} className={trx.status === 'Diproses' ? 'border-primary text-primary' : ''}>{trx.status}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <Separator className="mb-3" />
                  <p className="text-sm text-muted-foreground truncate">{itemsSummary}</p>
                </CardContent>
              </Card>
            )})
          )}
          {filteredTransactions.length > displayedCount && (
            <div className="space-y-4 mt-4">
              {[...Array(3)].map((_, i) => (
                <Card key={i} className="shadow-md">
                  <CardHeader className="p-4">
                    <Skeleton className="h-5 w-1/3" />
                    <Skeleton className="h-4 w-1/2 mt-1" />
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    <Separator className="mb-3" />
                    <Skeleton className="h-4 w-full" />
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
