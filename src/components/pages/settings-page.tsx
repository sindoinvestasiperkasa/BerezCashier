"use client";

import { ArrowLeft, Bell, Lock, Globe } from "lucide-react";
import { Button } from "../ui/button";
import type { View } from "../app-shell";
import { Card, CardContent } from "../ui/card";
import { Label } from "../ui/label";
import { Switch } from "../ui/switch";
import { ChevronRight } from "lucide-react";

interface SettingsPageProps {
  setView: (view: View) => void;
}

export default function SettingsPage({ setView }: SettingsPageProps) {
  const settingsItems = [
    { icon: Bell, text: "Notifikasi", hasSwitch: true },
    { icon: Lock, text: "Keamanan Akun", hasSwitch: false },
    { icon: Globe, text: "Bahasa", hasSwitch: false },
  ];

  return (
    <div className="flex flex-col h-full">
      <header className="flex items-center p-4 border-b sticky top-0 bg-background/95 backdrop-blur-sm z-10">
        <Button variant="ghost" size="icon" className="mr-2" onClick={() => setView('account')}>
          <ArrowLeft />
        </Button>
        <h1 className="text-xl font-bold">Pengaturan</h1>
      </header>
      <div className="p-4 flex-grow overflow-y-auto">
        <Card>
          <CardContent className="p-2">
             {settingsItems.map((item, index) => (
              <div key={index} className="flex items-center p-3 hover:bg-secondary rounded-lg transition-colors">
                <item.icon className="w-5 h-5 mr-4 text-primary" />
                <span className="flex-grow font-medium">{item.text}</span>
                {item.hasSwitch ? <Switch /> : <ChevronRight className="w-5 h-5 text-muted-foreground" />}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
