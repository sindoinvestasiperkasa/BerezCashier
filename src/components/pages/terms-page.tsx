
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
        <p>Harap baca Syarat dan Ketentuan ("Syarat", "Syarat dan Ketentuan") ini dengan saksama sebelum menggunakan aplikasi seluler Berez Kitchen ("Layanan") yang dioperasikan oleh Berez.id ("kami", "kita", atau "milik kami").</p>

        <h2>1. Penerimaan Persyaratan</h2>
        <p>Dengan mengakses atau menggunakan Layanan, Anda setuju untuk terikat oleh Syarat ini. Jika Anda tidak setuju dengan bagian mana pun dari syarat ini, maka Anda tidak diizinkan untuk mengakses Layanan.</p>

        <h2>2. Deskripsi Layanan</h2>
        <p>Berez Kitchen menyediakan aplikasi manajemen dapur dan point-of-sale (POS) untuk membantu bisnis F&B mengelola pesanan, alur kerja dapur, penjualan, dan data pelanggan. Layanan dapat berubah dari waktu ke waktu atas kebijakan kami.</p>

        <h2>3. Pendaftaran Akun</h2>
        <ul>
            <li>Anda harus mendaftar untuk sebuah akun untuk mengakses fitur-fitur Layanan.</li>
            <li>Anda harus memberikan informasi yang akurat, terkini, dan lengkap selama proses pendaftaran.</li>
            <li>Anda bertanggung jawab untuk menjaga kerahasiaan kata sandi Anda dan untuk semua aktivitas yang terjadi di bawah akun Anda.</li>
        </ul>

        <h2>4. Biaya dan Pembayaran</h2>
        <p>Beberapa bagian dari Layanan mungkin tersedia dengan biaya. Anda setuju untuk membayar semua biaya yang berlaku untuk Layanan yang Anda pilih. Semua biaya tidak dapat dikembalikan kecuali ditentukan lain oleh kami.</p>

        <h2>5. Penggunaan yang Diizinkan</h2>
        <p>Anda setuju untuk tidak menggunakan Layanan untuk tujuan apa pun yang melanggar hukum atau dilarang oleh Syarat ini. Anda tidak boleh:</p>
        <ul>
            <li>Menggunakan Layanan dengan cara apa pun yang dapat merusak, menonaktifkan, membebani, atau mengganggu server kami.</li>
            <li>Mencoba mendapatkan akses tidak sah ke Layanan, akun lain, atau sistem komputer.</li>
            <li>Menggunakan perangkat lunak penambangan data, robot, atau alat pengumpulan dan ekstraksi data serupa.</li>
        </ul>
        
        <h2>6. Konten Pengguna</h2>
        <ul>
            <li>Anda bertanggung jawab penuh atas semua data, informasi, dan materi lain yang Anda unggah atau masukkan ke dalam Layanan ("Konten Pengguna").</li>
            <li>Anda memberi kami lisensi di seluruh dunia, non-eksklusif, bebas royalti untuk menggunakan, mereproduksi, dan menampilkan Konten Pengguna Anda semata-mata untuk tujuan menyediakan Layanan kepada Anda.</li>
        </ul>

        <h2>7. Hak Kekayaan Intelektual</h2>
        <p>Layanan dan konten aslinya (tidak termasuk Konten Pengguna), fitur, dan fungsionalitas adalah dan akan tetap menjadi milik eksklusif Berez.id dan pemberi lisensinya.</p>
        
        <h2>8. Penghentian</h2>
        <p>Kami dapat menghentikan atau menangguhkan akses Anda ke Layanan kami segera, tanpa pemberitahuan atau kewajiban sebelumnya, untuk alasan apa pun, termasuk tanpa batasan jika Anda melanggar Syarat.</p>

        <h2>9. Penafian Jaminan</h2>
        <p>Layanan ini disediakan "SEBAGAIMANA ADANYA" dan "SEBAGAIMANA TERSEDIA". Penggunaan Layanan oleh Anda adalah risiko Anda sendiri. Layanan disediakan tanpa jaminan apa pun, baik tersurat maupun tersirat.</p>

        <h2>10. Batasan Tanggung Jawab</h2>
        <p>Dalam keadaan apa pun Berez.id, maupun direktur, karyawan, mitra, agen, pemasok, atau afiliasinya, tidak akan bertanggung jawab atas kerusakan tidak langsung, insidental, khusus, konsekuensial, atau hukuman, termasuk tanpa batasan, kehilangan keuntungan, data, atau kerugian tidak berwujud lainnya.</p>

        <h2>11. Ganti Rugi</h2>
        <p>Anda setuju untuk membela, mengganti rugi, dan membebaskan Berez.id dan pemberi lisensinya, dan karyawan, kontraktor, agen, pejabat, dan direktur mereka, dari dan terhadap setiap dan semua klaim, kerusakan, kewajiban, kerugian, tanggung jawab, biaya atau utang, dan pengeluaran.</p>

        <h2>12. Hukum yang Mengatur</h2>
        <p>Syarat-syarat ini akan diatur dan ditafsirkan sesuai dengan hukum Republik Indonesia, tanpa memperhatikan pertentangan ketentuan hukumnya.</p>
        
        <h2>13. Penyelesaian Sengketa</h2>
        <p>Setiap sengketa yang timbul dari atau terkait dengan Syarat ini akan diselesaikan melalui arbitrase yang mengikat sesuai dengan aturan Badan Arbitrase Nasional Indonesia (BANI).</p>

        <h2>14. Keterpisahan</h2>
        <p>Jika ada ketentuan dari Syarat ini yang dianggap tidak sah atau tidak dapat dilaksanakan oleh pengadilan, ketentuan lainnya dari Syarat ini akan tetap berlaku.</p>

        <h2>15. Perubahan pada Syarat</h2>
        <p>Kami berhak, atas kebijakan kami sendiri, untuk mengubah atau mengganti Syarat ini kapan saja. Jika revisi bersifat material, kami akan memberikan pemberitahuan setidaknya 30 hari sebelum syarat baru berlaku.</p>

        <h2>16. Hubungi Kami</h2>
        <p>Jika Anda memiliki pertanyaan tentang Syarat ini, silakan hubungi kami di info@berez.id.</p>
      </div>
    </div>
  );
}
