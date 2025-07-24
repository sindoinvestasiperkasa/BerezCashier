import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.berez.cashier',
  appName: 'Berez Cashier',
  webDir: 'out',
  "server": {
    "allowNavigation": ["placehold.co"]
  }
};

export default config;
