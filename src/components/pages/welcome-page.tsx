
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
    title: "Tampilan Pesanan Dapur",
    description: "Lihat semua pesanan masuk secara real-time di satu layar yang terorganisir.",
    image: "/images/welcome/transactions.jpeg",
    hint: "kitchen display system"
  },
  {
    title: "Manajemen Status Pesanan",
    description: "Ubah status pesanan dari 'Baru', 'Sedang Dimasak', hingga 'Siap Disajikan' dengan mudah.",
    image: "/images/welcome/inventory.jpeg",
    hint: "chef cooking order"
  },
  {
    title: "Prioritas dan Waktu Memasak",
    description: "Sistem akan menampilkan timer untuk setiap pesanan agar Anda bisa menjaga kualitas dan kecepatan.",
    image: "/images/welcome/finance.jpeg",
    hint: "restaurant kitchen timer"
  },
  {
    title: "Notifikasi Pesanan Selesai",
    description: "Beri tahu pelayan secara otomatis saat hidangan sudah siap untuk diantar ke meja pelanggan.",
    image: "/images/welcome/reports.jpeg",
    hint: "waiter picking up food"
  },
  {
    title: "Analisis Performa Menu",
    description: "Ketahui menu mana yang paling cepat atau paling lama dimasak untuk optimasi alur kerja.",
    image: "/images/welcome/loyalty.jpeg",
    hint: "food analytics chart"
  },
  {
    title: "Terhubung dengan Pelayan & Kasir",
    description: "Sinkronisasi otomatis antara dapur, pelayan, dan kasir untuk operasional yang lancar.",
    image: "/images/welcome/retail.jpeg",
    hint: "busy restaurant staff"
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
