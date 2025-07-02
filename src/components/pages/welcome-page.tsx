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
import { Sparkles, Truck, ShieldCheck, Tag, Store } from "lucide-react";

interface WelcomePageProps {
  setView: (view: AuthView) => void;
}

const slides = [
  {
    icon: Sparkles,
    title: "Belanja Mudah & Cepat",
    description: "Temukan ribuan produk kebutuhan harian dengan kualitas terbaik dalam satu aplikasi.",
    image: "https://placehold.co/600x400.png",
    hint: "groceries online"
  },
  {
    icon: Truck,
    title: "Pengiriman Super Cepat",
    description: "Pesanan Anda akan kami antar langsung ke depan pintu Anda dengan cepat dan aman.",
    image: "https://placehold.co/600x400.png",
    hint: "delivery scooter"
  },
  {
    icon: ShieldCheck,
    title: "Kualitas Terjamin",
    description: "Kami hanya menyediakan produk segar dan berkualitas tinggi untuk kepuasan Anda.",
    image: "https://placehold.co/600x400.png",
    hint: "fresh vegetables"
  },
  {
    icon: Tag,
    title: "Promo & Diskon Menarik",
    description: "Dapatkan penawaran terbaik dan diskon spesial setiap hari untuk belanja lebih hemat.",
    image: "https://placehold.co/600x400.png",
    hint: "special offer"
  },
  {
    icon: Store,
    title: "Dukung Produk Lokal",
    description: "Dengan berbelanja di WarungQ, Anda turut mendukung pertumbuhan petani dan produsen lokal.",
    image: "https://placehold.co/600x400.png",
    hint: "local market"
  }
];

export default function WelcomePage({ setView }: WelcomePageProps) {
  const plugin = React.useRef(
    Autoplay({ delay: 3000, stopOnInteraction: true })
  );

  return (
    <div className="flex flex-col h-full">
      <div className="flex-grow flex flex-col items-center justify-center text-center p-6">
        <Carousel 
          className="w-full max-w-xs" 
          opts={{ loop: true }}
          plugins={[plugin.current]}
          onMouseEnter={plugin.current.stop}
          onMouseLeave={plugin.current.reset}
        >
          <CarouselContent>
            {slides.map((slide, index) => (
              <CarouselItem key={index}>
                <div className="p-1">
                    <div className="flex flex-col items-center justify-center gap-6">
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
      <div className="p-6 space-y-4 border-t">
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
