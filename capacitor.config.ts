
import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.berez.cashier',
  appName: 'Berez Cashier',
  webDir: 'out',
  server: {
    allowNavigation: ["placehold.co", "nominatim.openstreetmap.org"]
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 3000,
      launchAutoHide: true,
      backgroundColor: "#ffffffff",
      androidSplashResourceName: "splash",
      androidScaleType: "CENTER_CROP",
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true,
    },
    StatusBar: {
      overlaysWebView: true,
      style: "DARK",
      backgroundColor: "#00000000",
    },
  },
};

export default config;
