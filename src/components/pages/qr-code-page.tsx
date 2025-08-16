
"use client";

import { ArrowLeft } from "lucide-react";
import { Button } from "../ui/button";
import type { View } from "../app-shell";
import { useApp } from "@/hooks/use-app";
import QRCode from "qrcode.react";

interface QrCodePageProps {
  setView: (view: View) => void;
}

export default function QrCodePage({ setView }: QrCodePageProps) {
  const { user, selectedBranchId, selectedWarehouseId } = useApp();

  const idUMKM = user?.role === 'UMKM' ? user.uid : user?.idUMKM;
  const canGenerateQr = idUMKM && selectedBranchId && selectedWarehouseId;
  const qrUrl = canGenerateQr 
    ? `https://user.berez.id/?idUMKM=${idUMKM}&branchId=${selectedBranchId}&warehouseId=${selectedWarehouseId}` 
    : "";

  return (
    <div className="flex flex-col h-full bg-secondary/50">
        <header className="flex items-center p-4 border-b sticky top-0 bg-background/95 backdrop-blur-sm z-10">
            <Button variant="ghost" size="icon" className="mr-2" onClick={() => setView('account')}>
            <ArrowLeft />
            </Button>
            <h1 className="text-xl font-bold">QR Code Pemesanan</h1>
        </header>
        <div className="flex-grow flex flex-col items-center justify-center p-6 text-center space-y-6">
            <div className="p-6 bg-white rounded-xl shadow-lg">
                 {canGenerateQr ? (
                    <QRCode value={qrUrl} size={256} />
                 ) : (
                    <div className="w-64 h-64 bg-muted flex items-center justify-center text-muted-foreground">
                        Data tidak lengkap
                    </div>
                 )}
            </div>
            <div>
                <h2 className="text-2xl font-bold">{user?.businessName || "Toko Anda"}</h2>
                <p className="text-muted-foreground mt-2 max-w-sm">
                    Pindai kode ini dengan kamera ponsel Anda untuk langsung membuka halaman pemesanan.
                </p>
            </div>
             <p className="text-xs text-muted-foreground text-center break-words max-w-xs">
                {qrUrl}
            </p>
        </div>
    </div>
  );
}
