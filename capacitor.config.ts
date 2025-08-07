import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.berez.cashier',
  appName: 'Berez Cashier',
  webDir: 'out',
  server: {
    allowNavigation: ["placehold.co"]
  },
  plugins: {
    StatusBar: {
      overlaysWebView: true,
      style: "DARK",
      backgroundColor: "#00000000",
    },
  },
};

export default config;
