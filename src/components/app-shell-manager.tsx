"use client";

import { useApp } from "@/hooks/use-app";
import AppShell from "./app-shell";
import AuthFlow from "./auth-flow";

export default function AppShellManager() {
    const { isAuthenticated } = useApp();
    return isAuthenticated ? <AppShell /> : <AuthFlow />;
}
