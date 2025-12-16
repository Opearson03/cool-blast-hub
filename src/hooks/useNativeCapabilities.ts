import { useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';
import { Geolocation } from '@capacitor/geolocation';

export const useNativeCapabilities = () => {
  const isNative = Capacitor.isNativePlatform();

  useEffect(() => {
    if (!isNative) return;

    const initializeNativeCapabilities = async () => {
      // Request push notification permissions
      try {
        const permStatus = await PushNotifications.checkPermissions();
        
        if (permStatus.receive === 'prompt') {
          await PushNotifications.requestPermissions();
        }

        if (permStatus.receive === 'granted') {
          await PushNotifications.register();
        }

        // Listen for push notification events
        PushNotifications.addListener('registration', (token) => {
          console.log('Push registration success, token:', token.value);
          // TODO: Send token to backend for storing
        });

        PushNotifications.addListener('registrationError', (error) => {
          console.error('Push registration error:', error);
        });

        PushNotifications.addListener('pushNotificationReceived', (notification) => {
          console.log('Push notification received:', notification);
        });

        PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
          console.log('Push notification action performed:', notification);
        });
      } catch (error) {
        console.error('Error initializing push notifications:', error);
      }

      // Request geolocation permissions
      try {
        const geoPermStatus = await Geolocation.checkPermissions();
        
        if (geoPermStatus.location === 'prompt') {
          await Geolocation.requestPermissions();
        }
      } catch (error) {
        console.error('Error initializing geolocation:', error);
      }
    };

    initializeNativeCapabilities();

    return () => {
      if (isNative) {
        PushNotifications.removeAllListeners();
      }
    };
  }, [isNative]);

  const getCurrentLocation = async () => {
    if (!isNative) {
      // Fallback to web geolocation API
      return new Promise<{ latitude: number; longitude: number }>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          (position) => resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          }),
          reject
        );
      });
    }

    const position = await Geolocation.getCurrentPosition();
    return {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
    };
  };

  return {
    isNative,
    getCurrentLocation,
  };
};
