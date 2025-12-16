import { Capacitor } from '@capacitor/core';

export const usePlatform = () => {
  const isNative = Capacitor.isNativePlatform();
  const platform = Capacitor.getPlatform(); // 'ios', 'android', or 'web'
  
  return { isNative, platform };
};
