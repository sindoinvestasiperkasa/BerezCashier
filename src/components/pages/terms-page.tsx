"use client";

import { ArrowLeft } from "lucide-react";
import type { AuthView } from "../auth-flow";
import { Button } from "../ui/button";

interface TermsPageProps {
  setView: (view: AuthView) => void;
}

export default function TermsPage({ setView }: TermsPageProps) {
  return (
    <div className="flex flex-col h-full">
      <header className="flex items-center p-4 border-b sticky top-0 bg-background/95 backdrop-blur-sm z-10">
        <Button variant="ghost" size="icon" className="mr-2" onClick={() => setView('welcome')}>
          <ArrowLeft />
        </Button>
        <h1 className="text-xl font-bold">Syarat & Ketentuan</h1>
      </header>
      <div className="p-6 flex-grow overflow-y-auto prose prose-sm max-w-none">
        <p>Terakhir diperbarui: 24 Juli 2024</p>
        
        <h2>1. Penerimaan Persyaratan</h2>
        <p>Dengan mengunduh, menginstal, atau menggunakan aplikasi Berez Cashier ("Aplikasi"), Anda setuju untuk terikat oleh Syarat dan Ketentuan ini ("Syarat"). Jika Anda tidak menyetujui Syarat ini, jangan gunakan Aplikasi ini.</p>

        <h2>2. Deskripsi Layanan</h2>
        <p>Berez Cashier menyediakan aplikasi point-of-sale (POS) untuk membantu bisnis mengelola penjualan, inventaris, dan data pelanggan. Layanan dapat berubah dari waktu ke waktu atas kebijakan kami.</p>

        <h2>3. Pendaftaran Akun</h2>
        <p>Anda harus mendaftar akun untuk mengakses sebagian besar fitur Aplikasi. Anda setuju untuk memberikan informasi yang akurat, terkini, dan lengkap selama proses pendaftaran dan untuk memperbarui informasi tersebut agar tetap akurat.</p>

        <h2>4. Kewajiban Pengguna</h2>
        <p>Anda bertanggung jawab atas semua aktivitas yang terjadi di bawah akun Anda dan untuk menjaga keamanan kata sandi Anda. Anda setuju untuk tidak menggunakan Aplikasi untuk tujuan ilegal atau tidak sah.</p>

        <h2>5. Pembatasan Tanggung Jawab</h2>
        <p>Aplikasi ini disediakan "sebagaimana adanya" tanpa jaminan apa pun. Sejauh diizinkan oleh hukum, kami tidak akan bertanggung jawab atas kerusakan tidak langsung, insidental, khusus, konsekuensial, atau hukuman, atau kehilangan keuntungan atau pendapatan.</p>

        <h2>6. Perubahan Persyaratan</h2>
        <p>Kami berhak untuk mengubah Syarat ini kapan saja. Kami akan memberi tahu Anda tentang perubahan apa pun dengan memposting Syarat baru di dalam Aplikasi. Anda disarankan untuk meninjau Syarat ini secara berkala.</p>

        <h2>7. Hubungi Kami</h2>
        <p>Jika Anda memiliki pertanyaan tentang Syarat ini, silakan hubungi kami di support@berez.id.</p>
      </div>
    </div>
  );
}
