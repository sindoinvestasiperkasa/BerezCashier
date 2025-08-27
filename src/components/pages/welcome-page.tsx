
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
    title: "Kelola Pesanan Meja",
    description: "Catat setiap pesanan dari pelanggan dengan cepat, akurat, dan langsung dari meja.",
    image: "/images/welcome/transactions.jpeg",
    hint: "waiter taking order tablet"
  },
  {
    title: "Status Pesanan Real-time",
    description: "Pantau status setiap pesanan, dari dapur hingga meja pelanggan, secara langsung.",
    image: "/images/welcome/inventory.jpeg",
    hint: "kitchen order screen"
  },
  {
    title: "Integrasi Dapur & Kasir",
    description: "Aplikasi pelayan ini terintegrasi langsung dengan dapur dan kasir untuk alur kerja yang efisien.",
    image: "/images/welcome/finance.jpeg",
    hint: "restaurant kitchen staff"
  },
  {
    title: "Laporan Performa Lengkap",
    description: "Dapatkan laporan penjualan dan performa menu untuk analisis bisnis yang lebih baik.",
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
    title: "Cocok untuk Restoran & Kafe",
    description: "Sangat fleksibel untuk digunakan di restoran, kafe, warung kopi, dan berbagai jenis F&B lainnya.",
    image: "/images/welcome/retail.jpeg",
    hint: "cozy cafe interior"
  }
];

export default function WelcomePage({ setView }: WelcomePageProps) {
  const plugin = React.useRef(
    Autoplay({ delay: 3000, stopOnInteraction: true })
  );

  return (
    <div className="flex h-full flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm text-center flex-grow flex flex-col justify-center">
        <div>
            <h1 className="text-4xl font-bold text-primary tracking-tight">Berez Kitchen</h1>
            <p className="text-muted-foreground mt-2 mb-8">Aplikasi mobile untuk manajemen dapur Anda.</p>
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
                    <div className="w-10/12 mx-auto">
                        <div className="flex flex-col items-center justify-center gap-6 text-center">
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
        </div>
        <div className="space-y-4 mt-8">
            <Button onClick={() => setView('login')} className="w-full h-14 text-lg font-bold">
                Masuk
            </Button>
            <p className="text-sm text-muted-foreground">
                Belum punya akun?{' '}
                <a href="https://berez.id/signup" target="_blank" rel="noopener noreferrer" className="font-semibold text-primary underline-offset-4 hover:underline">
                    Daftar di sini
                </a>
            </p>
        </div>
      </div>
      <footer className="w-full text-center mt-auto flex-shrink-0 pb-4">
        <p className="text-xs text-muted-foreground">
          Dengan melanjutkan, Anda menyetujui <br />
          <Button variant="link" className="p-0 h-auto text-xs" onClick={() => setView('terms')}>Syarat & Ketentuan</Button> dan <Button variant="link" className="p-0 h-auto text-xs" onClick={() => setView('privacy')}>Kebijakan Privasi</Button> kami.
        </p>
      </footer>
    </div>
  );
}
