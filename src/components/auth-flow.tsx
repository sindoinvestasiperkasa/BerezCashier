"use client";

import { useState } from "react";
import WelcomePage from "./pages/welcome-page";
import LoginPage from "./pages/login-page";
import SignupPage from "./pages/signup-page";

export type AuthView = "welcome" | "login" | "signup";

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
      default:
        return <WelcomePage setView={setView} />;
    }
  };

  return (
    <div className="mx-auto max-w-md bg-background min-h-screen flex flex-col shadow-2xl">
      <main className="flex-grow overflow-y-auto">
        {renderContent()}
      </main>
    </div>
  );
}
