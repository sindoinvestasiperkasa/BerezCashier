
"use client";

import { useRef } from 'react';
import { ArrowLeft, Download, Share2 } from "lucide-react";
import { Button } from "../ui/button";
import type { View } from "../app-shell";
import { useApp } from "@/hooks/use-app";
import QRCode from "qrcode.react";

interface QrCodePageProps {
  setView: (view: View) => void;
}

export default function QrCodePage({ setView }: QrCodePageProps) {
  const { user, selectedBranchId, selectedWarehouseId } = useApp();
  const qrRef = useRef<HTMLDivElement>(null);

  const idUMKM = user?.role === 'UMKM' ? user.uid : user?.idUMKM;
  const canGenerateQr = idUMKM && selectedBranchId && selectedWarehouseId;
  const qrUrl = canGenerateQr 
    ? `https://user.berez.id/?idUMKM=${idUMKM}&branchId=${selectedBranchId}&warehouseId=${selectedWarehouseId}` 
    : "";

  const handleDownload = () => {
    if (qrRef.current) {
      const canvas = qrRef.current.querySelector("canvas");
      if (canvas) {
        const image = canvas.toDataURL("image/png");
        const link = document.createElement("a");
        link.href = image;
        link.download = `QR_Code_${user?.businessName || 'Berez'}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    }
  };

  const handleShare = async () => {
    if (navigator.share && qrRef.current) {
       const canvas = qrRef.current.querySelector("canvas");
       if (canvas) {
         canvas.toBlob(async (blob) => {
            if (blob) {
                try {
                    await navigator.share({
                        title: `QR Code Pemesanan untuk ${user?.businessName}`,
                        text: `Pindai QR Code ini untuk memesan dari ${user?.businessName}. Atau buka tautan: ${qrUrl}`,
                        files: [
                          new File([blob], `QR_Code_${user?.businessName || 'Berez'}.png`, {
                            type: blob.type,
                          }),
                        ],
                    });
                } catch (error) {
                    console.error("Gagal membagikan:", error);
                }
            }
         }, 'image/png');
       }
    } else {
      // Fallback for browsers that don't support Web Share API
      try {
        await navigator.clipboard.writeText(qrUrl);
        alert('Tautan pemesanan telah disalin ke clipboard!');
      } catch (err) {
        alert('Gagal menyalin tautan.');
      }
    }
  };

  return (
    <div className="flex flex-col h-full bg-secondary/50">
        <header className="flex items-center p-4 border-b sticky top-0 bg-background/95 backdrop-blur-sm z-10">
            <Button variant="ghost" size="icon" className="mr-2" onClick={() => setView('account')}>
            <ArrowLeft />
            </Button>
            <h1 className="text-xl font-bold">QR Code Pemesanan</h1>
        </header>
        <div className="flex-grow flex flex-col items-center justify-center p-6 text-center space-y-6">
            <div className="p-6 bg-white rounded-xl shadow-lg" ref={qrRef}>
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
                    Pindai atau bagikan kode ini untuk langsung membuka halaman pemesanan.
                </p>
            </div>

            <div className="flex gap-4">
                <Button variant="outline" onClick={handleDownload} disabled={!canGenerateQr}>
                    <Download className="mr-2 h-5 w-5" />
                    Unduh
                </Button>
                <Button onClick={handleShare} disabled={!canGenerateQr}>
                    <Share2 className="mr-2 h-5 w-5" />
                    Bagikan
                </Button>
            </div>
             
             <p className="text-xs text-muted-foreground text-center break-words max-w-xs pt-4">
                {qrUrl}
            </p>
        </div>
    </div>
  );
}
