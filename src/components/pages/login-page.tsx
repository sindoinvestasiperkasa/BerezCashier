"use client";

import { ArrowLeft, KeyRound, Mail } from "lucide-react";
import type { AuthView } from "../auth-flow";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { useApp } from "@/hooks/use-app";

interface LoginPageProps {
  setView: (view: AuthView) => void;
}

export default function LoginPage({ setView }: LoginPageProps) {
  const { login } = useApp();

  return (
    <div className="flex flex-col h-full p-6 justify-center">
       <div className="absolute top-4 left-4">
        <Button variant="ghost" size="icon" onClick={() => setView('welcome')}>
          <ArrowLeft />
        </Button>
      </div>
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold text-primary">Selamat Datang Kembali</h1>
        <p className="text-muted-foreground">Masuk untuk melanjutkan belanja.</p>
      </div>
      <div className="space-y-6">
        <div className="space-y-2 relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input id="email" type="email" placeholder="Email Anda" className="pl-10 h-12"/>
        </div>
        <div className="space-y-2 relative">
          <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input id="password" type="password" placeholder="Kata Sandi" className="pl-10 h-12"/>
        </div>
        <Button onClick={login} className="w-full h-14 text-lg font-bold">
          Masuk
        </Button>
      </div>
      <div className="mt-6 text-center">
        <p className="text-sm text-muted-foreground">
          Belum punya akun?{' '}
          <Button variant="link" className="p-0 h-auto" onClick={() => setView('signup')}>
            Daftar sekarang
          </Button>
        </p>
      </div>
    </div>
  );
}
