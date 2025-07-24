"use client";

import { useState } from 'react';
import Image from "next/image";
import { useApp } from "@/hooks/use-app";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from '@/components/ui/input';
import { Separator } from "@/components/ui/separator";
import { ShoppingCart, Plus, Minus, Trash2, Frown, UserPlus, PauseCircle } from "lucide-react";
import type { View } from "../app-shell";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Label } from '../ui/label';
import { Switch } from '../ui/switch';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { useToast } from '@/hooks/use-toast';

interface CartPageProps {
  setView: (view: View) => void;
}

export default function CartPage({ setView }: CartPageProps) {
  const { cart, updateQuantity, removeFromCart, clearCart, addTransaction } = useApp();
  const { toast } = useToast();

  const [discountPercent, setDiscountPercent] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [amountReceived, setAmountReceived] = useState(0);

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const discountAmount = (subtotal * discountPercent) / 100;
  const total = subtotal - discountAmount;
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

    addTransaction({
      total,
      items: cart,
      paymentMethod: paymentMethod,
    });

    clearCart();
    setDiscountPercent(0);
    setAmountReceived(0);
    
    toast({
        title: "Transaksi Berhasil!",
        description: "Transaksi telah berhasil disimpan.",
    });

    // Optional: navigate to transactions page
    // setView('transactions');
  }
  
  const handleClearCart = () => {
    clearCart();
    toast({
      title: 'Keranjang Dikosongkan',
      description: 'Semua item telah dihapus dari keranjang.',
      variant: 'destructive',
    });
  }

  return (
    <div className="p-4 md:p-6 flex flex-col h-full bg-secondary/30">
        <header className="flex justify-between items-center pb-4">
            <h1 className="text-2xl font-bold flex items-center gap-2"><ShoppingCart className="w-6 h-6" /> Keranjang</h1>
            <div className='flex items-center gap-2'>
                <Button variant="outline"><PauseCircle className="mr-2 h-4 w-4" /> Tahan Transaksi</Button>
                <Button variant="destructive" size="icon" onClick={handleClearCart}><Trash2 className="h-4 w-4" /></Button>
            </div>
        </header>
        
        <div className="flex-grow overflow-y-auto space-y-4 pb-28">
            <Card>
                <CardContent className="p-4">
                    <Label>Pelanggan</Label>
                    <div className="flex gap-2 mt-1">
                        <Select defaultValue="umum">
                            <SelectTrigger>
                                <SelectValue placeholder="Pilih pelanggan" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="umum">Pelanggan Umum</SelectItem>
                                <SelectItem value="member1">Member Satu</SelectItem>
                            </SelectContent>
                        </Select>
                        <Button variant="outline" size="icon"><UserPlus className="h-5 w-5"/></Button>
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
                             <Select defaultValue="4.1.1">
                                <SelectTrigger><SelectValue/></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="4.1.1">Penjualan Produk (4.1.1)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className='space-y-1'>
                            <Label>Akun Potongan Penjualan</Label>
                             <Select><SelectTrigger><SelectValue placeholder="Pilih akun..."/></SelectTrigger></Select>
                        </div>
                        <div className='space-y-1'>
                            <Label>Akun HPP</Label>
                             <Select defaultValue="5.1.9">
                                <SelectTrigger><SelectValue/></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="5.1.9">Harga Pokok Penjualan (HPP) (5.1.9)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className='space-y-1'>
                            <Label>Akun Persediaan</Label>
                             <Select defaultValue="1.1.4">
                                <SelectTrigger><SelectValue/></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="1.1.4">Persediaan (1.1.4)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <div className="flex items-center space-x-2 mt-4">
                        <Switch id="pkp" />
                        <Label htmlFor="pkp">Perusahaan Kena Pajak (PKP)</Label>
                    </div>
                </CardContent>
            </Card>
        </div>
        
        <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md md:max-w-2xl lg:max-w-4xl p-4 bg-background border-t">
            <div className="grid grid-cols-2 gap-4">
                <div className='space-y-2'>
                    <Label>Metode Pembayaran</Label>
                    <RadioGroup defaultValue="Cash" className="flex" onValueChange={setPaymentMethod}>
                        <div className="flex items-center space-x-2"><RadioGroupItem value="Cash" id="cash" /><Label htmlFor="cash">Cash</Label></div>
                        <div className="flex items-center space-x-2"><RadioGroupItem value="Transfer" id="transfer" /><Label htmlFor="transfer">Transfer</Label></div>
                    </RadioGroup>
                    
                    <div className='space-y-1 pt-1'>
                        <Label htmlFor="received">Uang Diterima</Label>
                        <Input id="received" type="number" placeholder='0' value={amountReceived || ''} onChange={(e) => setAmountReceived(Number(e.target.value))} />
                    </div>
                </div>

                <div className='space-y-2'>
                    <div className='text-right'>
                        <p className="text-muted-foreground">Total</p>
                        <p className="text-2xl font-bold text-primary">{formatCurrency(total)}</p>
                    </div>
                    <div className='text-right'>
                        <p className="text-muted-foreground">Kembalian</p>
                        <p className="text-lg font-bold">{formatCurrency(change)}</p>
                    </div>
                </div>
            </div>
            <Separator className='my-3'/>
            <Button className="w-full h-12 text-lg font-bold" onClick={handlePayment}>
                Bayar
            </Button>
        </div>
    </div>
  );
}
