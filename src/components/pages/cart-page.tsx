
"use client";

import { useState, useEffect, useMemo, useCallback } from 'react';
import Image from "next/image";
import { useApp } from "@/hooks/use-app";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from '@/components/ui/input';
import { Separator } from "@/components/ui/separator";
import { ShoppingCart, Plus, Minus, Trash2, Frown, UserPlus, PauseCircle, DollarSign, History, PlayCircle, Edit, Loader2, CheckCircle, Wallet, Printer, AlertTriangle, BadgeCent, Building, Warehouse, HandCoins, Calendar, Save, Hash } from "lucide-react";
import type { View } from "../app-shell";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { ScrollArea } from '@/components/ui/scroll-area';
import { format, isSameDay } from 'date-fns';
import { id } from 'date-fns/locale';
import jsPDF from 'jspdf';
import type { Transaction, CartItem as AppCartItem, UserData, Product } from "@/providers/app-provider"; // Using types from provider
import { cn } from '@/lib/utils';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

// Data for receipt printing
interface ReceiptData {
    items: any[]; // Kept as any to match original logic for flexibility
    subtotal: number;
    discountAmount: number;
    taxAmount: number;
    serviceFee: number;
    total: number;
    paymentMethod: string;
    cashReceived: number;
    changeAmount: number;
    transactionNumber: string;
    transactionDate: Date;
    customerName: string;
}

interface CartPageProps {
  setView: (view: View) => void;
}

export default function CartPage({ setView }: CartPageProps) {
  const { 
    cart, updateQuantity, removeFromCart, clearCart, addTransaction, 
    heldCarts, holdCart, resumeCart, deleteHeldCart, 
    transactions, customers, addCustomer, accounts, user, addShiftReportNotification,
    stockLots,
    selectedBranchId, 
    selectedWarehouseId,
    saveCartAsPendingTransaction 
  } = useApp();
  const { toast } = useToast();

  const [isProcessing, setIsProcessing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [discountPercent, setDiscountPercent] = useState<number | ''>('');
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [amountReceived, setAmountReceived] = useState(0);
  const [selectedCustomerId, setSelectedCustomerId] = useState("_general_");
  const [tableNumber, setTableNumber] = useState('');
  
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isSuccessOpen, setIsSuccessOpen] = useState(false);
  const [lastTransactionForReceipt, setLastTransactionForReceipt] = useState<ReceiptData | null>(null);

  const [isHeldCartsOpen, setIsHeldCartsOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isCustomerDialogOpen, setIsCustomerDialogOpen] = useState(false);
  const [isShiftOpen, setIsShiftOpen] = useState(false);
  
  const [newCustomerName, setNewCustomerName] = useState('');
  const [newCustomerEmail, setNewCustomerEmail] = useState('');
  const [newCustomerPhone, setNewCustomerPhone] = useState('');

  const [isPkp, setIsPkp] = useState(user?.isPkp || false);
  const [paymentAccountId, setPaymentAccountId] = useState<string | undefined>();
  const [salesAccountId, setSalesAccountId] = useState<string | undefined>();
  const [discountAccountId, setDiscountAccountId] = useState<string | undefined>();
  const [cogsAccountId, setCogsAccountId] = useState<string | undefined>();
  const [inventoryAccountId, setInventoryAccountId] = useState<string | undefined>();
  const [taxAccountId, setTaxAccountId] = useState<string | undefined>();

  useEffect(() => {
    if (accounts.length > 0) {
        const findAcc = (keywords: string[], category?: string) => accounts.find(a => (!category || a.category === category) && keywords.some(kw => a.name.toLowerCase().includes(kw)));
        
        setSalesAccountId(prev => prev ?? findAcc(['penjualan produk', 'penjualan'], 'Pendapatan')?.id);
        setDiscountAccountId(prev => prev ?? findAcc(['diskon penjualan', 'potongan penjualan'])?.id);
        setCogsAccountId(prev => prev ?? findAcc(['harga pokok penjualan', 'hpp'], 'Beban')?.id);
        setInventoryAccountId(prev => prev ?? findAcc(['persediaan'], 'Aset')?.id);
        setTaxAccountId(prev => prev ?? findAcc(['ppn keluaran'], 'Liabilitas')?.id);
    }
  }, [accounts]);
  
  useEffect(() => {
      const getPaymentAccount = (method: string): string | undefined => {
        const methodLower = method.toLowerCase();
        let account = accounts.find(a => a.name.toLowerCase() === methodLower);
        if (account) return account.id;
        if (['qris', 'gopay', 'dana', 'ovo', 'transfer'].includes(methodLower)) {
            account = accounts.find(a => a.name.toLowerCase().includes('bank') || a.name.toLowerCase().includes('kas bank'));
            if (account) return account.id;
        }
        return accounts.find(a => a.name.toLowerCase().includes('kas'))?.id;
    };
    setPaymentAccountId(getPaymentAccount(paymentMethod));
  }, [paymentMethod, accounts]);


  const TAX_RATE = 0.11;

  const subtotal = useMemo(() => cart.reduce((sum, item) => sum + item.price * item.quantity, 0), [cart]);
  const discountAmount = useMemo(() => (subtotal * Number(discountPercent || 0)) / 100, [subtotal, discountPercent]);
  const subtotalAfterDiscount = useMemo(() => subtotal - discountAmount, [subtotal, discountAmount]);

  const serviceFee = useMemo(() => {
    if (!user) return 0;
    // Tiers are based on subtotal AFTER discount
    if (subtotalAfterDiscount > 10000) return user.serviceFeeTier3 || 0;
    if (subtotalAfterDiscount >= 5000) return user.serviceFeeTier2 || 0;
    if (subtotalAfterDiscount > 0) return user.serviceFeeTier1 || 0;
    return 0;
  }, [subtotalAfterDiscount, user]);

  const taxAmount = useMemo(() => isPkp ? subtotalAfterDiscount * TAX_RATE : 0, [isPkp, subtotalAfterDiscount]);
  const total = useMemo(() => subtotalAfterDiscount + taxAmount + serviceFee, [subtotalAfterDiscount, taxAmount, serviceFee]);
  const change = useMemo(() => amountReceived > total ? amountReceived - total : 0, [amountReceived, total]);

  const formatCurrency = (amount: number | undefined) => {
    if (typeof amount !== 'number' || isNaN(amount)) {
        return "RpNaN";
    }
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };
  
  const handleOpenPaymentDialog = () => {
    if (cart.length === 0) {
      toast({ title: "Keranjang Kosong", description: "Silakan tambahkan produk terlebih dahulu.", variant: "destructive" });
      return;
    }
    
    if(!selectedBranchId) {
      toast({ title: "Cabang Belum Dipilih", description: "Silakan pilih cabang default di halaman Akun.", variant: "destructive" });
      return;
    }
    if(!selectedWarehouseId) {
      toast({ title: "Gudang Belum Dipilih", description: "Silakan pilih gudang default di halaman Akun.", variant: "destructive" });
      return;
    }

    // Stock validation
    for (const cartItem of cart) {
      if (cartItem.productSubType === 'Produk Retail' || cartItem.productSubType === 'Produk Produksi') {
         const totalStockForProduct = stockLots
            .filter(lot => lot.productId === cartItem.id && lot.warehouseId === selectedWarehouseId)
            .reduce((sum, lot) => sum + lot.remainingQuantity, 0);

        if (totalStockForProduct < cartItem.quantity) {
          toast({
            title: "Stok Tidak Cukup",
            description: `Stok untuk ${cartItem.name} hanya tersisa ${totalStockForProduct}.`,
            variant: "destructive",
          });
          return;
        }
      }
    }
    
    if (paymentMethod === 'Cash' && amountReceived < total) {
      toast({ title: "Uang Tidak Cukup", description: "Uang yang diterima kurang dari total belanja.", variant: "destructive" });
      return;
    }

    const missingAccounts = [];
    if (!paymentAccountId) missingAccounts.push("Akun Pembayaran (Kas/Bank)");
    if (!salesAccountId) missingAccounts.push("Akun Pendapatan");
    if (!cogsAccountId) missingAccounts.push("Akun HPP");
    if (!inventoryAccountId) missingAccounts.push("Akun Persediaan");
    if (isPkp && !taxAccountId) missingAccounts.push("Akun PPN");
    if (discountAmount > 0 && !discountAccountId) missingAccounts.push("Akun Diskon");

    if (missingAccounts.length > 0) {
        toast({ 
            title: "Akun Belum Lengkap", 
            description: `Silakan pilih akun berikut di Pengaturan Akun: ${missingAccounts.join(', ')}.`, 
            variant: "destructive",
            duration: 9000
        });
        return;
    }

    setIsConfirmOpen(true);
  }
  
  const handleConfirmPayment = async () => {
    setIsConfirmOpen(false);
    setIsProcessing(true);

    try {
        const customer = customers.find(c => c.id === selectedCustomerId);
        const customerName = customer ? customer.name : "Pelanggan Umum";
        
        const result = await addTransaction({
            items: cart,
            subtotal,
            discountAmount,
            taxAmount,
            total,
            paymentMethod,
            customerId: selectedCustomerId,
            customerName: customerName,
            branchId: selectedBranchId!, // Pass the guaranteed non-null ID
            warehouseId: selectedWarehouseId!, // Pass the guaranteed non-null ID
            isPkp,
            paymentAccountId: paymentAccountId!,
            salesAccountId: salesAccountId!,
            cogsAccountId: cogsAccountId!,
            inventoryAccountId: inventoryAccountId!,
            discountAccountId: discountAmount > 0 ? discountAccountId : undefined,
            taxAccountId: isPkp ? taxAccountId : undefined,
            serviceFee: serviceFee,
            tableNumber: tableNumber
        });

        if (result.success) {
            setLastTransactionForReceipt({
                items: cart.map(i => ({ productName: i.name, quantity: i.quantity, unitPrice: i.price })),
                subtotal: subtotal,
                discountAmount: discountAmount,
                taxAmount: taxAmount,
                serviceFee: serviceFee,
                total: total,
                paymentMethod: paymentMethod,
                cashReceived: amountReceived,
                changeAmount: change,
                transactionNumber: result.transactionId,
                transactionDate: new Date(),
                customerName: customerName,
            });
            setIsSuccessOpen(true);
        } else {
             toast({ title: "Transaksi Gagal", description: "Terjadi kesalahan saat memproses transaksi.", variant: "destructive" });
        }
    } catch (error: any) {
        console.error(error);
        toast({ title: "Transaksi Gagal", description: error.message || "Terjadi kesalahan yang tidak terduga.", variant: "destructive" });
    } finally {
        setIsProcessing(false);
    }
  }

  const handleFinishTransaction = () => {
    setIsSuccessOpen(false);
    clearCart();
    setDiscountPercent('');
    setAmountReceived(0);
    setSelectedCustomerId("_general_");
    setTableNumber('');
    setLastTransactionForReceipt(null);
  }
  
  const handleClearCart = () => {
    clearCart();
    setTableNumber('');
    toast({
      title: 'Keranjang Dikosongkan',
      description: 'Semua item telah dihapus dari keranjang.',
    });
  }

  const handleSaveAsPending = async () => {
    if (cart.length === 0) {
      toast({ title: "Keranjang Kosong", variant: "destructive" });
      return;
    }
     if(!selectedBranchId || !selectedWarehouseId) {
      toast({ title: "Cabang/Gudang Belum Dipilih", description: "Silakan pilih di halaman Akun.", variant: "destructive" });
      return;
    }

    setIsSaving(true);
    const customer = customers.find(c => c.id === selectedCustomerId);
    
    const result = await saveCartAsPendingTransaction({
        items: cart,
        subtotal,
        discountAmount,
        taxAmount,
        total,
        customerId: selectedCustomerId,
        customerName: customer?.name || "Pelanggan Umum",
        branchId: selectedBranchId,
        warehouseId: selectedWarehouseId,
        isPkp,
        serviceFee,
        tableNumber: tableNumber,
    });

    if (result.success) {
      toast({ title: 'Pesanan Dibuat', description: `Pesanan untuk ${customer?.name || "Pelanggan Umum"} telah dibuat.` });
      clearCart();
      setDiscountPercent('');
      setAmountReceived(0);
      setSelectedCustomerId("_general_");
      setTableNumber('');
    } else {
      toast({ title: 'Gagal Membuat Pesanan', description: 'Gagal menyimpan transaksi sebagai pesanan.', variant: "destructive" });
    }
    setIsSaving(false);
  }


  const handleResumeCart = (cartId: number) => {
    const held = heldCarts.find(h => h.id === cartId);
    if(held) {
      resumeCart(held.id);
      setSelectedCustomerId(held.customerId || "_general_");
      setIsHeldCartsOpen(false);
    }
  };
  
  const handleDeleteHeldCart = (cartId: number) => {
    deleteHeldCart(cartId);
  }

  const handleAddNewCustomer = async () => {
    if (newCustomerName.trim() === '') {
        toast({ title: 'Nama tidak boleh kosong', variant: 'destructive' });
        return;
    }
    const newCustomer = await addCustomer({ 
        name: newCustomerName, 
        email: newCustomerEmail, 
        phone: newCustomerPhone 
    });
    if (newCustomer) {
        setSelectedCustomerId(newCustomer.id);
        setNewCustomerName('');
        setNewCustomerEmail('');
        setNewCustomerPhone('');
        setIsCustomerDialogOpen(false);
        toast({ title: 'Pelanggan baru ditambahkan!' });
    }
  };

  const handlePrintReceipt = () => {
    if (!lastTransactionForReceipt || !user) return;
  
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: [58, 210] 
    });
  
    const pageWidth = 58;
    const margin = 3;
    let y = 5;
  
    doc.setFont('Courier', 'bold');
    doc.setFontSize(9);
    doc.text(user.businessName || 'Toko Anda', pageWidth / 2, y, { align: 'center' });
    y += 4;
  
    doc.setFont('Courier', 'normal');
    doc.setFontSize(7);
    if(user.address) {
        const addressLines = doc.splitTextToSize(user.address, pageWidth - margin * 2);
        doc.text(addressLines, pageWidth / 2, y, { align: 'center' });
        y += addressLines.length * 3;
    }
    if(user.phone) {
        doc.text(`Telp: ${user.phone}`, pageWidth / 2, y, { align: 'center' });
        y += 4;
    }
    
    doc.text('--------------------------', pageWidth / 2, y, { align: 'center' });
    y += 4;
    
    const kasirName = user.name || 'Kasir';
    doc.text(`Kasir: ${kasirName}`, margin, y);
    y += 3;
    doc.text(`No: ${lastTransactionForReceipt.transactionNumber.substring(0,10)}`, margin, y);
    y += 3;
    doc.text(`Tgl: ${format(lastTransactionForReceipt.transactionDate, 'dd/MM/yy HH:mm')}`, margin, y);
    y += 3;
    doc.text(`Pelanggan: ${lastTransactionForReceipt.customerName}`, margin, y);
    y += 4;
  
    doc.text('--------------------------', pageWidth / 2, y, { align: 'center' });
    y += 4;
  
    lastTransactionForReceipt.items.forEach(item => {
      doc.text(item.productName, margin, y);
      y += 3;
      const itemLine = `${item.quantity} x ${item.unitPrice.toLocaleString('id-ID')}`;
      const itemTotal = (item.quantity * item.price).toLocaleString('id-ID');
      doc.text(itemLine, margin, y);
      doc.text(itemTotal, pageWidth - margin, y, { align: 'right' });
      y += 3;
    });
  
    doc.text('--------------------------', pageWidth / 2, y, { align: 'center' });
    y += 4;

    const printLine = (label: string, value: string) => {
        doc.text(label, margin, y);
        doc.text(value, pageWidth - margin, y, { align: 'right' });
        y += 3;
    };
    
    printLine('Subtotal', lastTransactionForReceipt.subtotal.toLocaleString('id-ID'));
    if(lastTransactionForReceipt.discountAmount > 0) printLine(`Diskon`, `-${lastTransactionForReceipt.discountAmount.toLocaleString('id-ID')}`);
    if(lastTransactionForReceipt.taxAmount > 0) printLine(`Pajak (11%)`, lastTransactionForReceipt.taxAmount.toLocaleString('id-ID'));
    if(lastTransactionForReceipt.serviceFee > 0) printLine(`Biaya Layanan`, lastTransactionForReceipt.serviceFee.toLocaleString('id-ID'));
    
    doc.text('--------------------------', pageWidth / 2, y, { align: 'center' });
    y += 4;

    doc.setFont('Courier', 'bold');
    printLine('TOTAL', lastTransactionForReceipt.total.toLocaleString('id-ID'));
    doc.setFont('Courier', 'normal');
    y += 1;
    doc.text('--------------------------', pageWidth / 2, y, { align: 'center' });
    y += 4;
    
    if (lastTransactionForReceipt.paymentMethod === 'Cash') {
        printLine('Tunai', lastTransactionForReceipt.cashReceived.toLocaleString('id-ID'));
        printLine('Kembali', lastTransactionForReceipt.changeAmount.toLocaleString('id-ID'));
    } else {
        printLine('Metode Bayar', lastTransactionForReceipt.paymentMethod);
    }
    
    y += 4;
    doc.setFont('Courier', 'bold');
    doc.text('Terima Kasih!', pageWidth / 2, y, { align: 'center' });
    y += 3;
    doc.text('Selamat Berbelanja Kembali', pageWidth / 2, y, { align: 'center' });
  
    doc.autoPrint();
    doc.output('dataurlnewwindow');
  };

  const handleReprintReceipt = (tx: Transaction) => {
    const itemsForReceipt = tx.items || [];
    
    const receiptData: ReceiptData = {
      items: itemsForReceipt.map(i => ({ productName: i.productName, quantity: i.quantity, unitPrice: i.unitPrice, price: i.unitPrice })),
      subtotal: tx.subtotal || 0,
      discountAmount: tx.discountAmount || 0,
      taxAmount: tx.taxAmount || 0,
      serviceFee: tx.serviceFee || 0,
      total: tx.total || 0,
      paymentMethod: tx.paymentMethod || 'N/A',
      cashReceived: tx.paidAmount || tx.total || 0,
      changeAmount: Math.max(0, (tx.paidAmount || 0) - (tx.total || 0)),
      transactionNumber: tx.transactionNumber || tx.id,
      transactionDate: new Date(tx.date),
      customerName: tx.customerName || "Pelanggan Umum",
    };
  
    setLastTransactionForReceipt(receiptData);
    setTimeout(() => handlePrintReceipt(), 100);
  };


  const transactionsToday = useMemo(() => {
    return transactions
      .filter(tx => {
        const txDate = tx.date instanceof Date ? tx.date : new Date(tx.date);
        const today = new Date();
        const isToday = isSameDay(txDate, today);
        const isCashierSale = tx.status === 'Lunas' && tx.transactionNumber?.startsWith('KSR');
        return isToday && isCashierSale;
      })
      .map(tx => {
        const debits = tx.lines?.reduce((sum, line) => sum + line.debit, 0) || 0;
        const credits = tx.lines?.reduce((sum, line) => sum + line.credit, 0) || 0;
        return {
          ...tx,
          isBalanced: Math.abs(debits - credits) < 0.01
        };
      })
      .sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions]);
  
  const todayTotal = useMemo(() => {
    return transactionsToday.reduce((sum, tx) => sum + (tx.total || 0), 0);
  }, [transactionsToday]);

  const shiftSummary = useMemo(() => {
    const cashSales = transactionsToday.filter(t => t.paymentMethod === 'Cash');
    const nonCashSales = transactionsToday.filter(t => t.paymentMethod !== 'Cash');
    return {
      totalTransactions: transactionsToday.length,
      cashRevenue: cashSales.reduce((sum, t) => sum + (t.total || 0), 0),
      nonCashRevenue: nonCashSales.reduce((sum, t) => sum + (t.total || 0), 0),
      totalRevenue: transactionsToday.reduce((sum, t) => sum + (t.total || 0), 0),
    };
  }, [transactionsToday]);
  
  const handleCloseShift = () => {
    setIsShiftOpen(false);
    addShiftReportNotification(shiftSummary);
  }

  const utangBiayaLayananAccount = useMemo(() => {
      return accounts.find(a => a.name.toLowerCase().includes('utang biaya layanan berez'))
  }, [accounts]);

  return (
    <>
    <div className="p-4 md:p-6 flex flex-col h-full bg-secondary/30">
        <header className="flex justify-between items-center pb-4">
            <h1 className="text-2xl font-bold flex items-center gap-2"><ShoppingCart className="w-6 h-6" /> Keranjang</h1>
            <Button variant="destructive" size="icon" onClick={handleClearCart} aria-label="Kosongkan Keranjang"><Trash2 className="h-4 w-4" /></Button>
        </header>

        <div className="flex-grow overflow-y-auto space-y-4 pb-[12rem]">
             <Card>
                <CardContent className="p-4 space-y-4">
                    <div>
                      <Label>Pelanggan (Wajib)</Label>
                      <div className="flex gap-2 mt-1">
                          <Select value={selectedCustomerId} onValueChange={setSelectedCustomerId}>
                              <SelectTrigger>
                                  <SelectValue placeholder="Pilih pelanggan" />
                              </SelectTrigger>
                              <SelectContent>
                                  <SelectItem value="_general_">Pelanggan Umum</SelectItem>
                                  {customers.map(customer => (
                                      <SelectItem key={customer.id} value={customer.id}>{customer.name}</SelectItem>
                                  ))}
                              </SelectContent>
                          </Select>
                          <Button variant="outline" size="icon" onClick={() => setIsCustomerDialogOpen(true)}><UserPlus className="h-5 w-5"/></Button>
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="table-number">Nomor Meja (Opsional)</Label>
                      <Input 
                          id="table-number"
                          value={tableNumber}
                          onChange={(e) => setTableNumber(e.target.value)}
                          placeholder="Contoh: 12"
                          className="mt-1"
                      />
                    </div>
                </CardContent>
            </Card>

            {cart.length === 0 ? (
                <Card className="flex flex-col items-center justify-center text-center py-16 gap-4">
                    <Frown className="w-16 h-16 text-muted-foreground" />
                    <h2 className="text-xl font-semibold">Keranjang Belanja Kosong</h2>
                    <p className="text-muted-foreground">Silakan pindai atau cari produk untuk ditambahkan.</p>
                </Card>
            ) : (
                <div className="space-y-2">
                    {cart.map((item) => (
                        <Card key={item.id} className="overflow-hidden">
                            <CardContent className="p-3 flex gap-4 items-center">
                                <div className="flex-grow">
                                    <h3 className="font-semibold">{item.name}</h3>
                                    <p className="text-primary font-bold text-sm">{formatCurrency(item.price)}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button size="icon" variant="outline" className="h-8 w-8" onClick={() => updateQuantity(item.id, item.quantity - 1)}><Minus className="h-4 w-4" /></Button>
                                    <Input value={item.quantity} className="w-12 h-8 text-center" readOnly />
                                    <Button size="icon" variant="outline" className="h-8 w-8" onClick={() => updateQuantity(item.id, item.quantity + 1)}><Plus className="h-4 w-4" /></Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
            
            <Card>
                <CardContent className="p-4 space-y-3">
                    <div className="flex justify-between items-center">
                        <span className="font-medium">Subtotal</span>
                        <span className="font-bold text-lg">{formatCurrency(subtotal)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <Label htmlFor="discount" className="text-muted-foreground">Diskon (%)</Label>
                        <Input 
                            id="discount" 
                            type="number" 
                            value={discountPercent} 
                            onChange={(e) => setDiscountPercent(e.target.value === '' ? '' : Number(e.target.value))}
                            className="w-24 h-9" 
                            placeholder='0'
                        />
                    </div>
                     <div className="flex justify-between items-center text-destructive">
                        <span className="text-sm">Potongan Diskon</span>
                        <span className="font-medium">-{formatCurrency(discountAmount)}</span>
                    </div>
                </CardContent>
            </Card>
            
            <Card>
                <CardContent className="p-4 space-y-4">
                     {serviceFee > 0 && (
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground flex items-center gap-1.5"><HandCoins className="w-4 h-4"/> Biaya Layanan</span>
                          <span className="font-medium">{formatCurrency(serviceFee)}</span>
                        </div>
                     )}
                     <div className="flex items-center space-x-2">
                        <Switch id="pkp" checked={isPkp} onCheckedChange={setIsPkp} />
                        <Label htmlFor="pkp">Perusahaan Kena Pajak (PKP)</Label>
                    </div>
                     {isPkp && (
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground">Pajak (11%)</span>
                          <span className="font-medium">{formatCurrency(taxAmount)}</span>
                        </div>
                     )}
                </CardContent>
            </Card>
        </div>
        
        <div className="fixed bottom-[4.5rem] left-1/2 -translate-x-1/2 w-full max-w-md md:max-w-2xl lg:max-w-4xl p-4 bg-background border-t">
            <div className='space-y-4'>
                <div className="flex justify-between items-center">
                  <span className="font-bold text-lg">Total</span>
                  <span className="text-2xl font-bold text-primary">{formatCurrency(total)}</span>
                </div>

                <Button className="w-full h-12 text-lg font-bold" onClick={handleSaveAsPending} disabled={cart.length === 0 || isProcessing || isSaving}>
                    {isSaving ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Save className="mr-2 h-5 w-5" />}
                    {isSaving ? 'Membuat...' : 'Buat Pesanan'}
                </Button>
            </div>
        </div>
    </div>
    
      {/* Confirmation Dialog */}
      <Dialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
          <DialogContent>
              <DialogHeader>
                  <DialogTitle>Konfirmasi Pembayaran</DialogTitle>
                  <DialogDescription>
                      Harap periksa kembali pesanan Anda sebelum melanjutkan.
                  </DialogDescription>
              </DialogHeader>
              <div className="my-4">
                  <h4 className="font-semibold mb-2">Item Pesanan:</h4>
                  <ScrollArea className="max-h-32 pr-4">
                      <div className="space-y-2">
                      {cart.map((item, index) => (
                          <div key={index} className="flex justify-between text-sm">
                              <span>{item.name} <span className="text-muted-foreground">x{item.quantity}</span></span>
                              <span>{formatCurrency(item.price * item.quantity)}</span>
                          </div>
                      ))}
                      </div>
                  </ScrollArea>
                  <Separator className="my-3"/>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                        <span>Subtotal</span>
                        <span>{formatCurrency(subtotal)}</span>
                    </div>
                     <div className="flex justify-between">
                        <span>Diskon ({Number(discountPercent || 0)}%)</span>
                        <span className="text-destructive">- {formatCurrency(discountAmount)}</span>
                    </div>
                     {isPkp && <div className="flex justify-between">
                        <span>Pajak (11%)</span>
                        <span>{formatCurrency(taxAmount)}</span>
                    </div>}
                     {serviceFee > 0 && <div className="flex justify-between">
                        <span>Biaya Layanan</span>
                        <span>{formatCurrency(serviceFee)}</span>
                    </div>}
                  </div>
                  <Separator className="my-3"/>
                   <div className="flex justify-between font-bold text-lg mt-1">
                      <span>Total</span>
                      <span>{formatCurrency(total)}</span>
                  </div>
                   <div className="flex justify-between font-semibold text-base mt-2">
                      <span>Metode Pembayaran</span>
                      <span>{paymentMethod}</span>
                  </div>
                   <div className="flex justify-between font-semibold text-base mt-1">
                      <span className="flex items-center gap-2"><Calendar className="w-4 h-4"/> Tanggal Transaksi</span>
                      <span>{format(new Date(), "d MMMM yyyy HH:mm")}</span>
                  </div>
                  {paymentMethod === 'Cash' && (
                    <>
                      <div className="flex justify-between text-sm">
                          <span>Uang Tunai</span>
                          <span>{formatCurrency(amountReceived)}</span>
                      </div>
                      <div className="flex justify-between text-sm font-semibold">
                          <span>Kembalian</span>
                          <span>{formatCurrency(change)}</span>
                      </div>
                    </>
                  )}
              </div>
              <DialogFooter>
                  <Button variant="outline" onClick={() => setIsConfirmOpen(false)}>Batal</Button>
                  <Button onClick={handleConfirmPayment}>
                    {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Konfirmasi & Bayar
                  </Button>
              </DialogFooter>
          </DialogContent>
      </Dialog>

      {/* Success Dialog */}
      <Dialog open={isSuccessOpen} onOpenChange={(open) => {
           if (!open) {
               handleFinishTransaction();
           }
       }}>
        <DialogContent className="sm:max-w-sm text-center">
            <DialogHeader>
                <DialogTitle className="text-center w-full">Pembayaran Berhasil!</DialogTitle>
            </DialogHeader>
            <div className="flex flex-col items-center justify-center p-8 space-y-4">
                <div className="animate-in fade-in zoom-in-50 duration-500">
                    <CheckCircle className="h-24 w-24 text-green-500" />
                </div>
                <p className="text-muted-foreground">Transaksi <span className="font-mono font-semibold">{lastTransactionForReceipt?.transactionNumber?.substring(0,10)}</span> berhasil disimpan.</p>
            </div>
            <DialogFooter className="sm:justify-center gap-2">
                <Button variant="outline" onClick={handleFinishTransaction}>Transaksi Baru</Button>
                <Button onClick={handlePrintReceipt}><Printer className="mr-2 h-4 w-4"/>Cetak Struk</Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
    
      {/* Held Carts Dialog */}
      <Dialog open={isHeldCartsOpen} onOpenChange={setIsHeldCartsOpen}>
        <DialogContent>
          <DialogHeader>
              <DialogTitle>Transaksi Ditahan</DialogTitle>
              <DialogDescription>Pilih transaksi untuk dilanjutkan atau hapus.</DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-96">
            <div className="p-4">
              <div className="space-y-4">
                  {heldCarts.length === 0 ? <p className="text-center text-muted-foreground">Tidak ada transaksi yang ditahan.</p> :
                      heldCarts.map(held => (
                      <div key={held.id} className="p-3 border rounded-lg flex items-center justify-between">
                          <div>
                              <p className="font-semibold">{held.customerName}</p>
                              <p className="text-sm text-muted-foreground">Ditahan pada: {format(held.heldAt, 'HH:mm')}</p>
                              <p className="text-sm text-muted-foreground">{held.cart.length} item - {formatCurrency(held.cart.reduce((sum, item) => sum + item.quantity * item.price, 0))}</p>
                          </div>
                          <div className="flex items-center gap-2">
                              <Button size="sm" variant="default" onClick={() => handleResumeCart(held.id)}>Lanjutkan</Button>
                              <Button size="sm" variant="destructive" onClick={() => handleDeleteHeldCart(held.id)}><Trash2 className="h-4 w-4"/></Button>
                          </div>
                      </div>
                  ))}
              </div>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
      
      {/* History Dialog */}
      <Dialog open={isHistoryOpen} onOpenChange={setIsHistoryOpen}>
          <DialogContent className="max-w-2xl">
              <DialogHeader><DialogTitle>Riwayat Transaksi Hari Ini</DialogTitle></DialogHeader>
              <ScrollArea className="max-h-[60vh]">
                <div className="space-y-2 py-4">
                    {transactionsToday.length === 0 ? (
                        <p className="text-center text-muted-foreground">Belum ada transaksi kasir hari ini.</p>
                     ) : (
                        transactionsToday.map(tx => (
                            <div key={tx.id} className="p-3 border rounded-lg flex justify-between items-center text-sm">
                                <div>
                                    <p className="font-mono text-xs">{tx.transactionNumber || tx.id}</p>
                                    <p className="font-semibold">{formatCurrency(tx.total)}</p>
                                    <div className="mt-1">
                                        {(tx as any).isBalanced ? (
                                            <Badge variant="outline" className="text-green-600 border-green-500"><CheckCircle className="mr-1.5 h-3 w-3"/> Seimbang</Badge>
                                        ) : (
                                            <Badge variant="destructive"><AlertTriangle className="mr-1.5 h-3 w-3"/> Tidak Seimbang</Badge>
                                        )}
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <p className="text-muted-foreground">{format(new Date(tx.date), 'HH:mm')}</p>
                                     {!(tx as any).isBalanced && (
                                        <Button size="sm" variant="secondary" onClick={() => { /* Placeholder */ }}>
                                            <Edit className="mr-2 h-4 w-4" /> Edit Akun
                                        </Button>
                                    )}
                                    <Button size="sm" variant="outline" onClick={() => handleReprintReceipt(tx)}>
                                        <Printer className="mr-2 h-4 w-4" /> Cetak Ulang
                                    </Button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
              </ScrollArea>
               <DialogFooter>
                  <div className="w-full flex justify-between items-center font-bold text-lg">
                      <span>Total:</span>
                      <span>{formatCurrency(todayTotal)}</span>
                  </div>
              </DialogFooter>
          </DialogContent>
      </Dialog>

      {/* Shift Dialog */}
      <Dialog open={isShiftOpen} onOpenChange={(open) => {
        if (!open) handleCloseShift();
        else setIsShiftOpen(true);
      }}>
        <DialogContent>
            <DialogHeader><DialogTitle>Ringkasan Shift</DialogTitle><DialogDescription>Rekapitulasi transaksi kasir Anda pada sesi ini.</DialogDescription></DialogHeader>
            <div className="space-y-4 py-4">
              <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                  <p>Total Transaksi</p>
                  <p className="font-bold text-lg">{shiftSummary.totalTransactions}</p>
              </div>
              <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                  <p>Pendapatan Tunai</p>
                  <p className="font-bold text-lg">{formatCurrency(shiftSummary.cashRevenue)}</p>
              </div>
                <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                  <p>Pendapatan Non-Tunai</p>
                  <p className="font-bold text-lg">{formatCurrency(shiftSummary.nonCashRevenue)}</p>
              </div>
              <Separator/>
              <div className="flex justify-between items-center p-3 rounded-lg text-xl font-bold">
                  <p>Total Pendapatan</p>
                  <p>{formatCurrency(shiftSummary.totalRevenue)}</p>
              </div>
            </div>
            <DialogFooter>
                <Button variant="outline" onClick={() => setIsShiftOpen(false)}>Tutup</Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* New Customer Dialog */}
      <Dialog open={isCustomerDialogOpen} onOpenChange={setIsCustomerDialogOpen}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Tambah Pelanggan Baru</DialogTitle>
                <DialogDescription>Masukkan detail pelanggan untuk menambahkannya ke daftar.</DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-4">
                <div>
                    <Label htmlFor="customer-name">Nama Pelanggan</Label>
                    <Input 
                        id="customer-name" 
                        value={newCustomerName}
                        onChange={(e) => setNewCustomerName(e.target.value)}
                        placeholder="Contoh: John Doe" 
                    />
                </div>
                 <div>
                    <Label htmlFor="customer-email">Email</Label>
                    <Input 
                        id="customer-email" 
                        type="email"
                        value={newCustomerEmail}
                        onChange={(e) => setNewCustomerEmail(e.target.value)}
                        placeholder="Contoh: john@example.com" 
                    />
                </div>
                 <div>
                    <Label htmlFor="customer-phone">Telepon</Label>
                    <Input 
                        id="customer-phone" 
                        type="tel"
                        value={newCustomerPhone}
                        onChange={(e) => setNewCustomerPhone(e.target.value)}
                        placeholder="Contoh: 081234567890" 
                    />
                </div>
            </div>
            <DialogFooter>
                <Button variant="outline" onClick={() => setIsCustomerDialogOpen(false)}>Batal</Button>
                <Button onClick={handleAddNewCustomer}>Simpan</Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
