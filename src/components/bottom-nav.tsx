
"use client";

import type { Dispatch, SetStateAction } from "react";
import { ClipboardList, Receipt, User } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Tab } from "./app-shell";
import { useApp } from "@/hooks/use-app";

interface BottomNavProps {
  activeTab: Tab;
  setActiveTab: Dispatch<SetStateAction<Tab>>;
}

export default function BottomNav({ activeTab, setActiveTab }: BottomNavProps) {
  const { t, transactions } = useApp();

  const pendingOrdersCount = transactions.filter(
    tx => tx.status === 'Diproses'
  ).length;

  const navItems = [
    { id: "orders", label: t('nav.orders'), icon: ClipboardList, badge: pendingOrdersCount },
    { id: "transactions", label: t('nav.transactions'), icon: Receipt },
    { id: "account", label: t('nav.account'), icon: User },
  ] as const;


  return (
    <div className="fixed bottom-0 left-0 w-full z-20">
      <div className="relative h-16 bg-gradient-to-t from-primary/90 to-primary/70 backdrop-blur-sm shadow-[0_-1px_10px_rgba(0,0,0,0.1)]">
        <div className="grid grid-cols-3 h-full max-w-full mx-auto">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={cn(
                "flex flex-col items-center justify-center gap-1 w-full h-full transition-colors duration-200 relative group",
                activeTab === item.id
                  ? "text-primary-foreground"
                  : "text-primary-foreground/70 hover:text-primary-foreground"
              )}
              aria-current={activeTab === item.id ? "page" : undefined}
            >
              <item.icon className="w-6 h-6 transition-transform group-hover:scale-110" />
              <span className="text-xs font-medium">{item.label}</span>
              {item.id === 'orders' && item.badge > 0 && (
                 <div className="absolute top-1 right-1/2 translate-x-[20px] w-5 h-5 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center text-[10px] font-bold ring-2 ring-background">
                  {item.badge}
                </div>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
