
"use client";

import { ArrowLeft, Edit, Frown } from "lucide-react";
import { Button } from "../ui/button";
import type { View } from "../app-shell";
import { Card, CardContent } from "../ui/card";
import { useApp } from "@/hooks/use-app";

interface MyAddressPageProps {
  setView: (view: View) => void;
}

export default function MyAddressPage({ setView }: MyAddressPageProps) {
  const { user } = useApp();

  const userName = user?.role === 'UMKM' ? user.ownerName : user?.name;

  return (
    <div className="flex flex-col h-full">
      <header className="flex items-center p-4 border-b sticky top-0 bg-background/95 backdrop-blur-sm z-10">
        <Button variant="ghost" size="icon" className="mr-2" onClick={() => setView('account')}>
          <ArrowLeft />
        </Button>
        <h1 className="text-xl font-bold">Alamat Saya</h1>
      </header>
      <div className="p-4 space-y-4 flex-grow overflow-y-auto">
        {user?.address ? (
          <Card>
              <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                      <div>
                          <p className="font-semibold">{userName || "Pengguna"}</p>
                          <p className="text-sm text-muted-foreground">{user.phone || "Nomor telepon tidak diatur"}</p>
                          <p className="text-sm text-muted-foreground mt-2">{user.address}</p>
                      </div>
                      <Button variant="link" className="text-primary p-0 h-auto" onClick={() => setView('edit-profile')}>
                        <div className="flex items-center gap-1">
                          <Edit className="w-4 h-4"/>
                          Ubah
                        </div>
                      </Button>
                  </div>
              </CardContent>
          </Card>
        ) : (
          <Card className="text-center p-8">
            <CardContent className="flex flex-col items-center gap-4">
              <Frown className="w-16 h-16 text-muted-foreground" />
              <h2 className="text-xl font-semibold">Alamat Belum Diatur</h2>
              <p className="text-muted-foreground max-w-xs">
                Anda belum mengatur alamat. Silakan tambahkan alamat Anda.
              </p>
              <Button onClick={() => setView('edit-profile')}>
                <Edit className="mr-2 h-4 w-4" />
                Atur Alamat Sekarang
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
