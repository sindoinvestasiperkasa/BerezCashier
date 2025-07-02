"use client";

import { useState } from "react";
import { useApp } from "@/hooks/use-app";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { ArrowLeft, Landmark, QrCode, Wallet, CheckCircle } from "lucide-react";
import type { View } from "../app-shell";
import { useToast } from "@/hooks/use-toast";

interface PaymentPageProps {
  setView: (view: View) => void;
}

const paymentMethods = [
  { 
    name: "E-Wallets", 
    icon: Wallet,
    options: ["Gopay", "Dana", "OVO"]
  },
  { 
    name: "Transfer Virtual Account", 
    icon: Landmark,
    options: ["BCA Virtual Account", "Mandiri Virtual Account", "BNI Virtual Account"]
  },
  {
    name: "QRIS",
    icon: QrCode,
    options: ["Bayar dengan QRIS"]
  }
];

export default function PaymentPage({ setView }: PaymentPageProps) {
  const { cart, addTransaction, clearCart } = useApp();
  const { toast } = useToast();
  const [selectedPayment, setSelectedPayment] = useState<string | null>(null);

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 10000);

  const handlePayment = () => {
    if (!selectedPayment) {
      toast({
        title: "Pilih Pembayaran",
        description: "Silakan pilih metode pembayaran terlebih dahulu.",
        variant: "destructive"
      });
      return;
    }

    addTransaction({
      total,
      items: cart.map(item => `${item.name} (x${item.quantity})`).join(', '),
      paymentMethod: selectedPayment,
    });

    clearCart();
    
    toast({
        title: "Pembayaran Berhasil!",
        description: "Pesanan Anda sedang diproses. Terima kasih!",
    });

    setView('transactions');
  };
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="flex flex-col h-full bg-secondary/30">
      <header className="flex items-center p-4 border-b sticky top-0 bg-background/95 backdrop-blur-sm z-10">
        <Button variant="ghost" size="icon" className="mr-2" onClick={() => setView('checkout')}>
          <ArrowLeft />
        </Button>
        <h1 className="text-xl font-bold">Pilih Pembayaran</h1>
      </header>

      <div className="p-4 flex-grow overflow-y-auto">
        <Accordion type="single" collapsible className="w-full bg-card rounded-lg p-4">
          {paymentMethods.map(method => (
            <AccordionItem key={method.name} value={method.name}>
              <AccordionTrigger className="text-base">
                <div className="flex items-center gap-3">
                  <method.icon className="w-6 h-6 text-primary"/>
                  <span>{method.name}</span>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="pt-2 space-y-2">
                  {method.options.map(option => (
                    <Button 
                      key={option} 
                      variant={selectedPayment === option ? "default" : "outline"} 
                      className="w-full justify-start h-12"
                      onClick={() => setSelectedPayment(option)}
                    >
                      {selectedPayment === option && <CheckCircle className="w-5 h-5 mr-2" />}
                      {option}
                    </Button>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>

      <div className="p-4 border-t bg-background">
        <Card>
            <CardContent className="p-4 flex items-center justify-between">
                <div className="flex flex-col">
                    <span className="text-muted-foreground">Total Bayar</span>
                    <span className="font-bold text-xl text-primary">{formatCurrency(total)}</span>
                </div>
                <Button className="h-12 text-lg font-bold" onClick={handlePayment}>
                    Bayar Sekarang
                </Button>
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
