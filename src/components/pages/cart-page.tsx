
"use client";

import { useState, useEffect } from 'react';
import Image from "next/image";
import { useApp } from "@/hooks/use-app";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from '@/components/ui/input';
import { Separator } from "@/components/ui/separator";
import { ShoppingCart, Plus, Minus, Trash2, Frown, UserPlus, PauseCircle, DollarSign, History, PlayCircle, Edit, Loader2, CheckCircle, Wallet, Printer } from "lucide-react";
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
import { format } from 'date-fns';
import jsPDF from 'jspdf';
import type { Transaction } from "@/providers/app-provider";

interface CartPageProps {
  setView: (view: View) => void;
}

interface ReceiptData {
    items: any[];
    subtotal: number;
    discountAmount: number;
    taxAmount: number;
    total: number;
    paymentMethod: string;
    cashReceived: number;
    changeAmount: number;
    transactionNumber: string;
    transactionDate: Date;
}


export default function CartPage({ setView }: CartPageProps) {
  const { cart, updateQuantity, removeFromCart, clearCart, addTransaction, heldCarts, holdCart, resumeCart, deleteHeldCart, transactions, customers, addCustomer, accounts, user } = useApp();
  const { toast } = useToast();

  const [isProcessing, setIsProcessing] = useState(false);
  const [discountPercent, setDiscountPercent] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [amountReceived, setAmountReceived] = useState(0);
  const [selectedCustomerId, setSelectedCustomerId] = useState("_general_");
  
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isSuccessOpen, setIsSuccessOpen] = useState(false);
  const [lastTransactionForReceipt, setLastTransactionForReceipt] = useState<ReceiptData | null>(null);

  const [isHeldCartsOpen, setIsHeldCartsOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isCustomerDialogOpen, setIsCustomerDialogOpen] = useState(false);
  
  const [newCustomerName, setNewCustomerName] = useState('');
  const [newCustomerEmail, setNewCustomerEmail] = useState('');
  const [newCustomerPhone, setNewCustomerPhone] = useState('');

  const [isPkp, setIsPkp] = useState(false);
  const [paymentAccountId, setPaymentAccountId] = useState<string | undefined>();
  const [salesAccountId, setSalesAccountId] = useState<string | undefined>();
  const [discountAccountId, setDiscountAccountId] = useState<string | undefined>();
  const [cogsAccountId, setCogsAccountId] = useState<string | undefined>();
  const [inventoryAccountId, setInventoryAccountId] = useState<string | undefined>();
  const [taxAccountId, setTaxAccountId] = useState<string | undefined>();

  useEffect(() => {
    if (accounts.length > 0) {
        // Find and set default accounts with specific names, with fallbacks
        const findAcc = (keywords: string[], category?: string) => accounts.find(a => (!category || a.category === category) && keywords.some(kw => a.name.toLowerCase().includes(kw)));
        
        setSalesAccountId(prev => prev ?? findAcc(['penjualan produk'], 'Pendapatan')?.id);
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
            account = accounts.find(a => a.name.toLowerCase().includes('bank') || a.name.toLowerCase().includes('kas digital'));
            if (account) return account.id;
        }
        return accounts.find(a => a.name.toLowerCase().includes('kas'))?.id;
    };
    setPaymentAccountId(getPaymentAccount(paymentMethod));
  }, [paymentMethod, accounts]);


  const TAX_RATE = 0.11;

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const discountAmount = (subtotal * discountPercent) / 100;
  const taxableAmount = subtotal - discountAmount;
  const taxAmount = isPkp ? taxableAmount * TAX_RATE : 0;
  const total = taxableAmount + taxAmount;
  const change = amountReceived > total ? amountReceived - total : 0;

  const formatCurrency = (amount: number) => {
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
        
        const cartItemsForTransaction = cart.map(item => ({
            productId: item.id,
            productName: item.name,
            productType: item.productType,
            quantity: item.quantity,
            unitPrice: item.price,
            cogs: item.hpp || 0,
            attributeValues: [], // Add attribute values if they exist on the item
        }));

        const result = await addTransaction({
            items: cartItemsForTransaction,
            subtotal,
            discountAmount,
            taxAmount,
            total,
            paymentMethod,
            customerId: selectedCustomerId,
            customerName: customerName,
            isPkp,
            paymentAccountId: paymentAccountId!,
            salesAccountId: salesAccountId!,
            cogsAccountId: cogsAccountId!,
            inventoryAccountId: inventoryAccountId!,
            discountAccountId: discountAmount > 0 ? discountAccountId : undefined,
            taxAccountId: isPkp ? taxAccountId : undefined,
        });

        if (result.success) {
            setLastTransactionForReceipt({
                items: cartItemsForTransaction,
                subtotal: subtotal,
                discountAmount: discountAmount,
                taxAmount: taxAmount,
                total: total,
                paymentMethod: paymentMethod,
                cashReceived: amountReceived,
                changeAmount: change,
                transactionNumber: result.transactionId,
                transactionDate: new Date(),
            });
            setIsSuccessOpen(true);
        } else {
             toast({ title: "Transaksi Gagal", description: "Terjadi kesalahan saat memproses transaksi.", variant: "destructive" });
        }
    } catch (error) {
        console.error(error);
        toast({ title: "Transaksi Gagal", description: "Terjadi kesalahan yang tidak terduga.", variant: "destructive" });
    } finally {
        setIsProcessing(false);
    }
  }

  const handleFinishTransaction = () => {
    setIsSuccessOpen(false);
    clearCart();
    setDiscountPercent(0);
    setAmountReceived(0);
    setSelectedCustomerId("_general_");
    setLastTransactionForReceipt(null);
  }
  
  const handleClearCart = () => {
    clearCart();
    toast({
      title: 'Keranjang Dikosongkan',
      description: 'Semua item telah dihapus dari keranjang.',
    });
  }

  const handleHoldCart = () => {
    if (cart.length === 0) return;
    const customer = customers.find(c => c.id === selectedCustomerId);
    const customerName = customer ? customer.name : "Pelanggan Umum";
    holdCart(customerName, selectedCustomerId);
    setDiscountPercent(0);
    setAmountReceived(0);
    setSelectedCustomerId("_general_");
  };

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
      format: [58, 210] // Standard thermal receipt paper width
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
    y += 4;
  
    doc.text('--------------------------', pageWidth / 2, y, { align: 'center' });
    y += 4;
  
    lastTransactionForReceipt.items.forEach(item => {
      doc.text(item.productName, margin, y);
      y += 3;
      const itemLine = `${item.quantity} x ${item.unitPrice.toLocaleString('id-ID')}`;
      const itemTotal = (item.quantity * item.unitPrice).toLocaleString('id-ID');
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
    // Make sure we have the necessary fields, providing defaults if they are missing
    const items = tx.items || [];
    const subtotal = items.reduce((sum, item) => sum + (item.unitPrice || 0) * item.quantity, 0);
    const taxAmount = tx.taxAmount || 0;
    const discountAmount = tx.discountAmount || 0;
    const totalAmount = tx.amount || 0;
    const paidAmount = tx.paidAmount || totalAmount;
  
    const receiptData: ReceiptData = {
      items: items.map(item => ({
        ...item,
        unitPrice: item.unitPrice || item.price, // Fallback to price for safety
      })),
      subtotal,
      discountAmount,
      taxAmount,
      total: totalAmount,
      paymentMethod: tx.paymentMethod || 'N/A',
      cashReceived: paidAmount,
      changeAmount: Math.max(0, paidAmount - totalAmount),
      transactionNumber: tx.id,
      transactionDate: new Date(tx.date),
    };
  
    setLastTransactionForReceipt(receiptData);
    // Use a short timeout to ensure state is set before printing
    setTimeout(() => handlePrintReceipt(), 100);
  };


  const transactionsToday = transactions.filter(tx => {
    const txDate = new Date(tx.date);
    const today = new Date();
    return txDate.getDate() === today.getDate() &&
           txDate.getMonth() === today.getMonth() &&
           txDate.getFullYear() === today.getFullYear();
  });
  
  const selectedCustomerName = customers.find(c => c.id === selectedCustomerId)?.name || 'Pelanggan Umum';

  return (
    <>
    <div className="p-4 md:p-6 flex flex-col h-full bg-secondary/30">
        <header className="flex justify-between items-center pb-4">
            <h1 className="text-2xl font-bold flex items-center gap-2"><ShoppingCart className="w-6 h-6" /> Keranjang</h1>
            <Button variant="destructive" size="icon" onClick={handleClearCart} aria-label="Kosongkan Keranjang"><Trash2 className="h-4 w-4" /></Button>
        </header>

        <div className="grid grid-cols-2 gap-2 mb-4">
            <Button variant="outline" className="relative" onClick={() => setIsHeldCartsOpen(true)}>
                <PlayCircle className="mr-2 h-4 w-4" />
                Transaksi Ditahan
                {heldCarts.length > 0 && <Badge className="absolute -top-2 -right-2 px-2">{heldCarts.length}</Badge>}
            </Button>
            <Button variant="outline" onClick={() => setIsHistoryOpen(true)}>
                <History className="mr-2 h-4 w-4" />
                Riwayat Hari Ini
            </Button>
            <Button variant="outline">
                 <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="mr-2 h-4 w-4"
                >
                    <path d="M12 22h6a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v1" />
                    <path d="m7 14 5-5 5 5" />
                    <path d="M12 19V9" />
                    <path d="M12 2v4" />
                    <path d="M18 2v4" />
                    <path d="M6 2v4" />
                    <path d="M2 12h20" />
                </svg>
                Tutup Shift
            </Button>
            <Button variant="outline" onClick={handleHoldCart}>
                <PauseCircle className="mr-2 h-4 w-4" />
                Tahan Transaksi
            </Button>
        </div>


        <div className="flex-grow overflow-y-auto space-y-4 pb-64">
            <Card>
                <CardContent className="p-4">
                    <Label>Pelanggan</Label>
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
                            onChange={(e) => setDiscountPercent(Number(e.target.value))}
                            className="w-24 h-9" 
                            placeholder='0'
                        />
                    </div>
                     <div className="flex justify-between items-center text-red-500">
                        <span className="text-sm">Potongan Diskon</span>
                        <span className="font-medium">-{formatCurrency(discountAmount)}</span>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardContent className="p-4">
                    <h3 className="font-semibold mb-3">Pengaturan Akun</h3>
                    <div className="grid grid-cols-2 gap-4">
                        <div className='space-y-1'>
                            <Label>Akun Pendapatan</Label>
                             <Select value={salesAccountId} onValueChange={setSalesAccountId}>
                                <SelectTrigger><SelectValue placeholder="Pilih akun..."/></SelectTrigger>
                                <SelectContent>
                                    {accounts.filter(a => a.category === 'Pendapatan').map(acc => (
                                        <SelectItem key={acc.id} value={acc.id}>{acc.name} ({acc.id})</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className='space-y-1'>
                            <Label>Akun Potongan Penjualan</Label>
                             <Select value={discountAccountId} onValueChange={setDiscountAccountId}>
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
                             <Select value={cogsAccountId} onValueChange={setCogsAccountId}>
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
                             <Select value={inventoryAccountId} onValueChange={setInventoryAccountId}>
                                <SelectTrigger><SelectValue placeholder="Pilih akun..."/></SelectTrigger>
                                <SelectContent>
                                     {accounts.filter(a => a.category === 'Aset').map(acc => (
                                        <SelectItem key={acc.id} value={acc.id}>{acc.name} ({acc.id})</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        {isPkp && (
                             <div className='space-y-1 col-span-2'>
                                <Label>Akun PPN Keluaran</Label>
                                <Select value={taxAccountId} onValueChange={setTaxAccountId}>
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
                        <Switch id="pkp" checked={isPkp} onCheckedChange={setIsPkp}/>
                        <Label htmlFor="pkp">Perusahaan Kena Pajak (PKP)</Label>
                    </div>
                </CardContent>
            </Card>
        </div>
        
        <div className="fixed bottom-[4.5rem] left-1/2 -translate-x-1/2 w-full max-w-md md:max-w-2xl lg:max-w-4xl p-4 bg-background border-t space-y-4">
             <div className="space-y-3">
                <div className="flex justify-between items-center">
                    <Label>Metode Pembayaran</Label>
                    <RadioGroup defaultValue="Cash" className="flex" onValueChange={setPaymentMethod}>
                        <div className="flex items-center space-x-2"><RadioGroupItem value="Cash" id="cash" /><Label htmlFor="cash">Cash</Label></div>
                        <div className="flex items-center space-x-2"><RadioGroupItem value="Transfer" id="transfer" /><Label htmlFor="transfer">Transfer</Label></div>
                        <div className="flex items-center space-x-2"><RadioGroupItem value="QRIS" id="qris" /><Label htmlFor="qris">QRIS</Label></div>
                    </RadioGroup>
                </div>
                {paymentMethod === 'Cash' && <div className='flex justify-between items-center'>
                    <Label htmlFor="received">Uang Diterima</Label>
                    <Input id="received" type="number" placeholder='0' className="w-40 text-right" value={amountReceived || ''} onChange={(e) => setAmountReceived(Number(e.target.value))} />
                </div>}
                <Separator />
                 {isPkp && (
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Pajak (11%)</span>
                      <span className="font-medium">{formatCurrency(taxAmount)}</span>
                    </div>
                 )}
                 {paymentMethod === 'Cash' && <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Kembalian</span>
                  <span className="text-lg font-bold">{formatCurrency(change)}</span>
                </div>}
                <div className="flex justify-between items-center">
                  <span className="font-bold text-lg">Total</span>
                  <span className="text-2xl font-bold text-primary">{formatCurrency(total)}</span>
                </div>
            </div>

            <div className="flex gap-4">
                <Button variant="outline" className="h-12 text-md font-bold flex-1" onClick={handleHoldCart} disabled={cart.length === 0 || isProcessing}>
                    <PauseCircle className="mr-2 h-5 w-5" />
                    Tahan
                </Button>
                <Button className="w-full h-12 text-lg font-bold flex-[2]" onClick={handleOpenPaymentDialog} disabled={cart.length === 0 || isProcessing}>
                    {isProcessing ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Wallet className="mr-2 h-5 w-5" />}
                    {isProcessing ? 'Memproses...' : 'Bayar'}
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
                        <span>Diskon ({discountPercent}%)</span>
                        <span className="text-destructive">- {formatCurrency(discountAmount)}</span>
                    </div>
                     {isPkp && <div className="flex justify-between">
                        <span>Pajak (11%)</span>
                        <span>{formatCurrency(taxAmount)}</span>
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
          <DialogHeader>
            <DialogTitle>Riwayat Transaksi Hari Ini</DialogTitle>
            <DialogDescription>Daftar semua transaksi yang berhasil hari ini.</DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh]">
            <div className="space-y-2 py-4">
              {transactionsToday.length === 0 ? (
                <p className="text-center text-muted-foreground">Belum ada transaksi kasir hari ini.</p>
              ) : (
                transactionsToday.map(tx => (
                  <div key={tx.id} className="p-3 border rounded-lg flex justify-between items-center text-sm">
                    <div>
                      <p className="font-mono text-xs">{tx.id}</p>
                      <p className="font-semibold">{formatCurrency(tx.amount || 0)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <p className="text-muted-foreground">{format(new Date(tx.date), 'HH:mm')}</p>
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
              <span>{formatCurrency(transactionsToday.reduce((sum, tx) => sum + (tx.amount || 0), 0))}</span>
            </div>
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

    
    

    




    

    