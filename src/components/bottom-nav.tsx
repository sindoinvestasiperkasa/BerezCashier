"use client";

import type { Dispatch, SetStateAction } from "react";
import { Home, Heart, ShoppingCart, Receipt, User } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Tab } from "./app-shell";
import { useApp } from "@/hooks/use-app";

interface BottomNavProps {
  activeTab: Tab;
  setActiveTab: Dispatch<SetStateAction<Tab>>;
}

const navItems = [
  { id: "home", label: "Home", icon: Home },
  { id: "wishlist", label: "Wishlist", icon: Heart },
  { id: "cart", label: "Cart", icon: ShoppingCart },
  { id: "transactions", label: "Transactions", icon: Receipt },
  { id: "account", label: "Account", icon: User },
] as const;

export default function BottomNav({ activeTab, setActiveTab }: BottomNavProps) {
  const { cart, wishlist } = useApp();

  return (
    <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md h-16 bg-card border-t border-border shadow-[0_-1px_10px_rgba(0,0,0,0.05)]">
      <div className="flex justify-around items-center h-full">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={cn(
              "flex flex-col items-center justify-center gap-1 w-full h-full transition-colors duration-200 relative",
              activeTab === item.id
                ? "text-primary"
                : "text-muted-foreground hover:text-primary"
            )}
            aria-current={activeTab === item.id ? "page" : undefined}
          >
            <item.icon className="w-6 h-6" />
            <span className="text-xs font-medium">{item.label}</span>
            {item.id === 'cart' && cart.length > 0 && (
              <div className="absolute top-1 right-1/2 translate-x-4 w-5 h-5 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-bold">
                {cart.reduce((sum, item) => sum + item.quantity, 0)}
              </div>
            )}
            {item.id === 'wishlist' && wishlist.length > 0 && (
              <div className="absolute top-1 right-1/2 translate-x-4 w-5 h-5 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-bold">
                {wishlist.length}
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
