

"use client";

import { useState } from 'react';
import Image from "next/image";
import { useApp } from "@/hooks/use-app";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from '@/components/ui/input';
import { Separator } from "@/components/ui/separator";
import { ShoppingCart, Plus, Minus, Trash2, Frown, UserPlus, PauseCircle, DollarSign, History, Settings2, PlayCircle, Edit } from "lucide-react";
import type { View } from "../app-shell";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Label } from '../ui/label';
import { Switch } from '../ui/switch';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '../ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { ScrollArea } from '../ui/scroll-area';
import { format } from 'date-fns';

interface CartPageProps {
  setView: (view: View) => void;
}

export default function CartPage({ setView }: CartPageProps) {
  const { cart, updateQuantity, removeFromCart, clearCart, addTransaction, heldCarts, holdCart, resumeCart, deleteHeldCart, transactions, customers, addCustomer, accounts } = useApp();
  const { toast } = useToast();

  const [discountPercent, setDiscountPercent] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [amountReceived, setAmountReceived] = useState(0);
  const [selectedCustomerId, setSelectedCustomerId] = useState("_general_");
  const [isHeldCartsOpen, setIsHeldCartsOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isCustomerDialogOpen, setIsCustomerDialogOpen] = useState(false);
  
  const [newCustomerName, setNewCustomerName] = useState('');
  const [newCustomerEmail, setNewCustomerEmail] = useState('');
  const [newCustomerPhone, setNewCustomerPhone] = useState('');

  const [isPkp, setIsPkp] = useState(false);
  const [salesAccountId, setSalesAccountId] = useState<string>();
  const [discountAccountId, setDiscountAccountId] = useState<string>();
  const [cogsAccountId, setCogsAccountId] = useState<string>();
  const [inventoryAccountId, setInventoryAccountId] = useState<string>();
  const [taxAccountId, setTaxAccountId] = useState<string>();

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
  
  const handlePayment = () => {
    if (cart.length === 0) {
      toast({
        title: "Keranjang Kosong",
        description: "Silakan tambahkan produk terlebih dahulu.",
        variant: "destructive"
      });
      return;
    }
    
    if (paymentMethod === 'Cash' && amountReceived < total) {
      toast({
        title: "Uang Tidak Cukup",
        description: "Uang yang diterima kurang dari total belanja.",
        variant: "destructive"
      });
      return;
    }

    addTransaction({
      total,
      items: cart,
      paymentMethod: paymentMethod,
    });

    clearCart();
    setDiscountPercent(0);
    setAmountReceived(0);
    setSelectedCustomerId("_general_");
    
    toast({
        title: "Transaksi Berhasil!",
        description: "Transaksi telah berhasil disimpan.",
    });
  }
  
  const handleClearCart = () => {
    clearCart();
    toast({
      title: 'Keranjang Dikosongkan',
      description: 'Semua item telah dihapus dari keranjang.',
      variant: 'destructive',
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
                <Button variant="outline" className="h-12 text-md font-bold flex-1" onClick={handleHoldCart} disabled={cart.length === 0}>
                    <PauseCircle className="mr-2 h-5 w-5" />
                    Tahan
                </Button>
                <Button className="w-full h-12 text-lg font-bold flex-[2]" onClick={handlePayment} disabled={cart.length === 0}>
                    <DollarSign className="mr-2 h-5 w-5" />
                    Bayar
                </Button>
            </div>
        </div>
    </div>
    
      {/* Held Carts Dialog */}
      <Dialog open={isHeldCartsOpen} onOpenChange={setIsHeldCartsOpen}>
        <DialogContent>
          <DialogHeader>
              <DialogTitle>Transaksi Ditahan</DialogTitle>
              <DialogDescription>Pilih transaksi untuk dilanjutkan atau hapus.</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <ScrollArea className="max-h-96">
                <div className="space-y-4 px-4">
                    {heldCarts.length === 0 ? <p className="text-center text-muted-foreground">Tidak ada transaksi yang ditahan.</p> :
                        heldCarts.map(held => (
                        <div key={held.id} className="p-3 border rounded-lg flex items-center justify-between">
                            <div>
                                <p className="font-semibold">{held.customerName}</p>
                                <p className="text-sm">Ditahan pada: {format(held.heldAt, 'HH:mm')}</p>
                                <p className="text-sm">{held.cart.length} item - {formatCurrency(held.cart.reduce((sum, item) => sum + item.quantity * item.price, 0))}</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <Button size="sm" variant="default" onClick={() => handleResumeCart(held.id)}>Lanjutkan</Button>
                                <Button size="sm" variant="destructive" onClick={() => handleDeleteHeldCart(held.id)}><Trash2 className="h-4 w-4"/></Button>
                            </div>
                        </div>
                    ))}
                </div>
            </ScrollArea>
          </div>
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
                      <p className="font-semibold">{formatCurrency(tx.total)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <p className="text-muted-foreground">{format(new Date(tx.date), 'HH:mm')}</p>
                      <Button size="sm" variant="outline">
                        <Edit className="mr-2 h-4 w-4" /> Cetak Ulang
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
              <span>{formatCurrency(transactionsToday.reduce((sum, tx) => sum + tx.total, 0))}</span>
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



    