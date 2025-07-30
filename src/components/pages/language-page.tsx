
"use client";

import { ArrowLeft, Globe } from "lucide-react";
import { Button } from "../ui/button";
import type { View } from "../app-shell";
import { Card, CardContent } from "../ui/card";

interface LanguagePageProps {
  setView: (view: View) => void;
}

export default function LanguagePage({ setView }: LanguagePageProps) {
  return (
    <div className="flex flex-col h-full">
      <header className="flex items-center p-4 border-b sticky top-0 bg-background/95 backdrop-blur-sm z-10">
        <Button variant="ghost" size="icon" className="mr-2" onClick={() => setView('settings')}>
          <ArrowLeft />
        </Button>
        <h1 className="text-xl font-bold">Pengaturan Bahasa</h1>
      </header>
      <div className="p-4 flex-grow overflow-y-auto">
        <Card>
          <CardContent className="p-6 text-center">
            <Globe className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p>Pilihan bahasa akan tersedia di sini.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
