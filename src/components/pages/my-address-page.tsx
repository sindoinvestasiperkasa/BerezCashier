"use client";

import { ArrowLeft, MapPin, Plus } from "lucide-react";
import { Button } from "../ui/button";
import type { View } from "../app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";

interface MyAddressPageProps {
  setView: (view: View) => void;
}

export default function MyAddressPage({ setView }: MyAddressPageProps) {
  return (
    <div className="flex flex-col h-full">
      <header className="flex items-center p-4 border-b sticky top-0 bg-background/95 backdrop-blur-sm z-10">
        <Button variant="ghost" size="icon" className="mr-2" onClick={() => setView('account')}>
          <ArrowLeft />
        </Button>
        <h1 className="text-xl font-bold">Alamat Saya</h1>
      </header>
      <div className="p-4 space-y-4 flex-grow overflow-y-auto">
        <Card>
            <CardContent className="p-4">
                <div className="flex justify-between items-start">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                           <p className="font-semibold">Rumah</p>
                           <Badge>Utama</Badge>
                        </div>
                        <p className="text-sm font-medium">User Keren</p>
                        <p className="text-sm text-muted-foreground">081234567890</p>
                        <p className="text-sm text-muted-foreground mt-2">Jl. Jenderal Sudirman No. 123, Apartemen Cendana, Tower A / 12A, Jakarta Pusat, DKI Jakarta, 10220</p>
                    </div>
                    <Button variant="link" className="text-primary p-0 h-auto">Ubah</Button>
                </div>
            </CardContent>
        </Card>
        <Button variant="outline" className="w-full h-12 text-md font-bold">
            <Plus className="mr-2 h-5 w-5"/>
            Tambah Alamat Baru
        </Button>
      </div>
    </div>
  );
}
