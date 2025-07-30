
"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, KeyRound, Mail, Eye, EyeOff, Loader2 } from "lucide-react";
import type { AuthView } from "../auth-flow";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { useApp } from "@/hooks/use-app";
import { Form, FormControl, FormField, FormItem, FormMessage } from "../ui/form";
import { useToast } from "@/hooks/use-toast";

const loginSchema = z.object({
  email: z.string().email("Alamat email tidak valid"),
  password: z.string().min(6, "Password minimal 6 karakter"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage({ setView }: { setView: (view: AuthView) => void; }) {
  const { login, t } = useApp();
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const { isSubmitting } = form.formState;

  const onSubmit = async (data: LoginFormValues) => {
    try {
      const loginSuccess = await login(data.email, data.password);
      if (loginSuccess) {
          toast({
            title: t('login.success.title'),
            description: t('login.success.description'),
          });
          // AppShellManager will handle the redirect to home
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: t('login.error.title'),
        description: error.message || t('login.error.description'),
      });
      form.setValue('password', '');
    }
  };

  return (
    <div className="flex flex-col h-full p-6 justify-center">
      <div className="absolute top-4 left-4">
        <Button variant="ghost" size="icon" onClick={() => setView('welcome')}>
          <ArrowLeft />
        </Button>
      </div>
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold text-primary">{t('login.title')}</h1>
        <p className="text-muted-foreground">{t('login.description')}</p>
      </div>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <FormControl>
                    <Input id="email" type="email" placeholder={t('common.emailPlaceholder')} className="pl-10 h-12" {...field} />
                  </FormControl>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <FormControl>
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder={t('common.passwordPlaceholder')}
                      className="pl-10 h-12 pr-10"
                      {...field}
                    />
                  </FormControl>
                   <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
                        aria-label={showPassword ? t('common.hidePassword') : t('common.showPassword')}
                    >
                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" className="w-full h-14 text-lg font-bold" disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="mr-2 animate-spin" /> : null}
            {isSubmitting ? t('common.processing') : t('login.loginButton')}
          </Button>
        </form>
      </Form>
      <div className="mt-6 text-center">
        <p className="text-sm text-muted-foreground">
          {t('login.noAccount')}{' '}
          <Button variant="link" className="p-0 h-auto" onClick={() => setView('signup')}>
            {t('login.signUpNow')}
          </Button>
        </p>
      </div>
    </div>
  );
}
