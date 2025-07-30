
"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, Check, Save } from "lucide-react";
import { Button } from "../ui/button";
import type { View } from "../app-shell";
import { Card, CardContent } from "../ui/card";
import { RadioGroup, RadioGroupItem } from "../ui/radio-group";
import { Label } from "../ui/label";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { useApp } from "@/hooks/use-app";

interface LanguagePageProps {
  setView: (view: View) => void;
}

const languages = [
    { id: 'id', name: 'Bahasa Indonesia' },
    { id: 'en', name: 'English' },
];

export default function LanguagePage({ setView }: LanguagePageProps) {
  const { locale, changeLocale, t } = useApp();
  const [selectedLanguage, setSelectedLanguage] = useState(locale);
  const { toast } = useToast();

  useEffect(() => {
    setSelectedLanguage(locale);
  }, [locale]);

  const handleSave = () => {
    changeLocale(selectedLanguage);
    toast({
        title: t('lang.save.toast.title'),
        description: t('lang.save.toast.description'),
    });
    setView('settings');
  }

  const getLangName = (langId: 'id' | 'en') => {
      if (langId === 'id') return t('lang.indonesian');
      return t('lang.english');
  }

  return (
    <div className="flex flex-col h-full">
      <header className="flex items-center p-4 border-b sticky top-0 bg-background/95 backdrop-blur-sm z-10">
        <Button variant="ghost" size="icon" className="mr-2" onClick={() => setView('settings')}>
          <ArrowLeft />
        </Button>
        <h1 className="text-xl font-bold">{t('lang.title')}</h1>
      </header>
      <div className="p-4 flex-grow overflow-y-auto space-y-4">
        <Card>
          <CardContent className="p-4">
            <RadioGroup value={selectedLanguage} onValueChange={(value) => setSelectedLanguage(value as 'id' | 'en')}>
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
                        <span className="font-medium flex-grow">{getLangName(lang.id as 'id' | 'en')}</span>
                         {selectedLanguage === lang.id && <Check className="w-5 h-5 text-primary"/>}
                    </Label>
                ))}
            </RadioGroup>
          </CardContent>
        </Card>
        <Button onClick={handleSave} className="w-full h-12 text-lg font-bold">
            <Save className="mr-2 h-5 w-5"/>
            {t('lang.save')}
        </Button>
      </div>
    </div>
  );
}
