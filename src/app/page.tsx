import AppShellManager from "@/components/app-shell-manager";
import { AppProvider } from "@/providers/app-provider";

export default function Home() {
  return (
    <main className="bg-neutral-800">
      <AppProvider>
        <AppShellManager />
      </AppProvider>
    </main>
  );
}
