import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.f93db6306fbc403798da9c5a56b01779',
  appName: 'PourHub',
  webDir: 'dist',
  // NOTE: For development with live-reload, uncomment the server block below:
  // server: {
  //   url: 'https://f93db630-6fbc-4037-98da-9c5a56b01779.lovableproject.com?forceHideBadge=true',
  //   cleartext: true
  // },
  ios: {
    scheme: 'PourHub',
    contentInset: 'automatic',
    preferredContentMode: 'mobile',
    backgroundColor: '#1a1a1a'
  },
  android: {
    buildOptions: {
      keystorePath: undefined,
      keystoreAlias: undefined
    },
    backgroundColor: '#1a1a1a'
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: '#F97316',
      showSpinner: false,
      androidScaleType: 'CENTER_CROP',
      splashFullScreen: true,
      splashImmersive: true
    },
    Keyboard: {
      resize: 'body',
      resizeOnFullScreen: true
    }
  }
};

export default config;
