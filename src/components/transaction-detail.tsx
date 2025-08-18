
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
import { Package, Calendar, CreditCard, CheckCircle, Loader2, User, Percent, HandCoins, FileCog, Banknote } from "lucide-react";
import type { Transaction } from "@/providers/app-provider";
import type { Product } from "@/lib/data";
import { cn } from "@/lib/utils";
import { statusVariant, paymentStatusConfig } from "./pages/orders-page";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { Button } from "./ui/button";
import { useApp } from "@/hooks/use-app";
import { useState, useEffect, useMemo } from "react";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Switch } from "./ui/switch";

interface TransactionDetailProps {
  transaction: Transaction | null;
  products: Product[];
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

const formatDate = (date: Date) => {
    if (!date || !(date instanceof Date)) {
      return "Tanggal tidak valid";
    }
    return format(date, "d MMMM yyyy, HH:mm", { locale: id });
};


export default function TransactionDetail({ transaction, products, isOpen, onClose }: TransactionDetailProps) {
  const { updateTransactionDiscount, accounts } = useApp();
  const [isLoading, setIsLoading] = useState(false);
  
  // State for editable fields
  const [discountPercent, setDiscountPercent] = useState(0);
  const [isPkp, setIsPkp] = useState(false);
  const [paymentAccountId, setPaymentAccountId] = useState<string | undefined>();
  const [salesAccountId, setSalesAccountId] = useState<string | undefined>();
  const [discountAccountId, setDiscountAccountId] = useState<string | undefined>();
  const [cogsAccountId, setCogsAccountId] = useState<string | undefined>();
  const [inventoryAccountId, setInventoryAccountId] = useState<string | undefined>();
  const [taxAccountId, setTaxAccountId] = useState<string | undefined>();
  
  // Populate state when transaction changes
  useEffect(() => {
    if (transaction) {
      const initialDiscountPercent = (transaction.discountAmount || 0) > 0 
        ? ((transaction.discountAmount || 0) / (transaction.subtotal || 1)) * 100 
        : 0;
      setDiscountPercent(initialDiscountPercent);
      setIsPkp(transaction.isPkp || false);
      setPaymentAccountId(transaction.paymentAccountId);
      setSalesAccountId(transaction.salesAccountId);
      setDiscountAccountId(transaction.discountAccountId);
      setCogsAccountId(transaction.cogsAccountId);
      setInventoryAccountId(transaction.inventoryAccountId);
      setTaxAccountId(transaction.taxAccountId);
    }
  }, [transaction]);

  const subtotal = transaction?.subtotal || 0;
  const serviceFee = transaction?.serviceFee || 0;
  const taxRate = isPkp ? 0.11 : 0;
  
  const calculatedDiscountAmount = useMemo(() => {
    return (subtotal * discountPercent) / 100;
  }, [subtotal, discountPercent]);

  const subtotalAfterDiscount = subtotal - calculatedDiscountAmount;

  const calculatedTaxAmount = useMemo(() => {
     return subtotalAfterDiscount * taxRate;
  }, [subtotalAfterDiscount, taxRate]);

  const calculatedTotal = subtotalAfterDiscount + calculatedTaxAmount + serviceFee;
  
  const utangBiayaLayananAccount = useMemo(() => {
      return accounts.find(a => a.name.toLowerCase().includes('utang biaya layanan berez'))
  }, [accounts]);

  if (!transaction) {
    return null;
  }
  
  const handlePayAndSave = async () => {
    if (!transaction) return;
    setIsLoading(true);
    
    // Collect all account IDs from state
    const accountInfo: UpdatedAccountInfo = {
        isPkp,
        paymentAccountId,
        salesAccountId,
        discountAccountId,
        cogsAccountId,
        inventoryAccountId,
        taxAccountId,
    };
    
    await updateTransactionDiscount(
        transaction.id, 
        calculatedDiscountAmount,
        calculatedTaxAmount,
        calculatedTotal,
        accountInfo // Pass the complete account info object
    );
    
    setIsLoading(false);
    onClose(); // The listener will handle the status update visually
  };

  const isPaymentPending = transaction.paymentStatus === 'Pending' || transaction.paymentStatus === 'Gagal';
  const paymentConfig = paymentStatusConfig[transaction.paymentStatus];
  const PaymentIcon = paymentConfig?.icon || CreditCard;

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
            <div className="text-left flex items-center gap-4 text-sm pt-1 text-muted-foreground flex-wrap">
                <span className="font-mono">{transaction.transactionNumber || transaction.id}</span>
                <span className="text-xs">•</span>
                <div className="flex items-center gap-1.5">
                    <Calendar className="w-4 h-4" />
                    <span>{formatDate(transaction.date)}</span>
                </div>
                <span className="text-xs">•</span>
                <div className="flex items-center gap-1.5">
                    <User className="w-4 h-4" />
                    <span>{transaction.customerName || 'Pelanggan Umum'}</span>
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
                    {Array.isArray(transaction.items) && transaction.items.map((item, index) => {
                      const product = products.find(p => p.id === item.productId);
                      const imageUrl = item.imageUrl || product?.imageUrls?.[0] || 'https://placehold.co/64x64.png';
                      const productName = item.productName || product?.name || 'Produk tidak ditemukan';
                      
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
                              <p className="text-sm text-muted-foreground">{item.quantity} x {formatCurrency(item.unitPrice)}</p>
                          </div>
                          <p className="font-semibold">{formatCurrency(item.quantity * item.unitPrice)}</p>
                      </div>
                      )
                    })}
                </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 space-y-3">
                  <div className="flex justify-between text-muted-foreground">
                      <span>Subtotal</span>
                      <span className="font-medium text-foreground">{formatCurrency(subtotal)}</span>
                  </div>
                  
                  {isPaymentPending && (
                     <div className="flex justify-between items-center">
                        <Label htmlFor="discount-detail" className="text-muted-foreground">Diskon (%)</Label>
                        <div className="relative w-24">
                           <Input 
                              id="discount-detail" 
                              type="number" 
                              value={discountPercent || ''} 
                              onChange={(e) => setDiscountPercent(Number(e.target.value))}
                              className="w-full h-9 pr-7" 
                              placeholder='0'
                              disabled={isLoading}
                          />
                          <Percent className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        </div>
                    </div>
                  )}

                  {calculatedDiscountAmount > 0 && (
                    <div className="flex justify-between text-destructive">
                      <span>Potongan Diskon</span>
                      <span className="font-medium">- {formatCurrency(calculatedDiscountAmount)}</span>
                    </div>
                  )}
                   {calculatedTaxAmount > 0 && <div className="flex justify-between text-muted-foreground">
                      <span>Pajak (PPN 11%)</span>
                      <span className="font-medium text-foreground">{formatCurrency(calculatedTaxAmount)}</span>
                  </div>}
                   {serviceFee > 0 && <div className="flex justify-between text-muted-foreground">
                      <span className="flex items-center gap-1.5"><HandCoins className="w-4 h-4"/> Biaya Layanan</span>
                      <span className="font-medium text-foreground">{formatCurrency(serviceFee)}</span>
                  </div>}
                  <Separator/>
                  <div className="flex justify-between font-bold text-lg">
                      <span>Total</span>
                      <span>{formatCurrency(calculatedTotal)}</span>
                  </div>
              </CardContent>
            </Card>
            
            {isPaymentPending && (
              <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <FileCog className="w-5 h-5 text-primary" />
                        <span>Pengaturan Akun Jurnal</span>
                    </CardTitle>
                </CardHeader>
                  <CardContent className="p-4 pt-0 space-y-3">
                      <div className="grid grid-cols-2 gap-4">
                           <div className='space-y-1 col-span-2'>
                              <Label>Akun Pembayaran ({transaction.paymentMethod})</Label>
                              <Select value={paymentAccountId} onValueChange={setPaymentAccountId} disabled={isLoading}>
                                  <SelectTrigger><SelectValue placeholder="Pilih akun pembayaran..." /></SelectTrigger>
                                  <SelectContent>
                                      {accounts.filter(a => a.category === 'Aset' && (a.name.toLowerCase().includes('kas') || a.name.toLowerCase().includes('bank'))).map(acc => (
                                          <SelectItem key={acc.id} value={acc.id}>{acc.name} ({acc.id})</SelectItem>
                                      ))}
                                  </SelectContent>
                              </Select>
                          </div>
                          <div className='space-y-1'>
                              <Label>Akun Pendapatan</Label>
                               <Select value={salesAccountId} onValueChange={setSalesAccountId} disabled={isLoading}>
                                  <SelectTrigger><SelectValue placeholder="Pilih akun..."/></SelectTrigger>
                                  <SelectContent>
                                      {accounts.filter(a => a.category === 'Pendapatan').map(acc => (
                                          <SelectItem key={acc.id} value={acc.id}>{acc.name} ({acc.id})</SelectItem>
                                      ))}
                                  </SelectContent>
                              </Select>
                          </div>
                          <div className='space-y-1'>
                              <Label>Akun Potongan</Label>
                               <Select value={discountAccountId} onValueChange={setDiscountAccountId} disabled={isLoading}>
                                  <SelectTrigger><SelectValue placeholder="Pilih akun..."/></SelectTrigger>
                                  <SelectContent>
                                      {accounts.filter(a => a.category === 'Pendapatan' || a.category === 'Beban').map(acc => (
                                          <SelectItem key={acc.id} value={acc.id}>{acc.name} ({acc.id})</SelectItem>
                                      ))}
                                  </SelectContent>
                               </Select>
                          </div>
                          <div className='space-y-1'>
                              <Label>Akun HPP</Label>
                               <Select value={cogsAccountId} onValueChange={setCogsAccountId} disabled={isLoading}>
                                  <SelectTrigger><SelectValue placeholder="Pilih akun..."/></SelectTrigger>
                                  <SelectContent>
                                      {accounts.filter(a => a.category === 'Beban').map(acc => (
                                          <SelectItem key={acc.id} value={acc.id}>{acc.name} ({acc.id})</SelectItem>
                                      ))}
                                  </SelectContent>
                              </Select>
                          </div>
                          <div className='space-y-1'>
                              <Label>Akun Persediaan</Label>
                               <Select value={inventoryAccountId} onValueChange={setInventoryAccountId} disabled={isLoading}>
                                  <SelectTrigger><SelectValue placeholder="Pilih akun..."/></SelectTrigger>
                                  <SelectContent>
                                       {accounts.filter(a => a.category === 'Aset').map(acc => (
                                          <SelectItem key={acc.id} value={acc.id}>{acc.name} ({acc.id})</SelectItem>
                                      ))}
                                  </SelectContent>
                              </Select>
                          </div>
                           <div className='space-y-1'>
                              <Label className="text-muted-foreground">Utang Biaya Layanan</Label>
                              <Input
                                  value={utangBiayaLayananAccount ? `${utangBiayaLayananAccount.name} (${utangBiayaLayananAccount.id})` : 'Otomatis'}
                                  disabled
                                  className="bg-muted/50"
                              />
                          </div>
                          {isPkp && (
                               <div className='space-y-1'>
                                  <Label>Akun PPN Keluaran</Label>
                                  <Select value={taxAccountId} onValueChange={setTaxAccountId} disabled={isLoading}>
                                      <SelectTrigger><SelectValue placeholder="Pilih akun PPN..."/></SelectTrigger>
                                      <SelectContent>
                                          {accounts.filter(a => a.category === 'Liabilitas').map(acc => (
                                              <SelectItem key={acc.id} value={acc.id}>{acc.name} ({acc.id})</SelectItem>
                                          ))}
                                      </SelectContent>
                                  </Select>
                              </div>
                          )}
                      </div>
                      <div className="flex items-center space-x-2 mt-4">
                          <Switch id="pkp-detail" checked={isPkp} onCheckedChange={setIsPkp} disabled={isLoading}/>
                          <Label htmlFor="pkp-detail">Perusahaan Kena Pajak (PKP)</Label>
                      </div>
                  </CardContent>
              </Card>
            )}

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
        
        {isPaymentPending && (
          <SheetFooter className="p-4 border-t bg-background">
            <Button className="w-full h-12" onClick={handlePayAndSave} disabled={isLoading}>
              {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <CheckCircle className="mr-2 h-5 w-5" />}
              {isLoading ? 'Menyimpan...' : 'Simpan & Lunasi'}
            </Button>
          </SheetFooter>
        )}
      </SheetContent>
    </Sheet>
  );
}
