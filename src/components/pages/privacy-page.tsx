"use client";

import { ArrowLeft } from "lucide-react";
import type { AuthView } from "../auth-flow";
import { Button } from "../ui/button";

interface PrivacyPageProps {
  setView: (view: AuthView) => void;
}

export default function PrivacyPage({ setView }: PrivacyPageProps) {
  return (
    <div className="flex flex-col h-full">
      <header className="flex items-center p-4 border-b sticky top-0 bg-background/95 backdrop-blur-sm z-10">
        <Button variant="ghost" size="icon" className="mr-2" onClick={() => setView('welcome')}>
          <ArrowLeft />
        </Button>
        <h1 className="text-xl font-bold">Kebijakan Privasi</h1>
      </header>
      <div className="p-6 flex-grow overflow-y-auto prose prose-sm max-w-none">
        <p>Terakhir diperbarui: 24 Juli 2024</p>
        
        <h2>1. Informasi yang Kami Kumpulkan</h2>
        <p>Kami dapat mengumpulkan informasi yang Anda berikan langsung kepada kami, seperti saat Anda membuat akun, dan informasi yang dikumpulkan secara otomatis, seperti data penggunaan.</p>
        <ul>
          <li><strong>Informasi Akun:</strong> Nama, email, nama bisnis.</li>
          <li><strong>Data Transaksional:</strong> Detail produk, penjualan, data pelanggan yang Anda masukkan.</li>
          <li><strong>Data Penggunaan:</strong> Informasi tentang bagaimana Anda menggunakan Aplikasi kami.</li>
        </ul>

        <h2>2. Bagaimana Kami Menggunakan Informasi Anda</h2>
        <p>Kami menggunakan informasi yang kami kumpulkan untuk:</p>
        <ul>
          <li>Menyediakan, memelihara, dan meningkatkan Aplikasi kami.</li>
          <li>Memproses transaksi Anda.</li>
          <li>Berkomunikasi dengan Anda, termasuk untuk dukungan pelanggan.</li>
        </ul>

        <h2>3. Berbagi Informasi</h2>
        <p>Kami tidak membagikan informasi pribadi Anda dengan perusahaan, organisasi, atau individu di luar Berez kecuali dalam keadaan berikut:</p>
        <ul>
          <li>Dengan persetujuan Anda.</li>
          <li>Untuk alasan hukum.</li>
        </ul>
        
        <h2>4. Keamanan Data</h2>
        <p>Kami bekerja keras untuk melindungi informasi Anda dari akses, perubahan, pengungkapan, atau perusakan yang tidak sah.</p>

        <h2>5. Hak Anda</h2>
        <p>Anda mungkin memiliki hak untuk mengakses, memperbaiki, atau menghapus informasi pribadi Anda. Silakan hubungi kami untuk menggunakan hak-hak ini.</p>

        <h2>6. Hubungi Kami</h2>
        <p>Jika Anda memiliki pertanyaan tentang Kebijakan Privasi ini, silakan hubungi kami di support@berez.id.</p>
      </div>
    </div>
  );
}
