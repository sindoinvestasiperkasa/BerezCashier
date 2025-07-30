
"use client";

import { ArrowLeft, User, Mail, Phone, Building, Save, Loader2 } from "lucide-react";
import { Button } from "../ui/button";
import type { View } from "../app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { useApp } from "@/hooks/use-app";
import { useForm, SubmitHandler } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "../ui/form";
import { Textarea } from "../ui/textarea";

interface EditProfilePageProps {
  setView: (view: View) => void;
}

const profileSchema = z.object({
  name: z.string().min(1, 'Nama tidak boleh kosong'),
  email: z.string().email('Email tidak valid'),
  phone: z.string().optional(),
  address: z.string().optional(),
  businessName: z.string().optional(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export default function EditProfilePage({ setView }: EditProfilePageProps) {
  const { user, updateUserData } = useApp();
  const { toast } = useToast();

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      address: '',
      businessName: '',
    },
  });

  const { formState: { isSubmitting } } = form;

  useEffect(() => {
    if (user) {
      form.reset({
        name: user.role === 'UMKM' ? user.ownerName : user.name,
        email: user.email,
        phone: user.phone,
        address: user.address,
        businessName: user.businessName,
      });
    }
  }, [user, form]);
  
  const onSubmit: SubmitHandler<ProfileFormValues> = async (data) => {
    const dataToUpdate = {
        email: data.email,
        phone: data.phone,
        address: data.address,
        businessName: data.businessName,
        ...(user?.role === 'UMKM' ? { ownerName: data.name } : { name: data.name }),
    };

    const success = await updateUserData(dataToUpdate);

    if (success) {
      toast({
        title: "Profil Diperbarui",
        description: "Informasi profil Anda telah berhasil disimpan.",
      });
      setView('account');
    } else {
      toast({
        variant: "destructive",
        title: "Gagal Menyimpan",
        description: "Terjadi kesalahan saat memperbarui profil Anda.",
      });
    }
  };

  return (
    <div className="flex flex-col h-full">
      <header className="flex items-center p-4 border-b sticky top-0 bg-background/95 backdrop-blur-sm z-10">
        <Button variant="ghost" size="icon" className="mr-2" onClick={() => setView('account')}>
          <ArrowLeft />
        </Button>
        <h1 className="text-xl font-bold">Edit Profil</h1>
      </header>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="p-4 space-y-4 flex-grow overflow-y-auto">
          <Card>
              <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                      <User className="w-5 h-5 text-primary" />
                      <span>Informasi Pribadi & Bisnis</span>
                  </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nama Lengkap</FormLabel>
                        <FormControl>
                          <Input placeholder="Nama Anda" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                   <FormField
                    control={form.control}
                    name="businessName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nama Bisnis</FormLabel>
                        <FormControl>
                          <Input placeholder="Nama Bisnis Anda" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="email@anda.com" {...field} disabled />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nomor Telepon</FormLabel>
                        <FormControl>
                          <Input type="tel" placeholder="08123456789" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                   <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Alamat</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Alamat lengkap Anda" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
              </CardContent>
          </Card>
          <Button type="submit" className="w-full h-12 text-lg font-bold" disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Save className="mr-2 h-5 w-5" />}
            Simpan Perubahan
          </Button>
        </form>
      </Form>
    </div>
  );
}
