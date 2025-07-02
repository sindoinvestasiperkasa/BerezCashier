"use client";

import { useState } from "react";
import BottomNav from "./bottom-nav";
import HomePage from "./pages/home-page";
import WishlistPage from "./pages/wishlist-page";
import CartPage from "./pages/cart-page";
import TransactionsPage from "./pages/transactions-page";
import AccountPage from "./pages/account-page";
import CheckoutPage from "./pages/checkout-page";
import PaymentPage from "./pages/payment-page";

export type Tab = "home" | "wishlist" | "cart" | "transactions" | "account";
export type View = Tab | "checkout" | "payment";

export default function AppShell() {
  const [view, setView] = useState<View>("home");

  const renderContent = () => {
    switch (view) {
      case "home":
        return <HomePage />;
      case "wishlist":
        return <WishlistPage />;
      case "cart":
        return <CartPage setView={setView} />;
      case "transactions":
        return <TransactionsPage />;
      case "account":
        return <AccountPage />;
      case "checkout":
        return <CheckoutPage setView={setView} />;
      case "payment":
        return <PaymentPage setView={setView} />;
      default:
        return <HomePage />;
    }
  };
  
  const isTabView = (v: View): v is Tab => ["home", "wishlist", "cart", "transactions", "account"].includes(v);

  return (
    <div className="mx-auto max-w-md bg-background min-h-screen flex flex-col shadow-2xl">
      <main className="flex-grow pb-20 overflow-y-auto">
        {renderContent()}
      </main>
      {isTabView(view) && <BottomNav activeTab={view} setActiveTab={setView} />}
    </div>
  );
}
