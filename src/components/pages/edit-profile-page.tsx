"use client";

import { ArrowLeft, User } from "lucide-react";
import { Button } from "../ui/button";
import type { View } from "../app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Input } from "../ui/input";
import { Label } from "../ui/label";

interface EditProfilePageProps {
  setView: (view: View) => void;
}

export default function EditProfilePage({ setView }: EditProfilePageProps) {
  return (
    <div className="flex flex-col h-full">
      <header className="flex items-center p-4 border-b sticky top-0 bg-background/95 backdrop-blur-sm z-10">
        <Button variant="ghost" size="icon" className="mr-2" onClick={() => setView('account')}>
          <ArrowLeft />
        </Button>
        <h1 className="text-xl font-bold">Edit Profil</h1>
      </header>
      <div className="p-4 space-y-4 flex-grow overflow-y-auto">
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                    <User className="w-5 h-5 text-primary" />
                    <span>Informasi Pribadi</span>
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-1">
                    <Label htmlFor="name">Nama Lengkap</Label>
                    <Input id="name" defaultValue="User Keren" />
                </div>
                <div className="space-y-1">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" defaultValue="user.keren@email.com" />
                </div>
                <div className="space-y-1">
                    <Label htmlFor="phone">Nomor Telepon</Label>
                    <Input id="phone" type="tel" defaultValue="081234567890" />
                </div>
            </CardContent>
        </Card>
        <Button className="w-full h-12 text-lg font-bold">Simpan Perubahan</Button>
      </div>
    </div>
  );
}
