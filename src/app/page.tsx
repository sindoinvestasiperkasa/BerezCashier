
import AppShellManager from "@/components/app-shell-manager";
import { AppProvider } from "@/providers/app-provider";
import type { Metadata } from 'next';
import StatusBarManager from "@/components/status-bar-manager";

export const metadata: Metadata = {
  title: 'Beranda',
  description: 'Selamat datang di Berez Cashier. Aplikasi Point of Sale (POS) modern untuk mengelola transaksi, stok, dan keuangan bisnis Anda dengan mudah.',
}

export default function Home() {
  return (
    <main className="bg-neutral-800">
      <AppProvider>
        <StatusBarManager />
        <AppShellManager />
      </AppProvider>
    </main>
  );
}
