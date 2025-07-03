"use client";

import Image from "next/image";
import { useApp } from "@/hooks/use-app";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ShoppingCart, Plus, Minus, Trash2, Frown } from "lucide-react";
import type { View } from "../app-shell";

interface CartPageProps {
  setView: (view: View) => void;
}

export default function CartPage({ setView }: CartPageProps) {
  const { cart, updateQuantity, removeFromCart } = useApp();

  const subtotal = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const shipping = cart.length > 0 ? 10000 : 0;
  const total = subtotal + shipping;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="p-4 md:p-6 flex flex-col h-full">
      <div className="flex items-center gap-2 mb-6">
        <ShoppingCart className="w-6 h-6 text-primary" />
        <h1 className="text-2xl font-bold">Keranjang Saya</h1>
      </div>

      {cart.length === 0 ? (
        <div className="flex-grow flex flex-col items-center justify-center text-center py-20 gap-4">
          <Frown className="w-16 h-16 text-muted-foreground" />
          <h2 className="text-xl font-semibold">Keranjang Belanja Kosong</h2>
          <p className="text-muted-foreground">Cari produk dan tambahkan ke keranjang!</p>
        </div>
      ) : (
        <div className="flex-grow lg:grid lg:grid-cols-3 lg:gap-8 lg:items-start">
          <div className="lg:col-span-2 space-y-4">
            {cart.map((item) => (
              <Card key={item.id} className="overflow-hidden">
                <CardContent className="p-3 flex gap-4 items-center">
                  <Image
                    src={item.imageUrl}
                    alt={item.name}
                    width={80}
                    height={80}
                    className="rounded-md object-cover"
                    data-ai-hint="product image"
                  />
                  <div className="flex-grow">
                    <h3 className="font-semibold">{item.name}</h3>
                    <p className="text-primary font-bold">{formatCurrency(item.price)}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <Button
                        size="icon"
                        variant="outline"
                        className="h-7 w-7"
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <span className="w-8 text-center font-bold">{item.quantity}</span>
                      <Button
                        size="icon"
                        variant="outline"
                        className="h-7 w-7"
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="text-muted-foreground hover:text-destructive self-start"
                    onClick={() => removeFromCart(item.id)}
                  >
                    <Trash2 className="h-5 w-5" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="mt-6 lg:mt-0 lg:col-span-1">
            <Card className="lg:sticky lg:top-6">
                <CardContent className="p-4 space-y-3">
                    <h2 className="text-lg font-bold mb-2">Ringkasan Belanja</h2>
                    <div className="flex justify-between text-muted-foreground">
                        <span>Subtotal</span>
                        <span className="font-medium text-foreground">{formatCurrency(subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                        <span>Ongkos Kirim</span>
                        <span className="font-medium text-foreground">{formatCurrency(shipping)}</span>
                    </div>
                    <Separator/>
                    <div className="flex justify-between font-bold text-lg">
                        <span>Total</span>
                        <span>{formatCurrency(total)}</span>
                    </div>
                    <Button className="w-full mt-4 h-12 text-lg font-bold" onClick={() => setView('checkout')}>
                        Lanjut ke Checkout
                    </Button>
                </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
