
"use client";

import { useState } from "react";
import BottomNav from "./bottom-nav";
import HomePage from "./pages/home-page";
import OrdersPage from "./pages/orders-page";
import TransactionsPage from "./pages/transactions-page";
import AccountPage from "./pages/account-page";
import EditProfilePage from "./pages/edit-profile-page";
import MyAddressPage from "./pages/my-address-page";
import SettingsPage from "./pages/settings-page";
import NotificationsPage from "./pages/notifications-page";
import AccountSecurityPage from "./pages/account-security-page";
import LanguagePage from "./pages/language-page";
import QrCodePage from "./pages/qr-code-page";
import WishlistPage from "./pages/wishlist-page";

export type Tab = "home" | "orders" | "wishlist" | "transactions" | "account";
export type View = Tab | "edit-profile" | "my-address" | "settings" | "notifications" | "account-security" | "language" | "qr-code";

export default function AppShell() {
  const [view, setView] = useState<View>("orders");

  const renderContent = () => {
    switch (view) {
      case "home":
        return <HomePage setView={setView} />;
      case "orders":
        return <OrdersPage />;
      case "wishlist":
        return <WishlistPage />;
      case "transactions":
        return <TransactionsPage />;
      case "account":
        return <AccountPage setView={setView} />;
      case "edit-profile":
        return <EditProfilePage setView={setView} />;
      case "my-address":
        return <MyAddressPage setView={setView} />;
      case "settings":
        return <SettingsPage setView={setView} />;
      case "notifications":
        return <NotificationsPage setView={setView} />;
      case "account-security":
        return <AccountSecurityPage setView={setView} />;
      case "language":
        return <LanguagePage setView={setView} />;
      case "qr-code":
        return <QrCodePage setView={setView} />;
      default:
        return <OrdersPage />;
    }
  };
  
  const isTabView = (v: View): v is Tab => ["home", "orders", "wishlist", "transactions", "account"].includes(v);

  return (
    <div className="mx-auto max-w-full bg-background min-h-screen flex flex-col">
      <main className="flex-grow overflow-y-auto">
        {renderContent()}
      </main>
      {isTabView(view) && <BottomNav activeTab={view} setActiveTab={setView} />}
    </div>
  );
}
