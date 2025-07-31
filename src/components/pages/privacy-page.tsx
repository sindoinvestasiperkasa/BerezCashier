
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
        <p>Kebijakan Privasi ini menjelaskan bagaimana informasi Anda dikumpulkan, digunakan, dan dibagikan saat Anda menggunakan aplikasi Berez Cashier ("Aplikasi").</p>
        
        <h2>1. Informasi yang Kami Kumpulkan</h2>
        <p>Kami mengumpulkan beberapa jenis informasi untuk berbagai tujuan guna menyediakan dan meningkatkan Layanan kami kepada Anda.</p>
        
        <h2>2. Informasi yang Anda Berikan Secara Sukarela</h2>
        <ul>
          <li><strong>Informasi Pendaftaran Akun:</strong> Saat Anda mendaftar, kami mengumpulkan nama, alamat email, nama bisnis, dan informasi kontak lainnya.</li>
          <li><strong>Data Transaksional:</strong> Kami memproses data penjualan, detail produk, informasi inventaris, dan data pelanggan yang Anda masukkan ke dalam Aplikasi.</li>
          <li><strong>Komunikasi:</strong> Jika Anda menghubungi kami secara langsung, kami dapat menerima informasi tambahan tentang Anda seperti nama, alamat email, nomor telepon, isi pesan dan/atau lampiran yang mungkin Anda kirimkan kepada kami, dan informasi lain yang mungkin Anda pilih untuk diberikan.</li>
        </ul>

        <h2>3. Informasi yang Dikumpulkan Secara Otomatis</h2>
        <ul>
          <li><strong>Data Log dan Penggunaan:</strong> Kami mengumpulkan informasi tentang akses Anda dan penggunaan Layanan, termasuk jenis perangkat yang Anda gunakan, pengidentifikasi unik perangkat, alamat IP, sistem operasi, jenis browser, dan informasi tentang cara Anda berinteraksi dengan Layanan kami.</li>
          <li><strong>Informasi Lokasi:</strong> Kami dapat mengumpulkan informasi tentang lokasi perangkat Anda untuk menyediakan fitur Layanan kami.</li>
          <li><strong>Cookie dan Teknologi Pelacakan Serupa:</strong> Kami menggunakan cookie dan teknologi pelacakan serupa untuk melacak aktivitas di Layanan kami dan menyimpan informasi tertentu.</li>
        </ul>

        <h2>4. Bagaimana Kami Menggunakan Informasi Anda</h2>
        <p>Kami menggunakan informasi yang kami kumpulkan untuk berbagai tujuan:</p>
        <ul>
          <li>Untuk menyediakan, mengoperasikan, dan memelihara Layanan kami.</li>
          <li>Untuk meningkatkan, mempersonalisasi, dan memperluas Layanan kami.</li>
          <li>Untuk memahami dan menganalisis bagaimana Anda menggunakan Layanan kami.</li>
          <li>Untuk mengembangkan produk, layanan, fitur, dan fungsionalitas baru.</li>
          <li>Untuk memproses transaksi Anda dan mengelola data bisnis Anda.</li>
          <li>Untuk berkomunikasi dengan Anda, baik secara langsung atau melalui salah satu mitra kami, termasuk untuk layanan pelanggan, untuk memberi Anda pembaruan dan informasi lain yang berkaitan dengan Layanan, dan untuk tujuan pemasaran dan promosi.</li>
          <li>Untuk mengirimkan email kepada Anda.</li>
          <li>Untuk mendeteksi dan mencegah penipuan.</li>
        </ul>

        <h2>5. Berbagi Informasi Anda</h2>
        <p>Kami dapat membagikan informasi Anda dalam situasi berikut:</p>
        <ul>
          <li><strong>Dengan Penyedia Layanan:</strong> Kami dapat membagikan informasi Anda dengan penyedia layanan pihak ketiga yang melakukan layanan atas nama kami.</li>
          <li><strong>Untuk Kepatuhan Hukum:</strong> Kami dapat mengungkapkan informasi Anda jika diwajibkan oleh hukum atau sebagai tanggapan atas permintaan yang sah oleh otoritas publik.</li>
          <li><strong>Transfer Bisnis:</strong> Informasi Anda dapat ditransfer jika kami terlibat dalam merger, akuisisi, atau penjualan aset.</li>
        </ul>

        <h2>6. Keamanan Data</h2>
        <p>Keamanan data Anda penting bagi kami, tetapi ingatlah bahwa tidak ada metode transmisi melalui Internet, atau metode penyimpanan elektronik yang 100% aman. Kami menggunakan cara yang dapat diterima secara komersial untuk melindungi Informasi Pribadi Anda, tetapi kami tidak dapat menjamin keamanan mutlaknya.</p>
        
        <h2>7. Privasi Anak-Anak</h2>
        <p>Layanan kami tidak ditujukan untuk siapa pun yang berusia di bawah 13 tahun. Kami tidak secara sadar mengumpulkan informasi yang dapat diidentifikasi secara pribadi dari anak-anak di bawah 13 tahun.</p>

        <h2>8. Hak Privasi Anda (GDPR/CCPA)</h2>
        <p>Bergantung pada lokasi Anda, Anda mungkin memiliki hak berikut mengenai informasi pribadi Anda:</p>
        <ul>
          <li>Hak untuk mengakses – Anda berhak meminta salinan informasi pribadi Anda.</li>
          <li>Hak untuk perbaikan – Anda berhak meminta kami memperbaiki informasi apa pun yang Anda yakini tidak akurat.</li>
          <li>Hak untuk menghapus – Anda berhak meminta kami menghapus informasi pribadi Anda, dalam kondisi tertentu.</li>
          <li>Hak untuk membatasi pemrosesan – Anda berhak meminta kami membatasi pemrosesan informasi pribadi Anda, dalam kondisi tertentu.</li>
        </ul>

        <h2>9. Perubahan pada Kebijakan Privasi Ini</h2>
        <p>Kami dapat memperbarui Kebijakan Privasi kami dari waktu ke waktu. Kami akan memberitahu Anda tentang perubahan apa pun dengan memposting Kebijakan Privasi baru di halaman ini.</p>

        <h2>10. Hubungi Kami</h2>
        <p>Jika Anda memiliki pertanyaan tentang Kebijakan Privasi ini, silakan hubungi kami di info@berez.id.</p>
      </div>
    </div>
  );
}
