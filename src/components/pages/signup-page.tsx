"use client";

import { ArrowLeft, User, Mail, KeyRound } from "lucide-react";
import type { AuthView } from "../auth-flow";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { useApp } from "@/hooks/use-app";

interface SignupPageProps {
  setView: (view: AuthView) => void;
}

export default function SignupPage({ setView }: SignupPageProps) {
  const { login } = useApp(); // Simulate login after signup

  return (
    <div className="flex flex-col h-full p-6 justify-center">
      <div className="absolute top-4 left-4">
        <Button variant="ghost" size="icon" onClick={() => setView('welcome')}>
          <ArrowLeft />
        </Button>
      </div>
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold text-primary">Buat Akun Baru</h1>
        <p className="text-muted-foreground">Daftar untuk mulai belanja kebutuhanmu.</p>
      </div>
      <div className="space-y-6">
        <div className="space-y-2 relative">
          <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input id="fullname" placeholder="Nama Lengkap" className="pl-10 h-12"/>
        </div>
        <div className="space-y-2 relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input id="email" type="email" placeholder="Email Anda" className="pl-10 h-12"/>
        </div>
        <div className="space-y-2 relative">
          <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input id="password" type="password" placeholder="Buat Kata Sandi" className="pl-10 h-12"/>
        </div>
        <Button onClick={login} className="w-full h-14 text-lg font-bold">
          Daftar
        </Button>
      </div>
      <div className="mt-6 text-center">
        <p className="text-sm text-muted-foreground">
          Sudah punya akun?{' '}
          <Button variant="link" className="p-0 h-auto" onClick={() => setView('login')}>
            Masuk di sini
          </Button>
        </p>
      </div>
    </div>
  );
}
