"use client";

import { AlertTriangle, ArrowLeft, Bell, CheckCircle, FileText, Frown, Package, XCircle } from "lucide-react";
import { Button } from "../ui/button";
import { useApp } from "@/hooks/use-app";
import { Card, CardContent } from "../ui/card";
import { formatDistanceToNow } from "date-fns";
import { id } from "date-fns/locale";
import { cn } from "@/lib/utils";
import type { View } from "../app-shell";

interface NotificationsPageProps {
  setView: (view: View) => void;
}

const notificationIcons: { [key: string]: React.ElementType } = {
    'low_stock': AlertTriangle,
    'daily_summary': FileText,
    'transaction_failed': XCircle,
    'shift_report': CheckCircle,
    'default': Package
}

const notificationColors: { [key: string]: string } = {
    'low_stock': 'text-destructive',
    'daily_summary': 'text-blue-500',
    'transaction_failed': 'text-destructive',
    'shift_report': 'text-green-500',
    'default': 'text-primary'
}

export default function NotificationsPage({ setView }: NotificationsPageProps) {
  const { notifications, markNotificationAsRead } = useApp();

  const sortedNotifications = [...notifications].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

  return (
    <div className="flex flex-col h-full">
      <header className="flex items-center p-4 border-b sticky top-0 bg-background/95 backdrop-blur-sm z-10">
        <Button variant="ghost" size="icon" className="mr-2" onClick={() => setView('home')}>
          <ArrowLeft />
        </Button>
        <h1 className="text-xl font-bold flex items-center gap-2">
            <Bell className="w-5 h-5"/>
            <span>Notifikasi</span>
        </h1>
      </header>
      <div className="flex-grow overflow-y-auto bg-secondary/30">
        {sortedNotifications.length === 0 ? (
            <div className="text-center py-20 flex flex-col items-center gap-4">
                <Frown className="w-16 h-16 text-muted-foreground" />
                <h2 className="text-xl font-semibold">Tidak Ada Notifikasi</h2>
                <p className="text-muted-foreground">Semua notifikasi Anda sudah terbaca.</p>
            </div>
        ) : (
            <div className="p-4 space-y-3">
                {sortedNotifications.map(notif => {
                    const Icon = notificationIcons[notif.type] || notificationIcons.default;
                    const colorClass = notificationColors[notif.type] || notificationColors.default;
                    return (
                        <Card 
                            key={notif.id} 
                            className={cn(
                                "cursor-pointer transition-all", 
                                !notif.isRead ? "bg-card" : "bg-card/60 opacity-70"
                            )}
                            onClick={() => markNotificationAsRead(notif.id)}
                        >
                            <CardContent className="p-4 flex gap-4 items-start">
                                <Icon className={cn("w-6 h-6 mt-1 flex-shrink-0", colorClass)} />
                                <div className="flex-grow">
                                    <p className="font-semibold">{notif.title}</p>
                                    <p className="text-sm text-muted-foreground">{notif.message}</p>
                                    <p className="text-xs text-muted-foreground mt-2">
                                        {formatDistanceToNow(notif.timestamp, { addSuffix: true, locale: id })}
                                    </p>
                                </div>
                                {!notif.isRead && <div className="w-2.5 h-2.5 rounded-full bg-primary mt-1 flex-shrink-0" />}
                            </CardContent>
                        </Card>
                    );
                })}
            </div>
        )}
      </div>
    </div>
  );
}
