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
import EditProfilePage from "./pages/edit-profile-page";
import MyAddressPage from "./pages/my-address-page";
import SettingsPage from "./pages/settings-page";
import NotificationsPage from "./pages/notifications-page";

export type Tab = "home" | "wishlist" | "cart" | "transactions" | "account";
export type View = Tab | "checkout" | "payment" | "edit-profile" | "my-address" | "settings" | "notifications";

export default function AppShell() {
  const [view, setView] = useState<View>("home");

  const renderContent = () => {
    switch (view) {
      case "home":
        return <HomePage setView={setView} />;
      case "wishlist":
        return <WishlistPage />;
      case "cart":
        return <CartPage setView={setView} />;
      case "transactions":
        return <TransactionsPage />;
      case "account":
        return <AccountPage setView={setView} />;
      case "checkout":
        return <CheckoutPage setView={setView} />;
      case "payment":
        return <PaymentPage setView={setView} />;
      case "edit-profile":
        return <EditProfilePage setView={setView} />;
      case "my-address":
        return <MyAddressPage setView={setView} />;
      case "settings":
        return <SettingsPage setView={setView} />;
      case "notifications":
        return <NotificationsPage setView={setView} />;
      default:
        return <HomePage setView={setView} />;
    }
  };
  
  const isTabView = (v: View): v is Tab => ["home", "wishlist", "cart", "transactions", "account"].includes(v);

  return (
    <div className="mx-auto max-w-md md:max-w-2xl lg:max-w-4xl bg-background min-h-screen flex flex-col shadow-2xl">
      <main className="flex-grow pb-20 overflow-y-auto">
        {renderContent()}
      </main>
      {isTabView(view) && <BottomNav activeTab={view} setActiveTab={setView} />}
    </div>
  );
}
