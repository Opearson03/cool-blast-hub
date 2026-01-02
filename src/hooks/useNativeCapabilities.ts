import { useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';
import { Geolocation } from '@capacitor/geolocation';
import { supabase } from '@/integrations/supabase/client';

export const useNativeCapabilities = () => {
  const isNative = Capacitor.isNativePlatform();

  useEffect(() => {
    if (!isNative) return;

    const savePushToken = async (token: string) => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          console.log('No authenticated user, skipping push token save');
          return;
        }

        const platform = Capacitor.getPlatform();
        
        const { error } = await supabase
          .from('push_tokens')
          .upsert(
            {
              user_id: user.id,
              token,
              platform,
              updated_at: new Date().toISOString(),
            },
            {
              onConflict: 'user_id,platform',
            }
          );

        if (error) {
          console.error('Error saving push token:', error);
        } else {
          console.log('Push token saved successfully for platform:', platform);
        }
      } catch (error) {
        console.error('Error in savePushToken:', error);
      }
    };

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

        PushNotifications.addListener('registration', async (token) => {
          console.log('Push registration success, token:', token.value);
          await savePushToken(token.value);
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
      PushNotifications.removeAllListeners();
    };
  }, [isNative]);

  const getCurrentLocation = async () => {
    if (!isNative) {
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
