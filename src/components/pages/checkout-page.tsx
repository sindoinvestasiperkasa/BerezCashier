"use client";

import Image from "next/image";
import { useApp } from "@/hooks/use-app";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, MapPin, Edit, Package } from "lucide-react";
import type { View } from "../app-shell";

interface CheckoutPageProps {
  setView: (view: View) => void;
}

export default function CheckoutPage({ setView }: CheckoutPageProps) {
  const { cart } = useApp();

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
    <div className="flex flex-col h-full">
      <header className="flex items-center p-4 border-b sticky top-0 bg-background/95 backdrop-blur-sm z-10">
        <Button variant="ghost" size="icon" className="mr-2" onClick={() => setView('cart')}>
          <ArrowLeft />
        </Button>
        <h1 className="text-xl font-bold">Konfirmasi Pesanan</h1>
      </header>

      <div className="p-4 space-y-4 flex-grow overflow-y-auto">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-lg">
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-primary" />
                <span>Alamat Pengiriman</span>
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Edit className="w-4 h-4" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-semibold">User Keren</p>
            <p className="text-muted-foreground text-sm">Jl. Jenderal Sudirman No. 123, Apartemen Cendana, Tower A / 12A, Jakarta Pusat, DKI Jakarta, 10220</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Package className="w-5 h-5 text-primary" />
              <span>Ringkasan Pesanan</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {cart.map(item => (
              <div key={item.id} className="flex items-center gap-4">
                <Image 
                  src={item.imageUrl} 
                  alt={item.name} 
                  width={64} 
                  height={64} 
                  className="rounded-md object-cover"
                  data-ai-hint="product image"
                />
                <div className="flex-grow">
                  <p className="font-semibold">{item.name}</p>
                  <p className="text-sm text-muted-foreground">{item.quantity} x {formatCurrency(item.price)}</p>
                </div>
                <p className="font-semibold">{formatCurrency(item.quantity * item.price)}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="p-4 border-t mt-auto bg-background">
        <Card>
          <CardContent className="p-4 space-y-3">
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
              <Button className="w-full mt-4 h-12 text-lg font-bold" onClick={() => setView('payment')}>
                  Pilih Metode Pembayaran
              </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
