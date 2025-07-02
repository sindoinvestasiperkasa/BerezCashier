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
    <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md">
      <div className="relative h-16 bg-gradient-to-t from-primary/90 to-primary/70 backdrop-blur-sm shadow-[0_-1px_10px_rgba(0,0,0,0.1)]">
        <div className="grid grid-cols-5 h-full">
          {navItems.map((item) => {
            const isCart = item.id === "cart";

            if (isCart) {
              return (
                <div key={item.id} className="relative flex justify-center items-start">
                  <button
                    onClick={() => setActiveTab(item.id)}
                    className={cn(
                      "absolute -top-7 w-16 h-16 rounded-full flex items-center justify-center transition-transform duration-300 group",
                      "bg-primary/80 backdrop-blur-sm text-primary-foreground shadow-lg border-4 border-background hover:scale-105"
                    )}
                     aria-current={activeTab === item.id ? "page" : undefined}
                  >
                    <item.icon className="w-7 h-7 transition-transform group-hover:scale-110" />
                    {cart.length > 0 && (
                      <div className="absolute top-0 right-0 w-6 h-6 bg-primary-foreground text-primary rounded-full flex items-center justify-center text-xs font-bold">
                        {cart.reduce((sum, item) => sum + item.quantity, 0)}
                      </div>
                    )}
                  </button>
                </div>
              );
            }

            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 w-full h-full transition-colors duration-200 relative",
                  activeTab === item.id
                    ? "text-primary-foreground"
                    : "text-primary-foreground/70 hover:text-primary-foreground"
                )}
                aria-current={activeTab === item.id ? "page" : undefined}
              >
                <item.icon className="w-6 h-6" />
                <span className="text-xs font-medium">{item.label}</span>
                
                {item.id === 'wishlist' && wishlist.length > 0 && (
                  <div className="absolute top-1 right-1/2 translate-x-4 w-5 h-5 bg-primary-foreground text-primary rounded-full flex items-center justify-center text-xs font-bold">
                    {wishlist.length}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
