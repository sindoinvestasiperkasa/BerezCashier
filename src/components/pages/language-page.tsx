
"use client";

import { useState } from "react";
import { ArrowLeft, Check, Save } from "lucide-react";
import { Button } from "../ui/button";
import type { View } from "../app-shell";
import { Card, CardContent } from "../ui/card";
import { RadioGroup, RadioGroupItem } from "../ui/radio-group";
import { Label } from "../ui/label";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface LanguagePageProps {
  setView: (view: View) => void;
}

const languages = [
    { id: 'id', name: 'Bahasa Indonesia' },
    { id: 'en', name: 'English' },
];

export default function LanguagePage({ setView }: LanguagePageProps) {
  const [selectedLanguage, setSelectedLanguage] = useState('id');
  const { toast } = useToast();

  const handleSave = () => {
    toast({
        title: "Pengaturan Disimpan",
        description: "Pilihan bahasa Anda telah berhasil disimpan.",
    });
    setView('settings');
  }

  return (
    <div className="flex flex-col h-full">
      <header className="flex items-center p-4 border-b sticky top-0 bg-background/95 backdrop-blur-sm z-10">
        <Button variant="ghost" size="icon" className="mr-2" onClick={() => setView('settings')}>
          <ArrowLeft />
        </Button>
        <h1 className="text-xl font-bold">Pengaturan Bahasa</h1>
      </header>
      <div className="p-4 flex-grow overflow-y-auto space-y-4">
        <Card>
          <CardContent className="p-4">
            <RadioGroup value={selectedLanguage} onValueChange={setSelectedLanguage}>
                {languages.map(lang => (
                    <Label 
                        key={lang.id} 
                        htmlFor={`lang-${lang.id}`}
                        className={cn(
                            "flex items-center p-4 rounded-lg border transition-colors cursor-pointer",
                            selectedLanguage === lang.id ? "bg-primary/10 border-primary" : "hover:bg-secondary"
                        )}
                    >
                        <RadioGroupItem value={lang.id} id={`lang-${lang.id}`} className="mr-4" />
                        <span className="font-medium flex-grow">{lang.name}</span>
                         {selectedLanguage === lang.id && <Check className="w-5 h-5 text-primary"/>}
                    </Label>
                ))}
            </RadioGroup>
          </CardContent>
        </Card>
        <Button onClick={handleSave} className="w-full h-12 text-lg font-bold">
            <Save className="mr-2 h-5 w-5"/>
            Simpan Perubahan
        </Button>
      </div>
    </div>
  );
}
