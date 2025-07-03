import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.warq.app',
  appName: 'WarQ',
  webDir: 'out',
  "server": {
    "allowNavigation": ["placehold.co"]
  }
};

export default config;
