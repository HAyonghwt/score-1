import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.netlify.easyscore',
  appName: '파크골프스코어',
  webDir: 'out',
  server: {
    url: 'https://onegeplay.netlify.app',
    cleartext: true
  }
};

export default config;
