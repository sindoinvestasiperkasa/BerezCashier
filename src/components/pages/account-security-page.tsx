
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
import { FirebaseError } from 'firebase/app';
import { useApp } from "@/hooks/use-app";


interface AccountSecurityPageProps {
  setView: (view: View) => void;
}

export default function AccountSecurityPage({ setView }: AccountSecurityPageProps) {
  const { toast } = useToast();
  const auth = getAuth(app);
  const { t } = useApp();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
        toast({ title: t('common.error'), description: t('security.error.passwordMismatch'), variant: "destructive" });
        return;
    }
    
    if (newPassword.length < 6) {
        toast({ title: t('common.error'), description: t('security.error.passwordLength'), variant: "destructive" });
        return;
    }

    setIsLoading(true);

    const user = auth.currentUser;
    if (!user || !user.email) {
        toast({ title: t('common.error'), description: t('security.error.sessionInvalid'), variant: "destructive" });
        setIsLoading(false);
        return;
    }
    
    try {
        const credential = EmailAuthProvider.credential(user.email, currentPassword);
        await reauthenticateWithCredential(user, credential);
        
        await updatePassword(user, newPassword);

        toast({ title: t('common.success'), description: t('security.success.passwordUpdated') });
        setView('settings');

    } catch (error: any) {
        let description = t('security.error.unexpected');
        if (error instanceof FirebaseError) {
          if (error.code === 'auth/invalid-credential') {
              description = t('security.error.wrongPassword');
          } else if (error.code === 'auth/weak-password') {
              description = t('security.error.weakPassword');
          }
        }
        toast({ title: t('security.error.updateFailed'), description, variant: "destructive" });
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
        <h1 className="text-xl font-bold">{t('security.title')}</h1>
      </header>
      <form onSubmit={handlePasswordChange} className="p-4 flex-grow overflow-y-auto space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Lock className="w-5 h-5 text-primary" />
              <span>{t('security.changePassword')}</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="current-password">{t('security.currentPassword')}</Label>
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
              <Label htmlFor="new-password">{t('security.newPassword')}</Label>
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
              <Label htmlFor="confirm-password">{t('security.confirmNewPassword')}</Label>
              <div className="relative mt-1">
                <Input id="confirm-password" type={showNewPassword ? "text" : "password"} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required disabled={isLoading}/>
              </div>
            </div>
          </CardContent>
        </Card>
        <Button type="submit" className="w-full h-12 text-lg font-bold" disabled={isLoading}>
          {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Save className="mr-2 h-5 w-5" />}
          {isLoading ? t('common.saving') : t('common.savePassword')}
        </Button>
      </form>
    </div>
  );
}
