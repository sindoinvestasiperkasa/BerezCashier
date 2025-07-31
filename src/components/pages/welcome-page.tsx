
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

interface WelcomePageProps {
  setView: (view: AuthView) => void;
}

const slides = [
  {
    title: "Kelola Transaksi dengan Mudah",
    description: "Catat setiap penjualan dengan cepat dan akurat menggunakan antarmuka yang intuitif.",
    image: "/images/welcome/transactions.jpeg",
    hint: "cashier point of sale"
  },
  {
    title: "Manajemen Stok Real-time",
    description: "Pantau persediaan produk Anda secara langsung untuk menghindari kehabisan stok.",
    image: "/images/welcome/inventory.jpeg",
    hint: "inventory management warehouse"
  },
  {
    title: "Integrasi Stok & Keuangan",
    description: "Aplikasi kasir ini terintegrasi langsung dengan manajemen stok dan laporan keuangan Anda.",
    image: "/images/welcome/finance.jpeg",
    hint: "finance integration stock"
  },
  {
    title: "Laporan Penjualan Lengkap",
    description: "Dapatkan laporan harian, mingguan, dan bulanan untuk analisis bisnis yang lebih baik.",
    image: "/images/welcome/reports.jpeg",
    hint: "sales analytics chart"
  },
  {
    title: "Program Loyalitas Pelanggan",
    description: "Buat dan kelola promo atau diskon untuk meningkatkan loyalitas pelanggan setia Anda.",
    image: "/images/welcome/loyalty.jpeg",
    hint: "customer loyalty program"
  },
  {
    title: "Cocok untuk Berbagai Bisnis",
    description: "Sangat fleksibel untuk digunakan di toko retail, kafe, restoran, dan berbagai jenis usaha lainnya.",
    image: "/images/welcome/retail.jpeg",
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
                    <div className="flex flex-col items-center justify-center gap-6 text-center w-10/12 mx-auto">
                        <div className="p-2">
                            <Image
                                src={slide.image}
                                alt={slide.title}
                                width={300}
                                height={200}
                                className="object-cover w-full aspect-video rounded-xl shadow-2xl shadow-primary/20"
                                data-ai-hint={slide.hint}
                            />
                        </div>
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
