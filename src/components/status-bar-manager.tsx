'use client';

import { useEffect } from 'react';
import { StatusBar, Style } from '@capacitor/status-bar';
import { Capacitor } from '@capacitor/core';


export default function StatusBarManager() {
  useEffect(() => {
    // Jalankan kode Capacitor hanya jika platformnya native (bukan web)
    if (Capacitor.isNativePlatform()) {
      // iOS only: tap on status bar to scroll to top
      window.addEventListener('statusTap', () => {
        console.log('Status bar tapped');
      });

      // Tampilkan konten di bawah status bar (transparent)
      StatusBar.setOverlaysWebView({ overlay: true });

      // Ganti style dan warna status bar
      StatusBar.setStyle({ style: Style.Light }); // atau Style.Dark
      StatusBar.setBackgroundColor({ color: '#00000000' }); // transparan
      StatusBar.show();
    }
  }, []);

  return null;
}
