"use client";

import Image from "next/image";
import * as React from "react";
import Autoplay from "embla-carousel-autoplay";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import { Button } from "../ui/button";
import type { AuthView } from "../auth-flow";
import { Sparkles, Truck, ShieldCheck, Tag, Store, Wallet } from "lucide-react";

interface WelcomePageProps {
  setView: (view: AuthView) => void;
}

const slides = [
  {
    icon: Sparkles,
    title: "Kelola Transaksi dengan Mudah",
    description: "Catat setiap penjualan dengan cepat dan akurat menggunakan antarmuka yang intuitif.",
    image: "https://placehold.co/600x400.png",
    hint: "cashier point of sale"
  },
  {
    icon: Truck,
    title: "Manajemen Stok Real-time",
    description: "Pantau persediaan produk Anda secara langsung untuk menghindari kehabisan stok.",
    image: "https://placehold.co/600x400.png",
    hint: "inventory management warehouse"
  },
  {
    icon: Wallet,
    title: "Integrasi Stok & Keuangan",
    description: "Aplikasi kasir ini terintegrasi langsung dengan manajemen stok dan laporan keuangan Anda.",
    image: "https://placehold.co/600x400.png",
    hint: "finance integration stock"
  },
  {
    icon: ShieldCheck,
    title: "Laporan Penjualan Lengkap",
    description: "Dapatkan laporan harian, mingguan, dan bulanan untuk analisis bisnis yang lebih baik.",
    image: "https://placehold.co/600x400.png",
    hint: "sales analytics chart"
  },
  {
    icon: Tag,
    title: "Program Loyalitas Pelanggan",
    description: "Buat dan kelola promo atau diskon untuk meningkatkan loyalitas pelanggan setia Anda.",
    image: "https://placehold.co/600x400.png",
    hint: "customer loyalty program"
  },
  {
    icon: Store,
    title: "Cocok untuk Berbagai Bisnis",
    description: "Sangat fleksibel untuk digunakan di toko retail, kafe, restoran, dan berbagai jenis usaha lainnya.",
    image: "https://placehold.co/600x400.png",
    hint: "small business storefront"
  }
];

export default function WelcomePage({ setView }: WelcomePageProps) {
  const plugin = React.useRef(
    Autoplay({ delay: 3000, stopOnInteraction: true })
  );

  return (
    <div className="flex flex-col h-full">
      <div className="flex-grow flex items-center justify-center p-6">
        <div className="w-full max-w-xs text-center">
            <h1 className="text-4xl font-bold text-primary tracking-tight">Berez Cashier</h1>
            <p className="text-muted-foreground mt-2 mb-8">Aplikasi mobile untuk kasir Anda.</p>
            <Carousel 
              className="w-full" 
              opts={{ loop: true }}
              plugins={[plugin.current]}
              onMouseEnter={plugin.current.stop}
              onMouseLeave={plugin.current.reset}
            >
              <CarouselContent>
                {slides.map((slide, index) => (
                  <CarouselItem key={index}>
                    <div className="p-1">
                        <div className="flex flex-col items-center justify-center gap-6 text-center">
                            <Image
                                src={slide.image}
                                alt={slide.title}
                                width={300}
                                height={200}
                                className="rounded-xl object-cover aspect-video"
                                data-ai-hint={slide.hint}
                            />
                            <div className="space-y-2">
                                <h2 className="text-2xl font-bold flex items-center justify-center gap-2">
                                    <slide.icon className="w-7 h-7 text-primary"/>
                                    {slide.title}
                                </h2>
                                <p className="text-muted-foreground">
                                    {slide.description}
                                </p>
                            </div>
                        </div>
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
            </Carousel>
        </div>
      </div>
      <div className="p-6 space-y-4">
        <Button onClick={() => setView('signup')} className="w-full h-14 text-lg font-bold">
            Buat Akun Baru
        </Button>
        <Button onClick={() => setView('login')} variant="outline" className="w-full h-14 text-lg font-bold">
            Masuk
        </Button>
      </div>
    </div>
  );
}
