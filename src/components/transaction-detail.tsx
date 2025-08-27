
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
import { Package, Calendar, CreditCard, CheckCircle, Loader2, User, Percent, HandCoins, FileCog, Banknote, PlusCircle, Trash2, Minus, Plus, Search, Save, Hash, ShieldCheck } from "lucide-react";
import type { Transaction, SaleItem } from "@/providers/app-provider";
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
import type { UpdatedAccountInfo } from "@/providers/app-provider";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogClose, DialogTrigger, DialogFooter } from "./ui/dialog";
import { ScrollArea } from "./ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "./ui/alert-dialog";
import { useIsMobile } from "@/hooks/use-mobile";


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


export default function TransactionDetail({ transaction: initialTransaction, products, isOpen, onClose }: TransactionDetailProps) {
  const { updateTransactionAndPay, accounts, products: allProducts, productCategories, updateTransactionOnly, deleteTransaction } = useApp();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isAddItemDialogOpen, setIsAddItemDialogOpen] = useState(false);
  const isMobile = useIsMobile();
  
  // Local state for the transaction being edited
  const [transaction, setTransaction] = useState<Transaction | null>(initialTransaction);

  // State for editable fields
  const [discountPercent, setDiscountPercent] = useState(0);
  const [isPkp, setIsPkp] = useState(false);
  const [paymentAccountId, setPaymentAccountId] = useState<string | undefined>();
  const [salesAccountId, setSalesAccountId] = useState<string | undefined>();
  const [discountAccountId, setDiscountAccountId] = useState<string | undefined>();
  const [cogsAccountId, setCogsAccountId] = useState<string | undefined>();
  const [inventoryAccountId, setInventoryAccountId] = useState<string | undefined>();
  const [taxAccountId, setTaxAccountId] = useState<string | undefined>();

  // State for Add Item Dialog
  const [addItemSearch, setAddItemSearch] = useState("");
  
  // Populate state when transaction changes
  useEffect(() => {
    setTransaction(initialTransaction); // Reset local transaction state when prop changes
    if (initialTransaction) {
      const initialDiscountPercent = (initialTransaction.discountAmount || 0) > 0 
        ? ((initialTransaction.discountAmount || 0) / (initialTransaction.subtotal || 1)) * 100 
        : 0;

      const findAccId = (keywords: string[], category?: string) => accounts.find(a => (!category || a.category === category) && keywords.some(kw => a.name.toLowerCase().includes(kw)))?.id;
      
      setDiscountPercent(initialDiscountPercent);
      setIsPkp(initialTransaction.isPkp || false);

      setPaymentAccountId(initialTransaction.paymentAccountId || findAccId(['kas'], 'Aset'));
      setSalesAccountId(initialTransaction.salesAccountId || findAccId(['penjualan'], 'Pendapatan'));
      setDiscountAccountId(initialTransaction.discountAccountId || findAccId(['diskon penjualan', 'potongan penjualan']));
      setCogsAccountId(initialTransaction.cogsAccountId || findAccId(['harga pokok penjualan', 'hpp'], 'Beban'));
      setInventoryAccountId(initialTransaction.inventoryAccountId || findAccId(['persediaan'], 'Aset'));
      setTaxAccountId(initialTransaction.taxAccountId || findAccId(['ppn keluaran'], 'Liabilitas'));
    }
  }, [initialTransaction, accounts, isOpen]); // Rerun when dialog opens

  const subtotal = useMemo(() => transaction?.items?.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0) || 0, [transaction?.items]);
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
  
  const handleItemQuantityChange = (productId: string, newQuantity: number) => {
    setTransaction(prevTx => {
      if (!prevTx) return null;
      
      let newItems;
      if (newQuantity <= 0) {
        newItems = prevTx.items.filter(item => item.productId !== productId);
      } else {
        newItems = prevTx.items.map(item => 
          item.productId === productId ? { ...item, quantity: newQuantity } : item
        );
      }

      const newSubtotal = newItems.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
      return { ...prevTx, items: newItems, subtotal: newSubtotal };
    });
  };

  const handleAddNewItem = (product: Product) => {
    setTransaction(prevTx => {
      if (!prevTx) return null;

      const existingItem = prevTx.items.find(item => item.productId === product.id);
      let newItems;

      if (existingItem) {
        newItems = prevTx.items.map(item =>
          item.productId === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      } else {
        const newItem: SaleItem = {
          productId: product.id,
          productName: product.name,
          productType: product.productType,
          quantity: 1,
          unitPrice: product.price,
          cogs: product.hpp || 0, // Use HPP as default cogs
          imageUrl: product.imageUrls?.[0] || product.imageUrl,
        };
        newItems = [...prevTx.items, newItem];
      }
      
      const newSubtotal = newItems.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
      return { ...prevTx, items: newItems, subtotal: newSubtotal };
    });
    toast({ title: "Item Ditambahkan", description: `${product.name} telah ditambahkan ke pesanan.` });
  };
  
  const filteredProductsForDialog = useMemo(() => {
      const productsWithCategory = allProducts
        .filter(p => p.productSubType !== 'Bahan Baku' && p.name.toLowerCase().includes(addItemSearch.toLowerCase()))
        .map(p => {
            const category = productCategories?.find(c => c.id === p.categoryId);
            const categoryName = (typeof category?.name === 'object' ? category.name.id : category?.name) || 'Lain-lain';
            return { ...p, categoryName };
        });

      return productsWithCategory.reduce((acc, product) => {
          const { categoryName } = product;
          if (!acc[categoryName]) {
              acc[categoryName] = [];
          }
          acc[categoryName].push(product);
          return acc;
      }, {} as Record<string, Product[]>);
  }, [allProducts, productCategories, addItemSearch]);


  if (!transaction) {
    return null;
  }
  
  const handlePayAndSave = async () => {
    if (!transaction) return;
    setIsLoading(true);
    
    const accountInfo: UpdatedAccountInfo = {
        isPkp, paymentAccountId, salesAccountId, discountAccountId,
        cogsAccountId, inventoryAccountId, taxAccountId,
    };
    
    // Pass the entire local transaction state to be processed
    await updateTransactionAndPay(transaction, calculatedDiscountAmount, accountInfo);
    
    setIsLoading(false);
    onClose();
  };

  const handleSaveChanges = async () => {
    if (!transaction) return;
    setIsSaving(true);
    
    await updateTransactionOnly(transaction, calculatedDiscountAmount, { isPkp });
    
    setIsSaving(false);
    onClose();
  };

  const handleDelete = async () => {
    if (!transaction) return;
    setIsDeleting(true);
    const success = await deleteTransaction(transaction.id);
    if(success) {
        onClose();
    }
    setIsDeleting(false);
  }

  const isPaymentPending = transaction.paymentStatus === 'Pending' || transaction.paymentStatus === 'Gagal';
  const paymentConfig = paymentStatusConfig[transaction.paymentStatus];
  const PaymentIcon = paymentConfig?.icon || CreditCard;

  return (
    <>
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="flex flex-col p-0 max-h-[90vh] w-full" side="bottom">
        <SheetHeader className="p-4 pb-4 border-b">
          <div className="flex justify-between items-center">
            <SheetTitle className="text-xl font-bold text-left">
                Detail Transaksi
            </SheetTitle>
             {isPaymentPending && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="icon" className="h-9 w-9 flex-shrink-0" disabled={isDeleting}>
                      {isDeleting ? <Loader2 className="animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Anda yakin ingin menghapus pesanan ini?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Tindakan ini tidak dapat dibatalkan. Pesanan akan dihapus secara permanen dan stok akan dikembalikan.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Batal</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete} variant="destructive">Hapus</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
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
                    <span>{formatDate(transaction.date)}</span>
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
                    {isPaymentPending && (
                       <Button size="sm" variant="outline" onClick={() => setIsAddItemDialogOpen(true)}>
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Tambah Item
                        </Button>
                    )}
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
                              <p className="text-sm text-muted-foreground">{formatCurrency(item.unitPrice)}</p>
                          </div>
                           {isPaymentPending ? (
                            <div className="flex items-center gap-1 sm:gap-2">
                              <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => handleItemQuantityChange(item.productId, item.quantity - 1)}><Minus className="h-4 w-4" /></Button>
                              <Input value={item.quantity} className="w-10 h-7 text-center" onChange={(e) => handleItemQuantityChange(item.productId, parseInt(e.target.value) || 0)} />
                              <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => handleItemQuantityChange(item.productId, item.quantity + 1)}><Plus className="h-4 w-4" /></Button>
                            </div>
                           ) : (
                            <p className="font-semibold">{item.quantity} x</p>
                           )}
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
                <CardHeader className="p-4">
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <FileCog className="w-5 h-5 text-primary" />
                        <span>Pengaturan Akun Jurnal</span>
                    </CardTitle>
                </CardHeader>
                  <CardContent className="p-4 pt-0 space-y-3">
                      <fieldset disabled>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                             <div className='space-y-1 col-span-1 md:col-span-2'>
                                <Label>Akun Pembayaran ({transaction.paymentMethod})</Label>
                                <Select value={paymentAccountId} onValueChange={setPaymentAccountId} disabled>
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
                                 <Select value={salesAccountId} onValueChange={setSalesAccountId} disabled>
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
                                 <Select value={discountAccountId} onValueChange={setDiscountAccountId} disabled>
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
                                 <Select value={cogsAccountId} onValueChange={setCogsAccountId} disabled>
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
                                 <Select value={inventoryAccountId} onValueChange={setInventoryAccountId} disabled>
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
                                    <Select value={taxAccountId} onValueChange={setTaxAccountId} disabled>
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
                            <Switch id="pkp-detail" checked={isPkp} onCheckedChange={setIsPkp} disabled/>
                            <Label htmlFor="pkp-detail">Perusahaan Kena Pajak (PKP)</Label>
                        </div>
                      </fieldset>
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
            <div className="flex gap-2 w-full">
              <Button variant="default" className="w-full h-12" onClick={handleSaveChanges} disabled={isSaving || isLoading}>
                {isSaving ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                <span>
                  {isSaving ? 'Menyimpan...' : 'Simpan Perubahan'}
                </span>
              </Button>
            </div>
          </SheetFooter>
        )}
      </SheetContent>
    </Sheet>

    {/* Add Item Dialog */}
    <Dialog open={isAddItemDialogOpen} onOpenChange={setIsAddItemDialogOpen}>
        <DialogContent className="max-w-md flex flex-col h-[80vh]">
            <DialogHeader>
                <DialogTitle>Tambah Item ke Pesanan</DialogTitle>
                <DialogDescription>Pilih produk untuk ditambahkan ke transaksi ini.</DialogDescription>
            </DialogHeader>
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Cari produk..."
                    className="pl-10"
                    value={addItemSearch}
                    onChange={(e) => setAddItemSearch(e.target.value)}
                />
            </div>
            <ScrollArea className="flex-grow -mx-6">
                <div className="px-6 py-4 space-y-4">
                    {Object.keys(filteredProductsForDialog).length > 0 ? (
                        Object.entries(filteredProductsForDialog).map(([categoryName, productsInCategory]) => (
                            <div key={categoryName}>
                                <h3 className="font-semibold text-md mb-2 sticky top-0 bg-background py-1 -mx-1 px-1">{categoryName}</h3>
                                <div className="space-y-2">
                                    {productsInCategory.map(product => (
                                        <div 
                                            key={product.id} 
                                            className="flex items-center gap-4 p-2 rounded-lg hover:bg-secondary cursor-pointer"
                                            onClick={() => handleAddNewItem(product)}
                                        >
                                            <Image
                                                src={product.imageUrls?.[0] || 'https://placehold.co/64x64.png'}
                                                alt={product.name}
                                                width={48}
                                                height={48}
                                                className="rounded-md object-cover bg-muted"
                                            />
                                            <div className="flex-grow">
                                                <p className="font-semibold">{product.name}</p>
                                                <p className="text-sm text-primary">{formatCurrency(product.price)}</p>
                                            </div>
                                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                                <PlusCircle className="h-5 w-5 text-muted-foreground" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))
                    ) : (
                        <p className="text-center text-muted-foreground pt-10">Produk tidak ditemukan.</p>
                    )}
                </div>
            </ScrollArea>
        </DialogContent>
    </Dialog>
    </>
  );
}
