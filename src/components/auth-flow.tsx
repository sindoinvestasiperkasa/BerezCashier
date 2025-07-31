"use client";

import { useState } from "react";
import WelcomePage from "./pages/welcome-page";
import LoginPage from "./pages/login-page";
import SignupPage from "./pages/signup-page";
import TermsPage from "./pages/terms-page";
import PrivacyPage from "./pages/privacy-page";

export type AuthView = "welcome" | "login" | "signup" | "terms" | "privacy";

export default function AuthFlow() {
  const [view, setView] = useState<AuthView>("welcome");

  const renderContent = () => {
    switch (view) {
      case "welcome":
        return <WelcomePage setView={setView} />;
      case "login":
        return <LoginPage setView={setView} />;
      case "signup":
        return <SignupPage setView={setView} />;
      case "terms":
        return <TermsPage setView={setView} />;
      case "privacy":
        return <PrivacyPage setView={setView} />;
      default:
        return <WelcomePage setView={setView} />;
    }
  };

  return (
    <div className="mx-auto max-w-md md:max-w-2xl lg:max-w-4xl bg-background min-h-screen flex flex-col shadow-2xl">
      <main className="flex-grow overflow-y-auto">
        {renderContent()}
      </main>
    </div>
  );
}
