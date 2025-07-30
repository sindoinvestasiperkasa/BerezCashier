
"use client";

import { useState } from "react";
import { ArrowLeft, Bell, Lock, Globe, ChevronRight } from "lucide-react";
import { Button } from "../ui/button";
import type { View } from "../app-shell";
import { Card, CardContent } from "../ui/card";
import { Switch } from "../ui/switch";
import { Label } from "../ui/label";
import { cn } from "@/lib/utils";

interface SettingsPageProps {
  setView: (view: View) => void;
}

export default function SettingsPage({ setView }: SettingsPageProps) {
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  const settingsItems = [
    { 
      id: "notifications",
      icon: Bell, 
      text: "Notifikasi", 
      hasSwitch: true,
      action: () => setNotificationsEnabled(prev => !prev) 
    },
    { 
      id: "security",
      icon: Lock, 
      text: "Keamanan Akun", 
      hasSwitch: false,
      action: () => setView('account-security') 
    },
    { 
      id: "language",
      icon: Globe, 
      text: "Bahasa", 
      hasSwitch: false,
      action: () => setView('language') 
    },
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
             {settingsItems.map((item) => {
                if(item.hasSwitch) {
                    return (
                        <div key={item.id} className="flex w-full items-center p-3">
                            <item.icon className="w-5 h-5 mr-4 text-primary" />
                            <Label htmlFor={item.id} className="flex-grow font-medium cursor-pointer">{item.text}</Label>
                            <Switch id={item.id} checked={notificationsEnabled} onCheckedChange={setNotificationsEnabled}/> 
                        </div>
                    )
                }
                return (
                    <button 
                        key={item.id} 
                        onClick={item.action} 
                        className="flex w-full items-center p-3 hover:bg-secondary rounded-lg transition-colors text-left"
                    >
                        <item.icon className="w-5 h-5 mr-4 text-primary" />
                        <span className="flex-grow font-medium">{item.text}</span>
                        <ChevronRight className="w-5 h-5 text-muted-foreground" />
                    </button>
                )
             })}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
