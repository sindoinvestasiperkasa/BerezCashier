import AppShell from "@/components/app-shell";
import { AppProvider } from "@/providers/app-provider";

export default function Home() {
  return (
    <main className="bg-neutral-800">
      <AppProvider>
        <AppShell />
      </AppProvider>
    </main>
  );
}
