
"use client";

import { useState } from "react";
import { ArrowLeft, KeyRound, Lock, Eye, EyeOff, Loader2, Save } from "lucide-react";
import { Button } from "../ui/button";
import type { View } from "../app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useApp } from "@/hooks/use-app";
import { useToast } from "@/hooks/use-toast";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "../ui/form";
import { Input } from "../ui/input";
import { FirebaseError } from "firebase/app";

interface AccountSecurityPageProps {
  setView: (view: View) => void;
}

const passwordSchema = z.object({
  currentPassword: z.string().min(1, "Kata sandi saat ini diperlukan."),
  newPassword: z.string().min(6, "Kata sandi baru minimal 6 karakter."),
  confirmPassword: z.string()
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Konfirmasi kata sandi tidak cocok.",
  path: ["confirmPassword"],
});

type PasswordFormValues = z.infer<typeof passwordSchema>;

export default function AccountSecurityPage({ setView }: AccountSecurityPageProps) {
  const { changePassword } = useApp();
  const { toast } = useToast();
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  const form = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: ""
    }
  });

  const { isSubmitting } = form.formState;

  const onSubmit = async (data: PasswordFormValues) => {
    try {
      await changePassword(data.currentPassword, data.newPassword);
      toast({
        title: "Berhasil!",
        description: "Kata sandi Anda telah berhasil diperbarui."
      });
      form.reset();
    } catch (error: any) {
      if (error instanceof FirebaseError && error.code === 'auth/invalid-credential') {
        toast({
          variant: "destructive",
          title: "Gagal Mengubah Kata Sandi",
          description: "Kata sandi saat ini yang Anda masukkan salah. Silakan coba lagi."
        });
      } else {
        toast({
          variant: "destructive",
          title: "Gagal",
          description: error.message || "Terjadi kesalahan yang tidak terduga. Silakan coba lagi."
        });
      }
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
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="p-4 flex-grow overflow-y-auto space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Lock className="w-5 h-5 text-primary" />
                <span>Ubah Kata Sandi</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="currentPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Kata Sandi Saat Ini</FormLabel>
                    <div className="relative">
                      <FormControl>
                        <Input type={showCurrentPassword ? "text" : "password"} {...field} />
                      </FormControl>
                      <button
                        type="button"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground hover:text-foreground"
                      >
                        {showCurrentPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="newPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Kata Sandi Baru</FormLabel>
                     <div className="relative">
                      <FormControl>
                        <Input type={showNewPassword ? "text" : "password"} {...field} />
                      </FormControl>
                       <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground hover:text-foreground"
                      >
                        {showNewPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Konfirmasi Kata Sandi Baru</FormLabel>
                    <FormControl>
                      <Input type={showNewPassword ? "text" : "password"} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>
           <Button type="submit" className="w-full h-12 text-lg font-bold" disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Save className="mr-2 h-5 w-5" />}
            Simpan Kata Sandi
          </Button>
        </form>
      </Form>
    </div>
  );
}
