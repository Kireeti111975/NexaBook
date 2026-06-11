import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.contactbook.app',
  appName: 'NexaBook',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;
