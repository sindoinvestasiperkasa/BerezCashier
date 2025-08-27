
"use client";

import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronRight, User, MapPin, Settings, LogOut, Building, Warehouse, QrCode } from "lucide-react";
import type { View } from "../app-shell";
import { useApp } from "@/hooks/use-app";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";


interface AccountPageProps {
  setView: (view: View) => void;
}

export default function AccountPage({ setView }: AccountPageProps) {
  const { 
    logout, 
    user, 
    branches,
    filteredWarehouses,
    selectedBranchId, 
    setSelectedBranchId, 
    selectedWarehouseId, 
    setSelectedWarehouseId,
    t
  } = useApp();

  const menuItems = [
    { icon: User, text: t('account.editProfile'), action: () => setView('edit-profile') },
    { icon: MapPin, text: t('account.myAddress'), action: () => setView('my-address') },
    { icon: Settings, text: t('account.settings'), action: () => setView('settings') },
  ];

  const userName = user?.role === 'UMKM' ? user.ownerName : user?.name;
  const userEmail = user?.email;
  const userPhoto = user?.photoUrl;
  const nameFallback = userName ? userName.charAt(0).toUpperCase() : "U";

  const idUMKM = user?.role === 'UMKM' ? user.uid : user?.idUMKM;
  const canGenerateQr = idUMKM && selectedBranchId && selectedWarehouseId;
  
  return (
    <div className="bg-secondary/50 min-h-full pb-8">
      <div className="p-4 bg-gradient-to-b from-primary to-primary/80 text-primary-foreground rounded-b-3xl">
        <div className="flex items-center gap-4 pt-8 pb-4">
          <Avatar className="h-20 w-20 border-4 border-primary-foreground/50">
            <AvatarImage src={userPhoto} alt={userName || ''} />
            <AvatarFallback>{nameFallback}</AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-2xl font-bold">{userName || t('account.coolUser')}</h1>
            <p className="text-sm opacity-90">{userEmail || "user.keren@email.com"}</p>
          </div>
        </div>
      </div>

      <div className="p-4 -mt-6 space-y-4">
        <Card>
          <CardContent className="p-2">
            {menuItems.map((item, index) => (
              <button
                key={index}
                onClick={item.action}
                className="flex w-full items-center p-3 hover:bg-secondary rounded-lg transition-colors text-left"
              >
                <item.icon className="w-5 h-5 mr-4 text-primary" />
                <span className="flex-grow font-medium">{item.text}</span>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </button>
            ))}
          </CardContent>
        </Card>
        
        {user?.role === 'UMKM' && (
        <Card>
          <CardContent className="p-4 space-y-4">
              <h3 className="font-semibold text-lg">{t('account.operationalSettings')}</h3>
              <div className="space-y-2">
                <Label htmlFor="branch-select" className="flex items-center gap-2 text-muted-foreground">
                  <Building className="w-4 h-4"/>
                  <span>{t('account.defaultBranch')}</span>
                </Label>
                <Select value={selectedBranchId} onValueChange={setSelectedBranchId}>
                  <SelectTrigger id="branch-select">
                    <SelectValue placeholder={t('account.selectBranch')} />
                  </SelectTrigger>
                  <SelectContent>
                    {branches.map(branch => (
                      <SelectItem key={branch.id} value={branch.id}>{branch.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="warehouse-select" className="flex items-center gap-2 text-muted-foreground">
                  <Warehouse className="w-4 h-4"/>
                  <span>{t('account.defaultWarehouse')}</span>
                </Label>
                <Select value={selectedWarehouseId} onValueChange={setSelectedWarehouseId} disabled={!selectedBranchId || filteredWarehouses.length === 0}>
                  <SelectTrigger id="warehouse-select">
                    <SelectValue placeholder={t('account.selectWarehouse')} />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredWarehouses.map(wh => (
                      <SelectItem key={wh.id} value={wh.id}>{wh.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
          </CardContent>
        </Card>
        )}
        
        <Card>
          <CardContent className="p-4">
             <Button className="w-full" variant="outline" disabled={!canGenerateQr} onClick={() => setView('qr-code')}>
              <QrCode className="mr-2 h-5 w-5" />
              Tampilkan QR Code Pemesanan
            </Button>
            {!canGenerateQr && (
              <p className="text-xs text-muted-foreground mt-2 text-center">Pilih cabang dan gudang terlebih dahulu untuk membuat QR code.</p>
            )}
          </CardContent>
        </Card>

        <div>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <button
                  className="flex w-full items-center p-3 hover:bg-card rounded-lg transition-colors text-destructive text-left"
                >
                  <LogOut className="w-5 h-5 mr-4" />
                  <span className="flex-grow font-medium">{t('account.logout')}</span>
              </button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{t('account.logoutConfirmTitle')}</AlertDialogTitle>
                <AlertDialogDescription>
                  {t('account.logoutConfirmDesc')}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
                <AlertDialogAction onClick={logout} variant="destructive">
                  {t('account.logout')}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </div>
  );
}
