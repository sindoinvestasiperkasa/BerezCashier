"use client";

import { useState } from "react";
import BottomNav from "./bottom-nav";
import HomePage from "./pages/home-page";
import WishlistPage from "./pages/wishlist-page";
import CartPage from "./pages/cart-page";
import TransactionsPage from "./pages/transactions-page";
import AccountPage from "./pages/account-page";

export type Tab = "home" | "wishlist" | "cart" | "transactions" | "account";

export default function AppShell() {
  const [activeTab, setActiveTab] = useState<Tab>("home");

  const renderContent = () => {
    switch (activeTab) {
      case "home":
        return <HomePage />;
      case "wishlist":
        return <WishlistPage />;
      case "cart":
        return <CartPage />;
      case "transactions":
        return <TransactionsPage />;
      case "account":
        return <AccountPage />;
      default:
        return <HomePage />;
    }
  };

  return (
    <div className="mx-auto max-w-md bg-background min-h-screen flex flex-col shadow-2xl">
      <main className="flex-grow pb-20 overflow-y-auto">
        {renderContent()}
      </main>
      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  );
}
