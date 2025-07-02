"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronRight, User, MapPin, Heart, Settings, LogOut } from "lucide-react";
import type { View } from "../app-shell";

interface AccountPageProps {
  setView: (view: View) => void;
}

export default function AccountPage({ setView }: AccountPageProps) {
  const menuItems = [
    { icon: User, text: "Edit Profil", action: () => {} },
    { icon: MapPin, text: "Alamat Saya", action: () => {} },
    { icon: Heart, text: "Wishlist", action: () => setView('wishlist') },
    { icon: Settings, text: "Pengaturan", action: () => {} },
  ];

  return (
    <div className="bg-secondary/50 min-h-full">
      <div className="p-4 bg-gradient-to-b from-primary to-primary/80 text-primary-foreground rounded-b-3xl">
        <div className="flex items-center gap-4 pt-8 pb-4">
          <Avatar className="h-20 w-20 border-4 border-primary-foreground/50">
            <AvatarImage src="https://placehold.co/100x100.png" alt="User" />
            <AvatarFallback>U</AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-2xl font-bold">User Keren</h1>
            <p className="text-sm opacity-90">user.keren@email.com</p>
          </div>
        </div>
      </div>

      <div className="p-4 -mt-6">
        <Card>
          <CardContent className="p-2">
            {menuItems.map((item, index) => (
              <button
                key={index}
                onClick={item.action}
                className="flex w-full items-center p-3 hover:bg-secondary rounded-lg transition-colors text-left"
              >
                <item.icon className="w-5 h-5 mr-4 text-primary" />
                <span className="flex-grow font-medium">{item.text}</span>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </button>
            ))}
          </CardContent>
        </Card>
        
        <div className="mt-4">
            <button
                onClick={() => {}}
                className="flex w-full items-center p-3 hover:bg-card rounded-lg transition-colors text-destructive text-left"
              >
                <LogOut className="w-5 h-5 mr-4" />
                <span className="flex-grow font-medium">Keluar</span>
            </button>
        </div>
      </div>
    </div>
  );
}
