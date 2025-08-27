
import AppShellManager from "@/components/app-shell-manager";
import { AppProvider } from "@/providers/app-provider";
import type { Metadata } from 'next';
import StatusBarManager from "@/components/status-bar-manager";

export const metadata: Metadata = {
  title: 'Beranda',
  description: 'Selamat datang di Berez Kitchen. Aplikasi modern untuk mengelola alur kerja dapur untuk restoran dan kafe Anda.',
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
