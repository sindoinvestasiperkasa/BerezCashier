
"use client";

import { useState } from "react";
import { ArrowLeft, KeyRound, Lock, Eye, EyeOff, Loader2, Save } from "lucide-react";
import { Button } from "../ui/button";
import type { View } from "../app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { useToast } from "@/hooks/use-toast";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { getAuth, EmailAuthProvider, reauthenticateWithCredential, updatePassword } from 'firebase/auth';
import { app } from "@/lib/firebase";


interface AccountSecurityPageProps {
  setView: (view: View) => void;
}

export default function AccountSecurityPage({ setView }: AccountSecurityPageProps) {
  const { toast } = useToast();
  const auth = getAuth(app);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
        toast({ title: "Gagal", description: "Konfirmasi kata sandi baru tidak cocok.", variant: "destructive" });
        return;
    }
    
    if (newPassword.length < 6) {
        toast({ title: "Gagal", description: "Kata sandi baru minimal 6 karakter.", variant: "destructive" });
        return;
    }

    setIsLoading(true);

    const user = auth.currentUser;
    if (!user || !user.email) {
        toast({ title: "Gagal", description: "Sesi Anda tidak valid. Silakan login kembali.", variant: "destructive" });
        setIsLoading(false);
        // Di sini kita tidak punya akses ke `logout`, tapi bisa mengarahkan ke halaman login
        // atau membiarkan AppProvider menanganinya. Untuk sekarang, kita hanya stop prosesnya.
        return;
    }
    
    try {
        const credential = EmailAuthProvider.credential(user.email, currentPassword);
        await reauthenticateWithCredential(user, credential);
        
        await updatePassword(user, newPassword);

        toast({ title: "Berhasil", description: "Kata sandi Anda telah berhasil diperbarui." });
        setView('settings');

    } catch (error: any) {
        console.error("Password change error:", error.code, error.message);
        let description = "Terjadi kesalahan yang tidak terduga. Silakan coba lagi.";
        if (error.code === 'auth/invalid-credential') {
            description = "Kata sandi saat ini yang Anda masukkan salah.";
        } else if (error.code === 'auth/weak-password') {
            description = "Kata sandi baru terlalu lemah. Gunakan minimal 6 karakter.";
        }
        toast({ title: "Gagal Mengubah Kata Sandi", description, variant: "destructive" });
    } finally {
        setIsLoading(false);
    }
  };


  return (
    <div className="flex flex-col h-full">
      <header className="flex items-center p-4 border-b sticky top-0 bg-background/95 backdrop-blur-sm z-10">
        <Button variant="ghost" size="icon" className="mr-2" onClick={() => setView('settings')}>
          <ArrowLeft />
        </Button>
        <h1 className="text-xl font-bold">Keamanan Akun</h1>
      </header>
      <form onSubmit={handlePasswordChange} className="p-4 flex-grow overflow-y-auto space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Lock className="w-5 h-5 text-primary" />
              <span>Ubah Kata Sandi</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="current-password">Kata Sandi Saat Ini</Label>
              <div className="relative mt-1">
                <Input id="current-password" type={showCurrentPassword ? "text" : "password"} value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required disabled={isLoading} />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground hover:text-foreground"
                >
                  {showCurrentPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>
            <div>
              <Label htmlFor="new-password">Kata Sandi Baru</Label>
               <div className="relative mt-1">
                  <Input id="new-password" type={showNewPassword ? "text" : "password"} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required disabled={isLoading}/>
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground hover:text-foreground"
                  >
                    {showNewPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
              </div>
            </div>
            <div>
              <Label htmlFor="confirm-password">Konfirmasi Kata Sandi Baru</Label>
              <div className="relative mt-1">
                <Input id="confirm-password" type={showNewPassword ? "text" : "password"} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required disabled={isLoading}/>
              </div>
            </div>
          </CardContent>
        </Card>
        <Button type="submit" className="w-full h-12 text-lg font-bold" disabled={isLoading}>
          {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Save className="mr-2 h-5 w-5" />}
          {isLoading ? 'Menyimpan...' : 'Simpan Kata Sandi'}
        </Button>
      </form>
    </div>
  );
}
