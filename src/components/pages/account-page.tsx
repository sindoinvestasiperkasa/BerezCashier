"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronRight, User, MapPin, Settings, LogOut, Building, Warehouse } from "lucide-react";
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
    warehouses,
    selectedBranchId, 
    setSelectedBranchId, 
    selectedWarehouseId, 
    setSelectedWarehouseId 
  } = useApp();

  const menuItems = [
    { icon: User, text: "Edit Profil", action: () => setView('edit-profile') },
    { icon: MapPin, text: "Alamat Saya", action: () => setView('my-address') },
    { icon: Settings, text: "Pengaturan", action: () => setView('settings') },
  ];

  const userName = user?.role === 'UMKM' ? user.ownerName : user?.name;
  const userEmail = user?.email;
  const userPhoto = user?.photoUrl;
  const nameFallback = userName ? userName.charAt(0).toUpperCase() : "U";


  return (
    <div className="bg-secondary/50 min-h-full">
      <div className="p-4 bg-gradient-to-b from-primary to-primary/80 text-primary-foreground rounded-b-3xl">
        <div className="flex items-center gap-4 pt-8 pb-4">
          <Avatar className="h-20 w-20 border-4 border-primary-foreground/50">
            <AvatarImage src={userPhoto} alt={userName || ''} />
            <AvatarFallback>{nameFallback}</AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-2xl font-bold">{userName || "User Keren"}</h1>
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
        
        <Card>
          <CardContent className="p-4 space-y-4">
              <h3 className="font-semibold text-lg">Pengaturan Operasional</h3>
              <div className="space-y-2">
                <Label htmlFor="branch-select" className="flex items-center gap-2 text-muted-foreground">
                  <Building className="w-4 h-4"/>
                  <span>Cabang Default</span>
                </Label>
                <Select value={selectedBranchId} onValueChange={setSelectedBranchId}>
                  <SelectTrigger id="branch-select">
                    <SelectValue placeholder="Pilih cabang..." />
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
                  <span>Gudang Default</span>
                </Label>
                <Select value={selectedWarehouseId} onValueChange={setSelectedWarehouseId}>
                  <SelectTrigger id="warehouse-select">
                    <SelectValue placeholder="Pilih gudang..." />
                  </SelectTrigger>
                  <SelectContent>
                    {warehouses.map(wh => (
                      <SelectItem key={wh.id} value={wh.id}>{wh.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
          </CardContent>
        </Card>

        <div>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <button
                  className="flex w-full items-center p-3 hover:bg-card rounded-lg transition-colors text-destructive text-left"
                >
                  <LogOut className="w-5 h-5 mr-4" />
                  <span className="flex-grow font-medium">Keluar</span>
              </button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Anda yakin ingin keluar?</AlertDialogTitle>
                <AlertDialogDescription>
                  Anda akan dikembalikan ke halaman login dan perlu masuk kembali untuk mengakses akun Anda.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Batal</AlertDialogCancel>
                <AlertDialogAction onClick={logout} variant="destructive">
                  Keluar
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </div>
  );
}
