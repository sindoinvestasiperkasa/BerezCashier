
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
    image: "https://images.unsplash.com/photo-1556740738-b6a63e27c4df?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    hint: "cashier point of sale"
  },
  {
    icon: Truck,
    title: "Manajemen Stok Real-time",
    description: "Pantau persediaan produk Anda secara langsung untuk menghindari kehabisan stok.",
    image: "https://images.unsplash.com/photo-1586528116311-06924151d15a?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    hint: "inventory management warehouse"
  },
  {
    icon: Wallet,
    title: "Integrasi Stok & Keuangan",
    description: "Aplikasi kasir ini terintegrasi langsung dengan manajemen stok dan laporan keuangan Anda.",
    image: "https://images.unsplash.com/photo-1553729459-efe14ef6055d?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    hint: "finance integration stock"
  },
  {
    icon: ShieldCheck,
    title: "Laporan Penjualan Lengkap",
    description: "Dapatkan laporan harian, mingguan, dan bulanan untuk analisis bisnis yang lebih baik.",
    image: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    hint: "sales analytics chart"
  },
  {
    icon: Tag,
    title: "Program Loyalitas Pelanggan",
    description: "Buat dan kelola promo atau diskon untuk meningkatkan loyalitas pelanggan setia Anda.",
    image: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    hint: "customer loyalty program"
  },
  {
    icon: Store,
    title: "Cocok untuk Berbagai Bisnis",
    description: "Sangat fleksibel untuk digunakan di toko retail, kafe, restoran, dan berbagai jenis usaha lainnya.",
    image: "https://images.unsplash.com/photo-1556740772-1a741367b93e?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    hint: "small business storefront"
  }
];

export default function WelcomePage({ setView }: WelcomePageProps) {
  const plugin = React.useRef(
    Autoplay({ delay: 3000, stopOnInteraction: true })
  );

  return (
    <div className="flex h-full items-center justify-center p-6">
      <div className="w-full max-w-sm text-center">
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
                        <slide.icon className="w-16 h-16 text-primary stroke-1"/>
                        <Image
                            src={slide.image}
                            alt={slide.title}
                            width={300}
                            height={200}
                            className="rounded-xl object-cover aspect-video"
                            data-ai-hint={slide.hint}
                        />
                        <div className="space-y-2">
                            <h2 className="text-2xl font-bold">
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
        <div className="space-y-4 mt-8">
            <Button onClick={() => setView('signup')} className="w-full h-14 text-lg font-bold">
                Buat Akun Baru
            </Button>
            <Button onClick={() => setView('login')} variant="outline" className="w-full h-14 text-lg font-bold">
                Masuk
            </Button>
        </div>
      </div>
    </div>
  );
}
